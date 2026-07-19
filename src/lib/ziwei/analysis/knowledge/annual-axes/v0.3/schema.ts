/**
 * Type surface for the Annual Axes V0.3 head-centric Nam Phái knowledge
 * pack. Trung Châu continues to use the V0.2 loader / schema so that the
 * locked Trung Châu numeric fixture remains byte-identical.
 */

import type { AnnualAxisDomainId, AnnualAxisWeights } from "../schema";

export type AnnualAxisHeadRole = "focus" | "opposite" | "trine" | "outside";

export interface AnnualHeadPolicyProfileNamPhai {
  primaryAnnualHead: {
    preferredChartField: string;
    calculationFact: string;
    legacyRuntimeFlag: string;
    mustNotUseAsPrimary: string[];
    missingBehavior: string;
  };
  secondaryCoordinates: Array<{
    id: string;
    chartField: string;
    role: string;
  }>;
}

export interface AnnualHeadPolicyProfileTrungChau {
  primaryAnnualHead: {
    calculationFact: string;
    mustNotUseAsPrimary: string[];
    missingBehavior: string;
  };
  numericCompatibility: string;
}

export interface AnnualHeadPolicyCatalogV03 {
  schemaVersion: string;
  catalogId: string;
  status: string;
  terminology: {
    productLabelVi: string;
    technicalId: string;
    notes?: string;
  };
  profiles: {
    "nam-phai": AnnualHeadPolicyProfileNamPhai;
    "trung-chau": AnnualHeadPolicyProfileTrungChau;
  };
  noCrossSchoolFallback: boolean;
}

export interface AnnualDomainAnchorV03 {
  palaceName: string;
  weight: number;
}

export interface AnnualDomainDefinitionV03 {
  domain: AnnualAxisDomainId;
  labelVi: string;
  anchors: AnnualDomainAnchorV03[];
}

export interface AnnualAxisDefinitionsCatalogV03NamPhai {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  coordinate: "natal-palace-name";
  domains: AnnualDomainDefinitionV03[];
  validationRules: {
    anchorWeightsMustSumTo: number;
    allTwelveNatalPalaceNamesMustResolveUniquely: boolean;
    indexFallbackAllowed: boolean;
  };
  compatibility: {
    trungChauUsesThisCatalog: boolean;
    trungChauCatalog: string;
  };
}

export interface AnnualRoutingProfileV03 {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  headFrameRoleWeights: Record<AnnualAxisHeadRole, number>;
  localDomainFrameRoleWeights: Record<AnnualAxisHeadRole, number>;
  routing: {
    expression: string;
    min: number;
    max: number;
    duplicateAnchorBehavior: string;
  };
  channelBlend: {
    headShareFloor: number;
    headShareRange: number;
    headShareExpression: string;
    localShareExpression: string;
    combinedPhysicalFactGeometryExpression: string;
    samePhysicalFactBehavior: string;
  };
  structuralActivation: {
    baseRaw: number;
    routingRangeRaw: number;
    expression: string;
    axesAffected: string[];
    supportDelta: number;
    pressureDelta: number;
    stabilityDelta: number;
  };
}

export interface AnnualScoringProfileV03NamPhai {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  output: {
    scoreMin: number;
    scoreMax: number;
    scorePrecision: number;
    bands: Array<{
      minInclusive: number;
      maxExclusive?: number;
      maxInclusive?: number;
      id: string;
      labelVi: string;
    }>;
  };
  confidenceWeights: {
    approved: number;
    experimental: number;
  };
  diminishingReturns: {
    formula: string;
    expression: string;
    rankWithin: string[];
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
    identityFields: string[];
    headAndLocalSameFactBehavior: string;
    multipleLocalAnchorsBehavior: string;
    semanticAnnotationsAreNumeric: boolean;
  };
}

export interface AnnualLayerWeightsV03NamPhai {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  weights: {
    "natal-physical-star": number;
    "annual-moving-star": number;
    "annual-transformation": number;
    "major-fortune-context": number;
    "tam-hop-small-limit-secondary": number;
    "tai-tue-external-context": number;
    interaction: number;
  };
  constraints: {
    annualHeadIsNotAnExtraLayerWeight: boolean;
    annualHeadActsThroughGeometryAndRouting: boolean;
    disabledInteractionsRemainZero: boolean;
    previousModuleScoresForbidden: boolean;
  };
}

