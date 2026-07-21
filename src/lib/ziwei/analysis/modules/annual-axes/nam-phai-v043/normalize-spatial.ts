/**
 * V0.4.3 score normalization from spatialSigned + natal response + activation gate.
 */

import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type { AnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import type {
  AnnualAxisBand,
  AnnualAxisRawAxes,
  NatalDomainResponseProfile,
} from "../types";
import { resilienceDamping } from "../nam-phai-v04/natal-response";

export interface NormalizeSpatialInput {
  spatialSigned: number;
  activationNorm: number;
  natalResponse: NatalDomainResponseProfile;
  rawAxes: AnnualAxisRawAxes;
  knowledge043: AnnualAxesKnowledgeV043NamPhai;
  /** Band table still sourced from V0.4 delta profile (labels only). */
  knowledge04: AnnualAxesKnowledgeV04NamPhai;
}

export interface NormalizeSpatialResult {
  score: number;
  band: AnnualAxisBand;
  annualDelta: number;
  intensity: number;
  conflict: number;
  normalizedAxes: AnnualAxisRawAxes;
  effectiveDelta: number;
  activationGate: number;
}

function resolveBand(score: number, knowledge: AnnualAxesKnowledgeV04NamPhai): AnnualAxisBand {
  for (const band of knowledge.deltaProfile.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id as AnnualAxisBand;
  }
  throw new Error(`score ${score} did not resolve to any configured band`);
}

/**
 * Score = clamp(neutral + amplitude * tanh(effectiveDelta / divisor), min, max).
 * activationGate = floor + range * activationNorm (seed: floor=0 → gate=activationNorm).
 * No annual activation → gate 0 → effectiveDelta 0 → score exactly neutral.
 */
export function normalizeSpatialBudgetV043(input: NormalizeSpatialInput): NormalizeSpatialResult {
  const { spatialSigned, activationNorm, natalResponse, rawAxes, knowledge043, knowledge04 } =
    input;
  const agg = knowledge043.aggregationProfile;
  const scoreCfg = agg.score;
  const gateCfg = agg.activationGate;

  const activationGate = gateCfg.floor + gateCfg.range * activationNorm;
  const damping = resilienceDamping(natalResponse.resilience, knowledge04);
  const effectiveDelta =
    spatialSigned * natalResponse.amplitudeMultiplier * damping * activationGate;

  const rawScore =
    scoreCfg.neutral + scoreCfg.amplitude * Math.tanh(effectiveDelta / scoreCfg.divisor);
  const clamped = Math.min(scoreCfg.maximum, Math.max(scoreCfg.minimum, rawScore));
  const precisionFactor = 10 ** scoreCfg.precision;
  const score = Math.round(clamped * precisionFactor) / precisionFactor;

  const supportNorm = 1 - Math.exp(-Math.max(0, rawAxes.support) / agg.normalization.supportScale);
  const pressureNorm =
    1 - Math.exp(-Math.max(0, rawAxes.pressure) / agg.normalization.pressureScale);

  return {
    score,
    band: resolveBand(score, knowledge04),
    annualDelta: Math.round((score - scoreCfg.neutral) * precisionFactor) / precisionFactor,
    intensity: Math.round(100 * activationNorm),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm),
    normalizedAxes: {
      support: supportNorm,
      pressure: pressureNorm,
      stability: 0,
      activation: activationNorm,
    },
    effectiveDelta,
    activationGate,
  };
}
