import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import {
  availableScores,
  euclideanDistance,
  groupByChart,
  pearson,
  vectorKey,
} from "./compare-annual-vectors";
import type {
  AnnualAxesAuditObservation,
  AnnualAxesDistributionReport,
  DomainScoreSummary,
} from "./types";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return percentile(s, 0.5);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (values.length - 1);
  return Math.sqrt(v);
}

function summarizeDomain(values: number[]): DomainScoreSummary {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: mean(sorted),
    median: percentile(sorted, 0.5),
    p10: percentile(sorted, 0.1),
    p90: percentile(sorted, 0.9),
    standardDeviation: stddev(sorted),
  };
}

const NEAR_DUP_DISTANCE = 1.5;

/**
 * Aggregate scored observations into the V0.4 distribution report contract.
 */
export function computeDistributionReport(
  profileId: string,
  observations: AnnualAxesAuditObservation[],
): AnnualAxesDistributionReport {
  const school = observations[0]?.school ?? "nam-phai";
  const byChart = groupByChart(observations);
  const chartCount = byChart.size;
  const yearsPerChart =
    chartCount === 0
      ? 0
      : Math.round(observations.length / chartCount);

  const scoreSummaryByDomain = {} as Record<AnnualAxisDomain, DomainScoreSummary>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const vals = observations
      .map((o) => o.scores[domain])
      .filter((v): v is number => v != null);
    scoreSummaryByDomain[domain] = summarizeDomain(vals);
  }

  let allSixAbove50 = 0;
  let allSixAbove60 = 0;
  let availableYears = 0;
  const ranges: number[] = [];
  const sds: number[] = [];

  for (const obs of observations) {
    const vals = availableScores(obs.scores);
    if (vals.length < 6) continue;
    availableYears += 1;
    if (vals.every((v) => v > 50)) allSixAbove50 += 1;
    if (vals.every((v) => v > 60)) allSixAbove60 += 1;
    ranges.push(Math.max(...vals) - Math.min(...vals));
    sds.push(stddev(vals));
  }

  const vectorCounts = new Map<string, number>();
  for (const obs of observations) {
    if (availableScores(obs.scores).length < 6) continue;
    const key = vectorKey(obs.scores);
    vectorCounts.set(key, (vectorCounts.get(key) ?? 0) + 1);
  }
  let dupPairs = 0;
  let vectorTotal = 0;
  for (const count of vectorCounts.values()) {
    vectorTotal += count;
    if (count > 1) dupPairs += count;
  }

  const perDomainYearRanges: Record<AnnualAxisDomain, number[]> = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };
  const adjacentDeltas: Record<AnnualAxisDomain, number[]> = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };

  let headMoves = 0;
  let headMoveSensitive = 0;

  for (const series of byChart.values()) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const vals = series
        .map((o) => o.scores[domain])
        .filter((v): v is number => v != null);
      if (vals.length >= 2) {
        perDomainYearRanges[domain].push(Math.max(...vals) - Math.min(...vals));
        for (let i = 1; i < series.length; i++) {
          const a = series[i - 1]!.scores[domain];
          const b = series[i]!.scores[domain];
          if (a != null && b != null) adjacentDeltas[domain].push(Math.abs(b - a));
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
        const dist = euclideanDistance(prev.scores, cur.scores);
        if (dist != null && dist > 0.5) headMoveSensitive += 1;
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
        const av = obs.scores[a];
        const bv = obs.scores[b];
        if (av == null || bv == null) continue;
        xs.push(av);
        ys.push(bv);
      }
      interAxisCorrelation[`${a}|${b}`] = pearson(xs, ys);
    }
  }

  // Cross-chart similarity: one representative year (first) per chart.
  const reps: AnnualAxesAuditObservation[] = [];
  for (const series of byChart.values()) {
    const first = series.find((o) => availableScores(o.scores).length === 6);
    if (first) reps.push(first);
  }
  const nnDistances: number[] = [];
  let nearDup = 0;
  for (let i = 0; i < reps.length; i++) {
    let best: number | null = null;
    for (let j = 0; j < reps.length; j++) {
      if (i === j) continue;
      const d = euclideanDistance(reps[i]!.scores, reps[j]!.scores);
      if (d == null) continue;
      if (best == null || d < best) best = d;
    }
    if (best != null) {
      nnDistances.push(best);
      if (best <= NEAR_DUP_DISTANCE) nearDup += 1;
    }
  }

  const unavailableRate =
    observations.length === 0
      ? 0
      : observations.filter((o) => o.status === "unavailable").length / observations.length;
  const partialRate =
    observations.length === 0
      ? 0
      : observations.filter((o) => o.status === "partial").length / observations.length;

  const sortedRanges = [...ranges].sort((a, b) => a - b);

  const numericCounts: number[] = [];
  const contextOnlyCounts: number[] = [];
  for (const obs of observations) {
    if (!obs.collectStats) continue;
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const s = obs.collectStats[domain];
      if (!s) continue;
      numericCounts.push(s.numericFacts);
      contextOnlyCounts.push(s.contextOnlyFacts);
    }
  }
  const affinityCoverage =
    numericCounts.length === 0
      ? undefined
      : {
          meanNumericEvidenceCountPerDomainYear: mean(numericCounts),
          medianContextOnlyCountPerDomainYear: median(contextOnlyCounts),
        };

  return {
    profileId,
    school,
    chartCount,
    yearsPerChart,
    resultCount: observations.length,
    scoreSummaryByDomain,
    allSixAbove50Rate: availableYears === 0 ? 0 : allSixAbove50 / availableYears,
    allSixAbove60Rate: availableYears === 0 ? 0 : allSixAbove60 / availableYears,
    exactDuplicateVectorRate: vectorTotal === 0 ? 0 : dupPairs / vectorTotal,
    intraYearAxisSpread: {
      meanStandardDeviation: mean(sds),
      medianRange: median(ranges),
      p10Range: percentile(sortedRanges, 0.1),
    },
    longitudinalChange: {
      medianPerDomainTwelveYearRange: Object.fromEntries(
        ANNUAL_AXIS_DOMAINS.map((d) => [d, median(perDomainYearRanges[d])]),
      ) as Record<AnnualAxisDomain, number>,
      medianAdjacentYearAbsoluteDelta: Object.fromEntries(
        ANNUAL_AXIS_DOMAINS.map((d) => [d, median(adjacentDeltas[d])]),
      ) as Record<AnnualAxisDomain, number>,
      annualHeadMoveSensitivityRate: headMoves === 0 ? 0 : headMoveSensitive / headMoves,
    },
    interAxisCorrelation,
    crossChartSimilarity: {
      medianNearestNeighborDistance: median(nnDistances),
      nearDuplicateVectorRate: reps.length === 0 ? 0 : nearDup / reps.length,
    },
    unavailableRate,
    partialRate,
    affinityCoverage,
  };
}
