import type { AnnualAxisDomainId } from "../schema";

export type { AnnualAxisDomainId };

export type V08PointClass =
  | "annualTransformStrongPositive"
  | "annualTransformPositive"
  | "annualTransformNegative"
  | "otherAnnualPositive"
  | "otherAnnualNegative"
  | "staticPositive"
  | "staticNegative"
  | "dignifiedStaticPositive";

export type V08PalaceInputType = "annual-palace" | "small-limit-palace";

export interface V08DomainPalaceInput {
  type: V08PalaceInputType;
  palace?: string;
  weight: number;
  role?: string;
}

export interface V08DomainMappingEntry {
  primary: V08DomainPalaceInput;
  cooperating: V08DomainPalaceInput[];
}

export interface AnnualDomainMappingV08 {
  schemaVersion: string;
  catalogId: string;
  formulaVersion: "v0.8-annual-palace-weighted-score";
  domains: Record<AnnualAxisDomainId, V08DomainMappingEntry>;
  sourceIds: string[];
}

export interface AnnualPointClassesV08 {
  schemaVersion: string;
  profileId: string;
  classes: Record<V08PointClass, number>;
  palaceRawClamp: { minimum: number; maximum: number };
  axisRawClamp: { minimum: number; maximum: number };
  thaiTueMultiplier: number;
  thaiTueNeutralMultiplier: number;
  score: {
    neutral: number;
    pointsPerRawUnit: number;
    minimum: number;
    maximum: number;
    precision: number;
  };
  sourceIds: string[];
}

export interface V08StarRule {
  starName: string;
  pointClass: V08PointClass;
  ruleId: string;
  isTuHoa?: boolean;
  requiresDignity?: string[];
}

export interface AnnualStarRegistryV08 {
  schemaVersion: string;
  catalogId: string;
  axes: Record<
    AnnualAxisDomainId,
    {
      positive: V08StarRule[];
      negative: V08StarRule[];
    }
  >;
  sourceIds: string[];
}

export interface AnnualStarAliasesV08 {
  schemaVersion: string;
  catalogId: string;
  groups: Record<string, string[]>;
  sourceIds: string[];
}

export interface AnnualDistributionGatesV08 {
  schemaVersion: string;
  catalogId: string;
  hardGates: Record<string, number>;
  sourceIds: string[];
}

export interface AnnualAxesKnowledgeV08NamPhai {
  domainMapping: AnnualDomainMappingV08;
  pointClasses: AnnualPointClassesV08;
  starRegistry: AnnualStarRegistryV08;
  starAliases: AnnualStarAliasesV08;
  distributionGates: AnnualDistributionGatesV08;
}

export const V08_FORMULA_VERSION = "v0.8-annual-palace-weighted-score" as const;
