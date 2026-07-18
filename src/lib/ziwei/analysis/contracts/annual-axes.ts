/**
 * Module: annual-axes (6 trục khí vận theo năm xem)
 *
 * Phase 0 — contract only; no scoring implementation.
 *
 * Scope (future):
 * - phụ thuộc năm xem;
 * - dùng annual facts theo school profile;
 * - gồm 6 domain: sức khỏe, gia đạo, tài lộc, công việc, giao hữu, tình duyên;
 * - không tái sử dụng score 12 cung bằng phép cộng trọng số cơ học;
 * - output schema sẽ được thiết kế riêng.
 */

import type { ZiweiAnalysisModule } from "./common";

export const ANNUAL_AXES_MODULE: ZiweiAnalysisModule = "annual-axes";

export type AnnualAxisDomain =
  | "health"
  | "family"
  | "wealth"
  | "career"
  | "social"
  | "romance";

export type AnnualAxesContract = {
  module: "annual-axes";
  domains: readonly AnnualAxisDomain[];
  outputSchema: null;
};

export const ANNUAL_AXIS_DOMAINS: readonly AnnualAxisDomain[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
] as const;
