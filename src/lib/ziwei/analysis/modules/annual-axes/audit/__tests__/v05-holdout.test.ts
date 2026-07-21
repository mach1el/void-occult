/**
 * V0.5 holdout acceptance — scores only the 20% chart tail (stable ID split).
 * Fails the test if any acceptance gate is not satisfied.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput, ChartData } from "@/types/chart";
import { join } from "node:path";

import { FULL_CORPUS_CONTRACT, buildAuditBirthInputs, expandAnnualYears } from "../build-audit-corpus";
import { analyzeAnnualAxesNamPhaiV05 } from "../../nam-phai-v05/analyze";
import { computeDistributionReport } from "../compute-distribution-report";
import { availableScores } from "../compare-annual-vectors";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import type { AnnualAxesAuditObservation } from "../types";

const ENABLED = true;

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function stableChartId(contractId: string, chartIndex: number): string {
  return `${contractId}:nam-phai:c${chartIndex}`;
}

function scoreChart(chart: ChartData): AnnualAxesAuditObservation {
  const result = analyzeAnnualAxesNamPhaiV05(chart);
  const scores = {} as AnnualAxesAuditObservation["scores"];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = result.axes[domain];
    scores[domain] = axis.status === "available" ? axis.score : null;
  }

  const collectStats: AnnualAxesAuditObservation["collectStats"] = {};
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = result.axes[domain];
    if (axis.status === "available" && axis.collectStats) {
      collectStats[domain] = axis.collectStats;
    }
  }

  return {
    chartId: stableChartId(FULL_CORPUS_CONTRACT.contractId, 0), // overwritten by caller
    school: "nam-phai",
    annualYear: chart.annualYear,
    annualHeadPalaceIndex: chart.annualHeadPalace?.index ?? chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ?? null,
    status: result.status,
    scores,
    collectStats: Object.keys(collectStats).length > 0 ? collectStats : undefined,
  };
}

describe.runIf(ENABLED)("annual-axes v0.5 holdout acceptance", () => {
  it("satisfies all configured V0.5 hard gates and core constraints", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const knowledge = loaded.knowledge;

    const holdoutStart = Math.floor(FULL_CORPUS_CONTRACT.chartCount * 0.8);
    const holdoutIndices = Array.from(
      { length: FULL_CORPUS_CONTRACT.chartCount - holdoutStart },
      (_, i) => i + holdoutStart,
    );

    const bases = buildAuditBirthInputs(FULL_CORPUS_CONTRACT);
    expect(bases).toHaveLength(FULL_CORPUS_CONTRACT.chartCount);

    const observations: AnnualAxesAuditObservation[] = [];

    let totalAxes = 0;
    let extremeAxes = 0;
    let outsideVectors = 0;
    let outsideVectorsTotal = 0;
    const availabilityByDomain = ANNUAL_AXIS_DOMAINS.reduce(
      (acc, d) => {
        acc[d] = { available: 0, total: 0 };
        return acc;
      },
      {} as Record<AnnualAxisDomain, { available: number; total: number }>,
    );

    const EPS = 1e-9;

    for (const chartIndex of holdoutIndices) {
      const base = bases[chartIndex];
      if (!base) throw new Error(`missing base for chartIndex=${chartIndex}`);
      const chartId = stableChartId(FULL_CORPUS_CONTRACT.contractId, chartIndex);

      for (const yearly of expandAnnualYears(base, FULL_CORPUS_CONTRACT.baseAnnualYear, FULL_CORPUS_CONTRACT.yearsPerChart)) {
        const chart = calculateNamPhai(yearly);
        const result = analyzeAnnualAxesNamPhaiV05(chart);

        // Core constraints per axis (TP4C cap, boundedness, no NaN/Infinity).
        for (const domain of ANNUAL_AXIS_DOMAINS) {
          const axis = result.axes[domain];
          availabilityByDomain[domain].total += 1;
          if (axis.status !== "available") continue;
          availabilityByDomain[domain].available += 1;
          expect(Number.isFinite(axis.score)).toBe(true);
          expect(axis.score).toBeGreaterThanOrEqual(0);
          expect(axis.score).toBeLessThanOrEqual(100);
          expect(Number.isFinite(axis.activationGate ?? 0)).toBe(true);
          expect(axis.activationGate ?? 0).toBeGreaterThanOrEqual(0);
          expect(axis.activationGate ?? 0).toBeLessThanOrEqual(1 + EPS);
          const tp4cContribution = axis.spatialBudgetTrace?.tp4cContribution ?? 0;
          expect(Math.abs(tp4cContribution)).toBeLessThanOrEqual(0.1 + 1e-6);
        }

        const obs: AnnualAxesAuditObservation = {
          chartId,
          school: "nam-phai",
          annualYear: chart.annualYear,
          annualHeadPalaceIndex: chart.annualHeadPalace?.index ?? chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ?? null,
          status: result.status,
          scores: Object.fromEntries(
            ANNUAL_AXIS_DOMAINS.map((domain) => {
              const axis = result.axes[domain];
              return [domain, axis.status === "available" ? axis.score : null] as const;
            }),
          ) as any,
          collectStats: undefined,
        };
        observations.push(obs);

        const vals = availableScores(obs.scores);
        if (vals.length === 6) {
          const outsideCount = vals.filter((v) => v < 45 || v > 55).length;
          outsideVectorsTotal += 1;
          if (outsideCount >= 2) outsideVectors += 1;

          totalAxes += 6;
          extremeAxes += vals.filter((v) => v <= 2 || v >= 98).length;
        }
      }
    }

    const report = computeDistributionReport(knowledge.distributionGates.catalogId, observations);

    const gates = knowledge.distributionGates.hardGates;

    const minDomainMedian = Math.min(
      ...Object.values(report.longitudinalChange.medianPerDomainTwelveYearRange),
    );
    const minDomainAdjacent = Math.min(
      ...Object.values(report.longitudinalChange.medianAdjacentYearAbsoluteDelta),
    );

    const maxAbsCorr = Math.max(...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v)));

    const extremeScoreRate = totalAxes === 0 ? 0 : extremeAxes / totalAxes;
    const outsideNeutralBandRate =
      outsideVectorsTotal === 0 ? 0 : outsideVectors / outsideVectorsTotal;

    // Gate assertions.
    expect(report.intraYearAxisSpread.meanStandardDeviation).toBeGreaterThanOrEqual(
      gates.meanIntraYearAxisStandardDeviationMin,
    );
    expect(report.intraYearAxisSpread.medianRange).toBeGreaterThanOrEqual(
      gates.medianIntraYearAxisRangeMin,
    );
    expect(minDomainMedian).toBeGreaterThanOrEqual(gates.medianPerDomainTwelveYearRangeMin);
    expect(minDomainAdjacent).toBeGreaterThanOrEqual(gates.medianAdjacentYearAbsoluteDeltaMin);

    expect(report.exactDuplicateVectorRate).toBeLessThanOrEqual(gates.exactDuplicateVectorRateMax);
    expect(report.crossChartSimilarity.nearDuplicateVectorRate).toBeLessThanOrEqual(gates.nearDuplicateVectorRateMax);
    expect(report.unavailableRate).toBeLessThanOrEqual(gates.unavailableRateMax);
    expect(maxAbsCorr).toBeLessThanOrEqual(gates.absoluteInterAxisCorrelationMax);

    // UI-specific.
    expect(report.intraYearAxisSpread.medianRange).toBeGreaterThanOrEqual(
      gates.medianRadarRangeMin,
    );
    expect(outsideNeutralBandRate).toBeGreaterThanOrEqual(gates.outsideNeutralBandRateMin);
    expect(extremeScoreRate).toBeLessThanOrEqual(gates.extremeScoreRateMax);
  }, 600_000);
});

