import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import type { NatalDomainResponseProfile } from "../types";
import {
  computeActivationGate,
  computeDomainScore,
  computeLatent,
  type BucketSignedResult,
} from "./bucket-formula";
import type { V05BucketAggregateResult } from "./aggregate-buckets";
import { computeNatalGainV05 } from "./natal-gain";

export interface V05DomainScoreTrace {
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

export interface V05DomainScoreResult {
  score: number;
  activationGate: number;
  latent: number;
  trace: V05DomainScoreTrace;
  intensity: number;
  conflict: number;
  supportNorm: number;
  pressureNorm: number;
}

export function scoreV05Domain(input: {
  aggregate: V05BucketAggregateResult;
  natalResponse: NatalDomainResponseProfile;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV05NamPhai;
  activationScaleOverride?: number;
  domainScaleOverride?: number;
}): V05DomainScoreResult {
  const { aggregate, natalResponse, knowledge } = input;
  const activationScale = input.activationScaleOverride ?? knowledge.calibration.activationScale;
  const domainScale =
    input.domainScaleOverride ?? knowledge.calibration.domainScales[input.domain];

  const activationGate = computeActivationGate(aggregate.annualActivationRaw, activationScale);
  const natalGain = computeNatalGainV05(natalResponse, knowledge);
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
