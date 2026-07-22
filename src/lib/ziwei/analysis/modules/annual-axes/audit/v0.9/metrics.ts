import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import { pearson } from "../compare-annual-vectors";
import type { AnnualAxesAuditObservationV09 } from "./types";

const NEAR_DUP_DISTANCE = 1.5;
const NEUTRAL_SCORE = 50;
const BOUNDARY_LOW = 40;
const BOUNDARY_HIGH = 60;
const WIDE_BAND_LOW = 42;
const WIDE_BAND_HIGH = 58;
const NARROW_BAND_LOW = 45;
const NARROW_BAND_HIGH = 65;

export interface ScoreScaleConfig {
  minimum: number;
  maximum: number;
}

export interface DistributionSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
}

export interface AnnualAxesPerDomainMetricsV09 {
  medianPerDomainTwelveYearRange: number;
  medianAdjacentYearAbsoluteDelta: number;
  noSignalRate: number;
  neutralScoreRate: number;
}

export interface AnnualAxesFullMetricsV09 {
  meanIntraYearAxisStandardDeviation: number;
  medianIntraYearAxisRange: number;
  p25IntraYearRange: number;
  p10IntraYearRange: number;
  boundaryScoreRate: number;
  atLeastTwoOutside42To58Rate: number;
  atLeastOneAtOrBelow40Rate: number;
  atLeastOneAtOrAbove60Rate: number;
  oneLowAndOneHighRate: number;
  allSixAbove50Rate: number;
  fiveOrMoreAbove50Rate: number;
  allSixInside45To65Rate: number;
  exactDuplicateVectorRate: number;
  nearDuplicateVectorRate: number;
  unavailableRate: number;
  partialRate: number;
  maximumAbsoluteInterAxisCorrelation: number;
  annualHeadMoveSensitivityRate: number;
  noSignalRate: number;
  balancedSignalRate: number;
  neutralScoreRate: number;
  scoredStateNeutralScoreCount: number;
  palaceClampRate: number;
  axisClampRate: number;
  thaiTueApplicationRate: number;
  meanResolvedCoverage: number;
  partialCoverageDistribution: DistributionSummary;
  interAxisCorrelation: Record<string, number>;
  perDomain: Record<AnnualAxisDomain, AnnualAxesPerDomainMetricsV09>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 0.5);
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (values.length - 1);
  return Math.sqrt(v);
}

function summarize(values: number[]): DistributionSummary {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: mean(values),
    median: percentile(sorted, 0.5),
  };
}

function vectorKeyV09(obs: AnnualAxesAuditObservationV09): string | null {
  const scores = ANNUAL_AXIS_DOMAINS.map((d) => obs.domains[d].score);
  if (scores.some((s) => s == null)) return null;
  return scores.map((s) => s!.toFixed(4)).join("|");
}

