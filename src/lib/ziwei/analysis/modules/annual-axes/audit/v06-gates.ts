import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { computeDistributionReport } from "./compute-distribution-report";
import type { AnnualAxesAuditObservation } from "./types";
import {
  mean,
  median,
  percentile,
  rate,
  scoreDistribution,
  vectorDistribution,
} from "./v051-stats";
import type { V06GateResult } from "./v06-types";

export interface V06HoldoutSample {
  chartId: string;
  chartIndex: number;
  annualYear: number;
  domain: AnnualAxisDomain;
  score: number;
  latent: number;
  activationGate: number;
  spatialSigned: number;
  tp4cContributionAbs: number;
}

function g(
  name: string,
  value: number,
  threshold: number,
  comparator: ">=" | "<=",
): V06GateResult {
  const passed = comparator === ">=" ? value >= threshold : value <= threshold;
  return { gate: name, passed, value, threshold, comparator };
}

function samplesToObservations(samples: V06HoldoutSample[]): AnnualAxesAuditObservation[] {
  const byYear = new Map<
    string,
    { chartId: string; annualYear: number; scores: Partial<Record<AnnualAxisDomain, number>> }
  >();
  for (const s of samples) {
    const key = `${s.chartId}:${s.annualYear}`;
    const cur = byYear.get(key) ?? { chartId: s.chartId, annualYear: s.annualYear, scores: {} };
    cur.scores[s.domain] = s.score;
    byYear.set(key, cur);
  }
  return [...byYear.values()].map((row) => ({
    chartId: row.chartId,
    school: "nam-phai" as const,
    annualYear: row.annualYear,
    annualHeadPalaceIndex: null,
    status: "available" as const,
    scores: Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [d, row.scores[d] ?? null]),
    ) as AnnualAxesAuditObservation["scores"],
  }));
}

export function computeV06HoldoutMetrics(samples: V06HoldoutSample[]): Record<string, number> {
  const scores = samples.map((s) => s.score);
  const latents = samples.map((s) => s.latent);
  const scoreDist = scoreDistribution(scores);
  const observations = samplesToObservations(samples);
  const report = computeDistributionReport("annual-axes-v0.6", observations);
  const vectors: number[][] = [];
  const byYear = new Map<string, Partial<Record<AnnualAxisDomain, number>>>();
  for (const s of samples) {
    const key = `${s.chartId}:${s.annualYear}`;
    const cur = byYear.get(key) ?? {};
    cur[s.domain] = s.score;
    byYear.set(key, cur);
  }
  for (const p of byYear.values()) {
    const vals = ANNUAL_AXIS_DOMAINS.map((d) => p[d]).filter((v): v is number => v != null);
    if (vals.length === 6) vectors.push(vals);
  }
  const vec = vectorDistribution(vectors);
  const maxAbsCorr = Math.max(
    0,
    ...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v)),
  );
  const extremeRate = rate(
    scores.filter((v) => v <= 2 || v >= 98).length,
    scores.length,
  );
  const softExtremeRate = rate(
    scores.filter((v) => v <= 10 || v >= 90).length,
    scores.length,
  );
  const tp4cMax = samples.reduce((m, s) => Math.max(m, s.tp4cContributionAbs), 0);
  const allFinite = samples.every(
    (s) =>
      Number.isFinite(s.score) &&
      Number.isFinite(s.latent) &&
      Number.isFinite(s.activationGate) &&
      Number.isFinite(s.spatialSigned),
  )
    ? 1
    : 0;
  const allInRange = scores.every((v) => v >= 0 && v <= 100) ? 1 : 0;

  const metrics: Record<string, number> = {
    allFinite,
    allScoresInRange: allInRange,
    unavailableRate: report.unavailableRate,
    extremeScoreRate: extremeRate,
    softExtremeScoreRate: softExtremeRate,
    tp4cContributionMaxAbs: tp4cMax,
    globalMedianScore: scoreDist.median,
    globalMeanScore: scoreDist.mean,
    positiveLatentRate: rate(latents.filter((v) => v > 0).length, latents.length),
    negativeLatentRate: rate(latents.filter((v) => v < 0).length, latents.length),
    meanIntraYearSixAxisSd: vec.meanIntraYearSixAxisSd,
    medianIntraYearRange: vec.medianIntraYearRange,
    p25IntraYearRange: vec.p25IntraYearRange,
    p10IntraYearRange: vec.p10IntraYearRange,
    atLeastTwoOutside42To58Rate: vec.atLeastTwoOutside42To58Rate,
    atLeastOneAtOrBelow45Rate: vec.atLeastOneAtOrBelow45Rate,
    atLeastOneAtOrAbove60Rate: vec.atLeastOneAtOrAbove60Rate,
    oneLowAndOneHighRate: vec.oneLowAndOneHighRate,
    allSixAbove50Rate: vec.allSixAbove50Rate,
    fiveOrMoreAbove50Rate: vec.fiveOrMoreAbove50Rate,
    allSixInside45To65Rate: vec.allSixInside45To65Rate,
    exactDuplicateVectorRate: report.exactDuplicateVectorRate,
    nearDuplicateVectorRate: report.crossChartSimilarity.nearDuplicateVectorRate,
    maxAbsInterAxisCorrelation: maxAbsCorr,
  };

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const ds = samples.filter((s) => s.domain === domain);
    const dScores = ds.map((s) => s.score);
    const dLatents = ds.map((s) => s.latent);
    metrics[`domainMedian_${domain}`] = median(dScores);
    metrics[`domainPositiveLatentRate_${domain}`] = rate(
      dLatents.filter((v) => v > 0).length,
      dLatents.length,
    );
    metrics[`domainTwelveYearRange_${domain}`] =
      report.longitudinalChange.medianPerDomainTwelveYearRange[domain] ?? 0;
    metrics[`domainAdjacentDelta_${domain}`] =
      report.longitudinalChange.medianAdjacentYearAbsoluteDelta[domain] ?? 0;
  }

  return metrics;
}

