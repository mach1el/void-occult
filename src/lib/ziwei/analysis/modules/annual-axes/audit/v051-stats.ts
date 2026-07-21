/** Shared percentile / distribution helpers for V0.5.1 audits. */

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (values.length - 1);
  return Math.sqrt(v);
}

export function rate(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

export function closeEnough(a: number, b: number, rel = 1e-6, abs = 1e-9): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

export function scoreDistribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.length;
  return {
    minimum: sorted[0] ?? 0,
    maximum: sorted[sorted.length - 1] ?? 0,
    mean: mean(sorted),
    median: percentile(sorted, 0.5),
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    scoreAbove50Rate: rate(sorted.filter((v) => v > 50).length, total),
    scoreBelow50Rate: rate(sorted.filter((v) => v < 50).length, total),
    scoreEqual50Rate: rate(sorted.filter((v) => v === 50).length, total),
    scoreAtOrBelow45Rate: rate(sorted.filter((v) => v <= 45).length, total),
    scoreAtOrAbove60Rate: rate(sorted.filter((v) => v >= 60).length, total),
  };
}

export function latentDistribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const absSorted = sorted.map(Math.abs).sort((a, b) => a - b);
  const pos = sorted.filter((v) => v > 0);
  const neg = sorted.filter((v) => v < 0);
  const posAbs = pos.reduce((s, v) => s + Math.abs(v), 0);
  const negAbs = neg.reduce((s, v) => s + Math.abs(v), 0);
  return {
    spatialSignedMean: 0,
    spatialSignedMedian: 0,
    latentMean: mean(sorted),
    latentMedian: percentile(sorted, 0.5),
    positiveLatentRate: rate(pos.length, sorted.length),
    negativeLatentRate: rate(neg.length, sorted.length),
    zeroLatentRate: rate(sorted.filter((v) => v === 0).length, sorted.length),
    medianAbsLatent: percentile(absSorted, 0.5),
    q75AbsLatent: percentile(absSorted, 0.75),
    positiveNegativeAbsoluteMassRatio: negAbs > 0 ? posAbs / negAbs : posAbs > 0 ? Infinity : 1,
  };
}

export function vectorDistribution(
  vectors: number[][],
): {
  meanIntraYearSixAxisSd: number;
  medianIntraYearRange: number;
  p10IntraYearRange: number;
  p25IntraYearRange: number;
  allSixAbove50Rate: number;
  fiveOrMoreAbove50Rate: number;
  allSixInside45To65Rate: number;
  atLeastOneAtOrBelow45Rate: number;
  atLeastOneAtOrAbove60Rate: number;
  oneLowAndOneHighRate: number;
  atLeastTwoOutside42To58Rate: number;
} {
  const sds: number[] = [];
  const ranges: number[] = [];
  let allSixAbove50 = 0;
  let fiveOrMoreAbove50 = 0;
  let allSixInside45To65 = 0;
  let atLeastOneAtOrBelow45 = 0;
  let atLeastOneAtOrAbove60 = 0;
  let oneLowAndOneHigh = 0;
  let atLeastTwoOutside42To58 = 0;

  for (const vals of vectors) {
    if (vals.length !== 6) continue;
    sds.push(stddev(vals));
    ranges.push(Math.max(...vals) - Math.min(...vals));
    if (vals.every((v) => v > 50)) allSixAbove50 += 1;
    if (vals.filter((v) => v > 50).length >= 5) fiveOrMoreAbove50 += 1;
    if (vals.every((v) => v >= 45 && v <= 65)) allSixInside45To65 += 1;
    if (vals.some((v) => v <= 45)) atLeastOneAtOrBelow45 += 1;
    if (vals.some((v) => v >= 60)) atLeastOneAtOrAbove60 += 1;
    if (vals.some((v) => v <= 45) && vals.some((v) => v >= 60)) oneLowAndOneHigh += 1;
    if (vals.filter((v) => v < 42 || v > 58).length >= 2) atLeastTwoOutside42To58 += 1;
  }

  const sortedRanges = [...ranges].sort((a, b) => a - b);
  const total = vectors.filter((v) => v.length === 6).length;
  return {
    meanIntraYearSixAxisSd: mean(sds),
    medianIntraYearRange: percentile(sortedRanges, 0.5),
    p10IntraYearRange: percentile(sortedRanges, 0.1),
    p25IntraYearRange: percentile(sortedRanges, 0.25),
    allSixAbove50Rate: rate(allSixAbove50, total),
    fiveOrMoreAbove50Rate: rate(fiveOrMoreAbove50, total),
    allSixInside45To65Rate: rate(allSixInside45To65, total),
    atLeastOneAtOrBelow45Rate: rate(atLeastOneAtOrBelow45, total),
    atLeastOneAtOrAbove60Rate: rate(atLeastOneAtOrAbove60, total),
    oneLowAndOneHighRate: rate(oneLowAndOneHigh, total),
    atLeastTwoOutside42To58Rate: rate(atLeastTwoOutside42To58, total),
  };
}
