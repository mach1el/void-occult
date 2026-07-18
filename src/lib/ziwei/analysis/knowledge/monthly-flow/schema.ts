/** Shared knowledge record types for Monthly Flow Scoring V0.1. */

import type { AnnualAxisDomain } from "../../contracts/annual-axes";

export interface MonthlyFlowAxisWeights {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export interface MonthlyFlowDomainDefinition {
  domain: AnnualAxisDomain;
  labelVi: string;
}

export interface MonthlyFlowDomainDefinitionsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  domainSource: {
    catalogId: string;
    path: string;
    reuse: readonly string[];
    forbiddenReuse: readonly string[];
  };
  domains: readonly MonthlyFlowDomainDefinition[];
  annualDomainFrame: {
    focusOffset: number;
    oppositeOffset: number;
    trineOffsets: readonly number[];
    modulo: number;
  };
  monthlyActivationFrame: {
    focusOffset: number;
    oppositeOffset: number;
    trineOffsets: readonly number[];
    modulo: number;
  };
  intersectionPolicy: {
    mode: string;
    starEvidenceRequiresIntersection: boolean;
    monthlyTransformationRequiresDomainFrame: boolean;
    monthlyTransformationRequiresFocusIntersection: boolean;
    contextTransformationRequiresFocusIntersection: boolean;
    geometryWeightCombiner: string;
    expression: string;
  };
  availability: {
    requiresCompleteAnnualDomainMap: boolean;
    missingMapBehavior: string;
    natalPalaceNameFallbackAllowed: boolean;
  };
}

export interface MonthlyFlowScoringBand {
  minInclusive: number;
  maxExclusive?: number;
  maxInclusive?: number;
  id: string;
  labelVi: string;
}

export interface MonthlyFlowScoringProfile {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  axes: readonly string[];
  output: {
    scoreMin: number;
    scoreMax: number;
    scorePrecision: number;
    bands: readonly MonthlyFlowScoringBand[];
  };
  frameRoleWeights: {
    annualDomain: { focus: number; opposite: number; trine: number };
    monthlyActivation: { focus: number; opposite: number; trine: number };
  };
  evidenceLayerWeights: {
    "monthly-focus-star": number;
    "monthly-transformation": number;
    "annual-star-context": number;
    "annual-transformation-context": number;
    "major-transformation-context": number;
    "major-active-palace-context": number;
    "structural-activation": number;
    interaction: number;
  };
  confidenceWeights: {
    approved: number;
    experimental: number;
  };
  diminishingReturns: {
    formula: string;
    rankBase: number;
    expression: string;
  };
  normalization: {
    supportScale: number;
    pressureScale: number;
    stabilityScale: number;
    activationScale: number;
    stabilityCoefficient: number;
    activationGateFloor: number;
    activationGateRange: number;
    scoreAmplitude: number;
    scoreDivisor: number;
    neutralScore: number;
  };
  formulaSpec: Record<string, string>;
  dedup: {
    identityFields: readonly string[];
    duplicateAcrossAnchorsBehavior: string;
    sameNatalStarAcrossTemporalContextsBehavior: string;
    transformationsAreDistinctPhysicalFacts: boolean;
    semanticAnnotationsAreNumeric: boolean;
  };
}

export interface MonthlyFlowFocusMarkerRecord {
  markerId: string;
  frameRole: "focus" | "opposite" | "trine";
  axes: MonthlyFlowAxisWeights;
  ruleId: string;
}

export interface MonthlyFlowFocusMarkersCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  polarityRule: string;
  records: readonly MonthlyFlowFocusMarkerRecord[];
  constraints: {
    oneFocusMarkerPerMonth: boolean;
    twoTrineMarkersPerMonth: boolean;
    oneOppositeMarkerPerMonth: boolean;
    markerMayChangeSupportOrPressure: boolean;
  };
}

export interface MonthlyFlowTransformationImpactRecord {
  mutagen: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  axes: MonthlyFlowAxisWeights;
  stackingGroup: string;
  ruleId: string;
}

export interface MonthlyFlowTransformationImpactCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  applicationMode: string;
  records: readonly MonthlyFlowTransformationImpactRecord[];
  consistency: {
    baseVectorsMatch: readonly string[];
    layerStrengthComesFromScoringProfile: boolean;
  };
}

export interface MonthlyFlowMovingStarRecord {
  markerId: string;
  enabled: boolean;
  resolverCapability: string;
  candidateAxes: MonthlyFlowAxisWeights | null;
  ruleId: string;
  sourceRefs: readonly string[];
}

export interface MonthlyFlowMovingStarsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  defaultEnabled: boolean;
  records: readonly MonthlyFlowMovingStarRecord[];
  notes: string;
}

export interface MonthlyFlowCalendarRelationRecord {
  ruleId: string;
  relation: string;
  enabled: boolean;
  candidateAxesDelta: MonthlyFlowAxisWeights | null;
  sourceRefs: readonly string[];
  notes: string;
}

export interface MonthlyFlowCalendarRelationsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  defaultEnabled: boolean;
  records: readonly MonthlyFlowCalendarRelationRecord[];
}

