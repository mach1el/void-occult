import type { AnnualAxisDomainId } from "../schema";
import type { AnnualEvidenceLayerId, AnnualGeometryClass } from "../v0.4.3/schema";

export type { AnnualAxisDomainId, AnnualEvidenceLayerId, AnnualGeometryClass };

export interface AnnualSpatialBudgetV05 {
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

export interface AnnualEvidenceDedupePolicyV05 {
  schemaVersion: string;
  profileId: string;
  signedDedupeKey: string[];
  layerPrecedence: AnnualEvidenceLayerId[];
  geometryPrecedence: AnnualGeometryClass[];
  sourceIds: string[];
}

export interface AnnualBucketFormulaV05 {
  schemaVersion: string;
  profileId: string;
  evidenceScale: number;
  epsilon: number;
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

export interface AnnualNatalGainV05 {
  schemaVersion: string;
  profileId: string;
  sensitivityCoefficient: number;
  resilienceCoefficient: number;
  minimum: number;
  maximum: number;
  sourceIds: string[];
}

export interface AnnualScoreProfileV05 {
  schemaVersion: string;
  profileId: string;
  neutral: number;
  amplitude: number;
  minimum: number;
  maximum: number;
  precision: number;
  minimumDomainScale: number;
  maximumDomainScale: number;
  /** atanh(amplitude / score amplitude) — 14/38 for default amplitude 38 */
  latentTargetForDomainScale: number;
  sourceIds: string[];
}

export interface AnnualDistributionGatesV05 {
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

export interface AnnualAxisCalibrationV05 {
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
}

export interface AnnualAxesKnowledgeV05NamPhai {
  spatialBudget: AnnualSpatialBudgetV05;
  dedupePolicy: AnnualEvidenceDedupePolicyV05;
  bucketFormula: AnnualBucketFormulaV05;
  natalGain: AnnualNatalGainV05;
  scoreProfile: AnnualScoreProfileV05;
  calibration: AnnualAxisCalibrationV05;
  distributionGates: AnnualDistributionGatesV05;
}

/** Adapter shape for V0.4.3 dedupe helpers. */
export type AnnualAxesDedupeAdapterV05 = Pick<
  AnnualAxesKnowledgeV05NamPhai,
  "dedupePolicy" | "bucketFormula"
> & {
  aggregationProfile: {
    diminishingReturns: AnnualBucketFormulaV05["diminishingReturns"];
    contextChannels: AnnualBucketFormulaV05["contextChannels"];
  };
};

export function toDedupeAdapter(knowledge: AnnualAxesKnowledgeV05NamPhai): AnnualAxesDedupeAdapterV05 {
  return {
    dedupePolicy: knowledge.dedupePolicy,
    bucketFormula: knowledge.bucketFormula,
    aggregationProfile: {
      diminishingReturns: knowledge.bucketFormula.diminishingReturns,
      contextChannels: knowledge.bucketFormula.contextChannels,
    },
  };
}
