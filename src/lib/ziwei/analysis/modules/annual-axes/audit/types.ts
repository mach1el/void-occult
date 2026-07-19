import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { ZiweiSchool } from "../../../facts";

/** One chart × one annual year scored by a named profile. */
export interface AnnualAxesAuditObservation {
  chartId: string;
  school: ZiweiSchool;
  annualYear: number;
  annualHeadPalaceIndex: number | null;
  status: "available" | "partial" | "unavailable";
  scores: Record<AnnualAxisDomain, number | null>;
  /** V0.4.1 §12 — Nam Phái evidence-collection counters per domain, when
   * available (`analyzeAnnualAxesNamPhaiV04` only; undefined for Trung
   * Châu observations). */
  collectStats?: Partial<Record<AnnualAxisDomain, { numericFacts: number; contextOnlyFacts: number }>>;
}

export interface DomainScoreSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  p10: number;
  p90: number;
  standardDeviation: number;
}

/**
 * Machine-readable distribution report matching the V0.4 corrective prompt
 * §1 contract. Engineering validity metrics only — not doctrinal claims.
 */
export interface AnnualAxesDistributionReport {
  profileId: string;
  school: ZiweiSchool;
  chartCount: number;
  yearsPerChart: number;
  resultCount: number;

  scoreSummaryByDomain: Record<AnnualAxisDomain, DomainScoreSummary>;

  allSixAbove50Rate: number;
  allSixAbove60Rate: number;
  exactDuplicateVectorRate: number;

  intraYearAxisSpread: {
    meanStandardDeviation: number;
    medianRange: number;
    p10Range: number;
  };

  longitudinalChange: {
    medianPerDomainTwelveYearRange: Record<AnnualAxisDomain, number>;
    medianAdjacentYearAbsoluteDelta: Record<AnnualAxisDomain, number>;
    annualHeadMoveSensitivityRate: number;
  };

  interAxisCorrelation: Record<string, number>;

  crossChartSimilarity: {
    medianNearestNeighborDistance: number;
    nearDuplicateVectorRate: number;
  };

  unavailableRate: number;
  partialRate: number;

  /** V0.4.1 §12 — evidence-collection coverage, when the underlying
   * observations carried `collectStats` (Nam Phái only). Undefined for
   * Trung Châu reports. */
  affinityCoverage?: {
    meanNumericEvidenceCountPerDomainYear: number;
    medianContextOnlyCountPerDomainYear: number;
  };
}

export interface AuditCorpusContract {
  contractId: string;
  seed: number;
  chartCount: number;
  yearsPerChart: number;
  baseAnnualYear: number;
  timezone: string;
  flowBase: string;
  notes: string[];
}

export type AnnualAxesAuditProfileId =
  | "annual-axes-v0.2-baseline"
  | "annual-axes-current"
  | "annual-axes-v0.4";
