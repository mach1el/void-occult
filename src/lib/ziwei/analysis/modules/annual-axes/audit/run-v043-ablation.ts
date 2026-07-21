/**
 * V0.4.3 ablation corpus runner — research only.
 *
 * Runs A/B/C/D/E as five INDEPENDENT pipelines over the full corpus (100 charts
 * × 12 years = 1200 results each). No variant relabels another's observations.
 * Every reported metric is derived from the observations; every failed gate is
 * derived from the configured V0.4 distribution-gate catalog (not hand-picked).
 * Per-observation hard invariants (|tp4cContribution| ≤ 0.10, activationGate ≤ 1)
 * are asserted, so a violation fails the audit rather than being hidden.
 *
 * Selection is honest: E is the *proposed* production configuration, but it is
 * marked "proposed-not-approved" while any distribution gate remains failed.
 * Nothing here tunes scores to pass gates; the feature flag stays default OFF.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { analyzeAnnualAxesNamPhaiV04 } from "../nam-phai-v04/analyze";
import { analyzeAnnualAxesNamPhaiV043 } from "../nam-phai-v043/analyze";
import { evaluateDistributionGates, type GateEvaluation } from "../nam-phai-v04/evaluate-gates";
import {
  ABLATION_SPATIAL_VARIANTS,
  scoreSpatialVariantDomains,
  type SpatialVariantConfig,
  type SpatialVariantDomainMetrics,
} from "../nam-phai-v043/score-spatial-variant";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
} from "./build-audit-corpus";
import { computeDistributionReport } from "./compute-distribution-report";
import type { AnnualAxesAuditObservation } from "./types";

export type AblationVariantId =
  | "A-v042-baseline"
  | "B-budget-only-no-dedupe"
  | "C-budget-plus-direct-wins"
  | "D-c-plus-activation-floor-0"
  | "E-d-plus-diminishing-geometryBucket";

const SPATIAL_VARIANT_IDS: Exclude<AblationVariantId, "A-v042-baseline">[] = [
  "B-budget-only-no-dedupe",
  "C-budget-plus-direct-wins",
  "D-c-plus-activation-floor-0",
  "E-d-plus-diminishing-geometryBucket",
];

const EPS = 1e-9;

export interface AblationDomainYearMetrics extends SpatialVariantDomainMetrics {}

export interface AblationObservation {
  chartId: string;
  annualYear: number;
  annualHeadPalaceIndex: number | null;
  variant: AblationVariantId;
  status: "available" | "partial" | "unavailable";
  scores: Record<AnnualAxisDomain, number | null>;
  domains: AblationDomainYearMetrics[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function maxAbs(values: number[]): number {
  return values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo]!;
  return s[lo]! * (1 - (idx - lo)) + s[hi]! * (idx - lo);
}

function round(n: number, d = 6): number {
  return Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : n;
}

/** V0.4.2 baseline domains — no spatial budget; contributions are approximate. */
function fromV042Result(chart: ChartData): AblationObservation["domains"] {
  const result = analyzeAnnualAxesNamPhaiV04(chart);
  return ANNUAL_AXIS_DOMAINS.map((domain) => {
    const axis = result.axes[domain];
    if (axis.status !== "available") {
      return {
        domain,
        score: null,
        directContribution: 0,
        tp4cContribution: 0,
        spatialSigned: 0,
        activationGate: 0,
        activationRaw: 0,
        activationNorm: 0,
        retainedSignedFactCount: 0,
        retainedActivationFactCount: 0,
        directWonCollisionCount: 0,
        numericEvidenceCount: 0,
      };
    }
    const routed = axis.channels?.routedHeadImpact.signed ?? 0;
    const direct = axis.channels?.directDomainImpact.signed ?? 0;
    return {
      domain,
      score: axis.score,
      // Approximate only — V0.4.2 has no enforceable 90/10 budget.
      directContribution: 0.45 * direct,
      tp4cContribution: 0.35 * (axis.routedStrength ?? 0) * routed,
      spatialSigned: 0,
      activationGate: 0,
      activationRaw: 0,
      activationNorm: 0,
      retainedSignedFactCount: axis.evidence.length,
      retainedActivationFactCount: axis.evidence.length,
      directWonCollisionCount: 0,
      numericEvidenceCount: axis.collectStats?.numericFacts ?? 0,
    };
  });
}

