/**
 * V0.8 scoreState classification — numerical stability for near-zero raw.
 *
 * Public scores remain `50 + 5×raw` (clamped/rounded). Classification alone
 * uses an absolute epsilon so floating-point cancellation residues such as
 * `5.55e-17` are treated as effective zero without rewriting the raw trace.
 */

export type V08ScoreState =
  | "scored"
  | "no-signal"
  | "balanced-signal"
  | "partial-data"
  | "unavailable";

/**
 * Absolute tolerance on `prominenceAdjustedRaw`.
 *
 * Justification:
 * - Observed cancellation residues are ~1e-16–1e-17.
 * - Smallest meaningful V0.8 contribution is
 *   `min(|pointClass|) × min(palaceWeight) = 1 × 0.2 = 0.2`
 *   (optionally × Thái Tuế 1.25 → 0.25).
 * - `1e-9` is ≫ residue and ≪ 0.2, so it cannot erase a legitimate signal.
 */
export const V08_RAW_ZERO_EPSILON = 1e-9;

/** Smallest |weightedContribution| from current V0.8 point classes × weights. */
export const V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION = 0.2;

export interface ClassifyV08ScoreStateInput {
  matchedStarCount: number;
  prominenceAdjustedRaw: number;
  hasCooperatingGap: boolean;
}

/**
 * Legacy strict-zero classifier (pre-fix). Used only for before/after proof.
 * Do not use in production scoring.
 */
export function legacyClassifyV08ScoreState(
  input: ClassifyV08ScoreStateInput,
): V08ScoreState {
  const { matchedStarCount, prominenceAdjustedRaw, hasCooperatingGap } = input;
  if (matchedStarCount === 0 && prominenceAdjustedRaw === 0) {
    return hasCooperatingGap ? "partial-data" : "no-signal";
  }
  if (prominenceAdjustedRaw === 0) {
    return hasCooperatingGap ? "partial-data" : "balanced-signal";
  }
  if (hasCooperatingGap) return "partial-data";
  return "scored";
}

export function isEffectivelyZeroRaw(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value) <= V08_RAW_ZERO_EPSILON;
}

/**
 * Classify scoreState from matched-star count, raw magnitude, and data gaps.
 * Unavailable primary/input is handled before this function is called.
 */
export function classifyV08ScoreState(
  input: ClassifyV08ScoreStateInput,
): V08ScoreState {
  const { matchedStarCount, prominenceAdjustedRaw, hasCooperatingGap } = input;

  if (!Number.isFinite(prominenceAdjustedRaw)) {
    throw new Error(
      `V0.8 scoreState classification requires a finite prominenceAdjustedRaw; got ${String(prominenceAdjustedRaw)}`,
    );
  }

  const isEffectivelyZero = isEffectivelyZeroRaw(prominenceAdjustedRaw);

  if (hasCooperatingGap) {
    return "partial-data";
  }
  if (matchedStarCount === 0 && isEffectivelyZero) {
    return "no-signal";
  }
  if (isEffectivelyZero) {
    return "balanced-signal";
  }
  return "scored";
}
