/**
 * Module: major-fortune (Đại vận)
 *
 * Phase 0 — contract only; no scoring implementation.
 *
 * Scope (future):
 * - một Đại vận phải độc lập annualYear;
 * - không đọc sao lưu niên;
 * - không đọc sao lưu nguyệt;
 * - Tứ Hóa Đại vận phụ thuộc school profile;
 * - không dùng scorer Lưu Nguyệt.
 */

import type { ZiweiAnalysisModule } from "./common";

export const MAJOR_FORTUNE_MODULE: ZiweiAnalysisModule = "major-fortune";

export type MajorFortuneContract = {
  module: "major-fortune";
  independentOfAnnualYear: true;
  outputSchema: null;
};
