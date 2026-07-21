import type { AnnualAxisDomain } from "../../../contracts/annual-axes";

export type V051CandidateId = "BASELINE-V05" | "STRICT-SCALE" | "STRICT-BALANCED" | "STRICT-ACTIVATION";

export type V051Split = "training" | "holdout" | "full";

export interface V051CandidateSpec {
  id: V051CandidateId;
  targetMedianActivationGate: number;
  targetQ75ScoreDelta: number;
  /** When set, derive activationScale from median positive raw / atanh(target). */
  activationFromTargetGate: boolean;
  /** When set, domainScale = q75 / atanh(targetQ75/38) with clamp. */
  domainScaleFromQ75Delta: boolean;
  clampDomainScale: boolean;
}

export const V051_CANDIDATES: V051CandidateSpec[] = [
  {
    id: "BASELINE-V05",
    targetMedianActivationGate: 0.7,
    targetQ75ScoreDelta: 14,
    activationFromTargetGate: true,
    domainScaleFromQ75Delta: true,
    clampDomainScale: true,
  },
  {
    id: "STRICT-SCALE",
    targetMedianActivationGate: 0.7,
    targetQ75ScoreDelta: 18,
    activationFromTargetGate: true,
    domainScaleFromQ75Delta: true,
    clampDomainScale: true,
  },
  {
    id: "STRICT-BALANCED",
    targetMedianActivationGate: 0.78,
    targetQ75ScoreDelta: 17,
    activationFromTargetGate: true,
    domainScaleFromQ75Delta: true,
    clampDomainScale: false,
  },
  {
    id: "STRICT-ACTIVATION",
    targetMedianActivationGate: 0.8,
    targetQ75ScoreDelta: 18,
    activationFromTargetGate: true,
    domainScaleFromQ75Delta: true,
    clampDomainScale: false,
  },
];

export interface V051CalibrationParams {
  candidateId: V051CandidateId;
  activationScale: number;
  domainScales: Record<AnnualAxisDomain, number>;
  medianPositiveAnnualActivationRaw: number;
  q75AbsLatent: Record<AnnualAxisDomain, number>;
  trainingMedianActivationGate: number;
}

export interface V051DomainSample {
  chartId: string;
  chartIndex: number;
  split: V051Split;
  annualYear: number;
  domain: AnnualAxisDomain;
  score: number;
  spatialSigned: number;
  latent: number;
  activationGate: number;
  annualActivationRaw: number;
  natalGain: number;
  domainScale: number;
  directSupportRaw: number;
  directPressureRaw: number;
  tp4cSupportRaw: number;
  tp4cPressureRaw: number;
  tp4cContributionAbs: number;
  retainedSignedCount: number;
  retainedActivationCount: number;
}

export interface V051EvidenceMassBreakdown {
  supportRaw: number;
  pressureRaw: number;
  count: number;
}

export interface V051ScoreDistribution {
  minimum: number;
  maximum: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  scoreAbove50Rate: number;
  scoreBelow50Rate: number;
  scoreEqual50Rate: number;
  scoreAtOrBelow45Rate: number;
  scoreAtOrAbove60Rate: number;
}

export interface V051VectorDistribution {
  meanIntraYearSixAxisSd: number;
  medianIntraYearRange: number;
  p10IntraYearRange: number;
  p25IntraYearRange: number;
  allSixAbove50Rate: number;
  fiveOrMoreAbove50Rate: number;
  allSixInside45To65Rate: number;
  atLeastOneAtOrBelow45Rate: number;
  atLeastOneAtOrAbove60Rate: number;
  oneLowAndOneHighRate: number;
  atLeastTwoOutside42To58Rate: number;
}

export interface V051SignedSignalDistribution {
  spatialSignedMean: number;
  spatialSignedMedian: number;
  latentMean: number;
  latentMedian: number;
  positiveLatentRate: number;
  negativeLatentRate: number;
  zeroLatentRate: number;
  medianAbsLatent: number;
  q75AbsLatent: number;
  positiveNegativeAbsoluteMassRatio: number;
}

export interface V051ActivationDistribution {
  annualActivationRawMean: number;
  annualActivationRawMedian: number;
  activationGateMean: number;
  activationGateMedian: number;
  activationGateP10: number;
  activationGateP90: number;
  activationGateMaximum: number;
  gateBelow040Rate: number;
  gateAbove085Rate: number;
}

export interface V051GateResult {
  gate: string;
  passed: boolean;
  value: number;
  threshold: number;
  comparator: ">=" | "<=";
}

export interface V051CandidateEvaluation {
  candidateId: V051CandidateId;
  calibration: V051CalibrationParams;
  trainingMetrics: Record<string, number>;
  holdoutMetrics: Record<string, number>;
  gateResults: V051GateResult[];
  passedAllGates: boolean;
  blockers: string[];
}

export interface V051VariantEvaluationReport {
  profileId: "annual-axes-v0.5.1-variant-evaluation";
  corpusId: string;
  generatedAt: string;
  baselineReproduced: boolean;
  evidenceBiasDetected: boolean;
  evidenceBiasBlockers: string[];
  candidates: V051CandidateEvaluation[];
  selectedVariant: V051CandidateId | null;
  selectionStatus: "approved" | "no-variant-approved";
  selectionRationale: string[];
}

export interface V051BiasAuditReport {
  profileId: "annual-axes-v0.5.1-baseline-bias-audit";
  corpusId: string;
  engineVersion: "0.5.0";
  generatedAt: string;
  baselineReproduced: boolean;
  baselineMismatchDetails: string[];
  global: {
    score: V051ScoreDistribution;
    vector: V051VectorDistribution;
    signed: V051SignedSignalDistribution;
    activation: V051ActivationDistribution;
    evidence: {
      directSupportRawMass: number;
      directPressureRawMass: number;
      tp4cSupportRawMass: number;
      tp4cPressureRawMass: number;
      supportPressureRawMassRatio: number;
      retainedSignedFactCount: number;
      retainedActivationFactCount: number;
    };
  };
  perDomain: Record<
    AnnualAxisDomain,
    {
      score: V051ScoreDistribution;
      signed: Pick<
        V051SignedSignalDistribution,
        "latentMean" | "latentMedian" | "positiveLatentRate" | "negativeLatentRate"
      >;
      evidence: {
        directSupportRawMass: number;
        directPressureRawMass: number;
        tp4cSupportRawMass: number;
        tp4cPressureRawMass: number;
        supportPressureRawMassRatio: number;
      };
    }
  >;
  evidenceByDimension: {
    byLayer: Record<string, V051EvidenceMassBreakdown>;
    byCategory: Record<string, V051EvidenceMassBreakdown>;
    byGeometryBucket: Record<string, V051EvidenceMassBreakdown>;
    bySourceId: Record<string, V051EvidenceMassBreakdown>;
    byRuleId: Record<string, V051EvidenceMassBreakdown>;
    byStackingGroup: Record<string, V051EvidenceMassBreakdown>;
    byOwnershipRole: Record<string, V051EvidenceMassBreakdown>;
  };
  evidenceBiasFlags: {
    globalPositiveLatentBias: boolean;
    perDomainPositiveLatentBiasDomains: AnnualAxisDomain[];
    scaleOnlyTighteningBlocked: boolean;
  };
  diagnosis: {
    softnessInSpatialSigned: boolean;
    latentPositivelyBiased: boolean;
    supportLargerThanPressure: boolean;
    pressureDisproportionatelyTp4c: boolean;
    pressureDroppedByEligibilityOrDedupe: boolean;
    activationTooWeak: boolean;
    calibrationWouldAmplifyPositiveBias: boolean;
  };
}