export interface MonthlyFlowInteractionRuleRecord {
  ruleId: string;
  label: string;
  enabled: boolean;
  exactTargetKey: string;
  candidateAxesDelta: MonthlyFlowAxisWeights | null;
  sourceRefs: readonly string[];
}

export interface MonthlyFlowInteractionRulesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  defaultEnabled: boolean;
  records: readonly MonthlyFlowInteractionRuleRecord[];
}

export interface MonthlyFlowSchoolCapabilityProfile {
  supportsMonthlyFocus: boolean;
  supportsCalendarStemBranch: boolean;
  supportsMonthlyTransformations: boolean;
  supportsSixAxisOverlayFromCurrentChart: boolean;
  sixAxisRequirement: string;
  monthlyTransformationProviderRequirement: string;
  supportsLeapMonth: string;
}

export interface MonthlyFlowSchoolCapabilitiesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  profiles: {
    "nam-phai": MonthlyFlowSchoolCapabilityProfile;
    "trung-chau": MonthlyFlowSchoolCapabilityProfile;
  };
  mismatchBehavior: string;
  crossSchoolProviderAllowed: boolean;
}

export interface MonthlyFlowIdentityPolicy {
  schemaVersion: string;
  catalogId: string;
  status: string;
  monthIdentity: {
    requiredFields: readonly string[];
    regularMonthKeyFormat: string;
    leapMonthKeyFormat: string;
    lunarMonthRange: readonly number[];
    monthKeyMustBeUnique: boolean;
  };
  coordinateIndependence: {
    focusPalaceSource: string;
    calendarStemBranchSource: string;
    inferCalendarFromFocusPalace: boolean;
    inferFocusPalaceFromCalendarBranch: boolean;
  };
  regularYear: {
    expectedRegularMonthCount: number;
    missingRegularMonthBehavior: string;
    duplicateRegularMonthBehavior: string;
  };
  leapMonth: {
    mode: string;
    mayProduceThirteenthResult: boolean;
    inferFromChartLunarLeapOnly: boolean;
    missingSchoolPolicyBehavior: string;
  };
  ordering: Record<string, unknown>;
}

export interface MonthlyFlowContextPolicy {
  schemaVersion: string;
  catalogId: string;
  status: string;
  rules: readonly {
    context: string;
    mode: string;
    numericCategory: string;
    notes?: string;
    schoolCapabilityRequired?: boolean;
    polarity?: string;
  }[];
  forbiddenInputs: readonly string[];
  crossLayerRule: {
    onePhysicalFactOneNumericContributionPerMonthAxis: boolean;
    exactSamePhysicalFactWinner: string;
    differentTransformationLayersRemainDistinct: boolean;
  };
}

export interface MonthlyFlowSourceClaim {
  claimId: string;
  description: string;
}

export interface MonthlyFlowSourceRecord {
  sourceId: string;
  title: string;
  sourceType: string;
  location?: string;
  author?: string;
  url?: string;
  researchClaim?: string;
  allowedUsage: readonly string[];
  prohibitedUsage: readonly string[];
  claims?: readonly MonthlyFlowSourceClaim[];
}

export interface MonthlyFlowSourceRegistry {
  schemaVersion: string;
  registryId: string;
  status: string;
  sources: readonly MonthlyFlowSourceRecord[];
  researchQueue: ReadonlyArray<{
    researchId: string;
    priority: string;
    topic: string;
    question: string;
  }>;
}

export interface MonthlyFlowCalibrationCase {
  fixtureId: string;
  label: string;
  rawAxes: MonthlyFlowAxisWeights;
  expected: {
    score: number;
    intensity: number;
    conflict: number;
    normalizedAxes: MonthlyFlowAxisWeights;
  };
}

export interface MonthlyFlowBehavioralFixture {
  fixtureId: string;
  description: string;
}

export interface MonthlyFlowCalibrationFixtures {
  schemaVersion: string;
  fixtureSetId: string;
  status: string;
  formulaProfileId: string;
  formulaCases: readonly MonthlyFlowCalibrationCase[];
  behavioralFixtures: readonly MonthlyFlowBehavioralFixture[];
}

export interface MonthlyFlowScoringKnowledgeV0 {
  domainDefinitions: MonthlyFlowDomainDefinitionsCatalog;
  scoringProfile: MonthlyFlowScoringProfile;
  focusMarkers: MonthlyFlowFocusMarkersCatalog;
  transformationImpact: MonthlyFlowTransformationImpactCatalog;
  movingStars: MonthlyFlowMovingStarsCatalog;
  calendarRelations: MonthlyFlowCalendarRelationsCatalog;
  interactionRules: MonthlyFlowInteractionRulesCatalog;
  schoolCapabilities: MonthlyFlowSchoolCapabilitiesCatalog;
  identityPolicy: MonthlyFlowIdentityPolicy;
  contextPolicy: MonthlyFlowContextPolicy;
  sourceRegistry: MonthlyFlowSourceRegistry;
  calibrationFixtures: MonthlyFlowCalibrationFixtures;
}
