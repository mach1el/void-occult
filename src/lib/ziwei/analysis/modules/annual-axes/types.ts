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
  };
}
