import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type {
  AnnualAxisBand,
  AnnualAxisRawAxes,
  AnnualChannelSummary,
  NatalDomainResponseProfile,
} from "../types";
import { resilienceDamping } from "./natal-response";

export interface NormalizeDeltaInput {
  channels: {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  };
  routedStrength: number;
  natalResponse: NatalDomainResponseProfile;
  rawAxes: AnnualAxisRawAxes;
  knowledge: AnnualAxesKnowledgeV04NamPhai;
}

export interface NormalizeDeltaResult {
  score: number;
  band: AnnualAxisBand;
  annualDelta: number;
  intensity: number;
  conflict: number;
  normalizedAxes: AnnualAxisRawAxes;
  effectiveDelta: number;
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
 * V0.4 annual-delta normalization.
 * Score = clamp(50 + amp * tanh(effectiveDelta / divisor), 0, 100).
 * Stability never adds to signed quality.
 */
export function normalizeAnnualDeltaV04(input: NormalizeDeltaInput): NormalizeDeltaResult {
  const { channels, routedStrength, natalResponse, rawAxes, knowledge } = input;
  const w = knowledge.channelProfile.channelWeights;
  const p = knowledge.deltaProfile;

  const annualSignedDelta =
    w.globalAnnualClimate * channels.globalAnnualClimate.signed +
    w.routedHeadImpact * routedStrength * channels.routedHeadImpact.signed +
    w.directDomainImpact * channels.directDomainImpact.signed +
    w.majorFortuneBackground * channels.majorFortuneBackground.signed;

  const activationNorm = 1 - Math.exp(-rawAxes.activation / p.activationScale);
  const activationGate = p.activationGateFloor + p.activationGateRange * activationNorm;

  const damping = resilienceDamping(natalResponse.resilience, knowledge);
  const effectiveDelta =
    annualSignedDelta * natalResponse.amplitudeMultiplier * damping * activationGate;

  // No annual activation → no departure from neutral (activationGateFloor
  // still allows a tiny gate; when activationRaw is 0, gate equals floor,
  // and when all channel signed are 0, delta remains 0 → score 50).
  const rawScore = p.neutralScore + p.scoreAmplitude * Math.tanh(effectiveDelta / p.scoreDivisor);
  const clamped = Math.min(p.scoreMax, Math.max(p.scoreMin, rawScore));
  const precisionFactor = 10 ** p.scorePrecision;
  const score = Math.round(clamped * precisionFactor) / precisionFactor;

  const supportNorm = 1 - Math.exp(-rawAxes.support / p.supportScale);
  const pressureNorm = 1 - Math.exp(-rawAxes.pressure / p.pressureScale);

  return {
    score,
    band: resolveBand(score, knowledge),
    annualDelta: Math.round((score - p.neutralScore) * precisionFactor) / precisionFactor,
    intensity: Math.round(100 * activationNorm),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm),
    normalizedAxes: {
      support: supportNorm,
      pressure: pressureNorm,
      stability: 0,
      activation: activationNorm,
    },
    effectiveDelta,
  };
}
