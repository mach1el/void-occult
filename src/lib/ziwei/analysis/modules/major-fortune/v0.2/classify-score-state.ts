/**
 * Epsilon-safe scoreState for Major Fortune V0.2.
 * Float cancellation residues must not label as "scored".
 */

export type MajorFortuneV02ScoreState =
  | "no-signal"
  | "balanced-signal"
  | "scored"
  | "partial-data"
  | "unavailable";

export const MF_V02_RAW_ZERO_EPSILON = 1e-9;

export function isEffectivelyZeroDelta(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value) <= MF_V02_RAW_ZERO_EPSILON;
}

export interface ClassifyMajorFortuneV02ScoreStateInput {
  matchedExecutableContributionCount: number;
  totalRawAbs: number;
  hasPartialData: boolean;
  unavailable: boolean;
}

export function classifyMajorFortuneV02ScoreState(
  input: ClassifyMajorFortuneV02ScoreStateInput,
): MajorFortuneV02ScoreState {
  if (input.unavailable) return "unavailable";
  if (!Number.isFinite(input.totalRawAbs)) {
    throw new Error(`V0.2 scoreState requires finite totalRawAbs; got ${String(input.totalRawAbs)}`);
  }
  if (input.hasPartialData) return "partial-data";
  const zero = isEffectivelyZeroDelta(input.totalRawAbs);
  if (input.matchedExecutableContributionCount === 0 && zero) return "no-signal";
  if (zero) return "balanced-signal";
  return "scored";
}
