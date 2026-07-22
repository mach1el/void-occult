import type { AnnualAxisDomain } from "../../../../contracts/annual-axes";

/**
 * V0.9 research audit contract. Purely additive read model over the existing
 * V0.8 engine trace (`V08DomainScoreTrace`) — computes nothing the engine
 * doesn't already produce, and never mutates or re-derives a production score.
 */
export interface AnnualAxisAuditDomainObservationV09 {
  status: "available" | "partial-data" | "unavailable";
  score: number | null;
  band: string | null;
  scoreState:
    | "scored"
    | "no-signal"
    | "balanced-signal"
    | "partial-data"
    | "unavailable";

  resolvedWeight: number;
  totalWeight: number;
  missingPalaces: string[];

  primaryPalace: string;
  cooperatingPalaces: string[];

  positivePoints: number;
  negativePoints: number;
  axisRawBeforeThaiTue: number;
  thaiTueApplied: boolean;
  thaiTueMultiplier: number;
  prominenceAdjustedRaw: number;

  palaceClampApplied: boolean;
  axisClampApplied: boolean;

  matchedRuleIds: string[];
  matchedStarNames: string[];
}

export interface AnnualAxesAuditObservationV09 {
  chartId: string;
  school: "nam-phai";
  annualYear: number;
  annualHeadPalaceIndex: number | null;
  domains: Record<AnnualAxisDomain, AnnualAxisAuditDomainObservationV09>;
}
