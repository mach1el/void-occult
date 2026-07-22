import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV07NamPhai,
  AnnualSignedLayerFactorsV07,
} from "../../../knowledge/annual-axes/v0.7";
import type { NatalDomainResponseProfile } from "../types";
import {
  computeActivationGate,
  computeDomainScore,
  type BucketSignedResult,
} from "./bucket-formula";
import type { V07BucketAggregateResult } from "./aggregate-buckets";
import { computeNatalGainV07 } from "./natal-gain";

export const V07_FORMULA_VERSION = "v0.7-robust-centered-annual-score" as const;

export interface V07DomainScoreTrace {
  formulaVersion: typeof V07_FORMULA_VERSION;
  signedLayerFactors: AnnualSignedLayerFactorsV07;
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
  spatialSignedRaw: number;
  domainCenter: number;
  centeredSpatial: number;
  annualActivationRaw: number;
  activationGate: number;
  natalGain: number;
  strictLatent: number;
  domainScale: number;
  scoreAmplitude: number;
  absoluteScore: number;
}

export interface V07DomainScoreResult {
  score: number;
  activationGate: number;
  strictLatent: number;
  spatialSignedRaw: number;
  domainCenter: number;
  centeredSpatial: number;
  trace: V07DomainScoreTrace;
  intensity: number;
  conflict: number;
  supportNorm: number;
  pressureNorm: number;
}

export function computeStrictLatent(
  centeredSpatial: number,
  activationGate: number,
  natalGain: number,
): number {
  return centeredSpatial * activationGate * natalGain;
}

export function scoreV07Domain(input: {
  aggregate: V07BucketAggregateResult;
  natalResponse: NatalDomainResponseProfile;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV07NamPhai;
  activationScaleOverride?: number;
  domainScaleOverride?: number;
  domainCenterOverride?: number;
}): V07DomainScoreResult {
  const { aggregate, natalResponse, knowledge } = input;
  const activationScale = input.activationScaleOverride ?? knowledge.calibration.activationScale;
  const domainScale =
    input.domainScaleOverride ?? knowledge.calibration.domainScales[input.domain];
  const domainCenter =
    input.domainCenterOverride ?? knowledge.calibration.domainCenters[input.domain];

  const spatialSignedRaw = aggregate.spatialSigned;
  const centeredSpatial = spatialSignedRaw - domainCenter;
  const activationGate = computeActivationGate(aggregate.annualActivationRaw, activationScale);
  const natalGain = computeNatalGainV07(natalResponse, knowledge);
  const strictLatent = computeStrictLatent(centeredSpatial, activationGate, natalGain);
  const scoreAmplitude = knowledge.scoreProfile.amplitude;

  const score =
    activationGate <= 0 || Math.abs(centeredSpatial) === 0
      ? knowledge.scoreProfile.neutral
      : computeDomainScore(
          strictLatent,
          domainScale,
          knowledge.scoreProfile.neutral,
          scoreAmplitude,
          knowledge.scoreProfile.minimum,
          knowledge.scoreProfile.maximum,
          knowledge.scoreProfile.precision,
        );

  // Explicit zero-centeredSpatial → exactly 50 even if activationGate > 0.
  const absoluteScore =
    activationGate <= 0 || centeredSpatial === 0
      ? knowledge.scoreProfile.neutral
      : score;

  const totalSupportRaw =
    aggregate.spatialBudgetTrace.directSupportRaw + aggregate.spatialBudgetTrace.tp4cSupportRaw;
  const totalPressureRaw =
    aggregate.spatialBudgetTrace.directPressureRaw + aggregate.spatialBudgetTrace.tp4cPressureRaw;
  const evidenceScale = knowledge.bucketFormula.evidenceScale;
  const supportNorm = 1 - Math.exp(-Math.max(0, totalSupportRaw) / evidenceScale);
  const pressureNorm = 1 - Math.exp(-Math.max(0, totalPressureRaw) / evidenceScale);

  return {
    score: absoluteScore,
    activationGate,
    strictLatent: activationGate <= 0 ? 0 : strictLatent,
    spatialSignedRaw,
    domainCenter,
    centeredSpatial,
    trace: {
      formulaVersion: V07_FORMULA_VERSION,
      signedLayerFactors: { ...aggregate.signedLayerFactors },
      ...aggregate.layerMass,
      directBucket: aggregate.directBucket,
      tp4cBucket: aggregate.tp4cBucket,
      spatialSignedRaw,
      domainCenter,
      centeredSpatial,
      annualActivationRaw: aggregate.annualActivationRaw,
      activationGate,
      natalGain,
      strictLatent: activationGate <= 0 ? 0 : strictLatent,
      domainScale,
      scoreAmplitude,
      absoluteScore,
    },
    intensity: Math.round(100 * activationGate),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm) * activationGate),
    supportNorm,
    pressureNorm,
  };
}
