/**
 * V0.9 candidate schema (research-only).
 */

export type V09CandidateType = "control" | "experimental";

export type V09ChangeCategory =
  | "domain-palace"
  | "cooperating-palace"
  | "star-registry"
  | "star-domain"
  | "point-policy"
  | "dignity"
  | "temporal-identity"
  | "thai-tue"
  | "tieu-han"
  | "core-capability";

export type V09AssumptionStatus =
  | "classical"
  | "derived"
  | "engineering-hypothesis"
  | "disputed";

export interface AnnualAxesCandidateV09 {
  candidateId: string;
  candidateType: V09CandidateType;
  formulaVersion: string;
  engineVersion: string;
  knowledgeVersion: string;
  description: string;
  changeCategories: V09ChangeCategory[];
  auditFindingIds: string[];
  claimIds: string[];
  sourceIds: string[];
  policyRecordIds: string[];
  assumptions: Array<{
    statement: string;
    status: V09AssumptionStatus;
  }>;
  configuration: {
    domainMapping: unknown;
    pointPolicy: unknown;
    registryPolicy: unknown;
    temporalPolicy: unknown;
    dignityPolicy: unknown;
    thaiTuePolicy: unknown;
  };
  expectedEffects: string[];
  knownRisks: string[];
}

export type V09SelectionStatus =
  | "candidate-selected"
  | "no-candidate-approved"
  | "calculation-core-blocked"
  | "foundation-invalid"
  | "evaluation-inconclusive";

export type V09ProductionDecision =
  | "APPROVED_FOR_PRODUCTION_ROLLOUT"
  | "KEEP_V0_8_PRODUCTION"
  | "CALCULATION_CORE_BLOCKED"
  | "RESEARCH_REVISION_REQUIRED";

export interface AnnualAxesCandidateSelectionV09 {
  selectionStatus: V09SelectionStatus;
  selectedCandidateId: string | null;
  controlCandidateId: "CONTROL-V08";
  candidateResults: Array<{
    candidateId: string;
    selectable: boolean;
    passedAllMandatoryGates: boolean;
    failedGateIds: string[];
    blockingReasons: string[];
  }>;
  rationale: string[];
}

export interface AnnualAxesProductionDecisionV09 {
  decision: V09ProductionDecision;
  selectedCandidateId: string | null;
  controlVersion: {
    engineVersion: "0.8.0";
    formulaVersion: "v0.8-annual-palace-weighted-score";
  };
  evidence: {
    foundationDecision: string;
    auditFindingIds: string[];
    claimIds: string[];
    sourceIds: string[];
    passedGateIds: string[];
    failedGateIds: string[];
  };
  residualRisks: string[];
  prohibitedClaims: string[];
  nextTask: string;
}
