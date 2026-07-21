import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { computeDistributionReport } from "./compute-distribution-report";
import type { AnnualAxesAuditObservation } from "./types";
import type { V051DomainSample } from "./v051-types";
import {
  mean,
  median,
  percentile,
  rate,
  scoreDistribution,
  vectorDistribution,
} from "./v051-stats";

export interface V051Metrics {
  [key: string]: number;
}

function gate(
  name: string,
  value: number,
  threshold: number,
  comparator: ">=" | "<=",
): { gate: string; passed: boolean; value: number; threshold: number; comparator: ">=" | "<=" } {
  const passed = comparator === ">=" ? value >= threshold : value <= threshold;
  return { gate: name, passed, value, threshold, comparator };
}

export function samplesToObservations(samples: V051DomainSample[]): AnnualAxesAuditObservation[] {
  const byYear = new Map<
    string,
    {
      chartId: string;
      annualYear: number;
      scores: Partial<Record<AnnualAxisDomain, number>>;
    }
  >();

  for (const s of samples) {
    const key = `${s.chartId}:${s.annualYear}`;
    const cur = byYear.get(key) ?? {
      chartId: s.chartId,
      annualYear: s.annualYear,
      scores: {},
    };
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

export function computeV051Metrics(samples: V051DomainSample[]): V051Metrics {
  const scores = samples.map((s) => s.score);
  const latents = samples.map((s) => s.latent);
  const vectors = (() => {
    const byYear = new Map<string, number[]>();
    const partial = new Map<string, Partial<Record<AnnualAxisDomain, number>>>();
    for (const s of samples) {
      const key = `${s.chartId}:${s.annualYear}`;
      const cur = partial.get(key) ?? {};
      cur[s.domain] = s.score;
      partial.set(key, cur);
    }
    for (const [key, p] of partial) {
      const vals = ANNUAL_AXIS_DOMAINS.map((d) => p[d]).filter((v): v is number => v != null);
      if (vals.length === 6) byYear.set(key, vals);
    }
    return [...byYear.values()];
  })();

  const scoreDist = scoreDistribution(scores);
  const vecDist = vectorDistribution(vectors);
  const sortedLatents = [...latents].sort((a, b) => a - b);
  const posLatent = latents.filter((v) => v > 0);
  const negLatent = latents.filter((v) => v < 0);

  let totalAxes = scores.length;
  let extremeAxes = scores.filter((v) => v <= 2 || v >= 98).length;
  let softExtremeAxes = scores.filter((v) => v <= 10 || v >= 90).length;
  let tp4cMax = 0;
  for (const s of samples) {
    tp4cMax = Math.max(tp4cMax, s.tp4cContributionAbs);
  }

  const perDomainMedian: Record<string, number> = {};
  const perDomainPosLatentRate: Record<string, number> = {};
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const ds = samples.filter((s) => s.domain === domain);
    perDomainMedian[domain] = median(ds.map((s) => s.score));
    const dl = ds.map((s) => s.latent);
    perDomainPosLatentRate[domain] = rate(
      dl.filter((v) => v > 0).length,
      dl.length,
    );
  }

  return {
    globalMedianScore: scoreDist.median,
    globalPositiveLatentRate: rate(posLatent.length, latents.length),
    globalNegativeLatentRate: rate(negLatent.length, latents.length),
    globalLatentMedian: percentile(sortedLatents, 0.5),
    meanIntraYearSixAxisSd: vecDist.meanIntraYearSixAxisSd,
    medianIntraYearRange: vecDist.medianIntraYearRange,
    p25IntraYearRange: vecDist.p25IntraYearRange,
    p10IntraYearRange: vecDist.p10IntraYearRange,
    allSixAbove50Rate: vecDist.allSixAbove50Rate,
    fiveOrMoreAbove50Rate: vecDist.fiveOrMoreAbove50Rate,
    allSixInside45To65Rate: vecDist.allSixInside45To65Rate,
    atLeastOneAtOrBelow45Rate: vecDist.atLeastOneAtOrBelow45Rate,
    atLeastOneAtOrAbove60Rate: vecDist.atLeastOneAtOrAbove60Rate,
    oneLowAndOneHighRate: vecDist.oneLowAndOneHighRate,
    atLeastTwoOutside42To58Rate: vecDist.atLeastTwoOutside42To58Rate,
    extremeScoreRate: rate(extremeAxes, totalAxes),
    softExtremeScoreRate: rate(softExtremeAxes, totalAxes),
    tp4cContributionMaxAbs: tp4cMax,
    ...Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.flatMap((d) => [
        [`domainMedianScore_${d}`, perDomainMedian[d]!],
        [`domainPositiveLatentRate_${d}`, perDomainPosLatentRate[d]!],
      ]),
    ),
  };
}