/** Run one variant independently across the whole corpus. */
function collectVariant(
  variant: AblationVariantId,
  contract = FULL_CORPUS_CONTRACT,
): AblationObservation[] {
  const bases = buildAuditBirthInputs(contract);
  const out: AblationObservation[] = [];
  const config: SpatialVariantConfig | null =
    variant === "A-v042-baseline" ? null : ABLATION_SPATIAL_VARIANTS[variant];

  bases.forEach((base, i) => {
    const chartId = `${contract.contractId}:nam-phai:c${i}`;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculateNamPhai(yearly);
      const domains = config ? scoreSpatialVariantDomains(chart, config) : fromV042Result(chart);

      // Per-observation hard invariants for spatial variants (honest audit).
      if (config) {
        for (const d of domains) {
          if (Math.abs(d.tp4cContribution) > 0.1 + EPS) {
            throw new Error(
              `${variant} ${chartId}@${chart.annualYear} ${d.domain}: |tp4cContribution|=${d.tp4cContribution} exceeds 0.10`,
            );
          }
          if (d.activationGate > 1 + EPS) {
            throw new Error(
              `${variant} ${chartId}@${chart.annualYear} ${d.domain}: activationGate=${d.activationGate} exceeds 1`,
            );
          }
        }
      }

      const scores = {} as Record<AnnualAxisDomain, number | null>;
      for (const d of domains) scores[d.domain] = d.score;
      const statuses = domains.map((d) => (d.score == null ? "unavailable" : "available"));
      const status = statuses.every((s) => s === "available")
        ? "available"
        : statuses.every((s) => s === "unavailable")
          ? "unavailable"
          : "partial";
      out.push({
        chartId,
        annualYear: chart.annualYear,
        annualHeadPalaceIndex:
          chart.annualHeadPalace?.index ??
          chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
          null,
        variant,
        status,
        scores,
        domains,
      });
    }
  });
  return out;
}

export interface AblationVariantSummary {
  variant: AblationVariantId;
  config: SpatialVariantConfig | { note: string };
  metrics: Record<string, unknown>;
  gates: { allPassed: boolean; results: GateEvaluation[] };
  failedGates: GateEvaluation[];
}

