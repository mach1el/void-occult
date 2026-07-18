import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";

export interface AnnualAxisRawAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type AnnualAxisBand = "guarded" | "balanced" | "supportive" | "strong";

export type AnnualAxisEvidenceLayer = "annual" | "major-fortune" | "natal-activated";

export type AnnualAxisEvidenceCategory =
  | "star"
  | "mutagen"
  | "focal-marker"
  | "annual-focus"
  | "interaction";

export type AnnualAxisFrameRole = "focus" | "opposite" | "trine";

export interface AnnualAxisEvidence {
  id: string;
  domain: AnnualAxisDomain;
  layer: AnnualAxisEvidenceLayer;
  category: AnnualAxisEvidenceCategory;
  /** Layer-independent identity of the underlying physical fact (star/mutagen/marker). */
  physicalFactId: string;
  ruleId: string;
  targetPalaceIndex: number;
  targetPalaceName: string;
  /** The target palace's own resolved annual label — distinct from
   * `anchorPalaceName` (the anchor's label), since opposite/trine nodes
   * carry a different annual label than their anchor. Null only if the
   * physical palace genuinely has no annual label. */
  targetAnnualPalaceName: string | null;
  frameRole: AnnualAxisFrameRole;
  /** Annual label of the anchor palace whose frame collected this evidence. */
  anchorPalaceName: string;
  /** Diminishing-return competition group within the same domain+layer
   * (e.g. a minor-star family id, "major-star", "annual-mutagen",
   * "focal-marker"). Set at collection time since only the collector knows
   * the underlying knowledge grouping. */
  stackingGroup: string;
  rawAxes: AnnualAxisRawAxes;
  effectiveWeight: number;
  weightedAxes: AnnualAxisRawAxes;
  factIds: string[];
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

export type AnnualAxisResult =
  | {
      domain: AnnualAxisDomain;
      status: "available";
      score: number;
      band: AnnualAxisBand;
      rawAxes: AnnualAxisRawAxes;
      normalizedAxes: AnnualAxisRawAxes;
      intensity: number;
      conflict: number;
      evidence: AnnualAxisEvidence[];
      topSupportDrivers: AnnualAxisEvidence[];
      topPressureDrivers: AnnualAxisEvidence[];
    }
  | {
      domain: AnnualAxisDomain;
      status: "unavailable";
      score: null;
      band: null;
      evidence: [];
      reasonCodes: string[];
    };

export interface AnnualAxesDiagnostics {
  invalidKnowledge: string[];
  missingAnnualPalaceNames: string[];
  unresolvedAnnualTargets: string[];
  unknownStars: string[];
  unknownMutagens: string[];
  forbiddenSchoolMarkers: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  missingSourceIds: string[];
  missingRequiredAnnualFacts: string[];
  /** V0.2 — chart palace list not exactly 12, or labels are missing for
   * the school's required coordinate (e.g. Trung Châu chart without
   * annual labels). */
  incompleteChartPalaces: string[];
  /** V0.2 — Nam Phái specific: two natal palaces share the same
   * `palace.name` (should never happen on a well-formed chart). */
  duplicateNatalPalaceNames: string[];
  /** V0.2 — a domain anchor label from axis definitions did not match
   * any palace via the school's resolver. */
  missingDomainAnchor: string[];
  /** V0.2 — multiple palaces matched the same anchor label. */
  ambiguousDomainAnchor: string[];
  /** V0.2 — Nam Phái: `chart.smallLimitPalace` is missing. */
  missingSmallLimitPalace: string[];
  /** V0.2 — annual focus palace could not be resolved (Nam Phái or Trung
   * Châu). */
  invalidAnnualFocusPalace: string[];
  /** V0.2 — annual focus frame could not build any TP4C nodes. */
  missingAnnualFocusFrameNodes: string[];
  /** V0.2 — school policy missing/invalid for the requested school. */
  unsupportedSchoolPolicy: string[];
}

/** V0.2 — per-domain and module-level capabilities exposed to the UI.
 * `supportsAnnualFocus` reflects whether an activation-overlay frame was
 * actually built for this chart (i.e. the school's required focus palace
 * resolved). `supportsDomainScoring` mirrors the module-level status —
 * true iff at least one domain is available. */
export interface AnnualAxesCapabilities {
  supportsDomainScoring: boolean;
  supportsAnnualFocus: boolean;
  domainAnchorCoordinate: "natal-palace-name" | "annual-palace-name";
  domainAnchorProvenance: string;
  primaryAnnualFocus: "small-limit" | "annual-menh";
}

/** V0.2 — public summary of the annual-focus overlay. Never mutated by
 * downstream code; the UI reads it verbatim to render the focus header. */
export interface AnnualFocusSummary {
  mode: "small-limit" | "annual-menh";
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  annualPalaceName: string | null;
  frameBranches: string[];
}

export interface AnnualAxesResult {
  module: "annual-axes";
  annualYear: number;
  school: ZiweiSchool;
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
  };
  status: "available" | "partial" | "unavailable";
  axes: Record<AnnualAxisDomain, AnnualAxisResult>;
  diagnostics: AnnualAxesDiagnostics;
  capabilities: AnnualAxesCapabilities;
  annualFocus: AnnualFocusSummary | null;
}

export function emptyAnnualAxes(): AnnualAxisRawAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function addAnnualAxes(
  a: AnnualAxisRawAxes,
  b: AnnualAxisRawAxes,
): AnnualAxisRawAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function scaleAnnualAxes(
  axes: AnnualAxisRawAxes,
  factor: number,
): AnnualAxisRawAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function absAnnualEffect(axes: AnnualAxisRawAxes): number {
  return (
    Math.abs(axes.support) +
    Math.abs(axes.pressure) +
    Math.abs(axes.stability) +
    Math.abs(axes.activation)
  );
}

export function emptyAnnualAxesDiagnostics(): AnnualAxesDiagnostics {
  return {
    invalidKnowledge: [],
    missingAnnualPalaceNames: [],
    unresolvedAnnualTargets: [],
    unknownStars: [],
    unknownMutagens: [],
    forbiddenSchoolMarkers: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    missingSourceIds: [],
    missingRequiredAnnualFacts: [],
    incompleteChartPalaces: [],
    duplicateNatalPalaceNames: [],
    missingDomainAnchor: [],
    ambiguousDomainAnchor: [],
    missingSmallLimitPalace: [],
    invalidAnnualFocusPalace: [],
    missingAnnualFocusFrameNodes: [],
    unsupportedSchoolPolicy: [],
  };
}
