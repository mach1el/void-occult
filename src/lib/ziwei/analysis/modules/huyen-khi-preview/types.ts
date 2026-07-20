import type { School } from "@/types/chart";
import type {
  ZiweiBrightness,
  ZiweiTransformation,
  ZiweiVoidType,
} from "../../facts";

export type HuyenKhiDimensionId =
  | "capacity"
  | "coherence"
  | "expression"
  | "regulation"
  | "tendency";

export const HUYEN_KHI_DIMENSION_IDS: readonly HuyenKhiDimensionId[] = [
  "capacity",
  "coherence",
  "expression",
  "regulation",
  "tendency",
] as const;

/** Five Huyền Khí dimensions — states remain null until the evaluator is promoted. */
export type HuyenKhiDimensionStates = Record<HuyenKhiDimensionId, null>;

export type HuyenKhiPreviewDiagnosticCode =
  | "invalid-chart"
  | "duplicate-natal-fact-id"
  | "missing-palace"
  | "invalid-menh-index"
  | "invalid-than-index"
  | "menh-index-flag-mismatch"
  | "than-index-flag-mismatch"
  | "school-mismatch"
  | "unsupported-natal-fact";

export interface HuyenKhiPreviewDiagnostic {
  code: HuyenKhiPreviewDiagnosticCode;
  message: string;
  palaceIndex?: number;
  factId?: string;
}

export interface HuyenKhiPreviewStar {
  factId: string;
  starName: string;
  canonicalStarName: string;
  brightness?: ZiweiBrightness;
}

export interface HuyenKhiPreviewTransformation {
  factId: string;
  transformation: ZiweiTransformation;
  targetStar: string;
}

export interface HuyenKhiPreviewVoidMarker {
  factId: string;
  voidType: ZiweiVoidType;
}

export interface HuyenKhiPreviewPalace {
  palaceIndex: number;
  palaceName: string;
  branch: string;
  stem: string | null;
  isMenh: boolean;
  isThan: boolean;
  changShengStage: string | null;
  isVoChinhDieu: boolean;
  oppositePalaceIndex: number;
  trinePalaceIndexes: [number, number];
  majorStars: HuyenKhiPreviewStar[];
  minorStars: HuyenKhiPreviewStar[];
  natalTransformations: HuyenKhiPreviewTransformation[];
  voidMarkers: HuyenKhiPreviewVoidMarker[];
  /**
   * Major stars resident in the opposite palace.
   * Populated only when the focus palace is Vô Chính Diệu.
   * Factual display reference only; never a computed influence.
   */
  borrowedMajorStars: HuyenKhiPreviewStar[];
  dimensionStates: HuyenKhiDimensionStates;
  dimensionStateReason: "symbolic-evaluator-not-promoted";
}

export interface HuyenKhiPreviewResult {
  module: "huyen-khi";
  mode: "research-preview";
  evaluatorStatus: "not-promoted";
  status: "available" | "partial" | "unavailable";
  school: School;
  palaces: HuyenKhiPreviewPalace[];
  diagnostics: HuyenKhiPreviewDiagnostic[];
  versions: {
    contractVersion: "0.1.0";
    adapterVersion: "0.1.0";
    copyVersion: "0.1.0";
  };
}

export function emptyDimensionStates(): HuyenKhiDimensionStates {
  return {
    capacity: null,
    coherence: null,
    expression: null,
    regulation: null,
    tendency: null,
  };
}