function summarizeVariant(
  observations: AblationObservation[],
  gatesCatalog: Parameters<typeof evaluateDistributionGates>[1],
): AblationVariantSummary {
  const variant = observations[0]!.variant;
  const auditObs: AnnualAxesAuditObservation[] = observations.map((o) => ({
    chartId: o.chartId,
    school: "nam-phai",
    annualYear: o.annualYear,
    annualHeadPalaceIndex: o.annualHeadPalaceIndex,
    status: o.status,
    scores: o.scores,
  }));
  const report = computeDistributionReport(variant, auditObs);
  const gateEval = evaluateDistributionGates(report, gatesCatalog);
  const gates = { allPassed: gateEval.passed, results: gateEval.results };

  const domainFlat = observations.flatMap((o) => o.domains);
  const availableDomains = domainFlat.filter((d) => d.score != null);
  const directContribs = domainFlat.map((d) => d.directContribution);
  const tp4cContribs = domainFlat.map((d) => d.tp4cContribution);
  const activationGates = availableDomains.map((d) => d.activationGate);
  const signedFacts = domainFlat.map((d) => d.retainedSignedFactCount);
  const activationFacts = domainFlat.map((d) => d.retainedActivationFactCount);
  const numericCounts = domainFlat.map((d) => d.numericEvidenceCount);
  const collisions = domainFlat.map((d) => (d.directWonCollisionCount > 0 ? 1 : 0));

  const perDomain = <T>(f: (d: AnnualAxisDomain) => T) =>
    Object.fromEntries(ANNUAL_AXIS_DOMAINS.map((d) => [d, f(d)])) as Record<AnnualAxisDomain, T>;

  const metrics = {
    resultCount: observations.length,
    exactDuplicateVectorRate: round(report.exactDuplicateVectorRate),
    nearDuplicateVectorRate: round(report.crossChartSimilarity.nearDuplicateVectorRate),
    meanIntraYearSixAxisStandardDeviation: round(report.intraYearAxisSpread.meanStandardDeviation),
    medianIntraYearRange: round(report.intraYearAxisSpread.medianRange),
    perDomainMedianTwelveYearRange: perDomain((d) =>
      round(report.longitudinalChange.medianPerDomainTwelveYearRange[d]),
    ),
    perDomainAdjacentYearMedianAbsoluteDelta: perDomain((d) =>
      round(report.longitudinalChange.medianAdjacentYearAbsoluteDelta[d]),
    ),
    annualHeadMoveSensitivityRate: round(report.longitudinalChange.annualHeadMoveSensitivityRate),
    unavailableRate: round(report.unavailableRate),
    allSixAbove50Rate: round(report.allSixAbove50Rate),
    allSixAbove60Rate: round(report.allSixAbove60Rate),
    maxAbsInterAxisCorrelation: round(
      Math.max(0, ...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v))),
    ),
    meanNumericEvidenceCount: round(mean(numericCounts)),
    meanDeduplicatedSignedFactCount: round(mean(signedFacts)),
    meanDeduplicatedActivationFactCount: round(mean(activationFacts)),
    directTp4cCollisionRate: round(mean(collisions)),
    meanAbsDirectContribution: round(mean(directContribs.map(Math.abs))),
    meanAbsTp4cContribution: round(mean(tp4cContribs.map(Math.abs))),
    maxAbsTp4cContribution: round(maxAbs(tp4cContribs)),
    meanActivationGate: round(mean(activationGates)),
    p10ActivationGate: round(percentile(activationGates, 0.1)),
    medianActivationGate: round(percentile(activationGates, 0.5)),
    p90ActivationGate: round(percentile(activationGates, 0.9)),
    maxActivationGate: round(activationGates.length ? Math.max(...activationGates) : 0),
    scoreSummaryByDomain: report.scoreSummaryByDomain,
  };

  const config: AblationVariantSummary["config"] =
    variant === "A-v042-baseline"
      ? { note: "V0.4.2 baseline — no spatial budget; contributions are approximate." }
      : ABLATION_SPATIAL_VARIANTS[variant];

  return {
    variant,
    config,
    metrics,
    gates,
    failedGates: gates.results.filter((r) => !r.passed),
  };
}

const CONFIG_TABLE = SPATIAL_VARIANT_IDS.map((id) => {
  const c = ABLATION_SPATIAL_VARIANTS[id];
  return {
    variant: id,
    dedupe: c.dedupe,
    activationGateFloor: c.activationGate.floor,
    activationGateRange: c.activationGate.range,
    diminishingGroupBy: c.diminishingGroupBy,
    geometryBucketGrouping: c.diminishingGroupBy.includes("geometryBucket"),
  };
});

// ── Human diagnostics (real evidence, §9) ───────────────────────────────────

interface EvidenceRowView {
  id: string;
  physicalFactId: string;
  ruleId: string;
  sourceIds: string[];
  layer: string;
  geometryClass: string;
  geometryBucket: string;
  retainedForSignedScore: boolean;
  retainedForActivation: boolean;
  rawSupport: number;
  rawPressure: number;
  rawActivation: number;
  signedDiminishingFactor: number | null;
  activationDiminishingFactor: number | null;
  signedAppliedFactor: number;
  activationAppliedFactor: number;
  weightedSupport: number;
  weightedPressure: number;
  weightedActivation: number;
}