function groupByChart(
  observations: AnnualAxesAuditObservationV09[],
): Map<string, AnnualAxesAuditObservationV09[]> {
  const map = new Map<string, AnnualAxesAuditObservationV09[]>();
  for (const obs of observations) {
    const list = map.get(obs.chartId) ?? [];
    list.push(obs);
    map.set(obs.chartId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.annualYear - b.annualYear);
  return map;
}

function euclideanDistanceV09(
  a: AnnualAxesAuditObservationV09,
  b: AnnualAxesAuditObservationV09,
): number | null {
  let sum = 0;
  let n = 0;
  for (const d of ANNUAL_AXIS_DOMAINS) {
    const av = a.domains[d].score;
    const bv = b.domains[d].score;
    if (av == null || bv == null) continue;
    const diff = av - bv;
    sum += diff * diff;
    n += 1;
  }
  if (n === 0) return null;
  return Math.sqrt(sum / n);
}

/**
 * Every metric configured in the V0.9 audit spec (Part B). All rates are
 * computed over domain-level observations unless noted; "global" spread/
 * boundary/duplicate metrics operate over one chart-year (6-domain vector)
 * at a time.
 */
export function computeFullMetricsV09(
  observations: AnnualAxesAuditObservationV09[],
  scoreScale: ScoreScaleConfig = { minimum: 10, maximum: 90 },
): AnnualAxesFullMetricsV09 {
  const allDomainObs = observations.flatMap((o) => ANNUAL_AXIS_DOMAINS.map((d) => o.domains[d]));
  const totalDomainObs = allDomainObs.length;

  const ranges: number[] = [];
  const sds: number[] = [];
  let boundaryCount = 0;
  let twoOutsideWideBand = 0;
  let oneAtOrBelowLow = 0;
  let oneAtOrAboveHigh = 0;
  let oneLowOneHigh = 0;
  let allSixAbove50 = 0;
  let fiveOrMoreAbove50 = 0;
  let allSixInsideNarrowBand = 0;
  let fullVectorYears = 0;

  for (const obs of observations) {
    const scores = ANNUAL_AXIS_DOMAINS.map((d) => obs.domains[d].score);
    const available = scores.filter((s): s is number => s != null);
    if (available.length === 0) continue;

    ranges.push(Math.max(...available) - Math.min(...available));
    sds.push(stddev(available));
    boundaryCount += available.filter(
      (s) => s <= scoreScale.minimum || s >= scoreScale.maximum,
    ).length;

    if (available.length === 6) {
      fullVectorYears += 1;
      const outsideWide = available.filter((s) => s < WIDE_BAND_LOW || s > WIDE_BAND_HIGH).length;
      if (outsideWide >= 2) twoOutsideWideBand += 1;
      const hasLow = available.some((s) => s <= BOUNDARY_LOW);
      const hasHigh = available.some((s) => s >= BOUNDARY_HIGH);
      if (hasLow) oneAtOrBelowLow += 1;
      if (hasHigh) oneAtOrAboveHigh += 1;
      if (hasLow && hasHigh) oneLowOneHigh += 1;
      if (available.every((s) => s > 50)) allSixAbove50 += 1;
      if (available.filter((s) => s > 50).length >= 5) fiveOrMoreAbove50 += 1;
      if (available.every((s) => s >= NARROW_BAND_LOW && s <= NARROW_BAND_HIGH)) {
        allSixInsideNarrowBand += 1;
      }
    }
  }

  // Duplicate vector rates over fully-scored chart-years.
  const vectorCounts = new Map<string, number>();
  for (const obs of observations) {
    const key = vectorKeyV09(obs);
    if (key == null) continue;
    vectorCounts.set(key, (vectorCounts.get(key) ?? 0) + 1);
  }
  let dupPairs = 0;
  let vectorTotal = 0;
  for (const count of vectorCounts.values()) {
    vectorTotal += count;
    if (count > 1) dupPairs += count;
  }
  const exactDuplicateVectorRate = vectorTotal === 0 ? 0 : dupPairs / vectorTotal;

  const byChart = groupByChart(observations);
  const reps: AnnualAxesAuditObservationV09[] = [];
  for (const series of byChart.values()) {
    const first = series.find((o) => vectorKeyV09(o) != null);
    if (first) reps.push(first);
  }
  let nearDup = 0;
  for (let i = 0; i < reps.length; i++) {
    let best: number | null = null;
    for (let j = 0; j < reps.length; j++) {
      if (i === j) continue;
      const d = euclideanDistanceV09(reps[i]!, reps[j]!);
      if (d == null) continue;
      if (best == null || d < best) best = d;
    }
    if (best != null && best <= NEAR_DUP_DISTANCE) nearDup += 1;
  }
  const nearDuplicateVectorRate = reps.length === 0 ? 0 : nearDup / reps.length;

  // Longitudinal + per-domain diagnostics.
  const perDomainRanges: Record<AnnualAxisDomain, number[]> = {
    health: [], family: [], wealth: [], career: [], social: [], romance: [],
  };
  const perDomainDeltas: Record<AnnualAxisDomain, number[]> = {
    health: [], family: [], wealth: [], career: [], social: [], romance: [],
  };
  const perDomainNoSignal: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };
  const perDomainNeutral: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };
  const perDomainCount: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };

  let headMoves = 0;
  let headMoveSensitive = 0;

  for (const series of byChart.values()) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const vals = series.map((o) => o.domains[domain].score).filter((v): v is number => v != null);
      if (vals.length >= 2) {
        perDomainRanges[domain].push(Math.max(...vals) - Math.min(...vals));
        for (let i = 1; i < series.length; i++) {
          const a = series[i - 1]!.domains[domain].score;
          const b = series[i]!.domains[domain].score;
          if (a != null && b != null) perDomainDeltas[domain].push(Math.abs(b - a));
        }
      }
    }
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1]!;
      const cur = series[i]!;
      if (
        prev.annualHeadPalaceIndex != null &&
        cur.annualHeadPalaceIndex != null &&
        prev.annualHeadPalaceIndex !== cur.annualHeadPalaceIndex
      ) {
        headMoves += 1;
        const dist = euclideanDistanceV09(prev, cur);
        if (dist != null && dist > 0.5) headMoveSensitive += 1;
      }
    }
  }

  let noSignalCount = 0;
  let balancedSignalCount = 0;
  let neutralScoreCount = 0;
  let scoredStateNeutralScoreCount = 0;
  let unavailableCount = 0;
  let partialCount = 0;
  let palaceClampCount = 0;
  let axisClampCount = 0;
  let thaiTueCount = 0;
  const coverageRatios: number[] = [];
  const partialCoverageRatios: number[] = [];

  for (const obs of observations) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const d = obs.domains[domain];
      perDomainCount[domain] += 1;
      if (d.scoreState === "no-signal") {
        noSignalCount += 1;
        perDomainNoSignal[domain] += 1;
      }
      if (d.scoreState === "balanced-signal") balancedSignalCount += 1;
      if (d.score === NEUTRAL_SCORE) {
        neutralScoreCount += 1;
        perDomainNeutral[domain] += 1;
        if (d.scoreState === "scored") scoredStateNeutralScoreCount += 1;
      }
      if (d.status === "unavailable") unavailableCount += 1;
      if (d.status === "partial-data") partialCount += 1;
      if (d.palaceClampApplied) palaceClampCount += 1;
      if (d.axisClampApplied) axisClampCount += 1;
      if (d.thaiTueApplied) thaiTueCount += 1;
      if (d.totalWeight > 0) {
        const ratio = d.resolvedWeight / d.totalWeight;
        coverageRatios.push(ratio);
        if (d.status === "partial-data") partialCoverageRatios.push(ratio);
      }
    }
  }

  const interAxisCorrelation: Record<string, number> = {};
  for (let i = 0; i < ANNUAL_AXIS_DOMAINS.length; i++) {
    for (let j = i + 1; j < ANNUAL_AXIS_DOMAINS.length; j++) {
      const a = ANNUAL_AXIS_DOMAINS[i]!;
      const b = ANNUAL_AXIS_DOMAINS[j]!;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const obs of observations) {
        const av = obs.domains[a].score;
        const bv = obs.domains[b].score;
        if (av == null || bv == null) continue;
        xs.push(av);
        ys.push(bv);
      }
      interAxisCorrelation[`${a}|${b}`] = pearson(xs, ys);
    }
  }
  const maximumAbsoluteInterAxisCorrelation = Math.max(
    0,
    ...Object.values(interAxisCorrelation).map((v) => Math.abs(v)),
  );

  const sortedRanges = [...ranges].sort((a, b) => a - b);

  const perDomain = {} as Record<AnnualAxisDomain, AnnualAxesPerDomainMetricsV09>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    perDomain[domain] = {
      medianPerDomainTwelveYearRange: median(perDomainRanges[domain]),
      medianAdjacentYearAbsoluteDelta: median(perDomainDeltas[domain]),
      noSignalRate: perDomainCount[domain] === 0 ? 0 : perDomainNoSignal[domain] / perDomainCount[domain],
      neutralScoreRate: perDomainCount[domain] === 0 ? 0 : perDomainNeutral[domain] / perDomainCount[domain],
    };
  }

  return {
    meanIntraYearAxisStandardDeviation: mean(sds),
    medianIntraYearAxisRange: median(ranges),
    p25IntraYearRange: percentile(sortedRanges, 0.25),
    p10IntraYearRange: percentile(sortedRanges, 0.1),
    boundaryScoreRate: totalDomainObs === 0 ? 0 : boundaryCount / totalDomainObs,
    atLeastTwoOutside42To58Rate: fullVectorYears === 0 ? 0 : twoOutsideWideBand / fullVectorYears,
    atLeastOneAtOrBelow40Rate: fullVectorYears === 0 ? 0 : oneAtOrBelowLow / fullVectorYears,
    atLeastOneAtOrAbove60Rate: fullVectorYears === 0 ? 0 : oneAtOrAboveHigh / fullVectorYears,
    oneLowAndOneHighRate: fullVectorYears === 0 ? 0 : oneLowOneHigh / fullVectorYears,
    allSixAbove50Rate: fullVectorYears === 0 ? 0 : allSixAbove50 / fullVectorYears,
    fiveOrMoreAbove50Rate: fullVectorYears === 0 ? 0 : fiveOrMoreAbove50 / fullVectorYears,
    allSixInside45To65Rate: fullVectorYears === 0 ? 0 : allSixInsideNarrowBand / fullVectorYears,
    exactDuplicateVectorRate,
    nearDuplicateVectorRate,
    unavailableRate: totalDomainObs === 0 ? 0 : unavailableCount / totalDomainObs,
    partialRate: totalDomainObs === 0 ? 0 : partialCount / totalDomainObs,
    maximumAbsoluteInterAxisCorrelation,
    annualHeadMoveSensitivityRate: headMoves === 0 ? 0 : headMoveSensitive / headMoves,
    noSignalRate: totalDomainObs === 0 ? 0 : noSignalCount / totalDomainObs,
    balancedSignalRate: totalDomainObs === 0 ? 0 : balancedSignalCount / totalDomainObs,
    neutralScoreRate: totalDomainObs === 0 ? 0 : neutralScoreCount / totalDomainObs,
    scoredStateNeutralScoreCount,
    palaceClampRate: totalDomainObs === 0 ? 0 : palaceClampCount / totalDomainObs,
    axisClampRate: totalDomainObs === 0 ? 0 : axisClampCount / totalDomainObs,
    thaiTueApplicationRate: totalDomainObs === 0 ? 0 : thaiTueCount / totalDomainObs,
    meanResolvedCoverage: mean(coverageRatios),
    partialCoverageDistribution: summarize(partialCoverageRatios),
    interAxisCorrelation,
    perDomain,
  };
}
