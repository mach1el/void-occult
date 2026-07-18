/**
 * Module: monthly-flow (Lưu nguyệt từng tháng)
 *
 * Phase 0 — contract only; no scoring implementation.
 *
 * Scope (future):
 * - focusPalace và calendarStem/calendarBranch là hai hệ tọa độ độc lập;
 * - tháng là tầng kích hoạt;
 * - lưu niên và Đại vận chỉ là context theo policy tương lai;
 * - không nhân toàn cột;
 * - không dùng combo Đại vận nguyên xi;
 * - không dùng score cũ.
 */

import type { ZiweiAnalysisModule } from "./common";

export const MONTHLY_FLOW_MODULE: ZiweiAnalysisModule = "monthly-flow";

export type MonthlyFlowContract = {
  module: "monthly-flow";
  /** Cung Lưu Nguyệt Mệnh — độc lập Can Chi lịch tháng. */
  focusPalaceIndependentOfCalendar: true;
  outputSchema: null;
};
