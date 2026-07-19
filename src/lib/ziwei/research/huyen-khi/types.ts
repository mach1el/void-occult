import type { ZiweiSchool } from "../../analysis/facts";

/**
 * Strict namespace isolation (corrective prompt §2). Huyền Khí, Xí Hoa,
 * Đẩu Minh and Cung Khí are four distinct public metrics on the source
 * site; none may be aliased to another, in code or in data.
 */
export type QiMetricNamespace = "huyen-khi" | "xi-hoa" | "dau-minh" | "cung-khi";

export const NATAL_PALACE_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

export type NatalPalaceName = (typeof NATAL_PALACE_NAMES)[number];

export interface PublicHuyenKhiRecord {
  sampleId: string;
  metricNamespace: "huyen-khi";
  sourceType: string;
  sourceUrl: string;
  sourceLid: string | null;
  displayTitle: string;
  displayedTotal: number;
  palaceScores: Record<NatalPalaceName, number>;
  palacesExplicitlyListed: NatalPalaceName[];
  omittedPalacesAssumedZeroForValidation: NatalPalaceName[];
  calculatedTotal: number;
  totalDelta: number;
  totalValidation: "exact" | "mismatch";
  evidenceStatus: "source-confirmed" | "output-inferred" | "experimental" | "unresolved";
  notes?: string;
}

export interface PublicHuyenKhiDataset {
  schemaVersion: string;
  datasetId: string;
  metricNamespace: "huyen-khi";
  collectionMethod: string;
  records: PublicHuyenKhiRecord[];
}

/** §3 — parsed from `displayTitle` text already present in the pack; no
 * network access. The lunar year is stem-branch only (ambiguous mod 60) —
 * see `resolve-solar-date.ts`. */
export interface ParsedBirthTitle {
  yinYang: "dương" | "âm";
  gender: "male" | "female";
  yearStem: string;
  yearBranch: string;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
}

export interface SolarDateCandidate {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarYear: number;
}

export interface ResolvedSolarDate {
  yearResolution: "unique" | "ambiguous" | "unresolved";
  candidates: SolarDateCandidate[];
}

export interface HuyenKhiChartFactSnapshot {
  calculationEngineVersion: string;
  school: ZiweiSchool;
  cuc: string;
  menhPalaceIndex: number;
  thanPalaceIndex: number;
  palaces: Array<{
    index: number;
    branch: string;
    natalPalaceName: string;
    stem: string | null;
    stemBranchNapAm: string | null;
    majorStars: Array<{ canonicalName: string; brightness: string | null }>;
    minorStars: Array<{ canonicalName: string; brightness: string | null }>;
    natalTransformations: string[];
    hasTuan: boolean;
    hasTriet: boolean;
    oppositeIndex: number;
    trineIndexes: [number, number];
    adjacentIndexes: [number, number];
  }>;
}

export interface HuyenKhiFeatureDefinition {
  featureId: string;
  description: string;
  sourceStatus: "source-confirmed" | "output-inferred" | "experimental" | "unresolved";
  sourceIds: string[];
  extractionMethod: string;
  leakageRisk: "none" | "low" | "high";
}

export interface HuyenKhiEvaluationMetrics {
  mae: number;
  rmse: number;
  exactWithin001Rate: number;
  exactWithin005Rate: number;
  count: number;
}

export interface HuyenKhiEvaluationReport {
  recordCount: number;
  palaceObservationCount: number;
  palaceMae: number;
  palaceRmse: number;
  palaceExactWithin001Rate: number;
  palaceExactWithin005Rate: number;
  totalMae: number;
  totalAdditivityViolations: number;
  signAccuracy: number;
  byPalace: Partial<Record<NatalPalaceName, HuyenKhiEvaluationMetrics>>;
}
