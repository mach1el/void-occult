import type { AnnualAxisDomainId } from "../schema";
import type { AnnualEvidenceLayerId, AnnualGeometryClass } from "../v0.4.3/schema";

export type { AnnualAxisDomainId, AnnualEvidenceLayerId, AnnualGeometryClass };

export interface AnnualSignedLayerFactorsV07 {
  annual: number;
  natalActivated: number;
  majorFortune: number;
  global: number;
}

export interface AnnualSpatialBudgetV07 {
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

export interface AnnualEvidenceDedupePolicyV07 {
  schemaVersion: string;
  profileId: string;
  signedDedupeKey: string[];
  layerPrecedence: AnnualEvidenceLayerId[];
  geometryPrecedence: AnnualGeometryClass[];
  sourceIds: string[];
}

export interface AnnualBucketFormulaV07 {
  schemaVersion: string;
  profileId: string;
  evidenceScale: number;
  epsilon: number;
  /** Canonical V0.7 knowledge-driven signed layer factors. */
  signedLayerFactors: AnnualSignedLayerFactorsV07;
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

export interface AnnualNatalGainV07 {
  schemaVersion: string;
  profileId: string;
  sensitivityCoefficient: number;
  resilienceCoefficient: number;
  minimum: number;
  maximum: number;
  sourceIds: string[];
}

export interface AnnualScoreProfileV07 {
  schemaVersion: string;
  profileId: string;
  neutral: number;
  amplitude: number;
  targetQ75ScoreDelta: number;
  minimum: number;
  maximum: number;
  precision: number;
  minimumDomainScale: number;
  maximumDomainScale: number;
  /** atanh(targetQ75ScoreDelta / amplitude) === atanh(0.5) */
  latentTargetForDomainScale: number;
  sourceIds: string[];
}

export interface AnnualDistributionGatesV07 {
  schemaVersion: string;
  catalogId: string;
  hardGates: Record<string, number>;
  sourceIds: string[];
}

export interface AnnualAxisCalibrationV07 {
  schemaVersion: string;
  profileId: string;
  engineVersion: string;
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
  domainCenters: Record<AnnualAxisDomainId, number>;
  domainScales: Record<AnnualAxisDomainId, number>;
  q75AbsStrictLatent: Record<AnnualAxisDomainId, number>;
  trainingDiagnostics: {
    medianActivationGate: number;
    p90ActivationGate: number;
    maxActivationGate: number;
  };
  generatedAt: string;
  sourceIds: string[];
  signedLayerFactors: AnnualSignedLayerFactorsV07;
  selectionStatus?: "approved" | "no-variant-approved" | "pending";
}

export interface AnnualAxesKnowledgeV07NamPhai {
  spatialBudget: AnnualSpatialBudgetV07;
  dedupePolicy: AnnualEvidenceDedupePolicyV07;
  bucketFormula: AnnualBucketFormulaV07;
  natalGain: AnnualNatalGainV07;
  scoreProfile: AnnualScoreProfileV07;
  calibration: AnnualAxisCalibrationV07;
  distributionGates: AnnualDistributionGatesV07;
}

export type AnnualAxesDedupeAdapterV07 = Pick<
  AnnualAxesKnowledgeV07NamPhai,
  "dedupePolicy" | "bucketFormula"
> & {
  aggregationProfile: {
    diminishingReturns: AnnualBucketFormulaV07["diminishingReturns"];
    contextChannels: AnnualBucketFormulaV07["contextChannels"];
  };
};

export function toDedupeAdapter(knowledge: AnnualAxesKnowledgeV07NamPhai): AnnualAxesDedupeAdapterV07 {
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
  factors: AnnualSignedLayerFactorsV07,
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
  factors: AnnualSignedLayerFactorsV07,
): AnnualBucketFormulaV07["signedLayerWeights"] {
  return {
    annual: factors.annual,
    "major-fortune": factors.majorFortune,
    "natal-activated": factors.natalActivated,
  };
}
