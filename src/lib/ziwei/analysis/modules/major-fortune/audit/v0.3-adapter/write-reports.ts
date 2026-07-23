import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  buildMajorFortuneV02BirthCharts,
  MF_V02_FULL_CORPUS,
} from "../v0.2/corpus";
import {
  runMajorFortuneV03AdapterAudit,
  type MajorFortuneV03AdapterAuditMetrics,
} from "./run-audit";
import adapterPolicy from "../../v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json";
import engineeringProvenance from "../../v0.3-ordinal/adapter/policy/engineering-provenance.v0.3.json";
import branchElementMap from "../../v0.3-ordinal/adapter/policy/branch-element-map.v0.3.json";

export const PACK_REL = "research/major-fortune/v0.3-evidence-adapter-audit";

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function decide(metrics: MajorFortuneV03AdapterAuditMetrics): {
  readinessDecision:
    | "EVIDENCE_ADAPTER_READY_FOR_CANDIDATE_EVALUATION"
    | "EVIDENCE_ADAPTER_REVISION_REQUIRED";
  hardGateFailures: string[];
} {
  const failures = [...metrics.overall.hardGateFailures];
  if (!metrics.overall.v03ContractValid) failures.push("v03-contract-invalid");
  if (
    metrics.overall.productionRouting.status !== "available" ||
    metrics.overall.productionRouting.version !== "0.3.1"
  ) {
    failures.push("production-routing-unexpected");
  }
  const unique = [...new Set(failures)].sort();
  return {
    readinessDecision:
      unique.length === 0
        ? "EVIDENCE_ADAPTER_READY_FOR_CANDIDATE_EVALUATION"
        : "EVIDENCE_ADAPTER_REVISION_REQUIRED",
    hardGateFailures: unique,
  };
}

