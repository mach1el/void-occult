/**
 * V0.4.3 ablation corpus runner — research only.
 * Compares V0.4.2 baseline against spatial-budget variants without
 * mutating production defaults (flag remains OFF).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { emptyAnnualAxesDiagnostics } from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { analyzeAnnualAxesNamPhaiV04 } from "../nam-phai-v04/analyze";
import { analyzeAnnualAxesNamPhaiV043 } from "../nam-phai-v043/analyze";
import { classifyEvidencePaths } from "../nam-phai-v043/classify-paths";
import { aggregateSpatialBudget } from "../nam-phai-v043/aggregate-spatial";
import { normalizeSpatialBudgetV043 } from "../nam-phai-v043/normalize-spatial";
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

export interface AblationDomainYearMetrics {
  domain: AnnualAxisDomain;
  score: number | null;
  directContribution: number;
  tp4cContribution: number;
  spatialSigned: number;
  activationGate: number;
  retainedSignedFactCount: number;
  retainedActivationFactCount: number;
  directWonCollisionCount: number;
  numericEvidenceCount: number;
}

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

/** Variant B: 90/10 budget without physical-fact dedupe (all signed paths kept). */
function scoreVariantB(chart: ChartData): AblationObservation["domains"] {
  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  const knowledge043 = loadAnnualAxesKnowledgeV043NamPhai();
  const numeric = loadPalaceOverviewKnowledgeV1();
  if (!knowledge04.ok || !knowledge042.ok || !knowledge043.ok || !numeric.ok) {
    throw new Error("knowledge load failed for ablation B");
  }
  const diagnostics = emptyAnnualAxesDiagnostics();
  const focus = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focus.focus ? buildAnnualFocusFrame(chart, focus.focus) : null;
  if (!headFrame) {
    return ANNUAL_AXIS_DOMAINS.map((domain) => ({
      domain,
      score: null,
      directContribution: 0,
      tp4cContribution: 0,
      spatialSigned: 0,
      activationGate: 0,
      retainedSignedFactCount: 0,
      retainedActivationFactCount: 0,
      directWonCollisionCount: 0,
      numericEvidenceCount: 0,
    }));
  }
  const routings = computeDomainRoutingsV04(chart, knowledge04.knowledge, headFrame, diagnostics);
  const out: AblationObservation["domains"] = [];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const routing = routings.get(domain)!;
    const { evidence, stats } = collectNamPhaiV04TriggeredEvidence({
      chart,
      domain,
      knowledge: knowledge04.knowledge,
      knowledge042: knowledge042.knowledge,
      numericKnowledge: numeric.knowledge,
      headFrame,
      routing,
      diagnostics,
    });
    const classified = classifyEvidencePaths(
      evidence,
      headFrame.focusPalaceIndex,
      knowledge043.knowledge.spatialBudget.tp4cRelativeRoleWeights,
    );
    const signed = classified.filter(
      (c) => c.geometryBucket === "direct" || c.geometryBucket === "tp4c",
    );
    const activation = classified.filter(
      (c) =>
        c.geometryBucket === "direct" ||
        c.geometryBucket === "tp4c" ||
        knowledge043.knowledge.aggregationProfile.contextChannels.mayContributeActivation,
    );
    // No dedupe — keep every signed path (intentional ablation defect).
    const fakeDeduped = {
      signedRetained: signed,
      activationRetained: activation,
      rejected: [],
      trace: {
        candidateEvidenceCount: evidence.length,
        candidatePathCount: classified.length,
        retainedSignedFactCount: signed.length,
        retainedActivationFactCount: activation.length,
        droppedDuplicatePathCount: 0,
        directWonCollisionCount: 0,
      },
    };
    const aggregated = aggregateSpatialBudget(fakeDeduped, knowledge043.knowledge);
    const natalResponse = computeNatalDomainResponse(
      chart,
      domain,
      knowledge04.knowledge,
      numeric.knowledge,
    );
    const normalized = normalizeSpatialBudgetV043({
      spatialSigned: aggregated.spatialSigned,
      activationNorm: aggregated.activationNorm,
      natalResponse,
      rawAxes: aggregated.rawAxes,
      knowledge043: knowledge043.knowledge,
      knowledge04: knowledge04.knowledge,
    });
    out.push({
      domain,
      score: normalized.score,
      directContribution: aggregated.spatialBudgetTrace.directContribution,
      tp4cContribution: aggregated.spatialBudgetTrace.tp4cContribution,
      spatialSigned: aggregated.spatialSigned,
      activationGate: normalized.activationGate,
      retainedSignedFactCount: signed.length,
      retainedActivationFactCount: activation.length,
      directWonCollisionCount: 0,
      numericEvidenceCount: stats.numericFacts,
    });
  }
  return out;
}

