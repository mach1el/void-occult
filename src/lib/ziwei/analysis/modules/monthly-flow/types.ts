import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";

export interface MonthlyFlowAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type MonthlyFlowBand = "guarded" | "balanced" | "supportive" | "strong";

export type MonthlyFlowEvidenceCategory =
  | "monthly-focus-star"
  | "monthly-transformation"
  | "annual-star-context"
  | "annual-transformation-context"
  | "major-transformation-context"
  | "major-active-palace-context"
  | "structural-activation"
  | "interaction";

export type MonthlyFlowFrameRole = "focus" | "opposite" | "trine" | "outside";

/** Typed unavailable reasons for an axis, and typed year/month
 * diagnostic categories. No free-form strings when a code fits. */
export type MonthlyFlowReasonCode =
  | "invalid-knowledge"
  | "provider-school-mismatch"
  | "missing-month-context"
  | "missing-frame-nodes"
  | "missing-focus-palace"
  | "missing-calendar-stem-branch"
  | "missing-monthly-frame-nodes"
  | "incomplete-annual-domain-map"
  | "unsupported-school-capability"
  | "duplicate-month-key"
  | "invalid-month-number";

export interface MonthlyFlowEvidence {
  id: string;
  domain: AnnualAxisDomain;
  monthKey: string;
  category: MonthlyFlowEvidenceCategory;
  /** Layer-independent identity of the underlying physical fact
   * (star/mutagen/marker) — same across evidence-category variants when the
   * same physical fact is expressed differently. */
  physicalFactId: string;
  ruleId: string;
  targetPalaceIndex: number;
  targetNatalPalaceName: string;
  /** The target palace's own resolved annual label. Null when the palace
   * genuinely has no annual label (never backfilled from natal name). */
  targetAnnualPalaceName: string | null;
  monthlyFrameRole: MonthlyFlowFrameRole;
  annualDomainRole: MonthlyFlowFrameRole;
  /** Diminishing-return competition group within
   * `monthKey|domain|layer|stackingGroup`. */
  stackingGroup: string;
  rawAxes: MonthlyFlowAxes;
  effectiveWeight: number;
  weightedAxes: MonthlyFlowAxes;
  factIds: string[];
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

export type MonthlyFlowAxisResult =
  | {
      domain: AnnualAxisDomain;
      status: "available";
      score: number;
      band: MonthlyFlowBand;
      rawAxes: MonthlyFlowAxes;
      normalizedAxes: MonthlyFlowAxes;
      intensity: number;
      conflict: number;
      evidence: MonthlyFlowEvidence[];
      topSupportDrivers: MonthlyFlowEvidence[];
      topPressureDrivers: MonthlyFlowEvidence[];
    }
  | {
      domain: AnnualAxisDomain;
      status: "unavailable";
      score: null;
      band: null;
      evidence: [];
      reasonCodes: MonthlyFlowReasonCode[];
    };

export interface MonthlyFlowMonthCapabilities {
  supportsMonthlyFocus: boolean;
  supportsCalendarStemBranch: boolean;
  supportsMonthlyTransformations: boolean;
  supportsSixAxisOverlayFromCurrentChart: boolean;
  supportsLeapMonth: string;
}

/** Month-level diagnostics — honest fields only from the mission list. */
export interface MonthlyFlowMonthDiagnostics {
  missingFocusPalace: string[];
  missingCalendarStemBranch: string[];
  missingMonthlyFrameNodes: string[];
  ambiguousTransformationTargets: string[];
  unresolvedTransformationTargets: string[];
  unknownStars: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  disabledCalendarRelationHits: string[];
  missingSourceIds: string[];
}

/** Year-level diagnostics — honest fields only from the mission list. */
export interface MonthlyFlowYearDiagnostics {
  invalidKnowledge: string[];
  providerSchoolMismatch: string[];
  missingMonthlyEntries: string[];
  duplicateMonthKeys: string[];
  invalidMonthNumber: string[];
  missingFocusPalace: string[];
  missingCalendarStemBranch: string[];
  missingMonthlyFrameNodes: string[];
  incompleteAnnualDomainLabels: string[];
  duplicateAnnualDomainLabels: string[];
  unknownStars: string[];
  ambiguousTransformationTargets: string[];
  unresolvedTransformationTargets: string[];
  forbiddenPreviousScores: string[];
  forbiddenMovingStarInputs: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  disabledCalendarRelationHits: string[];
  missingSourceIds: string[];
  missingCalculationPolicyProfile: string[];
  unsupportedSchoolCapability: string[];
  leapMonthPolicyUnavailable: string[];
}

export interface MonthlyFlowMonthIdentity {
  annualYear: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  monthKey: string;
  focusPalaceIndex: number;
  calendarStem: string;
  calendarBranch: string;
}

export interface MonthResult {
  identity: MonthlyFlowMonthIdentity;
  status: "available" | "partial" | "unavailable";
  axes: Record<AnnualAxisDomain, MonthlyFlowAxisResult>;
  diagnostics: MonthlyFlowMonthDiagnostics;
}

export interface MonthlyFlowVersionProvenance {
  contractVersion: string;
  engineVersion: string;
  scoringKnowledgeVersion: string;
  capabilityProfileVersion: string;
  /** From Calculation Core when available; otherwise null. */
  calculationPolicyProfileVersion: string | null;
}

export interface MonthlyFlowResult {
  module: "monthly-flow";
  annualYear: number;
  school: ZiweiSchool;
  versions: MonthlyFlowVersionProvenance;
  status: "available" | "partial" | "unavailable";
  months: MonthResult[];
  capabilities: MonthlyFlowMonthCapabilities;
  diagnostics: MonthlyFlowYearDiagnostics;
}

/**
 * The minimum surface a Calculation Core provider must expose so the
 * scorer never depends on a concrete engine module. Both engines already
 * export `tuHoaTargets` and `stemBranchForLunarMonth`; the scorer only
 * accepts a provider whose `school` matches the caller's `school`.
 */
export interface MonthlyCalculationProvider {
  school: ZiweiSchool;
  tuHoaTargets(stem: string): Array<{ mutagen: string; starName: string }>;
  stemBranchForLunarMonth(
    yearStem: string,
    lunarMonth: number,
  ): { stem: string; branch: string };
}

export interface ResolvedMonthlyTransformation {
  mutagen: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  starName: string;
  canonicalStarName: string;
  targetPalaceIndex: number;
  targetNatalPalaceName: string;
}

export interface ResolvedMonthlyFlowContext {
  identity: MonthlyFlowMonthIdentity;
  /** Monthly Tứ Hóa resolved to exact target palaces. Empty when the
   * provider yielded no resolvable exact-target hits (never fabricated). */
  transformations: readonly ResolvedMonthlyTransformation[];
  /** True when at least one transformation from the provider table was
   * unresolvable/ambiguous and the month therefore lost some monthly-Tứ-Hóa
   * evidence. Numeric evidence is still limited to fully-resolved records. */
  transformationsPartial: boolean;
  /** Per-target diagnostics retained on the month when partial. */
  transformationDiagnostics: {
    ambiguous: readonly string[];
    unresolved: readonly string[];
  };
}

/**
 * Explicit leap-month input — calendar stem/branch must be supplied by the
 * caller. The scorer never derives leap calendar identity from the regular
 * month number via `stemBranchForLunarMonth`.
 */
export interface ExplicitLeapMonthContext {
  lunarMonth: number;
  focusPalaceIndex: number;
  calendarStem: string;
  calendarBranch: string;
}

export function emptyMonthlyFlowAxes(): MonthlyFlowAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function addMonthlyFlowAxes(
  a: MonthlyFlowAxes,
  b: MonthlyFlowAxes,
): MonthlyFlowAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function scaleMonthlyFlowAxes(
  axes: MonthlyFlowAxes,
  factor: number,
): MonthlyFlowAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function emptyMonthlyFlowMonthDiagnostics(): MonthlyFlowMonthDiagnostics {
  return {
    missingFocusPalace: [],
    missingCalendarStemBranch: [],
    missingMonthlyFrameNodes: [],
    ambiguousTransformationTargets: [],
    unresolvedTransformationTargets: [],
    unknownStars: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    disabledCalendarRelationHits: [],
    missingSourceIds: [],
  };
}

export function emptyMonthlyFlowYearDiagnostics(): MonthlyFlowYearDiagnostics {
  return {
    invalidKnowledge: [],
    providerSchoolMismatch: [],
    missingMonthlyEntries: [],
    duplicateMonthKeys: [],
    invalidMonthNumber: [],
    missingFocusPalace: [],
    missingCalendarStemBranch: [],
    missingMonthlyFrameNodes: [],
    incompleteAnnualDomainLabels: [],
    duplicateAnnualDomainLabels: [],
    unknownStars: [],
    ambiguousTransformationTargets: [],
    unresolvedTransformationTargets: [],
    forbiddenPreviousScores: [],
    forbiddenMovingStarInputs: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    disabledCalendarRelationHits: [],
    missingSourceIds: [],
    missingCalculationPolicyProfile: [],
    unsupportedSchoolCapability: [],
    leapMonthPolicyUnavailable: [],
  };
}
