import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV06NamPhai,
  AnnualSignedLayerFactorsV06,
} from "../../../knowledge/annual-axes/v0.6";
import type { NatalDomainResponseProfile } from "../types";
import {
  computeActivationGate,
  computeDomainScore,
  computeLatent,
  type BucketSignedResult,
} from "./bucket-formula";
import type { V06BucketAggregateResult } from "./aggregate-buckets";
import { computeNatalGainV06 } from "./natal-gain";

export interface V06DomainScoreTrace {
  formulaVersion: "v0.6-annual-dominant-core";
  candidateId: string;
  signedLayerFactors: AnnualSignedLayerFactorsV06;
  directSupportRawBeforeLayerFactor: number;
  directPressureRawBeforeLayerFactor: number;
  tp4cSupportRawBeforeLayerFactor: number;
  tp4cPressureRawBeforeLayerFactor: number;
  directSupportRawAfterLayerFactor: number;
  directPressureRawAfterLayerFactor: number;
  tp4cSupportRawAfterLayerFactor: number;
  tp4cPressureRawAfterLayerFactor: number;
  directBucket: BucketSignedResult;
  tp4cBucket: BucketSignedResult;
  spatialSigned: number;
  annualActivationRaw: number;
  activationGate: number;
  natalGain: number;
  latent: number;
  domainScale: number;
  absoluteScore: number;
}

export interface V06DomainScoreResult {
  score: number;
  activationGate: number;
  latent: number;
  trace: V06DomainScoreTrace;
  intensity: number;
  conflict: number;
  supportNorm: number;
  pressureNorm: number;
}

export function scoreV06Domain(input: {
  aggregate: V06BucketAggregateResult;
  natalResponse: NatalDomainResponseProfile;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV06NamPhai;
  activationScaleOverride?: number;
  domainScaleOverride?: number;
  candidateId?: string;
}): V06DomainScoreResult {
  const { aggregate, natalResponse, knowledge } = input;
  const activationScale = input.activationScaleOverride ?? knowledge.calibration.activationScale;
  const domainScale =
    input.domainScaleOverride ?? knowledge.calibration.domainScales[input.domain];

  const activationGate = computeActivationGate(aggregate.annualActivationRaw, activationScale);
  const natalGain = computeNatalGainV06(natalResponse, knowledge);
  const latent = computeLatent(aggregate.spatialSigned, activationGate, natalGain);

  const score =
    activationGate <= 0
      ? knowledge.scoreProfile.neutral
      : computeDomainScore(
          latent,
          domainScale,
          knowledge.scoreProfile.neutral,
          knowledge.scoreProfile.amplitude,
          knowledge.scoreProfile.minimum,
          knowledge.scoreProfile.maximum,
          knowledge.scoreProfile.precision,
        );

  const totalSupportRaw =
    aggregate.spatialBudgetTrace.directSupportRaw + aggregate.spatialBudgetTrace.tp4cSupportRaw;
  const totalPressureRaw =
    aggregate.spatialBudgetTrace.directPressureRaw + aggregate.spatialBudgetTrace.tp4cPressureRaw;
  const evidenceScale = knowledge.bucketFormula.evidenceScale;
  const supportNorm = 1 - Math.exp(-Math.max(0, totalSupportRaw) / evidenceScale);
  const pressureNorm = 1 - Math.exp(-Math.max(0, totalPressureRaw) / evidenceScale);

  return {
    score,
    activationGate,
    latent,
    trace: {
      formulaVersion: "v0.6-annual-dominant-core",
      candidateId:
        input.candidateId ??
        knowledge.calibration.candidateId ??
        "UNSELECTED",
      signedLayerFactors: { ...aggregate.signedLayerFactors },
      ...aggregate.layerMass,
      directBucket: aggregate.directBucket,
      tp4cBucket: aggregate.tp4cBucket,
      spatialSigned: aggregate.spatialSigned,
      annualActivationRaw: aggregate.annualActivationRaw,
      activationGate,
      natalGain,
      latent,
      domainScale,
      absoluteScore: score,
    },
    intensity: Math.round(100 * activationGate),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm) * activationGate),
    supportNorm,
    pressureNorm,
  };
}
