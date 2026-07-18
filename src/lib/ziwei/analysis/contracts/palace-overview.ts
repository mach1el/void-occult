/**
 * Module: palace-overview (Khí vận tổng thể 12 cung)
 *
 * Phase 0 — contract only; no scoring implementation.
 *
 * Scope (future):
 * - phân tích cấu trúc tĩnh 12 cung;
 * - không phụ thuộc năm xem;
 * - không đọc sao lưu;
 * - không dùng Đại vận / Lưu niên / Lưu nguyệt;
 * - output schema sẽ được thiết kế ở sprint riêng.
 */

import type { ZiweiAnalysisModule } from "./common";

export const PALACE_OVERVIEW_MODULE: ZiweiAnalysisModule = "palace-overview";

export type PalaceOverviewContract = {
  module: "palace-overview";
  /** Output schema intentionally unset until Sprint 2. */
  outputSchema: null;
};
