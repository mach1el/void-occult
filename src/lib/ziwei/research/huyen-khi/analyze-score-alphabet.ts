import { NATAL_PALACE_NAMES, type NatalPalaceName, type PublicHuyenKhiDataset } from "./types";

export interface ScoreAlphabetReport {
  sampleCount: number;
  palaceValueCount: number;
  quarterGridValueCount: number;
  quarterGridShare: number;
  minPalaceScore: number;
  maxPalaceScore: number;
  meanPalaceScore: number;
  medianPalaceScore: number;
  residualModuloQuarterHistogram: Record<string, number>;
  rangeByPalace: Partial<Record<NatalPalaceName, { min: number; max: number; count: number }>>;
}

function isOnQuarterGrid(value: number): boolean {
  const steps = value / 0.25;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * §8 score-alphabet analysis — reproduces the pack's own
 * `sample-validation-report.v0.1.json` numbers from the raw dataset (proof
 * the tool is correct), extended with a by-palace breakdown. Supports, does
 * not prove, the "coarse base + fine residual" hypothesis (HYP-HK-002).
 */
export function analyzeScoreAlphabet(dataset: PublicHuyenKhiDataset): ScoreAlphabetReport {
  const nonZeroValues: number[] = [];
  const rangeByPalace: ScoreAlphabetReport["rangeByPalace"] = {};
  const residualHistogram: Record<string, number> = {};

  for (const record of dataset.records) {
    for (const palaceName of NATAL_PALACE_NAMES) {
      const value = record.palaceScores[palaceName];
      const existing = rangeByPalace[palaceName];
      if (!existing) {
        rangeByPalace[palaceName] = { min: value, max: value, count: 1 };
      } else {
        existing.min = Math.min(existing.min, value);
        existing.max = Math.max(existing.max, value);
        existing.count += 1;
      }
      if (value === 0) continue;
      nonZeroValues.push(value);
      const residual = round2(Math.abs(value) % 0.25);
      const key = residual.toFixed(2);
      residualHistogram[key] = (residualHistogram[key] ?? 0) + 1;
    }
  }

  const sorted = [...nonZeroValues].sort((a, b) => a - b);
  const quarterCount = nonZeroValues.filter(isOnQuarterGrid).length;
  const mean = nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);

  return {
    sampleCount: dataset.records.length,
    palaceValueCount: nonZeroValues.length,
    quarterGridValueCount: quarterCount,
    quarterGridShare: round6(quarterCount / nonZeroValues.length),
    minPalaceScore: sorted[0] ?? 0,
    maxPalaceScore: sorted[sorted.length - 1] ?? 0,
    meanPalaceScore: round6(mean),
    medianPalaceScore: round2(median),
    residualModuloQuarterHistogram: residualHistogram,
    rangeByPalace,
  };
}