function num(m: Record<string, number>, key: string): number {
  return m[key] ?? 0;
}

export function evaluateV06HoldoutGates(samples: V06HoldoutSample[]): {
  metrics: Record<string, number>;
  gateResults: V06GateResult[];
  passedAllGates: boolean;
  blockers: string[];
} {
  const m = computeV06HoldoutMetrics(samples);
  const gates: V06GateResult[] = [
    g("allFinite", num(m, "allFinite"), 1, ">="),
    g("allScoresInRange", num(m, "allScoresInRange"), 1, ">="),
    g("unavailableRateMax", num(m, "unavailableRate"), 0.02, "<="),
    g("extremeScoreRateMax", num(m, "extremeScoreRate"), 0.02, "<="),
    g("softExtremeScoreRateMax", num(m, "softExtremeScoreRate"), 0.08, "<="),
    g("tp4cContributionMaxAbs", num(m, "tp4cContributionMaxAbs"), 0.1, "<="),
    g("globalMedianScoreMin", num(m, "globalMedianScore"), 48, ">="),
    g("globalMedianScoreMax", num(m, "globalMedianScore"), 52, "<="),
    g("globalMeanScoreMin", num(m, "globalMeanScore"), 47, ">="),
    g("globalMeanScoreMax", num(m, "globalMeanScore"), 53, "<="),
    g("positiveLatentRateMin", num(m, "positiveLatentRate"), 0.35, ">="),
    g("positiveLatentRateMax", num(m, "positiveLatentRate"), 0.65, "<="),
    g("negativeLatentRateMin", num(m, "negativeLatentRate"), 0.35, ">="),
    g("negativeLatentRateMax", num(m, "negativeLatentRate"), 0.65, "<="),
    g("meanIntraYearSixAxisSdMin", num(m, "meanIntraYearSixAxisSd"), 9, ">="),
    g("medianIntraYearRangeMin", num(m, "medianIntraYearRange"), 24, ">="),
    g("p25IntraYearRangeMin", num(m, "p25IntraYearRange"), 17, ">="),
    g("p10IntraYearRangeMin", num(m, "p10IntraYearRange"), 11, ">="),
    g("atLeastTwoOutside42To58RateMin", num(m, "atLeastTwoOutside42To58Rate"), 0.6, ">="),
    g("atLeastOneAtOrBelow45RateMin", num(m, "atLeastOneAtOrBelow45Rate"), 0.6, ">="),
    g("atLeastOneAtOrAbove60RateMin", num(m, "atLeastOneAtOrAbove60Rate"), 0.6, ">="),
    g("oneLowAndOneHighRateMin", num(m, "oneLowAndOneHighRate"), 0.5, ">="),
    g("allSixAbove50RateMax", num(m, "allSixAbove50Rate"), 0.12, "<="),
    g("fiveOrMoreAbove50RateMax", num(m, "fiveOrMoreAbove50Rate"), 0.28, "<="),
    g("allSixInside45To65RateMax", num(m, "allSixInside45To65Rate"), 0.3, "<="),
    g("exactDuplicateVectorRateMax", num(m, "exactDuplicateVectorRate"), 0.01, "<="),
    g("nearDuplicateVectorRateMax", num(m, "nearDuplicateVectorRate"), 0.05, "<="),
    g("maxAbsInterAxisCorrelationMax", num(m, "maxAbsInterAxisCorrelation"), 0.9, "<="),
  ];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    gates.push(g(`domainMedianMin_${domain}`, num(m, `domainMedian_${domain}`), 45, ">="));
    gates.push(g(`domainMedianMax_${domain}`, num(m, `domainMedian_${domain}`), 55, "<="));
    gates.push(
      g(`domainPositiveLatentRateMin_${domain}`, num(m, `domainPositiveLatentRate_${domain}`), 0.25, ">="),
    );
    gates.push(
      g(`domainPositiveLatentRateMax_${domain}`, num(m, `domainPositiveLatentRate_${domain}`), 0.75, "<="),
    );
    gates.push(
      g(`domainTwelveYearRangeMin_${domain}`, num(m, `domainTwelveYearRange_${domain}`), 8, ">="),
    );
    gates.push(
      g(`domainAdjacentDeltaMin_${domain}`, num(m, `domainAdjacentDelta_${domain}`), 1.5, ">="),
    );
  }

  const blockers = gates
    .filter((x) => !x.passed)
    .map((x) => `${x.gate}: ${x.value} vs ${x.comparator} ${x.threshold}`);
  return {
    metrics: m,
    gateResults: gates,
    passedAllGates: blockers.length === 0,
    blockers,
  };
}
