import type {
  MajorFortuneOrdinalBandId,
  MajorFortuneOrdinalEvidenceDirection,
  MajorFortuneOrdinalEvidenceStrength,
  MajorFortuneOrdinalKnowledge,
  MajorFortuneOrdinalLevel,
  MajorFortuneOrdinalPillarId,
  MajorFortuneOrdinalPolicyStatus,
  MajorFortuneOrdinalSchool,
  MajorFortuneOrdinalTemporalScope,
} from "../../../knowledge/major-fortune-scoring/v0.3-ordinal";

export type {
  MajorFortuneOrdinalBandId,
  MajorFortuneOrdinalLevel,
  MajorFortuneOrdinalPillarId,
  MajorFortuneOrdinalSchool,
};

export type MajorFortuneOrdinalPillarState =
  | "no-signal"
  | "balanced-signal"
  | "classified"
  | "partial-data"
  | "unavailable";

export type MajorFortuneOrdinalScoreState =
  | "no-signal"
  | "balanced-signal"
  | "scored"
  | "partial-data"
  | "unavailable";

export type MajorFortuneOrdinalRejectReason =
  | "blocked-policy"
  | "excluded-policy"
  | "excluded-signal-family"
  | "excluded-temporal-scope"
  | "school-scope-mismatch"
  | "unsupported-school-family"
  | "pillar-family-mismatch"
  | "duplicate-physical-fact"
  | "duplicate-evidence-cluster"
  | "cross-pillar-ownership-violation"
  | "incomplete-transformation-tuple"
  | "nam-phai-transformation-unavailable"
  | "invalid-evidence"
  | "pillar-unavailable";

export interface MajorFortuneOrdinalTransformationTuple {
  fortuneStem: string;
  transformationType: string;
  transformedStar: string;
  targetPalace: string;
}

export interface MajorFortuneOrdinalEvidence {
  evidenceId: string;
  physicalFactId: string;
  evidenceClusterId: string;
  pillarId: MajorFortuneOrdinalPillarId;
  signalFamilyId: string;
  direction: MajorFortuneOrdinalEvidenceDirection;
  strength: MajorFortuneOrdinalEvidenceStrength;
  temporalScope: MajorFortuneOrdinalTemporalScope;
  factIds: string[];
  sourceIds: string[];
  claimIds: string[];
  policyStatus: MajorFortuneOrdinalPolicyStatus;
  schoolScope: MajorFortuneOrdinalSchool[];
  reasonCode: string;
  /** Optional ownership hint; when present must match cross-pillar policy. */
  physicalFactKind?: string;
  transformationTuple?: MajorFortuneOrdinalTransformationTuple;
}

export interface MajorFortuneOrdinalPillarContext {
  availability: "available" | "partial-data" | "unavailable";
  reasonCodes?: string[];
}

export interface MajorFortuneOrdinalEvaluationInput {
  school: MajorFortuneOrdinalSchool;
  evidence: MajorFortuneOrdinalEvidence[];
  pillarContexts: Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarContext>;
  /** Metadata only — never affects score. */
  yearInCycle?: number;
  /** Optional contract override for fail-closed budget tests. */
  contract?: MajorFortuneOrdinalKnowledge;
}

export interface MajorFortuneOrdinalRejectedEvidence {
  evidenceId: string;
  reason: MajorFortuneOrdinalRejectReason;
  detail: string;
}

export interface MajorFortuneOrdinalPillarResult {
  budget: number;
  level: MajorFortuneOrdinalLevel | null;
  delta: number;
  state: MajorFortuneOrdinalPillarState;
  supportMass: number;
  pressureMass: number;
  acceptedEvidenceIds: string[];
  rejectedEvidence: MajorFortuneOrdinalRejectedEvidence[];
  physicalFactIds: string[];
  reasonCodes: string[];
}

export interface MajorFortuneOrdinalCoverage {
  coverageWeight: number;
  evaluablePillarIds: MajorFortuneOrdinalPillarId[];
  missingPillarIds: MajorFortuneOrdinalPillarId[];
  partialPillarIds: MajorFortuneOrdinalPillarId[];
}

export interface MajorFortuneOrdinalDiagnostics {
  rejectedEvidenceCount: number;
  acceptedEvidenceCount: number;
  duplicatePhysicalFactRejects: number;
  duplicateClusterRejects: number;
  excludedTemporalRejects: number;
  schoolGateRejects: number;
  invalidContract: string[];
}

export interface MajorFortuneOrdinalTrace {
  formulaVersion: string;
  modelNature: string;
  numericAuthority: string;
  baseScore: number;
  pillarDeltas: Record<MajorFortuneOrdinalPillarId, number>;
  sumDelta: number;
  rawScoreBeforeClamp: number;
  yearInCycleIgnored: boolean;
  forbidsPerRuleRawDelta: true;
}

export interface MajorFortuneOrdinalResult {
  module: "major-fortune";
  model: "v0.3-ordinal";
  school: MajorFortuneOrdinalSchool;
  status: "available" | "partial" | "unavailable";
  score: number | null;
  band: MajorFortuneOrdinalBandId | null;
  scoreState: MajorFortuneOrdinalScoreState;
  coverage: MajorFortuneOrdinalCoverage;
  pillars: Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarResult>;
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
    formulaVersion: string;
  };
  diagnostics: MajorFortuneOrdinalDiagnostics;
  trace: MajorFortuneOrdinalTrace;
}
