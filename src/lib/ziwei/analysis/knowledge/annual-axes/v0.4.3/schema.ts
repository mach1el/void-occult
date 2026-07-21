/**
 * Type surface for Annual Axes V0.4.3 (90/10 spatial budget) Nam Phái
 * knowledge. Values come from JSON — never hard-code budgets in the engine.
 */

import type { AnnualAxisDomainId } from "../schema";

export type AnnualGeometryClass =
  | "direct-exact-target"
  | "direct-head-focus"
  | "tp4c-opposite"
  | "tp4c-trine"
  | "context-only";

export type AnnualGeometryBucket = "direct" | "tp4c" | "context-only";

export type AnnualEvidenceLayerId = "annual" | "major-fortune" | "natal-activated";

export interface AnnualSpatialBudgetV043 {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  signedBudget: {
    direct: number;
    tp4c: number;
    globalAnnualClimate: number;
    majorFortuneBackground: number;
  };
  pathClassification: {
    exactAnnualTargetIsDirect: boolean;
    annualHeadFocusIsDirect: boolean;
    oppositeIsTp4c: boolean;
    trineIsTp4c: boolean;
    outsideIsNumeric: boolean;
    collisionPolicy: "direct-wins";
  };
  tp4cRelativeRoleWeights: {
    opposite: number;
    trine: number;
  };
  weightTolerance: number;
  sourceIds: string[];
  limitations: string[];
}

export interface AnnualEvidenceDedupePolicyV043 {
  schemaVersion: string;
  profileId: string;
  status: string;
  signedDedupeKey: Array<"domain" | "physicalFactId">;
  layerPrecedence: AnnualEvidenceLayerId[];
  geometryPrecedence: AnnualGeometryClass[];
  samePhysicalFactMultipleSignedPaths: "keep-highest-precedence";
  samePhysicalFactActivationContribution: "count-once-at-strongest-path";
  stableTieBreak: Array<"ruleId" | "evidenceId">;
  sourceIds: string[];
}

export interface AnnualAggregationProfileV043 {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  normalization: {
    function: "one-minus-exp";
    supportScale: number;
    pressureScale: number;
    activationScale: number;
  };
  diminishingReturns: {
    function: "inverse-square-root-rank";
    groupBy: Array<"domain" | "geometryBucket" | "layer" | "stackingGroup">;
  };
  activationGate: {
    floor: number;
    range: number;
  };
  score: {
    neutral: number;
    amplitude: number;
    divisor: number;
    minimum: number;
    maximum: number;
    precision: number;
  };
  contextChannels: {
    globalAnnualClimateSigned: boolean;
    majorFortuneBackgroundSigned: boolean;
    mayContributeActivation: boolean;
  };
  sourceIds: string[];
}

export interface AnnualAxisFixtureAnchorV043 {
  domain: AnnualAxisDomainId;
  labelVi: string;
  directFixturePalace: string;
}

export interface AnnualAxisFixtureMatrixV043 {
  schemaVersion: string;
  matrixId: string;
  status: string;
  notes: string[];
  directAnchors: AnnualAxisFixtureAnchorV043[];
  sourceIds: string[];
}

export interface AnnualAxesKnowledgeV043NamPhai {
  spatialBudget: AnnualSpatialBudgetV043;
  dedupePolicy: AnnualEvidenceDedupePolicyV043;
  aggregationProfile: AnnualAggregationProfileV043;
  fixtureMatrix: AnnualAxisFixtureMatrixV043;
}
