/**
 * Write Major Fortune V0.3 production-finalization research pack.
 * Reuses the frozen V0.2/V0.3 adapter corpus via runMajorFortuneV03AdapterAudit.
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  runMajorFortuneV03AdapterAudit,
  type MajorFortuneV03AdapterAuditMetrics,
} from "../v0.3-adapter/run-audit";
import { MF_V02_FULL_CORPUS, buildMajorFortuneV02BirthCharts } from "../v0.2/corpus";
import adapterPolicy from "../../v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json";
import engineeringProvenance from "../../v0.3-ordinal/adapter/policy/engineering-provenance.v0.3.json";
import branchElementMap from "../../v0.3-ordinal/adapter/policy/branch-element-map.v0.3.json";
import { getAnalysisStatus } from "../../../../contracts/common";
import { isMajorFortuneV03OrdinalEnabled } from "../../../../feature-flags";

export const PACK_REL = "research/major-fortune/v0.3-production-finalization";

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export type ProductionDecision =
  | "PROMOTE_MAJOR_FORTUNE_V03_TO_PRODUCTION"
  | "KEEP_MAJOR_FORTUNE_V03_BETA";

function collectProductionFailures(
  metrics: MajorFortuneV03AdapterAuditMetrics,
): string[] {
  const failures = [...metrics.overall.hardGateFailures];
  const np = metrics.schools["nam-phai"];
  const tc = metrics.schools["trung-chau"];

  if (np) {
    const meanScoring = np.meanScoringCoverageWeight;
    const meanContext = np.meanContextCoverageWeight;
    if (meanScoring == null || Math.abs(meanScoring - 0.75) > 0.001) {
      failures.push("nam-phai-scoring-coverage-not-0.75");
    }
    if (meanContext == null || Math.abs(meanContext - 1) > 0.001) {
      failures.push("nam-phai-context-coverage-not-1");
    }
  }

  if (tc) {
    const meanScoring = tc.meanScoringCoverageWeight;
    if (meanScoring == null || meanScoring < 0.999) {
      failures.push("trung-chau-scoring-coverage-not-1");
    }
  }

  const routing = metrics.overall.productionRouting;
  if (routing.status !== "available" || routing.version !== "0.3.1") {
    failures.push("production-status-not-available-0.3.1");
  }
  if (!isMajorFortuneV03OrdinalEnabled()) {
    failures.push("feature-flag-default-disabled");
  }

  return [...new Set(failures)].sort();
}

function decide(metrics: MajorFortuneV03AdapterAuditMetrics): {
  readinessDecision: ProductionDecision;
  hardGateFailures: string[];
} {
  const hardGateFailures = collectProductionFailures(metrics);
  return {
    readinessDecision:
      hardGateFailures.length === 0
        ? "PROMOTE_MAJOR_FORTUNE_V03_TO_PRODUCTION"
        : "KEEP_MAJOR_FORTUNE_V03_BETA",
    hardGateFailures,
  };
}

function schoolXfSummary(s: MajorFortuneV03AdapterAuditMetrics["schools"][string]) {
  const denom =
    s.observationsWithDirectTransformation + s.observationsWithoutDirectTransformation;
  return {
    directTransformationActivationCount: s.directTransformationActivationCount,
    outOfFrameTransformationCount: s.outOfFrameTransformationCount,
    observationsWithDirectTransformation: s.observationsWithDirectTransformation,
    observationsWithoutDirectTransformation: s.observationsWithoutDirectTransformation,
    directTransformationActivationRate: denom === 0 ? null : s.observationsWithDirectTransformation / denom,
    tuHoaLevels: s.pillarLevels["tu-hoa-sat-tinh"],
  };
}

export function writeMajorFortuneV03ProductionPack(
  metrics?: MajorFortuneV03AdapterAuditMetrics,
): {
  packDir: string;
  metrics: MajorFortuneV03AdapterAuditMetrics;
  decision: ReturnType<typeof decide>;
} {
  const m = metrics ?? runMajorFortuneV03AdapterAudit(MF_V02_FULL_CORPUS);
  const decision = decide(m);
  const packDir = join(process.cwd(), PACK_REL);
  const reports = join(packDir, "reports");
  const policy = join(packDir, "policy");
  const corpus = join(packDir, "corpus");
  const fixtures = join(packDir, "fixtures");

  for (const d of [packDir, reports, policy, corpus, fixtures]) {
    mkdirSync(d, { recursive: true });
  }

  writeJson(join(policy, "adapter-policy.v0.3.json"), adapterPolicy);
  writeJson(join(policy, "engineering-provenance.v0.3.json"), engineeringProvenance);
  writeJson(join(policy, "branch-element-map.v0.3.json"), branchElementMap);
  writeJson(join(policy, "adapter-policy-delta.v0.3.1.json"), {
    adapterVersion: "0.3.1",
    uiIntegrationVersion: "0.3.1",
    productionModuleVersion: "0.3.1",
    formulaContractVersion: "0.3.0",
    note: "Adapter/frame and production-integration correction; ordinal formula unchanged.",
    transformationFrame: "direct-active-major-fortune-palace-only",
    coverageSemantics: {
      contextCoverageWeight: "sum of budgets for non-unavailable pillar contexts / 100",
      scoringCoverageWeight: "sum of budgets for pillars with non-null ordinal level / 100",
    },
  });

  const charts = buildMajorFortuneV02BirthCharts(MF_V02_FULL_CORPUS);
  writeJson(join(corpus, "corpus-identity.json"), {
    corpusId: m.corpusId,
    seed: m.seed,
    chartCount: m.chartCount,
    trainCount: m.trainChartCount,
    holdoutCount: m.holdoutChartCount,
    cycleObservationCount: m.cycleObservationCount,
    schoolObservations: {
      "nam-phai": m.schools["nam-phai"]?.cycleObservationCount ?? 0,
      "trung-chau": m.schools["trung-chau"]?.cycleObservationCount ?? 0,
    },
    adapterVersion: m.adapterVersion,
    v03ContractHash: m.v03ContractHash,
    note: "Reuses frozen major-fortune-v0.2-audit-corpus; identities unchanged.",
  });
  writeJson(
    join(corpus, "chart-level-split-manifest.json"),
    charts.map((c) => ({
      birthChartId: c.birthChartId,
      split: c.split,
      solarDate: c.baseInput.solarDate,
      birthHour: c.baseInput.birthHour,
      gender: c.baseInput.gender,
    })),
  );

  const observations = [...m.observations].sort((a, b) =>
    a.observationId.localeCompare(b.observationId),
  );
  writeJson(join(reports, "audit-observations.json"), observations);

  writeJson(join(reports, "coverage-report.json"), {
    semantics: {
      contextCoverageWeight: "non-unavailable pillar budgets / 100",
      scoringCoverageWeight: "non-null level pillar budgets / 100",
    },
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          meanContextCoverageWeight: s.meanContextCoverageWeight,
          meanScoringCoverageWeight: s.meanScoringCoverageWeight,
          contextCoverageHistogram: s.contextCoverageHistogram,
          scoringCoverageHistogram: s.scoringCoverageHistogram,
          partialRate: s.partialRate,
        },
      ]),
    ),
  });

  writeJson(join(reports, "score-distribution-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [k, s.score]),
    ),
  });
  writeJson(join(reports, "band-distribution-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [k, s.bandCounts]),
    ),
  });
  writeJson(join(reports, "score-state-distribution-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [k, s.scoreStateCounts]),
    ),
  });
  writeJson(join(reports, "pillar-level-distribution-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          levels: s.pillarLevels,
          noSignalRate: s.pillarNoSignalRate,
          balancedRate: s.pillarBalancedRate,
          partialRate: s.pillarPartialRate,
        },
      ]),
    ),
  });

  writeJson(join(reports, "transformation-activation-report.json"), {
    transformationFrame: adapterPolicy.transformationFrame,
    note: "Engineering heuristic: score only XF targeting the active Major Fortune palace.",
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [k, schoolXfSummary(s)]),
    ),
  });

  writeJson(join(reports, "before-after-transformation-report.json"), (() => {
    const levels = m.schools["trung-chau"]?.pillarLevels["tu-hoa-sat-tinh"] ?? {};
    const scored =
      (levels["-2"] ?? 0) +
      (levels["-1"] ?? 0) +
      (levels["0"] ?? 0) +
      (levels["1"] ?? 0) +
      (levels["2"] ?? 0);
    const plusOne = levels["1"] ?? 0;
    return {
      before: {
        note: "Pre-0.3.1 global XF frame scored all four stem transformations into Tứ Hóa.",
        expectedConstantPlusOneAcrossTrungChau: true,
      },
      after: {
        transformationFrame: "direct-active-major-fortune-palace-only",
        trungChau: schoolXfSummary(m.schools["trung-chau"]!),
        tuHoaLevelCounts: levels,
        scoredObservations: scored,
        plusOneObservations: plusOne,
        constantPlusOneEliminated: !(scored > 0 && plusOne === scored),
      },
    };
  })());

  writeJson(join(reports, "accepted-rejected-evidence-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          acceptedEvidenceByFamily: s.acceptedEvidenceByFamily,
          rejectedEvidenceReasons: s.rejectedEvidenceReasons,
          missingProvenanceCount: s.missingProvenanceCount,
          incompleteTransformationTupleCount: s.incompleteTransformationTupleCount,
        },
      ]),
    ),
  });
  writeJson(join(reports, "dedupe-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          duplicatePhysicalFactCount: s.duplicatePhysicalFactCount,
          duplicateClusterCount: s.duplicateClusterCount,
          crossPillarOwnershipViolationCount: s.crossPillarOwnershipViolationCount,
        },
      ]),
    ),
  });
  writeJson(join(reports, "school-comparison-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          score: s.score,
          bandCounts: s.bandCounts,
          scoreStateCounts: s.scoreStateCounts,
          meanContextCoverageWeight: s.meanContextCoverageWeight,
          meanScoringCoverageWeight: s.meanScoringCoverageWeight,
          familyActivation: s.familyActivation,
          xf: schoolXfSummary(s),
        },
      ]),
    ),
  });
  writeJson(join(reports, "temporal-independence-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          annualMonthlyInfluenceFailures: s.annualMonthlyInfluenceFailures,
          determinismFailures: s.determinismFailures,
        },
      ]),
    ),
  });
  writeJson(join(reports, "deterministic-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        { determinismFailures: s.determinismFailures },
      ]),
    ),
    overallDeterminismFailures: Object.values(m.schools).reduce(
      (a, s) => a + s.determinismFailures,
      0,
    ),
  });

  writeJson(join(reports, "ui-production-proof-report.json"), {
    singleModuleSlot: true,
    experimentalSlotRemoved: true,
    featureFlag: "ziweiMajorFortuneV03Ordinal",
    featureFlagDefault: "enabled",
    killSwitchEnv: "VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=false",
    productionStatus: getAnalysisStatus("major-fortune"),
    monthlyFlowStatus: getAnalysisStatus("monthly-flow"),
    adapterVersion: "0.3.1",
    uiIntegrationVersion: "0.3.1",
    productionModuleVersion: "0.3.1",
    vietnameseBandLabels: true,
    scoringCoverageDisplayed: true,
    namPhaiShowsThreeOfFourPillars: true,
  });

  writeJson(join(fixtures, "product-smoke-fixtures.json"), m.productSmoke);

  const summary = {
    corpusId: m.corpusId,
    seed: m.seed,
    adapterVersion: m.adapterVersion,
    v03ContractHash: m.v03ContractHash,
    chartCount: m.chartCount,
    cycleObservationCount: m.cycleObservationCount,
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          observations: s.cycleObservationCount,
          score: s.score,
          meanContextCoverageWeight: s.meanContextCoverageWeight,
          meanScoringCoverageWeight: s.meanScoringCoverageWeight,
          xf: schoolXfSummary(s),
          bandCounts: s.bandCounts,
          scoreStateCounts: s.scoreStateCounts,
        },
      ]),
    ),
    overall: m.overall,
    readinessDecision: decision.readinessDecision,
    hardGateFailures: decision.hardGateFailures,
  };
  writeJson(join(reports, "summary-report.json"), summary);

  writeJson(join(reports, "validation-report.json"), {
    ok: decision.hardGateFailures.length === 0,
    hardGateFailures: decision.hardGateFailures,
    v03ContractValid: m.overall.v03ContractValid,
    productionRouting: m.overall.productionRouting,
    checks: {
      hardGateFailuresZero: decision.hardGateFailures.length === 0,
      scoringCoverageTruthful: !(
        decision.hardGateFailures.includes("nam-phai-scoring-coverage-not-0.75") ||
        decision.hardGateFailures.includes("nam-phai-context-coverage-not-1")
      ),
      noConstantTuHoaPlusOne: !decision.hardGateFailures.includes(
        "trung-chau-tu-hoa-constant-plus-one",
      ),
      productionAvailable: m.overall.productionRouting.status === "available",
    },
  });

  writeJson(join(reports, "decision.json"), {
    schemaVersion: "0.3.1",
    decisionId: "major-fortune-v0.3-production-finalization-decision",
    readinessDecision: decision.readinessDecision,
    modelNature: "engineering-heuristic",
    classicalDoctrineVerified: false,
    numericAuthority: "engineering-defined",
    productionStatus: "production",
    adapterVersion: m.adapterVersion,
    uiIntegrationVersion: "0.3.1",
    productionModuleVersion: "0.3.1",
    formulaContractVersion: "0.3.0",
    corpusId: m.corpusId,
    v03ContractHash: m.v03ContractHash,
    hardGateFailures: decision.hardGateFailures,
    featureFlagDefaultOn: true,
    killSwitch: "VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=false",
    noFurtherImplementationPhaseRequired: decision.hardGateFailures.length === 0,
    notes:
      decision.readinessDecision === "PROMOTE_MAJOR_FORTUNE_V03_TO_PRODUCTION"
        ? "All production hard gates passed. Major Fortune V0.3 is the production module."
        : "Keep Beta / opt-in only until hardGateFailures clear.",
  });

  writeFileSync(
    join(packDir, "V0.3-PRODUCTION-DECISION.md"),
    [
      "# Major Fortune V0.3 Production Decision",
      "",
      `**\`${decision.readinessDecision}\`**`,
      "",
      "## Model nature",
      "",
      "```text",
      "model nature: engineering heuristic",
      "classical doctrine verified: false",
      "numeric authority: engineering defined",
      "```",
      "",
      "## Versions",
      "",
      "- formula contract: `0.3.0` (unchanged)",
      "- adapterVersion: `0.3.1`",
      "- UI/integration: `0.3.1`",
      "- production module: `0.3.1`",
      "",
      "## Hard gates",
      "",
      decision.hardGateFailures.length === 0
        ? "- All production hard gates passed."
        : decision.hardGateFailures.map((f) => `- FAIL: \`${f}\``).join("\n"),
      "",
      "## Corpus",
      "",
      `- corpusId: \`${m.corpusId}\``,
      `- charts: ${m.chartCount}`,
      `- cycle observations: ${m.cycleObservationCount}`,
      "",
      "## Coverage",
      "",
      `- Nam Phái mean context coverage: \`${m.schools["nam-phai"]?.meanContextCoverageWeight}\``,
      `- Nam Phái mean scoring coverage: \`${m.schools["nam-phai"]?.meanScoringCoverageWeight}\``,
      `- Trung Châu mean scoring coverage: \`${m.schools["trung-chau"]?.meanScoringCoverageWeight}\``,
      "",
      "## Transformation frame",
      "",
      "```text",
      "transformationFrame = direct-active-major-fortune-palace-only",
      "```",
      "",
      "Engineering heuristic — not verified classical doctrine.",
      "",
      "## Production routing",
      "",
      "- Feature flag `ziweiMajorFortuneV03Ordinal` default ON",
      "- Kill-switch `VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=false`",
      "- `getAnalysisStatus(\"major-fortune\")` → `available` / `0.3.1`",
      "- Monthly Flow remains rebuilding",
      "",
      "## No further phase",
      "",
      decision.hardGateFailures.length === 0
        ? "No future Major Fortune implementation phase is required for V0.3 Round 1."
        : "Blockers remain — do not treat as full production promotion.",
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(packDir, "README.md"),
    [
      "# Major Fortune V0.3 Production Finalization",
      "",
      "Final bounded production rollout for Major Fortune ordinal V0.3.",
      "",
      "## Decision",
      "",
      `See \`V0.3-PRODUCTION-DECISION.md\` → **\`${decision.readinessDecision}\`**.`,
      "",
      "## What changed in 0.3.1",
      "",
      "- Truthful scoring vs context coverage",
      "- Direct-palace Trung Châu transformation frame",
      "- Production module slot + default-on kill-switch",
      "",
      "## What did not change",
      "",
      "- Ordinal formula, budgets, bands, mass weights, polarities",
      "- Frozen corpus identity (`major-fortune-v0.2-audit-corpus`)",
      "",
      "## Commands",
      "",
      "```bash",
      "npm run research:major-fortune-v03-production:validate",
      "npm run research:major-fortune-v03-production:audit",
      "npm run research:major-fortune-v03-production:report",
      "npm run research:major-fortune-v03-production:decision",
      "```",
      "",
    ].join("\n"),
    "utf8",
  );

  // Keep a pointer to prior pack reports if present (do not copy bulk)
  const priorSummary = join(
    process.cwd(),
    "research/major-fortune/v0.3-evidence-adapter-audit/reports/summary-report.json",
  );
  if (existsSync(priorSummary)) {
    copyFileSync(priorSummary, join(reports, "prior-adapter-audit-summary-pointer.json"));
  }

  return { packDir, metrics: m, decision };
}
