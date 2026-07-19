/** Shared knowledge record types for the Annual Axes V0.1 experimental pack. */

export type AnnualAxisDomainId =
  | "health"
  | "family"
  | "wealth"
  | "career"
  | "social"
  | "romance";

export interface AnnualAxisWeights {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export interface AnnualDomainAnchor {
  annualPalaceName: string;
  weight: number;
}

export interface AnnualDomainDefinition {
  domain: AnnualAxisDomainId;
  labelVi: string;
  anchors: AnnualDomainAnchor[];
}

export interface AnnualAxisDefinitionsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  domains: AnnualDomainDefinition[];
  validationRules: {
    anchorWeightsMustSumTo: number;
    allowedPalaceNames: string[];
    missingAnnualPalaceBehavior: string;
  };
}

export interface AnnualScoringBand {
  minInclusive: number;
  maxExclusive?: number;
  maxInclusive?: number;
  id: string;
  labelVi: string;
}

export interface AnnualScoringProfile {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  output: {
    scoreMin: number;
    scoreMax: number;
    scorePrecision: number;
    bands: AnnualScoringBand[];
  };
  frameRoleWeights: {
    focus: number;
    opposite: number;
    trine: number;
  };
  layerWeights: {
    annual: number;
    major_fortune: number;
    natal_activated: number;
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
    identityFields: string[];
    duplicateAcrossAnchorsBehavior: string;
    semanticAnnotationsAreNumeric: boolean;
  };
  schoolProfiles: Record<
    string,
    {
      enabledFocalMarkers: string[];
      forbiddenFocalMarkers?: string[];
    }
  >;
}

export interface AnnualFocalMarkerRecord {
  markerId: string;
  labelVi: string;
  schools: string[];
  axes: AnnualAxisWeights;
  ruleId: string;
}

export interface AnnualFocalConvergenceRecord {
  markerCount: number;
  samePalaceRequired: boolean;
  axes: AnnualAxisWeights;
  ruleId: string;
}

export interface AnnualFocalMarkersCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  polarityRule: string;
  records: AnnualFocalMarkerRecord[];
  convergence: AnnualFocalConvergenceRecord[];
}

export interface AnnualInteractionRuleRecord {
  ruleId: string;
  label: string;
  enabled: boolean;
  exactTargetRequired: boolean;
  candidateAxesDelta: AnnualAxisWeights;
  sourceRefs: string[];
  notes: string;
}

export interface AnnualInteractionRulesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  defaultEnabled: boolean;
  records: AnnualInteractionRuleRecord[];
}

export interface AnnualMutagenImpactRecord {
  mutagen: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  axes: AnnualAxisWeights;
  stackingGroup: string;
  ruleId: string;
}

export interface AnnualMutagenImpactCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  applicationMode: string;
  records: AnnualMutagenImpactRecord[];
}

export interface AnnualStarOverrideRecord {
  canonicalStarName: string;
  ruleId: string;
  sourceRefs: string[];
  axesOverride?: Partial<AnnualAxisWeights>;
  notes?: string;
}

export interface AnnualStarOverridesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  inheritance: {
    sourceCatalog: string;
    reuseFields: string[];
    forbiddenReuseFields: string[];
  };
  records: AnnualStarOverrideRecord[];
  notes: string;
}

export interface AnnualSourceClaim {
  claimId: string;
  description: string;
  policyLinks: string[];
}

export interface AnnualSourceRecord {
  sourceId: string;
  title: string;
  sourceType: string;
  allowedUsage: string[];
  prohibitedUsage: string[];
  claims: AnnualSourceClaim[];
}

export interface AnnualSourceRegistry {
  schemaVersion: string;
  registryId: string;
  status: string;
  sources: AnnualSourceRecord[];
  researchQueue: Array<{
    researchId: string;
    topic: string;
    priority: string;
    question: string;
  }>;
}

export interface AnnualCalibrationCase {
  fixtureId: string;
  label: string;
  rawAxes: AnnualAxisWeights;
  expected: {
    score: number;
    intensity: number;
    conflict: number;
    normalized: AnnualAxisWeights;
  };
}

export interface AnnualBehavioralFixture {
  fixtureId: string;
  description: string;
  expected: Record<string, boolean | number>;
}

export interface AnnualCalibrationFixtures {
  schemaVersion: string;
  fixtureSetId: string;
  status: string;
  formulaProfileId: string;
  cases: AnnualCalibrationCase[];
  behavioralFixtures: AnnualBehavioralFixture[];
}

export type AnnualDomainAnchorCoordinate =
  | "natal-palace-name"
  | "annual-palace-name";

export type AnnualPrimaryFocusMode =
  | "small-limit"
  | "annual-menh";

export interface AnnualSchoolDomainPolicyProfile {
  domainAnchorCoordinate: AnnualDomainAnchorCoordinate;
  domainAnchorProvenance: string;
  primaryAnnualFocus: AnnualPrimaryFocusMode;
  secondaryMarkers: string[];
}

export interface AnnualSchoolDomainPolicyCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  profiles: {
    "nam-phai": AnnualSchoolDomainPolicyProfile;
    "trung-chau": AnnualSchoolDomainPolicyProfile;
  };
}

export interface AnnualAxesKnowledgeV0 {
  axisDefinitions: AnnualAxisDefinitionsCatalog;
  scoringProfile: AnnualScoringProfile;
  focalMarkers: AnnualFocalMarkersCatalog;
  interactionRules: AnnualInteractionRulesCatalog;
  mutagenImpact: AnnualMutagenImpactCatalog;
  starOverrides: AnnualStarOverridesCatalog;
  sourceRegistry: AnnualSourceRegistry;
  calibrationFixtures: AnnualCalibrationFixtures;
  schoolDomainPolicy: AnnualSchoolDomainPolicyCatalog;
}