export function evaluateV051Gates(
  holdoutSamples: V051DomainSample[],
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): { metrics: V051Metrics; gateResults: ReturnType<typeof gate>[]; blockers: string[] } {
  const metrics = computeV051Metrics(holdoutSamples);
  const observations = samplesToObservations(holdoutSamples);
  const report = computeDistributionReport(knowledge.distributionGates.catalogId, observations);
  const gates = knowledge.distributionGates.hardGates;

  const minDomainMedian = Math.min(
    ...Object.values(report.longitudinalChange.medianPerDomainTwelveYearRange),
  );
  const minDomainAdjacent = Math.min(
    ...Object.values(report.longitudinalChange.medianAdjacentYearAbsoluteDelta),
  );
  const maxAbsCorr = Math.max(
    ...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v)),
  );

  let outsideVectors = 0;
  let outsideVectorsTotal = 0;
  for (const obs of observations) {
    const vals = ANNUAL_AXIS_DOMAINS.map((d) => obs.scores[d]).filter(
      (v): v is number => v != null,
    );
    if (vals.length !== 6) continue;
    outsideVectorsTotal += 1;
    if (vals.filter((v) => v < 45 || v > 55).length >= 2) outsideVectors += 1;
  }
  const outsideNeutralBandRate =
    outsideVectorsTotal === 0 ? 0 : outsideVectors / outsideVectorsTotal;

  const results = [
    gate("meanIntraYearAxisStandardDeviation", report.intraYearAxisSpread.meanStandardDeviation, gates.meanIntraYearAxisStandardDeviationMin, ">="),
    gate("medianIntraYearAxisRange", report.intraYearAxisSpread.medianRange, gates.medianIntraYearAxisRangeMin, ">="),
    gate("minDomainMedianTwelveYearRange", minDomainMedian, gates.medianPerDomainTwelveYearRangeMin, ">="),
    gate("minDomainAdjacentYearMedianAbsDelta", minDomainAdjacent, gates.medianAdjacentYearAbsoluteDeltaMin, ">="),
    gate("exactDuplicateVectorRate", report.exactDuplicateVectorRate, gates.exactDuplicateVectorRateMax, "<="),
    gate("nearDuplicateVectorRate", report.crossChartSimilarity.nearDuplicateVectorRate, gates.nearDuplicateVectorRateMax, "<="),
    gate("unavailableRate", report.unavailableRate, gates.unavailableRateMax, "<="),
    gate("maxAbsInterAxisCorrelation", maxAbsCorr, gates.absoluteInterAxisCorrelationMax, "<="),
    gate("extremeScoreRate", metrics.extremeScoreRate ?? 0, gates.extremeScoreRateMax, "<="),
    gate("tp4cContributionMaxAbs", metrics.tp4cContributionMaxAbs ?? 0, 0.1, "<="),
    gate("globalMedianScoreMin", metrics.globalMedianScore ?? 0, 48, ">="),
    gate("globalMedianScoreMax", metrics.globalMedianScore ?? 0, 52, "<="),
    gate("globalPositiveLatentRateMin", metrics.globalPositiveLatentRate ?? 0, 0.35, ">="),
    gate("globalPositiveLatentRateMax", metrics.globalPositiveLatentRate ?? 0, 0.65, "<="),
    gate("globalNegativeLatentRateMin", metrics.globalNegativeLatentRate ?? 0, 0.35, ">="),
    gate("globalNegativeLatentRateMax", metrics.globalNegativeLatentRate ?? 0, 0.65, "<="),
    gate("medianIntraYearRadarRangeStrict", metrics.medianIntraYearRange ?? 0, 26, ">="),
    gate("p25IntraYearRadarRangeStrict", metrics.p25IntraYearRange ?? 0, 18, ">="),
    gate("p10IntraYearRadarRangeStrict", metrics.p10IntraYearRange ?? 0, 12, ">="),
    gate("meanIntraYearSixAxisSdStrict", metrics.meanIntraYearSixAxisSd ?? 0, 9, ">="),
    gate("atLeastOneAxisAtOrBelow45Rate", metrics.atLeastOneAtOrBelow45Rate ?? 0, 0.65, ">="),
    gate("atLeastOneAxisAtOrAbove60Rate", metrics.atLeastOneAtOrAbove60Rate ?? 0, 0.65, ">="),
    gate("oneLowAndOneHighRate", metrics.oneLowAndOneHighRate ?? 0, 0.55, ">="),
    gate("atLeastTwoAxesOutside42To58Rate", metrics.atLeastTwoOutside42To58Rate ?? 0, 0.65, ">="),
    gate("allSixAbove50RateMax", metrics.allSixAbove50Rate ?? 0, 0.12, "<="),
    gate("fiveOrMoreAbove50RateMax", metrics.fiveOrMoreAbove50Rate ?? 0, 0.28, "<="),
    gate("allSixInside45To65RateMax", metrics.allSixInside45To65Rate ?? 0, 0.30, "<="),
    gate("softExtremeScoreRateMax", metrics.softExtremeScoreRate ?? 0, 0.08, "<="),
    ...ANNUAL_AXIS_DOMAINS.flatMap((d) => {
      const med = metrics[`domainMedianScore_${d}`] ?? 0;
      const pos = metrics[`domainPositiveLatentRate_${d}`] ?? 0;
      return [
        gate(`domainMedianScoreMin_${d}`, med, 45, ">="),
        gate(`domainMedianScoreMax_${d}`, med, 55, "<="),
        gate(`domainPositiveLatentRateMin_${d}`, pos, 0.25, ">="),
        gate(`domainPositiveLatentRateMax_${d}`, pos, 0.75, "<="),
      ];
    }),
  ];

  const blockers = results.filter((g) => !g.passed).map((g) => `${g.gate}: ${g.value} vs ${g.comparator} ${g.threshold}`);

  return { metrics, gateResults: results, blockers };
}

