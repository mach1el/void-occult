import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualSignedLayerFactorsV06 } from "../../../knowledge/annual-axes/v0.6";

export type V06CandidateId =
  | "V05-CONTROL"
  | "ANNUAL-DOMINANT-50"
  | "ANNUAL-DOMINANT-35"
  | "ANNUAL-DOMINANT-25";

export interface V06CandidateSpec {
  id: V06CandidateId;
  selectable: boolean;
  signedLayerFactors: AnnualSignedLayerFactorsV06;
}

export const V06_CANDIDATES: V06CandidateSpec[] = [
  {
    id: "V05-CONTROL",
    selectable: false,
    signedLayerFactors: { annual: 1, natalActivated: 1, majorFortune: 1, global: 0 },
  },
  {
    id: "ANNUAL-DOMINANT-50",
    selectable: true,
    signedLayerFactors: { annual: 1, natalActivated: 0.5, majorFortune: 0, global: 0 },
  },
  {
    id: "ANNUAL-DOMINANT-35",
    selectable: true,
    signedLayerFactors: { annual: 1, natalActivated: 0.35, majorFortune: 0, global: 0 },
  },
  {
    id: "ANNUAL-DOMINANT-25",
    selectable: true,
    signedLayerFactors: { annual: 1, natalActivated: 0.25, majorFortune: 0, global: 0 },
  },
];

export interface V06CalibrationParams {
  candidateId: V06CandidateId;
  signedLayerFactors: AnnualSignedLayerFactorsV06;
  activationScale: number;
  domainScales: Record<AnnualAxisDomain, number>;
  medianPositiveAnnualActivationRaw: number;
  q75AbsLatent: Record<AnnualAxisDomain, number>;
  trainingMedianActivationGate: number;
}

export interface V06GateResult {
  gate: string;
  passed: boolean;
  value: number;
  threshold: number;
  comparator: ">=" | "<=";
}

export interface V06ProductFixtureScores {
  health: number;
  family: number;
  wealth: number;
  career: number;
  social: number;
  romance: number;
  minimum: number;
  maximum: number;
  radarRange: number;
  countAbove50: number;
  countAtOrBelow45: number;
  countAtOrAbove60: number;
  l1FromV05: number;
  passesVisibleChangeGate: boolean;
}

export interface V06CandidateResult {
  candidateId: V06CandidateId;
  selectable: boolean;
  signedLayerFactors: AnnualSignedLayerFactorsV06;
  calibration: V06CalibrationParams;
  holdoutMetrics: Record<string, number>;
  gateResults: V06GateResult[];
  passedAllGates: boolean;
  blockers: string[];
  productFixture: V06ProductFixtureScores;
}

export interface V06CandidateEvaluationReport {
  profileId: string;
  corpusId: string;
  generatedAt: string;
  formulaVersion: "v0.6-annual-dominant-core";
  candidates: V06CandidateResult[];
  selectedVariant: V06CandidateId | null;
  selectionStatus: "approved" | "no-variant-approved";
  selectionRationale: string[];
}
