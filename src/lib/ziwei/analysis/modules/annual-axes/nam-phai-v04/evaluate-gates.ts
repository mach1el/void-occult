import type { AnnualAxesDistributionReport } from "../audit/types";
import type { AnnualDistributionGatesV04 } from "../../../knowledge/annual-axes/v0.4";

export interface GateEvaluation {
  gateId: string;
  passed: boolean;
  observed: number;
  threshold: number;
  comparator: "<=" | ">=";
}

/**
 * Evaluate V0.4 hard distribution gates against a report.
 * Does not mutate scores — reporting only.
 */
export function evaluateDistributionGates(
  report: AnnualAxesDistributionReport,
  gates: AnnualDistributionGatesV04["hardGates"],
): { passed: boolean; results: GateEvaluation[] } {
  const medianDomainRange = Math.min(
    ...Object.values(report.longitudinalChange.medianPerDomainTwelveYearRange),
  );
  const medianAdjacent = Math.min(
    ...Object.values(report.longitudinalChange.medianAdjacentYearAbsoluteDelta),
  );
  const maxAbsCorr = Math.max(
    ...Object.values(report.interAxisCorrelation).map((v) => Math.abs(v)),
    0,
  );

  const results: GateEvaluation[] = [
    {
      gateId: "allSixAbove60RateMax",
      passed: report.allSixAbove60Rate <= gates.allSixAbove60RateMax,
      observed: report.allSixAbove60Rate,
      threshold: gates.allSixAbove60RateMax,
      comparator: "<=",
    },
    {
      gateId: "exactDuplicateVectorRateMax",
      passed: report.exactDuplicateVectorRate <= gates.exactDuplicateVectorRateMax,
      observed: report.exactDuplicateVectorRate,
      threshold: gates.exactDuplicateVectorRateMax,
      comparator: "<=",
    },
    {
      gateId: "nearDuplicateVectorRateMax",
      passed:
        report.crossChartSimilarity.nearDuplicateVectorRate <= gates.nearDuplicateVectorRateMax,
      observed: report.crossChartSimilarity.nearDuplicateVectorRate,
      threshold: gates.nearDuplicateVectorRateMax,
      comparator: "<=",
    },
    {
      gateId: "meanIntraYearAxisStandardDeviationMin",
      passed:
        report.intraYearAxisSpread.meanStandardDeviation >=
        gates.meanIntraYearAxisStandardDeviationMin,
      observed: report.intraYearAxisSpread.meanStandardDeviation,
      threshold: gates.meanIntraYearAxisStandardDeviationMin,
      comparator: ">=",
    },
    {
      gateId: "medianIntraYearAxisRangeMin",
      passed: report.intraYearAxisSpread.medianRange >= gates.medianIntraYearAxisRangeMin,
      observed: report.intraYearAxisSpread.medianRange,
      threshold: gates.medianIntraYearAxisRangeMin,
      comparator: ">=",
    },
    {
      gateId: "medianPerDomainTwelveYearRangeMin",
      passed: medianDomainRange >= gates.medianPerDomainTwelveYearRangeMin,
      observed: medianDomainRange,
      threshold: gates.medianPerDomainTwelveYearRangeMin,
      comparator: ">=",
    },
    {
      gateId: "medianAdjacentYearAbsoluteDeltaMin",
      passed: medianAdjacent >= gates.medianAdjacentYearAbsoluteDeltaMin,
      observed: medianAdjacent,
      threshold: gates.medianAdjacentYearAbsoluteDeltaMin,
      comparator: ">=",
    },
    {
      gateId: "annualHeadMoveSensitivityRateMin",
      passed:
        report.longitudinalChange.annualHeadMoveSensitivityRate >=
        gates.annualHeadMoveSensitivityRateMin,
      observed: report.longitudinalChange.annualHeadMoveSensitivityRate,
      threshold: gates.annualHeadMoveSensitivityRateMin,
      comparator: ">=",
    },
    {
      gateId: "absoluteInterAxisCorrelationMax",
      passed: maxAbsCorr <= gates.absoluteInterAxisCorrelationMax,
      observed: maxAbsCorr,
      threshold: gates.absoluteInterAxisCorrelationMax,
      comparator: "<=",
    },
    {
      gateId: "unavailableRateMax",
      passed: report.unavailableRate <= gates.unavailableRateMax,
      observed: report.unavailableRate,
      threshold: gates.unavailableRateMax,
      comparator: "<=",
    },
  ];

  return { passed: results.every((r) => r.passed), results };
}
