/**
 * V0.5 holdout report writer — only runs when ANNUAL_AXES_V05_HOLDOUT_WRITE=1.
 * Writes a machine-readable holdout metrics file for PR/reporting.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";

import { FULL_CORPUS_CONTRACT, buildAuditBirthInputs, expandAnnualYears } from "../build-audit-corpus";
import { analyzeAnnualAxesNamPhaiV05 } from "../../nam-phai-v05/analyze";
import { computeDistributionReport } from "../compute-distribution-report";
import { availableScores } from "../compare-annual-vectors";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import type { AnnualAxesAuditObservation } from "../types";

const ENABLED = process.env.ANNUAL_AXES_V05_HOLDOUT_WRITE === "1";
const OUT_PATH = join(
  process.cwd(),
  "research/annual-axes/distribution/v0.5/annual-axes-v0.5-holdout-report.json",
);

function stableChartId(contractId: string, chartIndex: number): string {
  return `${contractId}:nam-phai:c${chartIndex}`;
}

describe.runIf(ENABLED)("annual-axes v0.5 holdout report write", () => {
  it("writes the accepted holdout metrics report", () => {
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
    const observations: AnnualAxesAuditObservation[] = [];
    let totalAxes = 0;
    let extremeAxes = 0;
    let outsideVectors = 0;
    let outsideVectorsTotal = 0;
    let tp4cContributionMaxAbs = 0;

    for (const chartIndex of holdoutIndices) {
      const base = bases[chartIndex];
      if (!base) throw new Error(`missing base for chartIndex=${chartIndex}`);
      const chartId = stableChartId(FULL_CORPUS_CONTRACT.contractId, chartIndex);

      for (const yearly of expandAnnualYears(base, FULL_CORPUS_CONTRACT.baseAnnualYear, FULL_CORPUS_CONTRACT.yearsPerChart)) {
        const chart = calculateNamPhai(yearly);
        const result = analyzeAnnualAxesNamPhaiV05(chart);

        for (const domain of ANNUAL_AXIS_DOMAINS) {
          const axis = result.axes[domain];
          if (axis.status !== "available") continue;
          tp4cContributionMaxAbs = Math.max(
            tp4cContributionMaxAbs,
            Math.abs(axis.spatialBudgetTrace?.tp4cContribution ?? 0),
          );
        }

        const obs: AnnualAxesAuditObservation = {
          chartId,
          school: "nam-phai",
          annualYear: chart.annualYear,
          annualHeadPalaceIndex:
            chart.annualHeadPalace?.index ??
            chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
            null,
          status: result.status,
          scores: Object.fromEntries(
            ANNUAL_AXIS_DOMAINS.map((domain) => {
              const axis = result.axes[domain];
              return [domain, axis.status === "available" ? axis.score : null] as const;
            }),
          ) as AnnualAxesAuditObservation["scores"],
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
    const maxAbsInterAxisCorrelation = Math.max(
      ...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v)),
    );
    const minDomainMedianTwelveYearRange = Math.min(
      ...Object.values(report.longitudinalChange.medianPerDomainTwelveYearRange),
    );
    const minDomainAdjacentYearMedianAbsDelta = Math.min(
      ...Object.values(report.longitudinalChange.medianAdjacentYearAbsoluteDelta),
    );
    const extremeScoreRate = totalAxes === 0 ? 0 : extremeAxes / totalAxes;
    const outsideNeutralBandRate =
      outsideVectorsTotal === 0 ? 0 : outsideVectors / outsideVectorsTotal;

    const output = {
      profileId: "annual-axes-v0.5-holdout",
      corpusId: FULL_CORPUS_CONTRACT.contractId,
      holdoutCharts: holdoutIndices.length,
      yearsPerChart: FULL_CORPUS_CONTRACT.yearsPerChart,
      activationScale: knowledge.calibration.activationScale,
      domainScales: knowledge.calibration.domainScales,
      trainingDiagnostics: knowledge.calibration.trainingDiagnostics,
      holdoutMetrics: {
        meanIntraYearAxisStandardDeviation: report.intraYearAxisSpread.meanStandardDeviation,
        medianIntraYearAxisRange: report.intraYearAxisSpread.medianRange,
        minDomainMedianTwelveYearRange,
        perDomainMedianTwelveYearRange: report.longitudinalChange.medianPerDomainTwelveYearRange,
        minDomainAdjacentYearMedianAbsDelta,
        perDomainAdjacentYearMedianAbsDelta:
          report.longitudinalChange.medianAdjacentYearAbsoluteDelta,
        exactDuplicateVectorRate: report.exactDuplicateVectorRate,
        nearDuplicateVectorRate: report.crossChartSimilarity.nearDuplicateVectorRate,
        unavailableRate: report.unavailableRate,
        maxAbsInterAxisCorrelation,
        extremeScoreRate,
        tp4cContributionMaxAbs,
        medianRadarRange: report.intraYearAxisSpread.medianRange,
        outsideNeutralBandRate,
      },
    };

    mkdirSync(join(process.cwd(), "research/annual-axes/distribution/v0.5"), {
      recursive: true,
    });
    writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
    expect(output.holdoutMetrics.minDomainMedianTwelveYearRange).toBeGreaterThan(0);
  }, 600_000);
});

