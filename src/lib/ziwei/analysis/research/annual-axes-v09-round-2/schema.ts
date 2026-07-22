/**
 * Annual Axes V0.9 Round-2 candidate schema (research-only).
 */

export type R2CandidateType = "control" | "experimental";

export type R2ChangeCategory =
  | "star-registry"
  | "star-domain"
  | "point-policy"
  | "palace-context"
  | "dignity-eligibility";

export type R2DomainBinding = "career" | "social";

export type R2PolarityMode =
  | "positive-activation"
  | "unsigned-activation"
  | "contextual-activation";

export type R2DignityMode = "none" | "eligibility-only" | "annotation-only";

export type R2AssumptionStatus =
  | "classical"
  | "derived"
  | "engineering-hypothesis"
  | "disputed";

export interface AnnualAxesCandidateRound2 {
  candidateId: string;
  candidateType: R2CandidateType;
  engineVersion: string;
  knowledgeVersion: string;
  formulaVersion: string;
  description: string;
  authorizedShapeIds: string[];
  policyRecordIds: string[];
  claimIds: string[];
  sourceIds: string[];
  changeCategories: R2ChangeCategory[];
  includedStarNames: string[];
  excludedStarNames: string[];
  domainBindings: R2DomainBinding[];
  /** Engineering hypothesis magnitude mapped onto V0.8 point classes. */
  pointMagnitude: number;
  polarityMode: R2PolarityMode;
  dignityMode: R2DignityMode;
  /** When true, Thiên Mã matches only in the domain primary palace. */
  primaryPalaceOnly?: boolean;
  assumptions: Array<{
    statement: string;
    status: R2AssumptionStatus;
  }>;
  expectedEffects: string[];
  knownRisks: string[];
}

export type R2SelectionStatus =
  | "candidate-selected"
  | "no-candidate-approved"
  | "evaluation-inconclusive"
  | "foundation-invalid"
  | "calculation-core-blocked";

export type R2ProductionDecision =
  | "APPROVED_FOR_PRODUCTION_ROLLOUT"
  | "KEEP_V0_8_PRODUCTION"
  | "RESEARCH_REVISION_REQUIRED"
  | "CALCULATION_CORE_BLOCKED";

export interface CandidateSelectionRound2 {
  selectionStatus: R2SelectionStatus;
  selectedCandidateId: string | null;
  controlCandidateId: "CONTROL-V08";
  candidateResults: Array<{
    candidateId: string;
    selectable: boolean;
    passedMandatoryGates: boolean;
    failedGateIds: string[];
    improvements: string[];
    regressions: string[];
    blockingReasons: string[];
  }>;
  rationale: string[];
}

export interface AnnualAxesProductionDecisionRound2 {
  decision: R2ProductionDecision;
  selectedCandidateId: string | null;
  controlVersion: {
    engineVersion: "0.8.0";
    formulaVersion: "v0.8-annual-palace-weighted-score";
  };
  foundation: {
    readiness: "READY_FOR_V0_9_CANDIDATE";
    shapeIds: ["SHAPE-AAV09-THIEN-MA-MOVEMENT"];
  };
  evidence: {
    candidateIds: string[];
    passedGateIds: string[];
    failedGateIds: string[];
    claimIds: string[];
    sourceIds: string[];
    policyRecordIds: string[];
  };
  improvements: string[];
  regressions: string[];
  residualRisks: string[];
  nextTask: string;
}