export interface AnnualContextMarkerV03 {
  markerId: string;
  sourceFact: string;
  axesFormulaRef?: string;
  baseAxes?: AnnualAxisWeights;
  ruleId: string;
}

export interface AnnualContextMarkersCatalogV03NamPhai {
  schemaVersion: string;
  catalogId: string;
  status: string;
  polarityRule: string;
  records: AnnualContextMarkerV03[];
  convergenceRules: unknown[];
  notes?: string;
}

export interface AnnualRoutingFixtureV03 {
  fixtureId: string;
  description: string;
  headFrame: {
    focus: { branch: string; natalPalaceName: string };
    opposite: { branch: string; natalPalaceName: string };
    trines: Array<{ branch: string; natalPalaceName: string }>;
  };
  expectedDomains: Array<{
    domain: AnnualAxisDomainId;
    routing: number;
    headShare: number;
    localShare: number;
  }>;
}

export interface AnnualFormulaCalibrationCaseV03 {
  fixtureId: string;
  label: string;
  rawAxes: AnnualAxisWeights;
  expected: {
    score: number;
    intensity: number;
    conflict: number;
    normalizedAxes: AnnualAxisWeights;
  };
}

export interface AnnualBehavioralFixtureV03 {
  fixtureId: string;
  description: string;
  expected: Record<string, boolean | number | string>;
}

export interface AnnualCalibrationFixturesV03 {
  schemaVersion: string;
  fixtureSetId: string;
  status: string;
  formulaProfileId: string;
  formulaCases: AnnualFormulaCalibrationCaseV03[];
  routingFixtures: AnnualRoutingFixtureV03[];
  behavioralFixtures: AnnualBehavioralFixtureV03[];
}

export interface AnnualSourceRegistryV03 {
  schemaVersion: string;
  registryId: string;
  status: string;
  sources: Array<{
    sourceId: string;
    title: string;
    author?: string;
    edition?: string;
    sourceType: string;
    url?: string;
    location?: string;
    locators?: Array<Record<string, unknown>>;
    allowedUsage: string[];
    prohibitedUsage: string[];
  }>;
  claims: Array<{
    claimId: string;
    sourceId: string;
    summary: string;
    confidence: string;
  }>;
}

export interface AnnualV02MigrationGuard {
  schemaVersion: string;
  guardId: string;
  mustRemoveOrReplace: string[];
  mustPreserve: string[];
  releaseBlock: boolean;
}

export interface AnnualDynamicResolutionGuardV03 {
  schemaVersion: string;
  guardId: string;
  status: string;
  principles: Record<string, boolean>;
  dynamicInputs: Array<{
    fact: string;
    source: string;
    role?: string;
    forbiddenFallbacks?: string[];
    requirements?: string[];
  }>;
  forbiddenHardcoding: string[];
  requiredRuntimeValidation: string[];
  requiredSourceScans: string[];
  testMatrix: {
    annualHeadBranches: string;
    schools: string[];
    chartCompleteness: string[];
    pointerStates: string[];
    dynamicAssertions: string[];
  };
}

/** V0.3 Nam Phái knowledge bundle. Trung Châu is intentionally excluded —
 * it continues to be served by `loadAnnualAxesKnowledgeV0` so the locked
 * V0.2 numeric fixture stays byte-identical. */
export interface AnnualAxesKnowledgeV03NamPhai {
  headPolicy: AnnualHeadPolicyCatalogV03;
  axisDefinitions: AnnualAxisDefinitionsCatalogV03NamPhai;
  routingProfile: AnnualRoutingProfileV03;
  scoringProfile: AnnualScoringProfileV03NamPhai;
  layerWeights: AnnualLayerWeightsV03NamPhai;
  contextMarkers: AnnualContextMarkersCatalogV03NamPhai;
  calibrationFixtures: AnnualCalibrationFixturesV03;
  sourceRegistry: AnnualSourceRegistryV03;
  migrationGuard: AnnualV02MigrationGuard;
  dynamicResolutionGuard: AnnualDynamicResolutionGuardV03;
}