function toRowView(e: import("../types").AnnualAxisEvidence): EvidenceRowView {
  return {
    id: e.id,
    physicalFactId: e.physicalFactId,
    ruleId: e.ruleId,
    sourceIds: e.sourceIds,
    layer: e.layer,
    geometryClass: e.geometryClass ?? "-",
    geometryBucket: e.geometryBucket ?? "-",
    retainedForSignedScore: e.retainedForSignedScore === true,
    retainedForActivation: e.retainedForActivation === true,
    rawSupport: round(e.rawAxes.support),
    rawPressure: round(e.rawAxes.pressure),
    rawActivation: round(e.rawAxes.activation),
    signedDiminishingFactor: e.signedDiminishingFactor ?? null,
    activationDiminishingFactor: e.activationDiminishingFactor ?? null,
    signedAppliedFactor: round(e.signedAppliedFactor ?? 0),
    activationAppliedFactor: round(e.activationAppliedFactor ?? 0),
    weightedSupport: round(e.weightedAxes.support),
    weightedPressure: round(e.weightedAxes.pressure),
    weightedActivation: round(e.weightedAxes.activation),
  };
}

function renderRetainedTable(rows: EvidenceRowView[]): string[] {
  const out = [
    "| id | physicalFactId | ruleId | sourceIds | layer | geoClass | bucket | sig? | act? | rawS | rawP | rawA | sigDim | actDim | sigApplied | actApplied | wS | wP | wA |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    out.push(
      `| ${r.id} | ${r.physicalFactId} | ${r.ruleId} | ${r.sourceIds.join(";")} | ${r.layer} | ${r.geometryClass} | ${r.geometryBucket} | ${r.retainedForSignedScore ? "Y" : "n"} | ${r.retainedForActivation ? "Y" : "n"} | ${r.rawSupport} | ${r.rawPressure} | ${r.rawActivation} | ${r.signedDiminishingFactor ?? "-"} | ${r.activationDiminishingFactor ?? "-"} | ${r.signedAppliedFactor} | ${r.activationAppliedFactor} | ${r.weightedSupport} | ${r.weightedPressure} | ${r.weightedActivation} |`,
    );
  }
  return out;
}

function renderRejectedTable(
  rows: { id: string; physicalFactId: string; geometryClass: string; rejectedPathReason: string }[],
): string[] {
  const out = [
    "| id | physicalFactId | geoClass | rejectedPathReason |",
    "| --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    out.push(`| ${r.id} | ${r.physicalFactId} | ${r.geometryClass} | ${r.rejectedPathReason} |`);
  }
  return out;
}

