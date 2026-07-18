import type { ZiweiBrightness, ZiweiSchool } from "../../facts";
import type { StaticFrameRole } from "../../frame";

export interface PalaceEvidenceAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type PalaceEvidenceCategory =
  | "major-star"
  | "transformation"
  | "minor-star-family"
  | "void-environment"
  | "chang-sheng"
  | "structural-rule";

/**
 * Descriptive provenance for display grouping only. Aggregation and
 * normalization must never read this — it carries no numeric weight.
 */
export type PalaceEvidenceSourceKind =
  | "natal"
  | "borrowed-opposite"
  | "context"
  | "rule";

export interface PalaceEvidence {
  id: string;
  category: PalaceEvidenceCategory;
  factIds: string[];
  ruleId?: string;
  palaceRole: StaticFrameRole;
  palaceName: string;
  palaceBranch: string;
  axes: PalaceEvidenceAxes;
  label: string;
  explanationKey: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  /** VCD borrow marker — not double-counted as opposite major. */
  borrowedFromOpposite?: boolean;

  // --- Display-only metadata below. Descriptive, never read by
  // aggregation/normalization; safe to extend without touching scoring. ---
  starName?: string;
  starBrightness?: ZiweiBrightness;
  familyId?: string;
  familyLabel?: string;
  traitTags?: string[];
  diminishingGroup?: string;
  diminishingRank?: number;
  diminishingFactor?: number;
  sourceKind?: PalaceEvidenceSourceKind;
}

export type PalaceOverviewBand =
  | "low"
  | "guarded"
  | "balanced"
  | "supportive"
  | "strong";

export interface PalaceOverviewResult {
  module: "palace-overview";
  /** @deprecated use versions.contractVersion instead. */
  version: "1.0.0-experimental";
  /** V1.2 — separate contract/engine/knowledge version identifiers (§8). */
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
  };
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  score: number;
  band: PalaceOverviewBand;
  axes: {
    support: number;
    pressure: number;
    stability: number;
    activation: number;
  };
  rawAxes: PalaceEvidenceAxes;
  intensity: number;
  evidenceCompleteness: number;
  majorStars: Array<{
    name: string;
    brightness: ZiweiBrightness;
    role: StaticFrameRole;
  }>;
  /** Known static stars with scoringMode "context-only" — informational only, never scored. */
  contextOnlyStars: Array<{ name: string; role: StaticFrameRole }>;
  isVoidMajor: boolean;
  topSupportDrivers: PalaceEvidence[];
  topPressureDrivers: PalaceEvidence[];
  allEvidence: PalaceEvidence[];
  profileId: string;
  school: ZiweiSchool;

  /** V1.2 semantic annotations — never scoring, never in allEvidence. */
  annotations: PalaceAnnotation[];
  isMenh: boolean;
  isThan: boolean;
}

export interface PalaceOverviewDiagnostics {
  unknownStars: string[];
  duplicateFacts: string[];
  unmappedTransformations: string[];
  missingBrightness: string[];
  /** factIds of static stars resolved to a context-only catalog record. */
  contextOnlyFacts: string[];
  ruleHits: Array<{
    palaceName: string;
    ruleId: string;
    factIds: string[];
  }>;
}

/* ────────────────────────────────────────────────────────────────────────
 * V1.2 Semantic Completion — annotation-only. Never read by aggregation,
 * normalization, driver ranking, or diminishing-return grouping. Must never
 * appear in PalaceEvidence/allEvidence.
 * ──────────────────────────────────────────────────────────────────────── */

export type PalaceAnnotationCategory =
  | "menh-than"
  | "minor-pair"
  | "transformation-target"
  | "domain-projection";

export interface PalaceAnnotationMetadata {
  scope?: "same-palace" | "opposite-link" | "trine-link" | "tp4c";
  transformation?: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  targetStar?: string;
  targetTraits?: string[];
  trait?: string;
  palaceDomainId?: string;

  /**
   * Domain-projection provenance only.
   * These fields are descriptive and must never affect scoring.
   */
  contributorStarNames?: string[];
  contributorEvidenceIds?: string[];
  contributorCount?: number;
}

export interface PalaceAnnotation {
  id: string;
  category: PalaceAnnotationCategory;

  label: string;
  explanationKey: string;
  tags: string[];

  factIds: string[];
  palaceIndexes: number[];
  palaceRoles: StaticFrameRole[];

  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";

  metadata?: PalaceAnnotationMetadata;
}

export interface PalaceOverviewSemanticDiagnostics {
  menhIndexMismatch: boolean;
  thanIndexMismatch: boolean;
  unresolvedPairParticipants: string[];
  unmappedTargetTraits: string[];
  unknownProjectionTraits: string[];
  missingSemanticSources: string[];
}

export function emptySemanticDiagnostics(): PalaceOverviewSemanticDiagnostics {
  return {
    menhIndexMismatch: false,
    thanIndexMismatch: false,
    unresolvedPairParticipants: [],
    unmappedTargetTraits: [],
    unknownProjectionTraits: [],
    missingSemanticSources: [],
  };
}

export function emptyAxes(): PalaceEvidenceAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function scaleAxes(
  axes: PalaceEvidenceAxes,
  factor: number,
): PalaceEvidenceAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function addAxes(
  a: PalaceEvidenceAxes,
  b: PalaceEvidenceAxes,
): PalaceEvidenceAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function absEffect(axes: PalaceEvidenceAxes): number {
  return (
    Math.abs(axes.support) +
    Math.abs(axes.pressure) +
    Math.abs(axes.stability) +
    Math.abs(axes.activation)
  );
}
