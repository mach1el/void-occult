import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import type { ZiweiSchool } from "../../../../facts";
import type {
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalEvaluationInput,
  MajorFortuneOrdinalPillarContext,
  MajorFortuneOrdinalResult,
} from "../types";
import type { MajorFortuneOrdinalPillarId } from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";

export type MajorFortuneAdapterSchool = ZiweiSchool;

export interface MajorFortuneAdapterCycle {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
}

export interface MajorFortuneAdapterResolvedContext {
  school: MajorFortuneAdapterSchool;
  cycle: MajorFortuneAdapterCycle;
  activePalace: ChartPalace;
  activePalaceBranch: string;
  fortuneStem: string | null;
  menhElement: string | null;
  menhPalace: ChartPalace | null;
  natalStarsInActivePalace: ChartStar[];
  transformations: readonly MutagenRecord[];
  presentNatalStarNames: Set<string>;
}

export interface MajorFortuneAdapterDiagnostics {
  forbiddenAnnualMonthlyFieldsPresent: string[];
  noActiveMajorFortune: string[];
  missingMenhElement: string[];
  unsupportedBrightness: string[];
  incompleteTransformationTuples: string[];
  namPhaiTransformationBlocked: string[];
  partialPairSets: string[];
  disabledFamilies: string[];
  evidenceValidationErrors: string[];
  notes: string[];
  /** Count of Major Fortune transformations that did not target the active palace. */
  outOfFrameTransformationCount: number;
}

export interface MajorFortuneOrdinalAdapterBuildResult {
  cycle: MajorFortuneAdapterCycle | null;
  evaluationInput: MajorFortuneOrdinalEvaluationInput | null;
  emittedEvidence: MajorFortuneOrdinalEvidence[];
  pillarContexts: Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarContext> | null;
  adapterDiagnostics: MajorFortuneAdapterDiagnostics;
}

export interface MajorFortuneOrdinalAdapterAnalysisResult {
  module: "major-fortune";
  model: "v0.3-ordinal-adapter";
  school: MajorFortuneAdapterSchool;
  build: MajorFortuneOrdinalAdapterBuildResult;
  evaluation: MajorFortuneOrdinalResult | null;
}

export interface AdapterEvidenceDraft extends MajorFortuneOrdinalEvidence {
  physicalFactKind: string;
}