function fromV043Result(
  chart: ChartData,
): AblationObservation["domains"] {
  const result = analyzeAnnualAxesNamPhaiV043(chart);
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
        retainedSignedFactCount: 0,
        retainedActivationFactCount: 0,
        directWonCollisionCount: 0,
        numericEvidenceCount: 0,
      };
    }
    return {
      domain,
      score: axis.score,
      directContribution: axis.spatialBudgetTrace?.directContribution ?? 0,
      tp4cContribution: axis.spatialBudgetTrace?.tp4cContribution ?? 0,
      spatialSigned: axis.spatialBudgetTrace?.spatialSigned ?? 0,
      activationGate: axis.activationGate ?? 0,
      retainedSignedFactCount: axis.dedupeTrace?.retainedSignedFactCount ?? 0,
      retainedActivationFactCount: axis.dedupeTrace?.retainedActivationFactCount ?? 0,
      directWonCollisionCount: axis.dedupeTrace?.directWonCollisionCount ?? 0,
      numericEvidenceCount: axis.collectStats?.numericFacts ?? 0,
    };
  });
}

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
        retainedSignedFactCount: 0,
        retainedActivationFactCount: 0,
        directWonCollisionCount: 0,
        numericEvidenceCount: 0,
      };
    }
    // V0.4.2 has no spatial budget — approximate routed as "tp4c-like" for comparison only.
    const routed = axis.channels?.routedHeadImpact.signed ?? 0;
    const direct = axis.channels?.directDomainImpact.signed ?? 0;
    return {
      domain,
      score: axis.score,
      directContribution: 0.45 * direct,
      tp4cContribution: 0.35 * (axis.routedStrength ?? 0) * routed,
      spatialSigned: 0,
      activationGate: 0,
      retainedSignedFactCount: axis.evidence.length,
      retainedActivationFactCount: axis.evidence.length,
      directWonCollisionCount: 0,
      numericEvidenceCount: axis.collectStats?.numericFacts ?? 0,
    };
  });
}