export function selectV051Candidate(
  evaluations: Array<{
    candidateId: string;
    passedAllGates: boolean;
    metrics: V051Metrics;
    gateResults: ReturnType<typeof gate>[];
  }>,
): { selectedVariant: string | null; selectionStatus: "approved" | "no-variant-approved"; rationale: string[] } {
  const passing = evaluations.filter(
    (e) => e.passedAllGates && e.candidateId !== "BASELINE-V05",
  );
  if (passing.length === 0) {
    return {
      selectedVariant: null,
      selectionStatus: "no-variant-approved",
      rationale: ["No non-baseline candidate passed all hard and strictness gates."],
    };
  }

  const precedence = ["STRICT-SCALE", "STRICT-BALANCED", "STRICT-ACTIVATION"];
  passing.sort((a, b) => {
    const distA = Math.abs((a.metrics.globalMedianScore ?? 50) - 50);
    const distB = Math.abs((b.metrics.globalMedianScore ?? 50) - 50);
    if (distA !== distB) return distA - distB;
    if ((a.metrics.allSixAbove50Rate ?? 0) !== (b.metrics.allSixAbove50Rate ?? 0)) {
      return (a.metrics.allSixAbove50Rate ?? 0) - (b.metrics.allSixAbove50Rate ?? 0);
    }
    if ((a.metrics.oneLowAndOneHighRate ?? 0) !== (b.metrics.oneLowAndOneHighRate ?? 0)) {
      return (b.metrics.oneLowAndOneHighRate ?? 0) - (a.metrics.oneLowAndOneHighRate ?? 0);
    }
    if ((a.metrics.p25IntraYearRange ?? 0) !== (b.metrics.p25IntraYearRange ?? 0)) {
      return (b.metrics.p25IntraYearRange ?? 0) - (a.metrics.p25IntraYearRange ?? 0);
    }
    if ((a.metrics.extremeScoreRate ?? 0) !== (b.metrics.extremeScoreRate ?? 0)) {
      return (a.metrics.extremeScoreRate ?? 0) - (b.metrics.extremeScoreRate ?? 0);
    }
    return precedence.indexOf(a.candidateId) - precedence.indexOf(b.candidateId);
  });

  const winner = passing[0]!;
  return {
    selectedVariant: winner.candidateId,
    selectionStatus: "approved",
    rationale: [
      `Selected ${winner.candidateId} by deterministic tie-break.`,
      `globalMedianScore=${winner.metrics.globalMedianScore}`,
      `allSixAbove50Rate=${winner.metrics.allSixAbove50Rate}`,
      `oneLowAndOneHighRate=${winner.metrics.oneLowAndOneHighRate}`,
    ],
  };
}
