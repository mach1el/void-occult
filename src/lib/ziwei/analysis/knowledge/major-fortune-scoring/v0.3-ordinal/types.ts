export type MajorFortuneOrdinalPillarId =
  | "thien-thoi"
  | "dia-loi"
  | "nhan-hoa"
  | "tu-hoa-sat-tinh";

export type MajorFortuneOrdinalLevel = -2 | -1 | 0 | 1 | 2;

export type MajorFortuneOrdinalBandId =
  | "strong-pressure"
  | "pressure"
  | "mixed"
  | "support"
  | "strong-support";

export type MajorFortuneOrdinalSchool = "nam-phai" | "trung-chau";

export type MajorFortuneOrdinalPolicyStatus =
  | "research-admitted"
  | "engineering-verified"
  | "blocked"
  | "excluded";

export type MajorFortuneOrdinalEvidenceDirection = "support" | "pressure";
export type MajorFortuneOrdinalEvidenceStrength = "normal" | "strong";
export type MajorFortuneOrdinalTemporalScope =
  | "major-fortune"
  | "natal"
  | "annual"
  | "monthly"
  | "unknown";

export interface MajorFortuneOrdinalPillarDef {
  pillarId: MajorFortuneOrdinalPillarId;
  budget: number;
  labelVi: string;
  allowedSignalFamilyIds?: string[];
  round1Notes?: string;
}

export interface MajorFortuneOrdinalBandDef {
  bandId: MajorFortuneOrdinalBandId;
  labelVi: string;
  minInclusive: number;
  maxInclusive: number;
}

export interface MajorFortuneOrdinalSignalFamily {
  signalFamilyId: string;
  pillarId: MajorFortuneOrdinalPillarId;
  directionality: string;
  policyStatus: MajorFortuneOrdinalPolicyStatus | "research-admitted";
  schoolScope: MajorFortuneOrdinalSchool[];
  classicalDoctrineVerified: boolean;
  description: string;
  requiresCompleteTransformationTuple?: boolean;
  transformationTupleFields?: string[];
  namPhaiStatus?: string;
  seedSets?: {
    support: string[];
    pressure: string[];
  };
}

export interface MajorFortuneOrdinalKnowledge {
  manifest: {
    schemaVersion: string;
    knowledgeVersion: string;
    contractVersion: string;
    engineVersion: string;
    formulaVersion: string;
    modelId: string;
    status: string;
    files: string[];
  };
  governance: {
    schemaVersion: string;
    governanceId: string;
    modelNature: "engineering-heuristic";
    doctrineRelationship: "doctrine-informed-not-classical-reconstruction";
    numericAuthority: "engineering-defined";
    productionStatus: "research-only";
    notClaims: string[];
    relationshipToV02: Record<string, unknown>;
    notes: string[];
  };
  formula: {
    schemaVersion: string;
    formulaId: string;
    formulaVersion: string;
    baseScore: number;
    scorePrecisionDecimals: number;
    scoreMinimum: number;
    scoreMaximum: number;
    ordinalDivisor: number;
    ordinalLevels: MajorFortuneOrdinalLevel[];
    ordinalSemantics: Record<string, string>;
    massWeights: { normal: number; strong: number };
    pillars: Array<{ pillarId: MajorFortuneOrdinalPillarId; budget: number; labelVi: string }>;
    derivation: {
      pillarDelta: string;
      score: string;
      forbidsPerRuleRawDelta: boolean;
    };
  };
  bands: {
    schemaVersion: string;
    catalogId: string;
    authority: string;
    classicalAuthorityClaimed: boolean;
    bands: MajorFortuneOrdinalBandDef[];
  };
  pillarRegistry: {
    schemaVersion: string;
    catalogId: string;
    pillars: MajorFortuneOrdinalPillarDef[];
  };
  signalFamilyPolicy: {
    schemaVersion: string;
    catalogId: string;
    families: MajorFortuneOrdinalSignalFamily[];
  };
  exclusionRegistry: {
    schemaVersion: string;
    catalogId: string;
    excludedSignalFamilyIds: string[];
    excludedTemporalScopes: string[];
    metadataOnlyFields: string[];
    notes: string[];
  };
  schoolCapabilityMatrix: {
    schemaVersion: string;
    catalogId: string;
    profiles: Record<
      MajorFortuneOrdinalSchool,
      {
        supportsElementRelation: boolean;
        supportsPrincipalStarDignity: boolean;
        supportsAuxiliarySets: boolean;
        supportsSeverePressureEvidence: boolean;
        supportsMajorFortuneTransformations: boolean;
        majorFortuneTransformationsBehavior: string;
        forbiddenTemporalScopes: string[];
        failClosedOnUnsupportedFamily: boolean;
      }
    >;
  };
  crossPillarOwnership: {
    schemaVersion: string;
    catalogId: string;
    policy: string;
    silentCrossPillarDoubleCounting: string;
    ownership: Array<{
      physicalFactKind: string;
      ownerPillarId: MajorFortuneOrdinalPillarId;
      notes: string;
    }>;
    dedupeRules: Array<{
      ruleId: string;
      scope: string;
      key: string;
      behavior: string;
    }>;
  };
}

export const MAJOR_FORTUNE_ORDINAL_PILLAR_IDS: MajorFortuneOrdinalPillarId[] = [
  "thien-thoi",
  "dia-loi",
  "nhan-hoa",
  "tu-hoa-sat-tinh",
];

export const MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS: Record<
  MajorFortuneOrdinalPillarId,
  number
> = {
  "thien-thoi": 30,
  "dia-loi": 25,
  "nhan-hoa": 20,
  "tu-hoa-sat-tinh": 25,
};