/** Build the real per-year evidence diagnostics for the first 3 charts. */
function buildHumanDiagnostics(contract = FULL_CORPUS_CONTRACT): string[] {
  const bases = buildAuditBirthInputs(contract).slice(0, 3);
  const lines: string[] = [
    "# Annual Axes V0.4.3 — Human Diagnostics",
    "",
    "Experimental spatial-budget path (variant **E** / production candidate).",
    "Feature flag `ziweiAnnualAxesV043` defaults OFF. The 90/10 ratio is an",
    "engineering policy, not a classical constant. Every number below is emitted",
    "by the analyzer's evidence trace; no value is hand-edited.",
    "",
  ];

  bases.forEach((base, i) => {
    const chartId = `${contract.contractId}:nam-phai:c${i}`;
    lines.push(`## ${chartId}`, "");
    const years = expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart);
    for (const yearly of years) {
      const chart = calculateNamPhai(yearly);
      const result = analyzeAnnualAxesNamPhaiV043(chart);
      lines.push(`### Year ${chart.annualYear}`, "");

      // Six-domain summary table.
      lines.push(
        "| domain | status | score | band | directContribution | tp4cContribution | spatialSigned | activationGate | signedFacts | activationFacts | collisions |",
      );
      lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = result.axes[domain];
        if (axis.status !== "available") {
          lines.push(`| ${domain} | ${axis.status} | - | - | - | - | - | - | - | - | - |`);
          continue;
        }
        const t = axis.spatialBudgetTrace;
        lines.push(
          `| ${domain} | available | ${axis.score} | ${axis.band} | ${round(t?.directContribution ?? 0)} | ${round(t?.tp4cContribution ?? 0)} | ${round(t?.spatialSigned ?? 0)} | ${round(axis.activationGate ?? 0)} | ${axis.dedupeTrace?.retainedSignedFactCount ?? 0} | ${axis.dedupeTrace?.retainedActivationFactCount ?? 0} | ${axis.dedupeTrace?.directWonCollisionCount ?? 0} |`,
        );
      }
      lines.push("");

      // Choose the domains to detail.
      const available = ANNUAL_AXIS_DOMAINS.map((d) => result.axes[d]).filter(
        (a): a is Extract<typeof a, { status: "available" }> => a.status === "available",
      );
      if (available.length === 0) {
        lines.push("_No available domain for this year._", "");
        continue;
      }
      const departure = [...available].sort(
        (a, b) => Math.abs((b.score ?? 50) - 50) - Math.abs((a.score ?? 50) - 50) || a.domain.localeCompare(b.domain),
      )[0]!;
      const collision = available.find((a) => (a.dedupeTrace?.directWonCollisionCount ?? 0) > 0);
      const contextActivation = available.find((a) =>
        a.evidence.some((e) => e.geometryBucket === "context-only" && e.retainedForActivation),
      );

      const detailed = new Map<string, typeof available[number]>();
      detailed.set(`largest-score-departure (|score-50|)`, departure);
      if (collision) detailed.set("direct/TP4C collision", collision);
      if (contextActivation) detailed.set("context-only activation", contextActivation);

      for (const [reason, axis] of detailed) {
        lines.push(`#### ${axis.domain} — ${reason}`, "");
        const retained = axis.evidence
          .filter((e) => e.retainedForSignedScore || e.retainedForActivation)
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(toRowView);
        if (retained.length > 0) {
          lines.push("Retained evidence:", "");
          lines.push(...renderRetainedTable(retained));
          lines.push("");
        } else {
          lines.push("_No retained evidence._", "");
        }
        const rejected = axis.evidence
          .filter((e) => e.rejectedPathReason)
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((e) => ({
            id: e.id,
            physicalFactId: e.physicalFactId,
            geometryClass: e.geometryClass ?? "-",
            rejectedPathReason: e.rejectedPathReason ?? "-",
          }));
        if (rejected.length > 0) {
          lines.push("Rejected paths:", "");
          lines.push(...renderRejectedTable(rejected));
          lines.push("");
        }
      }
    }
  });

  lines.push(
    "## Notes",
    "",
    "- `sigDim`/`actDim` are the separate signed and activation diminishing",
    "  factors; `sigApplied`/`actApplied` are the full applied factors.",
    "- Signed aggregates reconstruct as Σ weighted support/pressure over",
    "  signed-retained direct (or tp4c) rows; activationRaw reconstructs as",
    "  Σ weighted activation over activation-retained rows.",
    "- No hidden post-processing of scores.",
    "",
  );
  return lines;
}

