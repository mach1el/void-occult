import type { AnnualAxisDomainId } from "../schema";
import type { AnnualEvidenceLayerId, AnnualGeometryClass } from "../v0.4.3/schema";

export type { AnnualAxisDomainId, AnnualEvidenceLayerId, AnnualGeometryClass };

export interface AnnualSignedLayerFactorsV06 {
  annual: number;
  natalActivated: number;
  majorFortune: number;
  global: number;
}

export interface AnnualSpatialBudgetV06 {
  schemaVersion: string;
  profileId: string;
  signedBudget: {
    direct: number;
    tp4c: number;
    globalAnnualClimate: number;
    majorFortuneBackground: number;
  };
  tp4cRelativeRoleWeights: { opposite: number; trine: number };
  weightTolerance: number;
  sourceIds: string[];
}

export interface AnnualEvidenceDedupePolicyV06 {
  schemaVersion: string;
  profileId: string;
  signedDedupeKey: string[];
  layerPrecedence: AnnualEvidenceLayerId[];
  geometryPrecedence: AnnualGeometryClass[];
  sourceIds: string[];
}

export interface AnnualBucketFormulaV06 {
  schemaVersion: string;
  profileId: string;
  evidenceScale: number;
  epsilon: number;
  /** Canonical V0.6 knowledge-driven signed layer factors. */
  signedLayerFactors: AnnualSignedLayerFactorsV06;
  /** Mirrored kebab-case weights for V0.4.3 diminishing adapter compatibility. */
  signedLayerWeights: {
    annual: number;
    "major-fortune": number;
    "natal-activated": number;
  };
  annualActivationStrength: {
    supportWeight: number;
    pressureWeight: number;
    activationWeight: number;
  };
  diminishingReturns: {
    function: "inverse-square-root-rank";
    groupBy: Array<"domain" | "geometryBucket" | "layer" | "stackingGroup">;
  };
  contextChannels: { mayContributeActivation: boolean };
  sourceIds: string[];
}

export interface AnnualNatalGainV06 {
  schemaVersion: string;
  profileId: string;
  sensitivityCoefficient: number;
  resilienceCoefficient: number;
  minimum: number;
  maximum: number;
  sourceIds: string[];
}

export interface AnnualScoreProfileV06 {
  schemaVersion: string;
  profileId: string;
  neutral: number;
  amplitude: number;
  minimum: number;
  maximum: number;
  precision: number;
  minimumDomainScale: number;
  maximumDomainScale: number;
  latentTargetForDomainScale: number;
  sourceIds: string[];
}

export interface AnnualDistributionGatesV06 {
  schemaVersion: string;
  catalogId: string;
  hardGates: {
    meanIntraYearAxisStandardDeviationMin: number;
    medianIntraYearAxisRangeMin: number;
    medianPerDomainTwelveYearRangeMin: number;
    medianAdjacentYearAbsoluteDeltaMin: number;
    exactDuplicateVectorRateMax: number;
    nearDuplicateVectorRateMax: number;
    unavailableRateMax: number;
    absoluteInterAxisCorrelationMax: number;
    extremeScoreRateMax: number;
    medianRadarRangeMin: number;
    outsideNeutralBandRateMin: number;
  };
  sourceIds: string[];
}

export interface AnnualAxisCalibrationV06 {
  schemaVersion: string;
  profileId: string;
  formulaVersion: string;
  trainingCorpusId: string;
  splitPolicy: {
    trainingFraction: number;
    holdoutFraction: number;
    splitBy: "stable-chart-id";
  };
  activationTargetMedianGate: number;
  activationScale: number;
  medianPositiveAnnualActivationRaw: number;
  domainScales: Record<AnnualAxisDomainId, number>;
  q75AbsLatent: Record<AnnualAxisDomainId, number>;
  trainingDiagnostics: {
    medianActivationGate: number;
    p90ActivationGate: number;
    maxActivationGate: number;
  };
  generatedAt: string;
  sourceIds: string[];
  candidateId?: string;
  signedLayerFactors?: AnnualSignedLayerFactorsV06;
}

export interface AnnualAxesKnowledgeV06NamPhai {
  spatialBudget: AnnualSpatialBudgetV06;
  dedupePolicy: AnnualEvidenceDedupePolicyV06;
  bucketFormula: AnnualBucketFormulaV06;
  natalGain: AnnualNatalGainV06;
  scoreProfile: AnnualScoreProfileV06;
  calibration: AnnualAxisCalibrationV06;
  distributionGates: AnnualDistributionGatesV06;
}

export type AnnualAxesDedupeAdapterV06 = Pick<
  AnnualAxesKnowledgeV06NamPhai,
  "dedupePolicy" | "bucketFormula"
> & {
  aggregationProfile: {
    diminishingReturns: AnnualBucketFormulaV06["diminishingReturns"];
    contextChannels: AnnualBucketFormulaV06["contextChannels"];
  };
};

export function toDedupeAdapter(knowledge: AnnualAxesKnowledgeV06NamPhai): AnnualAxesDedupeAdapterV06 {
  return {
    dedupePolicy: knowledge.dedupePolicy,
    bucketFormula: knowledge.bucketFormula,
    aggregationProfile: {
      diminishingReturns: knowledge.bucketFormula.diminishingReturns,
      contextChannels: knowledge.bucketFormula.contextChannels,
    },
  };
}

export function layerFactorForEvidenceLayer(
  layer: string,
  factors: AnnualSignedLayerFactorsV06,
): number {
  switch (layer) {
    case "annual":
      return factors.annual;
    case "natal-activated":
      return factors.natalActivated;
    case "major-fortune":
      return factors.majorFortune;
    case "global":
      return factors.global;
    default:
      return 0;
  }
}

export function mirrorSignedLayerWeights(
  factors: AnnualSignedLayerFactorsV06,
): AnnualBucketFormulaV06["signedLayerWeights"] {
  return {
    annual: factors.annual,
    "major-fortune": factors.majorFortune,
    "natal-activated": factors.natalActivated,
  };
}
