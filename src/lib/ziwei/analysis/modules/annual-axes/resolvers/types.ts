import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../../knowledge/annual-axes";

/**
 * One physical palace resolved as a domain anchor for one axis definition.
 * `annualPalaceName` is the *label* from the axis definitions catalog —
 * for Nam Phái this equals `palace.name` (natal palace name); for Trung
 * Châu it equals `palace.annualPalaceName` (annual "trùng bài" label).
 * `provenance` records which resolver produced this anchor so downstream
 * evidence can carry a truthful audit trail.
 */
export interface ResolvedDomainAnchor {
  annualPalaceName: string;
  palaceIndex: number;
  weight: number;
  provenance: string;
}

/** Domain resolver diagnostics — hoisted verbatim into
 * `AnnualAxesDiagnostics` by the analyzer. Keys mirror the mission spec. */
export interface ResolvedAnnualDomainAnchorsDiagnostics {
  incompleteChartPalaces: string[];
  duplicateNatalPalaceNames: string[];
  missingDomainAnchor: string[];
  ambiguousDomainAnchor: string[];
}

/** The full resolver output — one entry per domain that at least one
 * anchor resolved for. Domains with zero resolved anchors are omitted
 * (the analyzer treats missing domains as unavailable via the missing
 * diagnostic list). */
export interface ResolvedAnnualDomainAnchors {
  coordinate: "natal-palace-name" | "annual-palace-name";
  provenance: string;
  anchorsByDomain: Map<AnnualAxisDomain, ResolvedDomainAnchor[]>;
  diagnostics: ResolvedAnnualDomainAnchorsDiagnostics;
}

/** School-specific domain anchor resolver interface. Both resolvers are
 * pure functions over `chart` + axis definitions; they never mutate
 * either. */
export interface AnnualAxisDomainResolver {
  readonly coordinate: "natal-palace-name" | "annual-palace-name";
  readonly provenance: string;
  resolve(
    chart: ChartData,
    axisDefinitions: AnnualAxisDefinitionsCatalog,
  ): ResolvedAnnualDomainAnchors;
}

/** Annual focus overlay resolved from the chart — Nam Phái uses
 * `chart.smallLimitPalace`; Trung Châu uses the annual `Mệnh` palace. */
export interface ResolvedAnnualFocus {
  mode: "small-limit" | "annual-menh";
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  annualPalaceName: string | null;
}

/** Focus resolution failure detail. Only ever surfaced to the analyzer
 * (never to callers directly); the analyzer folds the flags into the main
 * diagnostics object. */
export interface AnnualFocusResolutionIssues {
  missingSmallLimitPalace: boolean;
  invalidAnnualFocusPalace: boolean;
}

export function emptyDomainResolverDiagnostics(): ResolvedAnnualDomainAnchorsDiagnostics {
  return {
    incompleteChartPalaces: [],
    duplicateNatalPalaceNames: [],
    missingDomainAnchor: [],
    ambiguousDomainAnchor: [],
  };
}
