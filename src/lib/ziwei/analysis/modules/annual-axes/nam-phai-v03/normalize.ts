import type { AnnualAxesKnowledgeV03NamPhai } from "../../../knowledge/annual-axes/v0.3";
import type { AnnualAxisBand, AnnualAxisRawAxes } from "../types";

export interface AnnualAxisNormalizeResultV03 {
  score: number;
  band: AnnualAxisBand;
  intensity: number;
  conflict: number;
  normalizedAxes: AnnualAxisRawAxes;
}

function resolveBand(
  score: number,
  knowledge: AnnualAxesKnowledgeV03NamPhai,
): AnnualAxisBand {
  for (const band of knowledge.scoringProfile.output.bands) {
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
 * V0.3 normalization — literal implementation of the formula in
 * `annual-scoring-profile.nam-phai.v0.3.json`. Coefficients are read
 * from the loaded profile; nothing is hardcoded.
 */
export function normalizeAnnualAxesV03(
  rawAxes: AnnualAxisRawAxes,
  knowledge: AnnualAxesKnowledgeV03NamPhai,
): AnnualAxisNormalizeResultV03 {
  const n = knowledge.scoringProfile.normalization;

  const supportNorm = 1 - Math.exp(-rawAxes.support / n.supportScale);
  const pressureNorm = 1 - Math.exp(-rawAxes.pressure / n.pressureScale);
  const stabilityNorm = Math.tanh(rawAxes.stability / n.stabilityScale);
  const activationNorm = 1 - Math.exp(-rawAxes.activation / n.activationScale);

  const netQuality = supportNorm - pressureNorm + n.stabilityCoefficient * stabilityNorm;
  const activationGate = n.activationGateFloor + n.activationGateRange * activationNorm;

  const rawScore =
    n.neutralScore + n.scoreAmplitude * Math.tanh((netQuality * activationGate) / n.scoreDivisor);
  const clamped = Math.min(
    knowledge.scoringProfile.output.scoreMax,
    Math.max(knowledge.scoringProfile.output.scoreMin, rawScore),
  );
  const precisionFactor = 10 ** knowledge.scoringProfile.output.scorePrecision;
  const score = Math.round(clamped * precisionFactor) / precisionFactor;

  const intensity = Math.round(100 * activationNorm);
  const conflict = Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm);

  return {
    score,
    band: resolveBand(score, knowledge),
    intensity,
    conflict,
    normalizedAxes: {
      support: supportNorm,
      pressure: pressureNorm,
      stability: stabilityNorm,
      activation: activationNorm,
    },
  };
}
