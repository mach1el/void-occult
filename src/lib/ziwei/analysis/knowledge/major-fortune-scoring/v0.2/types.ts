import type { ZiweiSchool } from "../../../facts";

export type MajorFortuneV02PillarId =
  | "thien-thoi"
  | "dia-loi"
  | "nhan-hoa"
  | "tu-hoa-sat-tinh";

export type MajorFortuneV02BandId =
  | "han-bi"
  | "thu-thach"
  | "binh-on"
  | "thuan-loi"
  | "dai-van-vang";

export type MajorFortuneV02RuleStatus =
  | "executable"
  | "research-blocked"
  | "blocked-by-annual-independence"
  | "blocked-by-calculation-core";

export type MajorFortuneV02KnowledgeStatus = "unverified" | "experimental" | "approved";

export interface MajorFortuneV02PillarDef {
  pillarId: MajorFortuneV02PillarId;
  cap: number;
  labelVi: string;
}

export interface MajorFortuneV02BandDef {
  bandId: MajorFortuneV02BandId;
  labelVi: string;
  minInclusive: number;
  maxInclusive: number;
}

export interface MajorFortuneV02Rule {
  ruleId: string;
  school: ZiweiSchool;
  pillarId: MajorFortuneV02PillarId;
  status: MajorFortuneV02RuleStatus;
  knowledgeStatus: MajorFortuneV02KnowledgeStatus;
  sourceIds: string[];
  claimIds: string[];
  factRequirements: string[];
  mutualExclusionGroup: string | null;
  rawDelta: number | null;
  unavailableBehavior: string;
  notes?: string;
  matcher: Record<string, unknown>;
}

export interface MajorFortuneV02Knowledge {
  manifest: {
    schemaVersion: string;
    knowledgeVersion: string;
    contractVersion: string;
    engineVersion: string;
    formulaVersion: string;
    status: string;
    files: string[];
  };
  formula: {
    schemaVersion: string;
    formulaId: string;
    formulaVersion: string;
    baseScore: number;
    scorePrecisionDecimals: number;
    pillars: MajorFortuneV02PillarDef[];
    claimIds: string[];
    sourceIds: string[];
  };
  bands: {
    schemaVersion: string;
    catalogId: string;
    bands: MajorFortuneV02BandDef[];
    claimIds: string[];
    sourceIds: string[];
  };
  branchElementMap: {
    schemaVersion: string;
    mapId: string;
    elements: string[];
    branchToElement: Record<string, string>;
    generates: Record<string, string>;
    controls: Record<string, string>;
    sourceIds: string[];
    claimIds: string[];
  };
  schoolCapabilities: {
    schemaVersion: string;
    catalogId: string;
    profiles: Record<
      ZiweiSchool,
      {
        supportsOverallFrame: boolean;
        supportsTwelveDomainOverlay: boolean;
        supportsMajorFortuneTransformations: boolean;
        forbiddenInputs: string[];
      }
    >;
    sourceIds: string[];
  };
  natalPalaceGroups: {
    schemaVersion: string;
    catalogId: string;
    groups: Array<{ groupId: string; labelVi: string; palaceNames: string[] }>;
    claimIds: string[];
    sourceIds: string[];
  };
  rules: {
    schemaVersion: string;
    catalogId: string;
    rules: MajorFortuneV02Rule[];
  };
}
