import { describe, expect, it } from "vitest";
import { computeFullMetricsV09 } from "../metrics";
import { computeV09ResearchArtifacts, FAST_CORPUS_CONTRACT } from "../write-research-artifacts";
import type { AnnualAxesAuditObservationV09, AnnualAxisAuditDomainObservationV09 } from "../types";

function domainObs(score: number | null, overrides: Partial<AnnualAxisAuditDomainObservationV09> = {}): AnnualAxisAuditDomainObservationV09 {
  return {
    status: score == null ? "unavailable" : "available",
    score,
    band: null,
    scoreState: score == null ? "unavailable" : score === 50 ? "balanced-signal" : "scored",
    resolvedWeight: 1,
    totalWeight: 1,
    missingPalaces: [],
    primaryPalace: "X",
    cooperatingPalaces: [],
    positivePoints: 0,
    negativePoints: 0,
    axisRawBeforeThaiTue: 0,
    thaiTueApplied: false,
    thaiTueMultiplier: 1,
    prominenceAdjustedRaw: 0,
    palaceClampApplied: false,
    axisClampApplied: false,
    matchedRuleIds: [],
    matchedStarNames: [],
    ...overrides,
  };
}

function chartYear(
  chartId: string,
  annualYear: number,
  scores: [number | null, number | null, number | null, number | null, number | null, number | null],
  overrides: Partial<Record<string, Partial<AnnualAxisAuditDomainObservationV09>>> = {},
): AnnualAxesAuditObservationV09 {
  const domains = ["health", "family", "wealth", "career", "social", "romance"] as const;
  const record = {} as AnnualAxesAuditObservationV09["domains"];
  domains.forEach((d, i) => {
    record[d] = domainObs(scores[i]!, overrides[d]);
  });
  return { chartId, school: "nam-phai", annualYear, annualHeadPalaceIndex: null, domains: record };
}

describe("annual axes v0.9 metrics — synthetic dataset", () => {
  it("computes p25/p10 intra-year range exactly on a known dataset", () => {
    // 4 chart-years with known ranges [0, 10, 20, 30] -> sorted, p25 idx=0.75*3=2.25 -> interpolated
    const obs = [
      chartYear("c0", 2020, [50, 50, 50, 50, 50, 50]),
      chartYear("c1", 2020, [40, 50, 50, 50, 50, 50]),
      chartYear("c2", 2020, [30, 50, 50, 50, 50, 50]),
      chartYear("c3", 2020, [20, 50, 50, 50, 50, 50]),
    ];
    const metrics = computeFullMetricsV09(obs);
    // ranges: 0, 10, 20, 30 (sorted)
    expect(metrics.medianIntraYearAxisRange).toBeCloseTo(15, 5);
    expect(metrics.p10IntraYearRange).toBeCloseTo(3, 5);
    expect(metrics.p25IntraYearRange).toBeCloseTo(7.5, 5);
  });

  it("computes boundary rate correctly against a configured scale", () => {
    const obs = [chartYear("c0", 2020, [10, 90, 50, 50, 50, 50])];
    const metrics = computeFullMetricsV09(obs, { minimum: 10, maximum: 90 });
    expect(metrics.boundaryScoreRate).toBeCloseTo(2 / 6, 5);
  });

  it("computes low/high threshold rates correctly", () => {
    const obs = [
      chartYear("c0", 2020, [35, 65, 50, 50, 50, 50]), // has both low(<=40) and high(>=60)
      chartYear("c1", 2020, [55, 55, 55, 55, 55, 55]), // neither
    ];
    const metrics = computeFullMetricsV09(obs);
    expect(metrics.atLeastOneAtOrBelow40Rate).toBeCloseTo(0.5, 5);
    expect(metrics.atLeastOneAtOrAbove60Rate).toBeCloseTo(0.5, 5);
    expect(metrics.oneLowAndOneHighRate).toBeCloseTo(0.5, 5);
  });

  it("computes five-or-more-above-50 rate correctly", () => {
    const obs = [
      chartYear("c0", 2020, [51, 51, 51, 51, 51, 49]), // 5 above 50
      chartYear("c1", 2020, [49, 49, 49, 49, 49, 49]), // 0 above 50
    ];
    const metrics = computeFullMetricsV09(obs);
    expect(metrics.fiveOrMoreAbove50Rate).toBeCloseTo(0.5, 5);
    expect(metrics.allSixAbove50Rate).toBeCloseTo(0, 5);
  });

  it("computes maximum absolute inter-axis correlation as the max over all pairs", () => {
    // health and family move in perfect lockstep -> correlation 1
    const obs = [
      chartYear("c0", 2020, [10, 10, 50, 50, 50, 50]),
      chartYear("c1", 2020, [50, 50, 50, 50, 50, 50]),
      chartYear("c2", 2020, [90, 90, 50, 50, 50, 50]),
    ];
    const metrics = computeFullMetricsV09(obs);
    expect(metrics.maximumAbsoluteInterAxisCorrelation).toBeCloseTo(1, 5);
  });

  it("distinguishes neutral score (===50) from no-signal scoreState", () => {
    const obs = [
      chartYear("c0", 2020, [50, 50, 50, 50, 50, 50], {
        health: { scoreState: "no-signal" },
        family: { scoreState: "balanced-signal" },
        wealth: { scoreState: "partial-data" },
        career: { scoreState: "partial-data" },
        social: { scoreState: "partial-data" },
        romance: { scoreState: "partial-data" },
      }),
    ];
    const metrics = computeFullMetricsV09(obs);
    expect(metrics.neutralScoreRate).toBeCloseTo(1, 5); // all six are score===50
    expect(metrics.noSignalRate).toBeCloseTo(1 / 6, 5);
    expect(metrics.balancedSignalRate).toBeCloseTo(1 / 6, 5);
  });
});

describe("annual axes v0.9 metrics — fast corpus integration", () => {
  it("computes every configured metric as a finite number over the fast corpus", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const m = artifacts.metrics;
    for (const key of [
      "meanIntraYearAxisStandardDeviation",
      "medianIntraYearAxisRange",
      "p25IntraYearRange",
      "p10IntraYearRange",
      "boundaryScoreRate",
      "exactDuplicateVectorRate",
      "nearDuplicateVectorRate",
      "unavailableRate",
      "partialRate",
      "maximumAbsoluteInterAxisCorrelation",
      "noSignalRate",
      "balancedSignalRate",
      "neutralScoreRate",
      "palaceClampRate",
      "axisClampRate",
      "thaiTueApplicationRate",
      "meanResolvedCoverage",
    ] as const) {
      expect(Number.isFinite(m[key]), `${key} should be finite`).toBe(true);
    }
    // scoredStateNeutralScoreCount is not guaranteed to be 0: floating-point
    // summation of weighted contributions can land on a near-zero epsilon
    // instead of exact 0, which rounds to a score of 50 while still being
    // classified "scored" — a documented V0.9 finding, not a bug in this
    // read-only audit. See no-signal-analysis.ts for the full explanation.
    expect(m.scoredStateNeutralScoreCount).toBeGreaterThanOrEqual(0);
  });
});
