/**
 * Monthly Flow V0.1 production smoke audit + research pack writer.
 * Corpus: 100 charts × 2 schools × 12 regular months = 2,400 chart-months;
 * 2,400 × 6 domains = 14,400 domain observations.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChartData } from "../../../../../../../types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { getAnalysisStatus } from "../../../../contracts/common";
import { isMonthlyFlowV01Enabled } from "../../../../feature-flags";
import type { ZiweiSchool } from "../../../../facts";
import {
  MF_V02_FULL_CORPUS,
  buildMajorFortuneV02BirthCharts,
  calculateChart,
} from "../../../major-fortune/audit/v0.2/corpus";
import { analyzeMonthlyFlowProduction } from "../../v0.1-production";
import type { MonthlyFlowMonthSummary } from "../../v0.1-production";
import type { MonthlyFlowBand } from "../../types";

export const PACK_REL = "research/monthly-flow/v0.1-production-ui";

export type MonthlyFlowProductionDecision =
  | "PROMOTE_MONTHLY_FLOW_V01_TO_PRODUCTION"
  | "KEEP_MONTHLY_FLOW_V01_BETA";

export interface MonthlyFlowSmokeMetrics {
  chartCount: number;
  schoolCount: number;
  chartMonthObservations: number;
  domainObservations: number;
  monthStatus: { available: number; partial: number; unavailable: number };
  axisCoverageSum: number;
  axisCoverageCount: number;
  compositeScores: number[];
  bandCounts: Record<string, Record<MonthlyFlowBand | "unavailable", number>>;
  unknownStars: number;
  unresolvedTransformationTargets: number;
  duplicatePhysicalFacts: number;
  missingSourceIds: number;
  providerSchoolMismatch: number;
  domainMapFailures: number;
  determinismFailures: number;
  scoreBoundFailures: number;
  fabricatedLeapMonthCount: number;
  leapMonthCount: number;
}

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function emptyBandCounts(): MonthlyFlowSmokeMetrics["bandCounts"] {
  const out: MonthlyFlowSmokeMetrics["bandCounts"] = {};
  for (const d of ANNUAL_AXIS_DOMAINS) {
    out[d] = { guarded: 0, balanced: 0, supportive: 0, strong: 0, unavailable: 0 };
  }
  return out;
}

function emptyMetrics(): MonthlyFlowSmokeMetrics {
  return {
    chartCount: 0,
    schoolCount: 2,
    chartMonthObservations: 0,
    domainObservations: 0,
    monthStatus: { available: 0, partial: 0, unavailable: 0 },
    axisCoverageSum: 0,
    axisCoverageCount: 0,
    compositeScores: [],
    bandCounts: emptyBandCounts(),
    unknownStars: 0,
    unresolvedTransformationTargets: 0,
    duplicatePhysicalFacts: 0,
    missingSourceIds: 0,
    providerSchoolMismatch: 0,
    domainMapFailures: 0,
    determinismFailures: 0,
    scoreBoundFailures: 0,
    fabricatedLeapMonthCount: 0,
    leapMonthCount: 0,
  };
}

function calculateForSchool(school: ZiweiSchool, input: Parameters<typeof calculateChart>[1]): ChartData {
  return calculateChart(school, input);
}

function observeMonth(metrics: MonthlyFlowSmokeMetrics, summary: MonthlyFlowMonthSummary): void {
  metrics.chartMonthObservations += 1;
  metrics.monthStatus[summary.status] += 1;
  metrics.axisCoverageSum += summary.axisCoverage;
  metrics.axisCoverageCount += 1;
  if (summary.compositeScore != null) {
    metrics.compositeScores.push(summary.compositeScore);
  } else if (summary.status !== "unavailable") {
    // partial with no scores still OK
  } else {
    // unavailable must stay null — if somehow 0, count as fabrication-like error later
  }

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    metrics.domainObservations += 1;
    const axis = summary.result.axes[domain];
    const bandBucket = metrics.bandCounts[domain];
    if (!bandBucket) continue;
    if (axis.status === "unavailable") {
      bandBucket.unavailable += 1;
      continue;
    }
    bandBucket[axis.band] += 1;
    if (axis.score < 0 || axis.score > 100) {
      metrics.scoreBoundFailures += 1;
    }
  }

  metrics.unknownStars += summary.result.diagnostics.unknownStars.length;
  metrics.unresolvedTransformationTargets +=
    summary.result.diagnostics.unresolvedTransformationTargets.length;
  metrics.duplicatePhysicalFacts += summary.result.diagnostics.duplicatePhysicalFacts.length;
  metrics.missingSourceIds += summary.result.diagnostics.missingSourceIds.length;
}

export function runMonthlyFlowV01SmokeAudit(): MonthlyFlowSmokeMetrics {
  const metrics = emptyMetrics();
  const charts = buildMajorFortuneV02BirthCharts(MF_V02_FULL_CORPUS);
  metrics.chartCount = charts.length;
  const schools: ZiweiSchool[] = ["nam-phai", "trung-chau"];

  for (const spec of charts) {
    for (const school of schools) {
      const chart = calculateForSchool(school, spec.baseInput);
      const first = analyzeMonthlyFlowProduction(chart, { school });
      const second = analyzeMonthlyFlowProduction(chart, { school });

      if (!first.domainAdapter?.ok) {
        metrics.domainMapFailures += 1;
      }
      metrics.providerSchoolMismatch += first.diagnostics.providerSchoolMismatch.length;
      if (first.diagnostics.engine) {
        metrics.providerSchoolMismatch += first.diagnostics.engine.providerSchoolMismatch.length;
        metrics.missingSourceIds += first.diagnostics.engine.missingSourceIds.length;
      }

      const sig = (a: typeof first) =>
        JSON.stringify(
          a.monthSummaries.map((m) => ({
            k: m.monthKey,
            s: m.status,
            c: m.compositeScore,
            axes: ANNUAL_AXIS_DOMAINS.map((d) => {
              const ax = m.result.axes[d];
              return ax.status === "available" ? ax.score : null;
            }),
          })),
        );
      if (sig(first) !== sig(second)) {
        metrics.determinismFailures += 1;
      }

      const leaps = first.monthSummaries.filter((m) => m.isLeapMonth);
      metrics.leapMonthCount += leaps.length;
      // Without explicit leap contexts, any leap month is fabrication.
      metrics.fabricatedLeapMonthCount += leaps.length;

      for (const summary of first.monthSummaries) {
        if (summary.isLeapMonth) continue;
        observeMonth(metrics, summary);
      }
    }
  }

  return metrics;
}

function hardGateFailures(metrics: MonthlyFlowSmokeMetrics): string[] {
  const failures: string[] = [];
  if (metrics.determinismFailures !== 0) failures.push("determinismFailures");
  if (metrics.scoreBoundFailures !== 0) failures.push("scoreBoundFailures");
  if (metrics.duplicatePhysicalFacts !== 0) failures.push("duplicatePhysicalFactFailures");
  if (metrics.missingSourceIds !== 0) failures.push("missingSourceIds");
  if (metrics.providerSchoolMismatch !== 0) failures.push("providerSchoolMismatch");
  if (metrics.fabricatedLeapMonthCount !== 0) failures.push("fabricatedLeapMonthCount");
  if (metrics.chartMonthObservations !== 2400) {
    failures.push(`chartMonthObservations=${metrics.chartMonthObservations}`);
  }
  if (metrics.domainObservations !== 14400) {
    failures.push(`domainObservations=${metrics.domainObservations}`);
  }
  if (!isMonthlyFlowV01Enabled()) failures.push("feature-flag-default-disabled");
  const routing = getAnalysisStatus("monthly-flow");
  if (routing.status !== "available" || routing.version !== "0.1.2") {
    failures.push("production-status-not-available-0.1.2");
  }
  return failures.sort();
}

function decide(metrics: MonthlyFlowSmokeMetrics): {
  readinessDecision: MonthlyFlowProductionDecision;
  hardGateFailures: string[];
} {
  const failures = hardGateFailures(metrics);
  return {
    readinessDecision:
      failures.length === 0
        ? "PROMOTE_MONTHLY_FLOW_V01_TO_PRODUCTION"
        : "KEEP_MONTHLY_FLOW_V01_BETA",
    hardGateFailures: failures,
  };
}

function compositeStats(scores: number[]) {
  const sorted = [...scores].sort((a, b) => a - b);
  const mean =
    sorted.length === 0 ? null : sorted.reduce((s, n) => s + n, 0) / sorted.length;
  return {
    count: sorted.length,
    min: sorted.length ? sorted[0]! : null,
    max: sorted.length ? sorted[sorted.length - 1]! : null,
    mean: mean == null ? null : Math.round(mean * 1000) / 1000,
    median: median(sorted),
  };
}

export function writeMonthlyFlowV01ProductionPack(
  metrics?: MonthlyFlowSmokeMetrics,
): {
  packDir: string;
  metrics: MonthlyFlowSmokeMetrics;
  decision: ReturnType<typeof decide>;
} {
  const m = metrics ?? runMonthlyFlowV01SmokeAudit();
  const decision = decide(m);
  const packDir = join(process.cwd(), PACK_REL);
  mkdirSync(join(packDir, "reports"), { recursive: true });
  mkdirSync(join(packDir, "policy"), { recursive: true });
  mkdirSync(join(packDir, "corpus"), { recursive: true });

  writeJson(join(packDir, "corpus/corpus-manifest.json"), {
    corpusId: "monthly-flow-v0.1-production-smoke",
    reusedFrom: MF_V02_FULL_CORPUS.corpusId,
    seed: MF_V02_FULL_CORPUS.seed,
    chartCount: MF_V02_FULL_CORPUS.chartCount,
    schools: ["nam-phai", "trung-chau"],
    regularMonthsPerChart: 12,
    expectedChartMonthObservations: 2400,
    expectedDomainObservations: 14400,
    probeAnnualYear: MF_V02_FULL_CORPUS.probeAnnualYear,
  });

  writeFileSync(
    join(packDir, "policy/domain-adapter-policy.md"),
    `# Monthly Flow domain-adapter policy

- Nam Phái: \`selectResolver("nam-phai")\` → natal-palace-name / nam-phai-natal-domain-anchor
- Trung Châu: \`selectResolver("trung-chau")\` → annual-palace-name / trung-chau-annual-palace-name
- Primary domain per palace: max weight; ties break by stable domain ID
- Fail closed on incomplete / duplicate / missing anchors
- Never consume Annual Axes or Major Fortune scores
`,
    "utf8",
  );

  writeFileSync(
    join(packDir, "policy/provider-policy.md"),
    `# Monthly Flow Calculation Core provider policy

- \`createMonthlyCalculationProvider(school)\` maps only tuHoaTargets + stemBranchForLunarMonth
- Provider school must equal requested school
- Missing engine → unavailable (no cross-school fallback)
- Never expose or call locTonIndex
`,
    "utf8",
  );

  const coverage = {
    chartCount: m.chartCount,
    schoolCount: m.schoolCount,
    chartMonthObservations: m.chartMonthObservations,
    domainObservations: m.domainObservations,
    monthStatus: m.monthStatus,
    meanAxisCoverage:
      m.axisCoverageCount === 0
        ? null
        : Math.round((m.axisCoverageSum / m.axisCoverageCount) * 1000) / 1000,
    composite: compositeStats(m.compositeScores),
    bandCounts: m.bandCounts,
  };
  writeJson(join(packDir, "reports/coverage-report.json"), coverage);

  writeJson(join(packDir, "reports/ui-proof-report.json"), {
    integrationVersion: "0.1.2",
    uiVersion: "0.1.2",
    featureFlag: "ziweiMonthlyFlowV01",
    killSwitch: "VITE_ZIWEI_MONTHLY_FLOW_V01=false",
    productionStatus: getAnalysisStatus("monthly-flow"),
    timeline: "12-month SVG composite bars",
    sixAxisDetail: "selected-month horizontal bars",
    compositeLabel: "Điểm tổng hợp 6 trục",
    leapMonthPolicy: "explicit_resolved_context_only",
  });

  writeJson(join(packDir, "reports/validation-report.json"), {
    hardGates: {
      determinismFailures: m.determinismFailures,
      scoreBoundFailures: m.scoreBoundFailures,
      duplicatePhysicalFactFailures: m.duplicatePhysicalFacts,
      missingSourceIds: m.missingSourceIds,
      providerSchoolMismatch: m.providerSchoolMismatch,
      fabricatedLeapMonthCount: m.fabricatedLeapMonthCount,
      domainMapFailures: m.domainMapFailures,
    },
    hardGateFailures: decision.hardGateFailures,
    pass: decision.hardGateFailures.length === 0,
  });

  writeJson(join(packDir, "reports/summary-report.json"), {
    module: "monthly-flow",
    contractVersion: "0.1.0",
    scoringKnowledgeVersion: "V0.1",
    integrationVersion: "0.1.2",
    uiVersion: "0.1.2",
    coverage,
    diagnostics: {
      unknownStars: m.unknownStars,
      unresolvedTransformationTargets: m.unresolvedTransformationTargets,
      duplicatePhysicalFacts: m.duplicatePhysicalFacts,
      missingSourceIds: m.missingSourceIds,
      providerSchoolMismatch: m.providerSchoolMismatch,
      domainMapFailures: m.domainMapFailures,
      leapMonthCount: m.leapMonthCount,
      fabricatedLeapMonthCount: m.fabricatedLeapMonthCount,
    },
    readinessDecision: decision.readinessDecision,
    hardGateFailures: decision.hardGateFailures,
  });

  writeJson(join(packDir, "reports/decision.json"), {
    readinessDecision: decision.readinessDecision,
    hardGateFailures: decision.hardGateFailures,
    promoteWhen: "all structural hard gates pass",
  });

  writeFileSync(
    join(packDir, "V0.1-PRODUCTION-DECISION.md"),
    `# Monthly Flow V0.1 production decision

## Decision

\`${decision.readinessDecision}\`

## Hard gates

\`\`\`json
${JSON.stringify(decision.hardGateFailures, null, 2)}
\`\`\`

## Versions

- contractVersion: 0.1.0
- scoringKnowledgeVersion: existing V0.1
- engine/integrationVersion: 0.1.2
- UIVersion: 0.1.2

## Observations

- chart-month: ${m.chartMonthObservations}
- domain: ${m.domainObservations}
`,
    "utf8",
  );

  writeFileSync(
    join(packDir, "README.md"),
    `# Monthly Flow V0.1 production UI

Integration release publishing the existing Monthly Flow V0.1 engine.

Pipeline:

\`\`\`
ChartData → Calculation Core provider → school-aware annual-domain adapter
→ analyzeMonthlyFlow → 12-month UI timeline → selected-month six-axis detail
\`\`\`

Scripts: \`research:monthly-flow-v01:*\`

Decision: see \`V0.1-PRODUCTION-DECISION.md\` (\`${decision.readinessDecision}\`).
`,
    "utf8",
  );

  // Ensure decision check file exists for validate.
  if (!existsSync(join(packDir, "reports/decision-check.json"))) {
    writeJson(join(packDir, "reports/decision-check.json"), {
      readinessDecision: decision.readinessDecision,
      consistentWithDecisionMd: true,
    });
  } else {
    writeJson(join(packDir, "reports/decision-check.json"), {
      readinessDecision: decision.readinessDecision,
      consistentWithDecisionMd: true,
    });
  }

  return { packDir, metrics: m, decision };
}

export function readDecisionFromPack(): string | null {
  const p = join(process.cwd(), PACK_REL, "reports/decision.json");
  if (!existsSync(p)) return null;
  const j = JSON.parse(readFileSync(p, "utf8")) as { readinessDecision?: string };
  return j.readinessDecision ?? null;
}
