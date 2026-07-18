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
}

export type PalaceOverviewBand =
  | "low"
  | "guarded"
  | "balanced"
  | "supportive"
  | "strong";

export interface PalaceOverviewResult {
  module: "palace-overview";
  version: "1.0.0-experimental";
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
  isVoidMajor: boolean;
  topSupportDrivers: PalaceEvidence[];
  topPressureDrivers: PalaceEvidence[];
  allEvidence: PalaceEvidence[];
  profileId: string;
  school: ZiweiSchool;
}

export interface PalaceOverviewDiagnostics {
  unknownStars: string[];
  duplicateFacts: string[];
  unmappedTransformations: string[];
  missingBrightness: string[];
  ruleHits: Array<{
    palaceName: string;
    ruleId: string;
    factIds: string[];
  }>;
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
