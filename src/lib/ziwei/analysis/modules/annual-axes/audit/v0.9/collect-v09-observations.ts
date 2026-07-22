import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../../analyze";
import type { AnnualAxisNamPhaiV08Result, AnnualAxisScoreTraceV08 } from "../../types";
import type {
  AnnualAxesAuditObservationV09,
  AnnualAxisAuditDomainObservationV09,
} from "./types";

const EPSILON = 1e-9;

function sumPalacePoints(
  trace: AnnualAxisScoreTraceV08,
  field: "positivePoints" | "negativePoints",
): number {
  return (
    trace.primary[field] +
    trace.cooperating.reduce((sum, palace) => sum + palace[field], 0)
  );
}

/** Detects whether `clampPalaceRaw` actually clipped any resolved palace's
 * raw (positive − negative) sum to the configured [min, max] band. */
function detectPalaceClamp(trace: AnnualAxisScoreTraceV08): boolean {
  const palaces = [trace.primary, ...trace.cooperating].filter(
    (p) => p.palaceIndex != null,
  );
  return palaces.some((p) => {
    const unclamped = p.positivePoints - p.negativePoints;
    return Math.abs(unclamped - p.palaceRaw) > EPSILON;
  });
}

/** Detects whether the axis-level clamp (`clamp(axisRaw × multiplier, min,
 * max)`) actually clipped the prominence-adjusted raw value. */
function detectAxisClamp(trace: AnnualAxisScoreTraceV08): boolean {
  const unclamped = trace.axisRawBeforeThaiTue * trace.thaiTueMultiplier;
  return Math.abs(unclamped - trace.prominenceAdjustedRaw) > EPSILON;
}

/** Reduces one already-computed per-domain V0.8 engine result into the V0.9
 * audit observation shape. Exported so the fuller corpus collector
 * (`corpus-collection.ts`) can reuse it without recomputing the engine. */
export function toDomainObservationV09(
  result: AnnualAxisNamPhaiV08Result,
): AnnualAxisAuditDomainObservationV09 {
  const trace = result.scoreTrace;

  if (!trace) {
    // Invalid-knowledge path: no trace was ever built.
    return {
      status: "unavailable",
      score: null,
      band: null,
      scoreState: "unavailable",
      resolvedWeight: 0,
      totalWeight: 0,
      missingPalaces: [],
      primaryPalace: "unknown",
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
    };
  }

  const coverage = result.coverage ??
    trace.coverage ?? { resolvedWeight: 0, totalWeight: 0, missingPalaces: [] };
  const matchedRuleIds = [...new Set((result.v08Evidence ?? []).map((e) => e.ruleId))].sort(
    (a, b) => a.localeCompare(b),
  );
  const matchedStarNames = [
    ...new Set((result.v08Evidence ?? []).map((e) => e.starName)),
  ].sort((a, b) => a.localeCompare(b));

  return {
    status: result.status === "unavailable" ? "unavailable" : result.status,
    score: result.score,
    band: result.band,
    scoreState: trace.scoreState,
    resolvedWeight: coverage.resolvedWeight,
    totalWeight: coverage.totalWeight,
    missingPalaces: coverage.missingPalaces,
    primaryPalace: trace.primary.palaceName,
    cooperatingPalaces: trace.cooperating.map((p) => p.palaceName),
    positivePoints: sumPalacePoints(trace, "positivePoints"),
    negativePoints: sumPalacePoints(trace, "negativePoints"),
    axisRawBeforeThaiTue: trace.axisRawBeforeThaiTue,
    thaiTueApplied: trace.isThaiTueHighlighted,
    thaiTueMultiplier: trace.thaiTueMultiplier,
    prominenceAdjustedRaw: trace.prominenceAdjustedRaw,
    palaceClampApplied: detectPalaceClamp(trace),
    axisClampApplied: detectAxisClamp(trace),
    matchedRuleIds,
    matchedStarNames,
  };
}

/**
 * Reduces one already-computed Nam Phái V0.8 chart result into the richer
 * V0.9 audit observation shape. Read-only: calls the same
 * `analyzeAnnualAxes` entry point the app uses, does not alter engine
 * behavior, scores, or routing.
 */
export function collectV09Observation(
  chartId: string,
  chart: ChartData,
): AnnualAxesAuditObservationV09 {
  const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
  const domains = {} as Record<AnnualAxisDomain, AnnualAxisAuditDomainObservationV09>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    domains[domain] = toDomainObservationV09(result.axes[domain] as AnnualAxisNamPhaiV08Result);
  }
  return {
    chartId,
    school: "nam-phai",
    annualYear: chart.annualYear,
    annualHeadPalaceIndex:
      chart.annualHeadPalace?.index ??
      chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
      null,
    domains,
  };
}
