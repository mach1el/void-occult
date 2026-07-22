import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import type { AnnualAxesFullMetricsV09 } from "./metrics";

export type GateOperator = "minimum" | "maximum";
export type GateScope = "global" | AnnualAxisDomain;
export type GateStatus = "passed" | "failed" | "not-computable" | "not-configured";

export interface AnnualAxesGateEvaluation {
  metricId: string;
  scope: GateScope;
  actual: number;
  threshold: number;
  operator: GateOperator;
  passed: boolean;
  status: GateStatus;
  explanation: string;
}

export interface AnnualAxesGateEvaluationResult {
  catalogId: string;
  evaluations: AnnualAxesGateEvaluation[];
  unknownConfiguredGateKeys: string[];
  allConfiguredGatesEvaluated: boolean;
  anyFailed: boolean;
}

export interface GateCatalogV08 {
  schemaVersion: string;
  catalogId: string;
  hardGates: Record<string, number>;
  sourceIds: string[];
}

/** Every hard-gate key the V0.8 catalog is allowed to configure, mapped to
 * the metric it reads and whether it is evaluated once globally or once per
 * domain (per-domain aggregate gates in Part C). This registry is the single
 * point of truth for "unknown configured metric fails validation." */
const GLOBAL_GATE_METRIC_MAP: Record<
  string,
  { metricId: keyof AnnualAxesFullMetricsV09; operator: GateOperator }
> = {
  meanIntraYearAxisStandardDeviationMin: {
    metricId: "meanIntraYearAxisStandardDeviation",
    operator: "minimum",
  },
  medianIntraYearAxisRangeMin: { metricId: "medianIntraYearAxisRange", operator: "minimum" },
  p25IntraYearRangeMin: { metricId: "p25IntraYearRange", operator: "minimum" },
  p10IntraYearRangeMin: { metricId: "p10IntraYearRange", operator: "minimum" },
  exactDuplicateVectorRateMax: { metricId: "exactDuplicateVectorRate", operator: "maximum" },
  nearDuplicateVectorRateMax: { metricId: "nearDuplicateVectorRate", operator: "maximum" },
  unavailableRateMax: { metricId: "unavailableRate", operator: "maximum" },
  absoluteInterAxisCorrelationMax: {
    metricId: "maximumAbsoluteInterAxisCorrelation",
    operator: "maximum",
  },
  boundaryScoreRateMax: { metricId: "boundaryScoreRate", operator: "maximum" },
  atLeastTwoOutside42To58RateMin: { metricId: "atLeastTwoOutside42To58Rate", operator: "minimum" },
  atLeastOneAtOrBelow40RateMin: { metricId: "atLeastOneAtOrBelow40Rate", operator: "minimum" },
  atLeastOneAtOrAbove60RateMin: { metricId: "atLeastOneAtOrAbove60Rate", operator: "minimum" },
  oneLowAndOneHighRateMin: { metricId: "oneLowAndOneHighRate", operator: "minimum" },
  allSixAbove50RateMax: { metricId: "allSixAbove50Rate", operator: "maximum" },
  fiveOrMoreAbove50RateMax: { metricId: "fiveOrMoreAbove50Rate", operator: "maximum" },
  allSixInside45To65RateMax: { metricId: "allSixInside45To65Rate", operator: "maximum" },
};

/** Per-domain aggregate gates: evaluated once per domain against the same
 * threshold, reading `metrics.perDomain[domain][metricId]`. */
const PER_DOMAIN_GATE_METRIC_MAP: Record<
  string,
  { metricId: keyof AnnualAxesFullMetricsV09["perDomain"][AnnualAxisDomain]; operator: GateOperator }
> = {
  medianPerDomainTwelveYearRangeMin: {
    metricId: "medianPerDomainTwelveYearRange",
    operator: "minimum",
  },
  medianAdjacentYearAbsoluteDeltaMin: {
    metricId: "medianAdjacentYearAbsoluteDelta",
    operator: "minimum",
  },
};

function isValidNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function evaluate(
  metricId: string,
  scope: GateScope,
  actual: unknown,
  threshold: number,
  operator: GateOperator,
): AnnualAxesGateEvaluation {
  if (!isValidNumber(actual)) {
    return {
      metricId,
      scope,
      actual: Number.NaN,
      threshold,
      operator,
      passed: false,
      status: "not-computable",
      explanation: `Metric "${metricId}" (scope ${scope}) produced a non-finite value; gate cannot be evaluated.`,
    };
  }
  const passed = operator === "minimum" ? actual >= threshold : actual <= threshold;
  return {
    metricId,
    scope,
    actual,
    threshold,
    operator,
    passed,
    status: passed ? "passed" : "failed",
    explanation: passed
      ? `${metricId} (${scope}) = ${actual} satisfies ${operator} threshold ${threshold}.`
      : `${metricId} (${scope}) = ${actual} violates ${operator} threshold ${threshold}.`,
  };
}

/**
 * Deterministic evaluator over the *existing* V0.8 gate catalog
 * (`annual-distribution-gates.v0.8.json`, read-only). Every configured gate
 * key produces exactly one evaluation (or, for the two per-domain aggregate
 * gates, one evaluation per domain). Any gate key this evaluator does not
 * recognize is reported separately as unknown rather than silently dropped.
 */
export function evaluateGatesV09(
  catalog: GateCatalogV08,
  metrics: AnnualAxesFullMetricsV09,
): AnnualAxesGateEvaluationResult {
  const evaluations: AnnualAxesGateEvaluation[] = [];
  const unknownConfiguredGateKeys: string[] = [];

  for (const [key, threshold] of Object.entries(catalog.hardGates)) {
    const globalMapping = GLOBAL_GATE_METRIC_MAP[key];
    const perDomainMapping = PER_DOMAIN_GATE_METRIC_MAP[key];

    if (globalMapping) {
      evaluations.push(
        evaluate(globalMapping.metricId, "global", metrics[globalMapping.metricId], threshold, globalMapping.operator),
      );
      continue;
    }

    if (perDomainMapping) {
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const actual = metrics.perDomain[domain][perDomainMapping.metricId];
        evaluations.push(evaluate(perDomainMapping.metricId, domain, actual, threshold, perDomainMapping.operator));
      }
      continue;
    }

    unknownConfiguredGateKeys.push(key);
    evaluations.push({
      metricId: key,
      scope: "global",
      actual: Number.NaN,
      threshold,
      operator: "minimum",
      passed: false,
      status: "not-computable",
      explanation: `Gate key "${key}" is configured in ${catalog.catalogId} but has no evaluator mapping. Unknown configured metrics fail validation rather than being silently ignored.`,
    });
  }

  const expectedEvaluationCount =
    Object.keys(catalog.hardGates).filter((k) => GLOBAL_GATE_METRIC_MAP[k]).length +
    Object.keys(catalog.hardGates).filter((k) => PER_DOMAIN_GATE_METRIC_MAP[k]).length *
      ANNUAL_AXIS_DOMAINS.length +
    unknownConfiguredGateKeys.length;

  return {
    catalogId: catalog.catalogId,
    evaluations,
    unknownConfiguredGateKeys,
    allConfiguredGatesEvaluated: evaluations.length === expectedEvaluationCount,
    anyFailed: evaluations.some((e) => e.status !== "passed"),
  };
}
