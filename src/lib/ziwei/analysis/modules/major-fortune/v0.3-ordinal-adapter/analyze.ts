import type { ChartData } from "@/types/chart";
import {
  adaptChartToMajorFortuneOrdinalInput as adaptCore,
  analyzeMajorFortuneOrdinalV03 as analyzeCore,
} from "../v0.3-ordinal/adapter";
import type { MajorFortuneAdapterDiagnostics } from "../v0.3-ordinal/adapter/types";
import { buildDisplay, emptyDiagnostics } from "./display";
import type {
  AdaptMajorFortuneOrdinalOptions,
  MajorFortuneOrdinalAdapterDiagnostics,
  MajorFortuneOrdinalAdapterResult,
  MajorFortuneOrdinalAdapterStatus,
  MajorFortuneOrdinalCycleMetadata,
  MajorFortuneOrdinalV03Analysis,
} from "./types";

function mapDiagnostics(
  raw: MajorFortuneAdapterDiagnostics,
  evaluationRejects?: {
    duplicatePhysicalFacts: string[];
    duplicateEvidenceClusters: string[];
    ownershipViolations: string[];
  },
): MajorFortuneOrdinalAdapterDiagnostics {
  const diagnostics = emptyDiagnostics();
  diagnostics.missingActiveMajorFortunePalace = [...raw.noActiveMajorFortune];
  diagnostics.missingMenhElement = [...raw.missingMenhElement];
  diagnostics.unsupportedBrightness = [...raw.unsupportedBrightness];
  diagnostics.partialAuxiliarySets = [...raw.partialPairSets];
  diagnostics.incompleteTransformations = [...raw.incompleteTransformationTuples];
  diagnostics.blockedNamPhaiTransformations = [...raw.namPhaiTransformationBlocked];
  diagnostics.forbiddenTemporalFactsDetected = [...raw.forbiddenAnnualMonthlyFieldsPresent];
  diagnostics.rejectedGeneratedEvidence = [...raw.evidenceValidationErrors];
  diagnostics.missingProvenance = raw.evidenceValidationErrors.filter((e) =>
    /empty|missing|provenance|sourceIds|claimIds|physicalFact/i.test(e),
  );
  diagnostics.disabledFamilies = [...raw.disabledFamilies];
  diagnostics.notes = [...raw.notes];
  diagnostics.outOfFrameTransformationCount = raw.outOfFrameTransformationCount ?? 0;
  if (evaluationRejects) {
    diagnostics.duplicatePhysicalFacts = evaluationRejects.duplicatePhysicalFacts;
    diagnostics.duplicateEvidenceClusters = evaluationRejects.duplicateEvidenceClusters;
    diagnostics.ownershipViolations = evaluationRejects.ownershipViolations;
  }
  return diagnostics;
}

function resolveAdapterStatus(
  cycle: MajorFortuneOrdinalCycleMetadata | null,
  evaluationStatus: "available" | "partial" | "unavailable" | undefined,
  pillarPartial: boolean,
): MajorFortuneOrdinalAdapterStatus {
  if (!cycle) return "unavailable";
  if (evaluationStatus === "unavailable") return "unavailable";
  if (evaluationStatus === "partial" || pillarPartial) return "partial";
  if (evaluationStatus === "available") return "ready";
  return "partial";
}

function enrichCycle(
  chart: ChartData,
  cycle: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  } | null,
): MajorFortuneOrdinalCycleMetadata | null {
  if (!cycle) return null;
  const palace =
    chart.majorFortunePalace ??
    chart.palaces.find((p) => p.index === cycle.activePalaceIndex) ??
    null;
  return {
    ...cycle,
    activePalaceName: palace?.name ?? "?",
    activePalaceBranch: palace?.branch ?? "?",
    fortuneStem: palace?.stem ?? null,
  };
}

/**
 * Adapt ChartData → normalized V0.3 ordinal evaluation input (UI-facing result shape).
 * Does not invoke the pure evaluator.
 */
export function adaptChartToMajorFortuneOrdinalInput(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneOrdinalAdapterResult {
  const build = adaptCore(chart, { school: options.school });
  const cycle = enrichCycle(chart, build.cycle);
  const pillarPartial = Boolean(
    build.pillarContexts &&
      Object.values(build.pillarContexts).some((p) => p.availability !== "available"),
  );
  const diagnostics = mapDiagnostics(build.adapterDiagnostics);

  // Surface missing brightness from dia-loi context when present.
  const diaReasons = build.pillarContexts?.["dia-loi"]?.reasonCodes ?? [];
  if (diaReasons.includes("missing-brightness")) {
    diagnostics.missingBrightness.push("dia-loi:missing-brightness");
  }

  const status = resolveAdapterStatus(
    cycle,
    build.evaluationInput ? (pillarPartial ? "partial" : "available") : undefined,
    pillarPartial,
  );

  return {
    status,
    school: options.school,
    cycle,
    evaluationInput: build.evaluationInput,
    emittedEvidence: build.emittedEvidence,
    diagnostics,
  };
}

/**
 * End-to-end production analysis: adapter → pure evaluator → UI display model.
 */
export function analyzeMajorFortuneOrdinalV03(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneOrdinalV03Analysis {
  const core = analyzeCore(chart, options);
  const cycle = enrichCycle(chart, core.build.cycle);

  const evaluationRejects = {
    duplicatePhysicalFacts: [] as string[],
    duplicateEvidenceClusters: [] as string[],
    ownershipViolations: [] as string[],
  };
  if (core.evaluation) {
    for (const pillar of Object.values(core.evaluation.pillars)) {
      for (const r of pillar.rejectedEvidence) {
        if (r.reason === "duplicate-physical-fact") {
          evaluationRejects.duplicatePhysicalFacts.push(r.evidenceId);
        }
        if (r.reason === "duplicate-evidence-cluster") {
          evaluationRejects.duplicateEvidenceClusters.push(r.evidenceId);
        }
        if (r.reason === "cross-pillar-ownership-violation") {
          evaluationRejects.ownershipViolations.push(r.evidenceId);
        }
      }
    }
  }

  const diagnostics = mapDiagnostics(core.build.adapterDiagnostics, evaluationRejects);
  const diaReasons = core.build.pillarContexts?.["dia-loi"]?.reasonCodes ?? [];
  if (diaReasons.includes("missing-brightness")) {
    diagnostics.missingBrightness.push("dia-loi:missing-brightness");
  }

  const pillarPartial = Boolean(
    core.build.pillarContexts &&
      Object.values(core.build.pillarContexts).some((p) => p.availability !== "available"),
  );
  const adapterStatus = resolveAdapterStatus(
    cycle,
    core.evaluation?.status,
    pillarPartial,
  );

  return {
    model: "v0.3-ordinal",
    experimental: false,
    version: "0.3.1",
    school: options.school,
    adapterStatus,
    cycle,
    result: core.evaluation,
    adapterDiagnostics: diagnostics,
    emittedEvidence: core.build.emittedEvidence,
    display: buildDisplay(core.evaluation, core.build.emittedEvidence, {
      school: options.school,
    }),
  };
}