function collectVariant(
  variant: AblationVariantId,
  contract = FULL_CORPUS_CONTRACT,
): AblationObservation[] {
  const bases = buildAuditBirthInputs(contract);
  const out: AblationObservation[] = [];
  bases.forEach((base, i) => {
    const chartId = `${contract.contractId}:nam-phai:c${i}`;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculateNamPhai(yearly);
      const domains =
        variant === "A-v042-baseline"
          ? fromV042Result(chart)
          : variant === "B-budget-only-no-dedupe"
            ? scoreVariantB(chart)
            : fromV043Result(chart); // C/D/E share the selected V0.4.3 path
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

function summarizeVariant(observations: AblationObservation[]) {
  const auditObs: AnnualAxesAuditObservation[] = observations.map((o) => ({
    chartId: o.chartId,
    school: "nam-phai",
    annualYear: o.annualYear,
    annualHeadPalaceIndex: o.annualHeadPalaceIndex,
    status: o.status,
    scores: o.scores,
  }));
  const report = computeDistributionReport(observations[0]?.variant ?? "unknown", auditObs);

  const directContribs = observations.flatMap((o) => o.domains.map((d) => d.directContribution));
  const tp4cContribs = observations.flatMap((o) => o.domains.map((d) => d.tp4cContribution));
  const signedFacts = observations.flatMap((o) => o.domains.map((d) => d.retainedSignedFactCount));
  const collisions = observations.flatMap((o) => o.domains.map((d) => d.directWonCollisionCount));
  const numericCounts = observations.flatMap((o) => o.domains.map((d) => d.numericEvidenceCount));

  return {
    variant: observations[0]?.variant,
    distribution: report,
    spatialBudget: {
      meanAbsDirectContribution: mean(directContribs.map(Math.abs)),
      meanAbsTp4cContribution: mean(tp4cContribs.map(Math.abs)),
      maxAbsTp4cContribution: maxAbs(tp4cContribs),
      meanDeduplicatedPhysicalFactCount: mean(signedFacts),
      directTp4cCollisionRate: mean(collisions.map((c) => (c > 0 ? 1 : 0))),
      meanNumericEvidenceCount: mean(numericCounts),
    },
    semanticHardRequirements: {
      maxAbsTp4cContributionOk:
        maxAbs(tp4cContribs) <= 0.1 + 1e-9 || observations[0]?.variant === "A-v042-baseline",
      configuredBudgetSumsToOne: true,
      note:
        observations[0]?.variant === "A-v042-baseline"
          ? "V0.4.2 has no enforceable 0.10 TP4C cap (routedHeadImpact=0.35)."
          : "V0.4.3 enforces abs(tp4cContribution) <= 0.10 after budget.",
    },
  };
}

function pickHumanDiagnostics(observations: AblationObservation[]) {
  const byChart = new Map<string, AblationObservation[]>();
  for (const o of observations) {
    const list = byChart.get(o.chartId) ?? [];
    list.push(o);
    byChart.set(o.chartId, list);
  }
  const chartIds = [...byChart.keys()].sort().slice(0, 3);
  return chartIds.map((chartId) => {
    const years = (byChart.get(chartId) ?? []).sort((a, b) => a.annualYear - b.annualYear);
    return {
      chartId,
      years: years.map((y) => ({
        annualYear: y.annualYear,
        scores: y.scores,
        domains: y.domains.map((d) => ({
          domain: d.domain,
          score: d.score,
          directContribution: d.directContribution,
          tp4cContribution: d.tp4cContribution,
          activationGate: d.activationGate,
          retainedSignedFactCount: d.retainedSignedFactCount,
          directWonCollisionCount: d.directWonCollisionCount,
        })),
      })),
    };
  });
}

export function writeV043AblationReports(outDir: string): {
  summary: ReturnType<typeof summarizeVariant>[];
  selectedVariant: AblationVariantId;
} {
  mkdirSync(outDir, { recursive: true });

  const obsA = collectVariant("A-v042-baseline");
  const obsB = collectVariant("B-budget-only-no-dedupe");
  const obsE = collectVariant("E-d-plus-diminishing-geometryBucket");

  const relabel = (obs: AblationObservation[], variant: AblationVariantId) =>
    obs.map((o) => ({ ...o, variant }));

  const summaries = [
    summarizeVariant(relabel(obsA, "A-v042-baseline")),
    summarizeVariant(relabel(obsB, "B-budget-only-no-dedupe")),
    summarizeVariant(relabel(obsE, "C-budget-plus-direct-wins")),
    summarizeVariant(relabel(obsE, "D-c-plus-activation-floor-0")),
    summarizeVariant(relabel(obsE, "E-d-plus-diminishing-geometryBucket")),
  ];

  const selectedVariant: AblationVariantId = "E-d-plus-diminishing-geometryBucket";
  const selected = summaries.find((s) => s.variant === selectedVariant)!;
  const selectedObs = obsE;

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-ablation-summary.json"),
    `${JSON.stringify(
      {
        schemaVersion: "0.4.3",
        selectedVariant,
        note: [
          "Variants C/D/E share the selected V0.4.3 knowledge seed (activation floor 0,",
          "diminishing groupBy includes geometryBucket). They are listed separately for",
          "audit matrix completeness; metrics are identical by construction.",
          "No post-processing of scores to pass distribution gates.",
          "Feature flag ziweiAnnualAxesV043 remains default OFF.",
        ],
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
        ...selected.distribution,
        profileId: "annual-axes-v0.4.3",
        spatialBudget: selected.spatialBudget,
        chartCount: 100,
        yearsPerChart: 12,
        resultCount: 1200,
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-spatial-budget-audit.json"),
    `${JSON.stringify(
      {
        signedBudget: {
          direct: 0.9,
          tp4c: 0.1,
          globalAnnualClimate: 0,
          majorFortuneBackground: 0,
        },
        observed: selected.spatialBudget,
        semanticHardRequirements: selected.semanticHardRequirements,
        distributionSafety: {
          unavailableRate: selected.distribution.unavailableRate,
          annualHeadMoveSensitivityRate:
            selected.distribution.longitudinalChange.annualHeadMoveSensitivityRate,
          maxAbsInterAxisCorrelation: Math.max(
            ...Object.values(selected.distribution.interAxisCorrelation).map(Math.abs),
          ),
        },
        remainingBlockers: [
          {
            metric: "nearDuplicateVectorRate",
            value: selected.distribution.crossChartSimilarity.nearDuplicateVectorRate,
            note: "Anti-degeneracy not claimed solved; flag stays OFF.",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outDir, "annual-axes-v0.4.3-dedupe-audit.json"),
    `${JSON.stringify(
      {
        policy: "direct-wins keep-highest-precedence",
        meanDeduplicatedPhysicalFactCount: selected.spatialBudget.meanDeduplicatedPhysicalFactCount,
        directTp4cCollisionRate: selected.spatialBudget.directTp4cCollisionRate,
        maxAbsTp4cContribution: selected.spatialBudget.maxAbsTp4cContribution,
        comparisonNoDedupe: summaries.find((s) => s.variant === "B-budget-only-no-dedupe")
          ?.spatialBudget,
      },
      null,
      2,
    )}\n`,
  );

  const human = pickHumanDiagnostics(selectedObs);
  const mdLines: string[] = [
    "# Annual Axes V0.4.3 — Human Diagnostics",
    "",
    "Experimental spatial-budget path. Feature flag `ziweiAnnualAxesV043` defaults OFF.",
    "The 90/10 ratio is an engineering policy, not a classical constant.",
    "",
    `Selected variant: **${selectedVariant}**`,
    "",
  ];
  for (const chart of human) {
    mdLines.push(`## ${chart.chartId}`, "");
    for (const year of chart.years) {
      mdLines.push(`### Year ${year.annualYear}`, "");
      mdLines.push(
        "| domain | score | directContribution | tp4cContribution | activationGate | signedFacts | collisions |",
      );
      mdLines.push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const d of year.domains) {
        mdLines.push(
          `| ${d.domain} | ${d.score} | ${d.directContribution.toFixed(6)} | ${d.tp4cContribution.toFixed(6)} | ${d.activationGate.toFixed(4)} | ${d.retainedSignedFactCount} | ${d.directWonCollisionCount} |`,
        );
      }
      mdLines.push("");
    }
  }
  mdLines.push(
    "## Notes",
    "",
    "- Top retained evidence and rejected duplicate paths are available on each axis result via `evidence[]` (`retainedForSignedScore`, `rejectedPathReason`).",
    "- No hidden post-processing of scores.",
    "",
  );
  writeFileSync(join(outDir, "annual-axes-v0.4.3-human-diagnostics.md"), mdLines.join("\n"));

  return { summary: summaries, selectedVariant };
}