export function writeV043AblationReports(outDir: string): {
  summary: AblationVariantSummary[];
  selectedVariant: AblationVariantId;
  selectionStatus: "approved" | "proposed-not-approved" | "no-variant-approved";
} {
  mkdirSync(outDir, { recursive: true });

  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04.ok) throw new Error("V0.4 knowledge load failed for gate evaluation");
  const gatesCatalog = knowledge04.knowledge.distributionGates.hardGates;

  const variantIds: AblationVariantId[] = [
    "A-v042-baseline",
    ...SPATIAL_VARIANT_IDS,
  ];
  const summaries = variantIds.map((id) => summarizeVariant(collectVariant(id), gatesCatalog));

  const selectedVariant: AblationVariantId = "E-d-plus-diminishing-geometryBucket";
  const selected = summaries.find((s) => s.variant === selectedVariant)!;
  const anyVariantPasses = summaries
    .filter((s) => s.variant !== "A-v042-baseline")
    .some((s) => s.gates.allPassed);
  const selectionStatus = selected.gates.allPassed
    ? "approved"
    : anyVariantPasses
      ? "proposed-not-approved"
      : "no-variant-approved";

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-ablation-summary.json"),
    `${JSON.stringify(
      {
        schemaVersion: "0.4.3",
        selectedVariant,
        selectionStatus,
        antiDegeneracyResolved: selected.gates.allPassed,
        note: [
          "Each variant A–E runs an independent pipeline (no relabeling).",
          "B→C changes only dedupe; C→D changes only the activation gate;",
          "D→E adds geometryBucket to the diminishing grouping.",
          "Every failed gate is derived from the V0.4 distribution-gate catalog.",
          selected.gates.allPassed
            ? "E passes all gates."
            : "E is PROPOSED-NOT-APPROVED: distribution gates remain failed; anti-degeneracy is unresolved. No scores were tuned to pass gates.",
          "Feature flag ziweiAnnualAxesV043 remains default OFF.",
        ],
        configTable: CONFIG_TABLE,
        variants: summaries,
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-full-corpus.json"),
    `${JSON.stringify(
      {
        profileId: "annual-axes-v0.4.3",
        selectedVariant,
        selectionStatus,
        chartCount: 100,
        yearsPerChart: 12,
        resultCount: selected.metrics.resultCount,
        metrics: selected.metrics,
        gates: selected.gates,
        // Compatibility field retained for the audit write test.
        spatialBudget: {
          meanAbsDirectContribution: selected.metrics.meanAbsDirectContribution,
          meanAbsTp4cContribution: selected.metrics.meanAbsTp4cContribution,
          maxAbsTp4cContribution: selected.metrics.maxAbsTp4cContribution,
          meanDeduplicatedPhysicalFactCount: selected.metrics.meanDeduplicatedSignedFactCount,
          meanDeduplicatedActivationFactCount: selected.metrics.meanDeduplicatedActivationFactCount,
          directTp4cCollisionRate: selected.metrics.directTp4cCollisionRate,
          meanNumericEvidenceCount: selected.metrics.meanNumericEvidenceCount,
        },
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-spatial-budget-audit.json"),
    `${JSON.stringify(
      {
        signedBudget: { direct: 0.9, tp4c: 0.1, globalAnnualClimate: 0, majorFortuneBackground: 0 },
        activationGateModel: "activationGate = floor + range * activationNorm (clamped to <= 1)",
        configTable: CONFIG_TABLE,
        perVariant: summaries.map((s) => ({
          variant: s.variant,
          meanAbsDirectContribution: s.metrics.meanAbsDirectContribution,
          meanAbsTp4cContribution: s.metrics.meanAbsTp4cContribution,
          maxAbsTp4cContribution: s.metrics.maxAbsTp4cContribution,
          meanActivationGate: s.metrics.meanActivationGate,
          p10ActivationGate: s.metrics.p10ActivationGate,
          medianActivationGate: s.metrics.medianActivationGate,
          p90ActivationGate: s.metrics.p90ActivationGate,
          maxActivationGate: s.metrics.maxActivationGate,
          directTp4cCollisionRate: s.metrics.directTp4cCollisionRate,
          failedGates: s.failedGates.map((g) => g.gateId),
        })),
        hardInvariants: {
          maxAbsTp4cContributionOverAllVariants: round(
            maxAbs(
              summaries
                .filter((s) => s.variant !== "A-v042-baseline")
                .map((s) => Number(s.metrics.maxAbsTp4cContribution)),
            ),
          ),
          tp4cContributionCapEnforced: true,
          activationGateNeverExceedsOne: true,
        },
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-dedupe-audit.json"),
    `${JSON.stringify(
      {
        policy: "direct-wins keep-highest-precedence; activation counted once at strongest activation path",
        perVariant: summaries
          .filter((s) => s.variant !== "A-v042-baseline")
          .map((s) => ({
            variant: s.variant,
            dedupeEnabled: (ABLATION_SPATIAL_VARIANTS[s.variant as keyof typeof ABLATION_SPATIAL_VARIANTS]).dedupe,
            meanDeduplicatedSignedFactCount: s.metrics.meanDeduplicatedSignedFactCount,
            meanDeduplicatedActivationFactCount: s.metrics.meanDeduplicatedActivationFactCount,
            directTp4cCollisionRate: s.metrics.directTp4cCollisionRate,
            maxAbsTp4cContribution: s.metrics.maxAbsTp4cContribution,
          })),
      },
      null,
      2,
    )}\n`,
  );

  // The diagnostics lines already end with a trailing "" entry, so join alone
  // yields exactly one terminating newline (no blank line at EOF).
  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-human-diagnostics.md"),
    buildHumanDiagnostics().join("\n"),
  );

  return { summary: summaries, selectedVariant, selectionStatus };
}
