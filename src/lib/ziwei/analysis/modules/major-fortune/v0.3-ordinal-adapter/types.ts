import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import type {
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalEvaluationInput,
  MajorFortuneOrdinalResult,
} from "../v0.3-ordinal/types";
import type { MajorFortuneOrdinalPillarId } from "../../../knowledge/major-fortune-scoring/v0.3-ordinal";

export interface AdaptMajorFortuneOrdinalOptions {
  school: ZiweiSchool;
  /** Metadata only — never affects numerics. */
  yearInCycle?: number;
}

export interface MajorFortuneOrdinalCycleMetadata {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
  activePalaceName: string;
  activePalaceBranch: string;
  fortuneStem: string | null;
}

export interface MajorFortuneOrdinalAdapterDiagnostics {
  missingActiveMajorFortunePalace: string[];
  missingMenhElement: string[];
  missingBrightness: string[];
  unsupportedBrightness: string[];
  partialAuxiliarySets: string[];
  incompleteTransformations: string[];
  blockedNamPhaiTransformations: string[];
  forbiddenTemporalFactsDetected: string[];
  rejectedGeneratedEvidence: string[];
  missingProvenance: string[];
  duplicatePhysicalFacts: string[];
  duplicateEvidenceClusters: string[];
  ownershipViolations: string[];
  disabledFamilies: string[];
  notes: string[];
  outOfFrameTransformationCount: number;
}

export type MajorFortuneOrdinalAdapterStatus = "ready" | "partial" | "unavailable";

export interface MajorFortuneOrdinalAdapterResult {
  status: MajorFortuneOrdinalAdapterStatus;
  school: ZiweiSchool;
  cycle: MajorFortuneOrdinalCycleMetadata | null;
  evaluationInput: MajorFortuneOrdinalEvaluationInput | null;
  emittedEvidence: MajorFortuneOrdinalEvidence[];
  diagnostics: MajorFortuneOrdinalAdapterDiagnostics;
}

export interface MajorFortuneOrdinalPillarDisplaySummary {
  pillarId: MajorFortuneOrdinalPillarId;
  labelVi: string;
  level: -2 | -1 | 0 | 1 | 2 | null;
  levelLabelVi: string;
  delta: number;
  state: string;
  stateLabelVi: string;
  evidenceLabels: string[];
  reasonLabels: string[];
}

export interface MajorFortuneOrdinalV03Display {
  title: string;
  subtitle: string;
  disclaimer: string;
  experimentalBadge: string;
  bandLabelVi: string | null;
  scoringCoveragePercent: number | null;
  scoredPillarFractionLabel: string | null;
  namPhaiPartialTuHoaNote: string | null;
  pillarSummaries: MajorFortuneOrdinalPillarDisplaySummary[];
}

export interface MajorFortuneOrdinalV03Analysis {
  model: "v0.3-ordinal";
  experimental: false;
  version: "0.3.1";
  school: ZiweiSchool;
  adapterStatus: MajorFortuneOrdinalAdapterStatus;
  cycle: MajorFortuneOrdinalCycleMetadata | null;
  result: MajorFortuneOrdinalResult | null;
  adapterDiagnostics: MajorFortuneOrdinalAdapterDiagnostics;
  emittedEvidence: MajorFortuneOrdinalEvidence[];
  display: MajorFortuneOrdinalV03Display;
}

/** Production public result alias. */
export type MajorFortuneProductionResult = MajorFortuneOrdinalV03Analysis;

export type { ChartData, ZiweiSchool };
