import type { MonthlyFlowScoringProfile } from "../../knowledge/monthly-flow";
import type { DeepReadonly } from "../../knowledge/monthly-flow";
import {
  addMonthlyFlowAxes,
  emptyMonthlyFlowAxes,
  type MonthlyFlowAxes,
  type MonthlyFlowBand,
  type MonthlyFlowEvidence,
} from "./types";

type ScoringProfile = DeepReadonly<MonthlyFlowScoringProfile> | MonthlyFlowScoringProfile;

export function sumWeightedAxes(evidence: MonthlyFlowEvidence[]): MonthlyFlowAxes {
  return evidence.reduce(
    (acc, e) => addMonthlyFlowAxes(acc, e.weightedAxes),
    emptyMonthlyFlowAxes(),
  );
}

export function resolveMonthlyFlowBand(
  score: number,
  profile: ScoringProfile,
): MonthlyFlowBand {
  for (const band of profile.output.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id as MonthlyFlowBand;
  }
  throw new Error(`score ${score} did not resolve to any configured band`);
}

export interface MonthlyFlowNormalizeResult {
  score: number;
  band: MonthlyFlowBand;
  intensity: number;
  conflict: number;
  normalizedAxes: MonthlyFlowAxes;
}

/**
 * Literal implementation of
 * `monthly-scoring-profile.v0.json#formulaSpec`. Every scale/coefficient
 * is read from the loaded profile — never a hardcoded TS numeric literal.
 * Kept structurally identical to Major Fortune's `normalizeMajorFortuneAxes`
 * so calibration test cases share expectations, but points at the monthly
 * profile so future divergence stays isolated.
 */
export function normalizeMonthlyFlowAxes(
  rawAxes: MonthlyFlowAxes,
  profile: ScoringProfile,
): MonthlyFlowNormalizeResult {
  const n = profile.normalization;

  const supportNorm = 1 - Math.exp(-rawAxes.support / n.supportScale);
  const pressureNorm = 1 - Math.exp(-rawAxes.pressure / n.pressureScale);
  const stabilityNorm = Math.tanh(rawAxes.stability / n.stabilityScale);
  const activationNorm = 1 - Math.exp(-rawAxes.activation / n.activationScale);

  const netQuality = supportNorm - pressureNorm + n.stabilityCoefficient * stabilityNorm;
  const activationGate = n.activationGateFloor + n.activationGateRange * activationNorm;

  const rawScore =
    n.neutralScore + n.scoreAmplitude * Math.tanh((netQuality * activationGate) / n.scoreDivisor);
  const clampedScore = Math.min(profile.output.scoreMax, Math.max(profile.output.scoreMin, rawScore));
  const precisionFactor = 10 ** profile.output.scorePrecision;
  const score = Math.round(clampedScore * precisionFactor) / precisionFactor;

  const intensity = Math.round(100 * activationNorm);
  const conflict = Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm);

  return {
    score,
    band: resolveMonthlyFlowBand(score, profile),
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
