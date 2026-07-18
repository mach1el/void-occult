/** Shared knowledge record metadata for Zi Wei analysis modules. */

export type KnowledgeStatus =
  | "draft"
  | "experimental"
  | "approved"
  | "deprecated";

export type SchoolProfileId = "nam-phai-v1" | "trung-chau-v1";

export interface KnowledgeRecordMeta {
  id: string;
  version: string;
  status: KnowledgeStatus;
  schoolProfiles: SchoolProfileId[];
  sourceIds: string[];
  confidence: number;
  effectiveFrom: string;
  notes?: string;
}

export interface AxisSeed {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export interface BrightnessModifier {
  supportFactor: number;
  pressureFactor: number;
  stabilityDelta: number;
  activationFactor: number;
}

export interface PalaceOverviewProfile extends KnowledgeRecordMeta {
  geometry: {
    focus: number;
    opposite: number;
    trine: number;
  };
  familyDiminishingReturns: number[];
  familyMaxContributors: number;
  qualityNormalization: {
    method: "logistic";
    scale: number;
    midpoint: number;
  };
  axisNormalization: {
    supportScale: number;
    pressureScale: number;
    activationScale: number;
    stabilityScale: number;
  };
  intensityNormalization: {
    scale: number;
  };
  featureFlag: string;
  voidMajorBorrowFactor: number;
}

export interface MajorStarRecord {
  name: string;
  axes: AxisSeed;
  traits: string[];
}

export interface MajorStarsCatalog extends KnowledgeRecordMeta {
  brightnessModifiers: Record<string, BrightnessModifier>;
  stars: MajorStarRecord[];
}

export interface TransformationRecord {
  transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  axes: AxisSeed;
}

export interface TransformationsCatalog extends KnowledgeRecordMeta {
  transformations: TransformationRecord[];
}

export interface MinorFamilyRecord {
  id: string;
  label: string;
  axes: AxisSeed;
  diminishingGroup: string;
  notes?: string;
}

export interface MinorStarFamiliesCatalog extends KnowledgeRecordMeta {
  families: MinorFamilyRecord[];
}

export type MinorStarScoringMode = "direct" | "context-only";

export type MinorBrightnessPolicy =
  | "none"
  | "hoa-linh"
  | "literary-if-present";

export interface MinorStarRecord {
  id: string;
  version: string;
  status: KnowledgeStatus;

  name: string;
  canonicalName: string;
  familyId: string;
  scoringMode: MinorStarScoringMode;

  schoolProfiles: SchoolProfileId[];
  sourceIds: string[];
  confidence: number;
  effectiveFrom: string;

  brightnessPolicy: MinorBrightnessPolicy;
  traitTags: string[];
  explanationKey: string;

  axesOverride?: AxisSeed;
  notes?: string;
}

export interface MinorStarsCatalog extends KnowledgeRecordMeta {
  stars: MinorStarRecord[];
}

export interface StarAliasRecord {
  alias: string;
  canonical: string;
}

export interface StarAliasesCatalog extends KnowledgeRecordMeta {
  aliases: StarAliasRecord[];
}

export interface MinorStateModifierPolicy {
  supportFactor: number;
  pressureFactor: number;
  stabilityDelta: number;
  activationFactor: number;
}

export interface MinorStateModifiersCatalog extends KnowledgeRecordMeta {
  policies: {
    none: { description: string };
    "hoa-linh": Record<string, MinorStateModifierPolicy>;
    "literary-if-present": Record<string, MinorStateModifierPolicy>;
  };
}

export interface SchoolStarCoverageCatalog extends KnowledgeRecordMeta {
  staticMinorStars: {
    shared: string[];
    trungChauOnly: string[];
    namPhaiOnly: string[];
  };
  excludedFromStaticScoring: {
    transformMarkers: string[];
    voidMarkers: string[];
    annualExamples: string[];
    changShengSeparate: string[];
  };
  specialCases: Array<{ name: string; policy: string; reason: string }>;
}

export interface VoidEnvironmentCatalog extends KnowledgeRecordMeta {
  voidMajorBorrowFactor: number;
  voidContext: AxisSeed;
  doubleVoidContext: AxisSeed;
  singleVoid: {
    localMajorMagnitudeFactor: number;
    localTransformationMagnitudeFactor: number;
    localMinorMagnitudeFactor: number;
    activationFactor: number;
    stabilityDelta: number;
  };
  doubleVoid: {
    localMajorMagnitudeFactor: number;
    localTransformationMagnitudeFactor: number;
    localMinorMagnitudeFactor: number;
    activationFactor: number;
    stabilityDelta: number;
  };
}

export interface ChangShengRecord {
  stage: string;
  axes: AxisSeed;
}

export interface ChangShengCatalog extends KnowledgeRecordMeta {
  stages: ChangShengRecord[];
}

export interface StructuralRuleRecord {
  id: string;
  label: string;
  participants: string[];
  baseAxes: AxisSeed;
  conditions: Record<string, unknown>;
}

export interface StructuralRulesCatalog extends KnowledgeRecordMeta {
  rules: StructuralRuleRecord[];
}

export interface SourceRecord extends KnowledgeRecordMeta {
  title: string;
  kind: "heuristic-seed" | "calculation-core" | "spec";
}

export interface SourcesCatalog {
  sources: SourceRecord[];
}

export interface PalaceOverviewKnowledgeV1 {
  profile: PalaceOverviewProfile;
  majorStars: MajorStarsCatalog;
  transformations: TransformationsCatalog;
  minorFamilies: MinorStarFamiliesCatalog;
  minorStars: MinorStarsCatalog;
  minorStateModifiers: MinorStateModifiersCatalog;
  starAliases: StarAliasesCatalog;
  schoolCoverage: SchoolStarCoverageCatalog;
  voidEnvironment: VoidEnvironmentCatalog;
  changSheng: ChangShengCatalog;
  structuralRules: StructuralRulesCatalog;
  sources: SourcesCatalog;
}