export function writeMajorFortuneV03AdapterAudit(
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
  const prompts = join(packDir, "prompts");

  for (const d of [packDir, reports, policy, corpus, fixtures, prompts]) {
    mkdirSync(d, { recursive: true });
  }

  // Policy / provenance copies
  writeJson(join(policy, "adapter-policy.v0.3.json"), adapterPolicy);
  writeJson(join(policy, "engineering-provenance.v0.3.json"), engineeringProvenance);
  writeJson(join(policy, "branch-element-map.v0.3.json"), branchElementMap);

  const charts = buildMajorFortuneV02BirthCharts(MF_V02_FULL_CORPUS);
  writeJson(join(corpus, "corpus-manifest.json"), {
    corpusId: m.corpusId,
    seed: m.seed,
    chartCount: m.chartCount,
    trainCount: m.trainChartCount,
    holdoutCount: m.holdoutChartCount,
    cycleObservationCount: m.cycleObservationCount,
    adapterVersion: m.adapterVersion,
    v03ContractHash: m.v03ContractHash,
    includeAllAvailableMajorFortuneCycles: true,
    schools: ["nam-phai", "trung-chau"],
    note: "Reuses frozen Major Fortune V0.2 audit corpus identity; no holdout tuning in this phase.",
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

  // Sort observations for determinism
  const observations = [...m.observations].sort((a, b) =>
    a.observationId.localeCompare(b.observationId),
  );
  writeJson(join(reports, "audit-observations.json"), observations);

  const bySchool = Object.fromEntries(
    Object.entries(m.schools).map(([school, s]) => [
      school,
      {
        chartCount: s.chartCount,
        cycleObservationCount: s.cycleObservationCount,
        score: s.score,
        bandCounts: s.bandCounts,
        scoreStateCounts: s.scoreStateCounts,
        coverageHistogram: s.coverageHistogram,
        contextCoverageHistogram: s.contextCoverageHistogram,
        scoringCoverageHistogram: s.scoringCoverageHistogram,
        meanContextCoverageWeight: s.meanContextCoverageWeight,
        meanScoringCoverageWeight: s.meanScoringCoverageWeight,
        partialRate: s.partialRate,
        unavailableRate: s.unavailableRate,
        pillarLevels: s.pillarLevels,
        pillarNoSignalRate: s.pillarNoSignalRate,
        pillarBalancedRate: s.pillarBalancedRate,
        pillarPartialRate: s.pillarPartialRate,
        acceptedEvidenceByFamily: s.acceptedEvidenceByFamily,
        supportMassByFamily: s.supportMassByFamily,
        pressureMassByFamily: s.pressureMassByFamily,
        saturationNeg2: s.saturationNeg2,
        saturationPos2: s.saturationPos2,
        rejectedEvidenceReasons: s.rejectedEvidenceReasons,
        missingProvenanceCount: s.missingProvenanceCount,
        duplicatePhysicalFactCount: s.duplicatePhysicalFactCount,
        duplicateClusterCount: s.duplicateClusterCount,
        crossPillarOwnershipViolationCount: s.crossPillarOwnershipViolationCount,
        incompleteTransformationTupleCount: s.incompleteTransformationTupleCount,
        annualMonthlyInfluenceFailures: s.annualMonthlyInfluenceFailures,
        determinismFailures: s.determinismFailures,
        boundsFailures: s.boundsFailures,
        levelFailures: s.levelFailures,
        familyActivation: s.familyActivation,
        namPhaiXfUnavailableCount: s.namPhaiXfUnavailableCount,
        directTransformationActivationCount: s.directTransformationActivationCount,
        outOfFrameTransformationCount: s.outOfFrameTransformationCount,
        observationsWithDirectTransformation: s.observationsWithDirectTransformation,
        observationsWithoutDirectTransformation: s.observationsWithoutDirectTransformation,
      },
    ]),
  );

  writeJson(join(reports, "coverage-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          coverageHistogram: s.coverageHistogram,
          contextCoverageHistogram: s.contextCoverageHistogram,
          scoringCoverageHistogram: s.scoringCoverageHistogram,
          meanContextCoverageWeight: s.meanContextCoverageWeight,
          meanScoringCoverageWeight: s.meanScoringCoverageWeight,
          partialRate: s.partialRate,
          unavailableRate: s.unavailableRate,
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
          saturationNeg2: s.saturationNeg2,
          saturationPos2: s.saturationPos2,
        },
      ]),
    ),
  });
  writeJson(join(reports, "evidence-activation-report.json"), {
    enabledFamilies: adapterPolicy.enabledSignalFamilies,
    disabledFamilies: m.overall.disabledFamilies,
    overallActivation: m.overall.enabledFamilyActivation,
    transformationFrame: adapterPolicy.transformationFrame ?? null,
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          familyActivation: s.familyActivation,
          acceptedEvidenceByFamily: s.acceptedEvidenceByFamily,
          supportMassByFamily: s.supportMassByFamily,
          pressureMassByFamily: s.pressureMassByFamily,
          directTransformationActivationCount: s.directTransformationActivationCount,
          outOfFrameTransformationCount: s.outOfFrameTransformationCount,
          observationsWithDirectTransformation: s.observationsWithDirectTransformation,
          observationsWithoutDirectTransformation: s.observationsWithoutDirectTransformation,
          directTransformationActivationRate:
            s.observationsWithDirectTransformation +
              s.observationsWithoutDirectTransformation ===
            0
              ? null
              : s.observationsWithDirectTransformation /
                (s.observationsWithDirectTransformation +
                  s.observationsWithoutDirectTransformation),
        },
      ]),
    ),
  });
  writeJson(join(reports, "accepted-rejected-evidence-report.json"), {
    bySchool: Object.fromEntries(
      Object.entries(m.schools).map(([k, s]) => [
        k,
        {
          acceptedEvidenceByFamily: s.acceptedEvidenceByFamily,
          rejectedEvidenceReasons: s.rejectedEvidenceReasons,
          missingProvenanceCount: s.missingProvenanceCount,
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
  writeJson(join(reports, "school-comparison-report.json"), bySchool);
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
    note: "Annual/monthly fields may appear in diagnostics but must not affect evidence or score.",
  });
  writeJson(join(fixtures, "product-smoke-fixtures.json"), m.productSmoke);

  const summary = {
    corpusId: m.corpusId,
    seed: m.seed,
    adapterVersion: m.adapterVersion,
    v03ContractHash: m.v03ContractHash,
    chartCount: m.chartCount,
    cycleObservationCount: m.cycleObservationCount,
    trainChartCount: m.trainChartCount,
    holdoutChartCount: m.holdoutChartCount,
    bySchool,
    overall: m.overall,
    productSmoke: m.productSmoke,
    readinessDecision: decision.readinessDecision,
    hardGateFailures: decision.hardGateFailures,
  };
  writeJson(join(reports, "summary-report.json"), summary);

  writeJson(join(reports, "validation-report.json"), {
    ok: decision.hardGateFailures.length === 0,
    hardGateFailures: decision.hardGateFailures,
    v03ContractValid: m.overall.v03ContractValid,
    productionRouting: m.overall.productionRouting,
    enabledFamilyActivation: m.overall.enabledFamilyActivation,
    checks: {
      allScoresInBounds: Object.values(m.schools).every((s) => s.boundsFailures === 0),
      allLevelsOrdinal: Object.values(m.schools).every((s) => s.levelFailures === 0),
      noMissingProvenance: Object.values(m.schools).every(
        (s) => s.missingProvenanceCount === 0,
      ),
      noCrossPillarOwnership: Object.values(m.schools).every(
        (s) => s.crossPillarOwnershipViolationCount === 0,
      ),
      temporalIndependence: Object.values(m.schools).every(
        (s) => s.annualMonthlyInfluenceFailures === 0,
      ),
      deterministic: Object.values(m.schools).every((s) => s.determinismFailures === 0),
      namPhaiXfBlocked: (m.schools["nam-phai"]?.namPhaiXfUnavailableCount ?? 0) > 0,
    },
  });

  writeJson(join(reports, "decision.json"), {
    schemaVersion: "0.3.0",
    decisionId: "major-fortune-v0.3-evidence-adapter-audit-decision",
    readinessDecision: decision.readinessDecision,
    modelNature: "engineering-heuristic",
    classicalDoctrineVerified: false,
    numericAuthority: "engineering-defined",
    productionStatus: "research-only",
    adapterVersion: m.adapterVersion,
    corpusId: m.corpusId,
    v03ContractHash: m.v03ContractHash,
    hardGateFailures: decision.hardGateFailures,
    enabledSignalFamilies: adapterPolicy.enabledSignalFamilies,
    disabledSignalFamilies: adapterPolicy.round1DisabledFamilies,
    includesUi: false,
    includesFeatureFlag: false,
    includesProductionRouting: false,
    v01Unchanged: true,
    v02Unchanged: true,
    v03OrdinalContractUnchanged: true,
    notes:
      decision.readinessDecision === "EVIDENCE_ADAPTER_READY_FOR_CANDIDATE_EVALUATION"
        ? "Structural hard gates passed. Narrow score distribution alone does not force revision."
        : "Revision required: see hardGateFailures.",
  });

  writeFileSync(
    join(packDir, "V0.3-ADAPTER-AUDIT-DECISION.md"),
    [
      "# Major Fortune V0.3 Evidence Adapter Audit Decision",
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
      "## Hard gates",
      "",
      decision.hardGateFailures.length === 0
        ? "- All structural hard gates passed."
        : decision.hardGateFailures.map((f) => `- FAIL: \`${f}\``).join("\n"),
      "",
      "## Corpus",
      "",
      `- corpusId: \`${m.corpusId}\``,
      `- charts: ${m.chartCount}`,
      `- cycle observations: ${m.cycleObservationCount}`,
      `- adapterVersion: \`${m.adapterVersion}\``,
      `- v03ContractHash: \`${m.v03ContractHash}\``,
      "",
      "## Production safety",
      "",
      "- V0.1 unchanged",
      "- V0.2 unchanged",
      "- V0.3 ordinal formula contract unchanged",
      "- `getAnalysisStatus(\"major-fortune\")` → `available` / `0.3.1` when enabled",
      "- Production UI + feature-flag kill-switch live in the production-finalization pack",
      "",
      "## Next step",
      "",
      decision.readinessDecision === "EVIDENCE_ADAPTER_READY_FOR_CANDIDATE_EVALUATION"
        ? "Adapter audit remains a historical research artifact; production rollout is owned by `v0.3-production-finalization`."
        : "Revise adapter emitters or provenance until hard gates clear.",
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(prompts, "next-step-handoff-prompt.md"),
    [
      "# Next-step handoff — Major Fortune V0.3 evidence adapter",
      "",
      `Decision: \`${decision.readinessDecision}\``,
      "",
      "Do not change the V0.3 ordinal formula contract.",
      "Do not tune mappings from corpus aesthetics in the same phase.",
      "Production routing must remain rebuilding.",
      "",
      "If READY: design a separate candidate-evaluation research pack.",
      "If REVISION: fix hardGateFailures listed in reports/decision.json.",
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(packDir, "README.md"),
    [
      "# Major Fortune V0.3 Evidence Adapter Audit",
      "",
      "Research-only ChartData → `MajorFortuneOrdinalEvidence` adapter audit.",
      "",
      "## Pipeline",
      "",
      "```text",
      "ChartData",
      "→ resolved Major Fortune context",
      "→ normalized evidence",
      "→ evaluateMajorFortuneOrdinal(...)",
      "→ adapter/corpus audit reports",
      "```",
      "",
      "## Commands",
      "",
      "```bash",
      "npm run research:major-fortune-v03-adapter:validate",
      "npm run research:major-fortune-v03-adapter:audit",
      "npm run research:major-fortune-v03-adapter:report",
      "npm run research:major-fortune-v03-adapter:decision",
      "```",
      "",
      "## Decision",
      "",
      `See \`V0.3-ADAPTER-AUDIT-DECISION.md\` — currently **\`${decision.readinessDecision}\`**.`,
      "",
    ].join("\n"),
    "utf8",
  );

  // Ensure policy source of truth under src remains authoritative; pack is a snapshot.
  if (!existsSync(join(policy, "adapter-policy.v0.3.json"))) {
    throw new Error("failed to write adapter policy snapshot");
  }

  return { packDir, metrics: m, decision };
}
