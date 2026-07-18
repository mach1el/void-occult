/**
 * Module: monthly-flow (Lưu nguyệt từng tháng)
 *
 * V0.1 — experimental deterministic scoring of monthly flow across six
 * annual-axes domains (Sức khỏe · Gia đạo · Tài lộc · Công việc · Giao hữu
 * · Tình duyên). Focus palace and calendar stem/branch are strictly
 * independent coordinate systems (`focusPalaceIndependentOfCalendar:
 * true`).
 *
 * Scope:
 * - focusPalace và calendarStem/calendarBranch là hai hệ tọa độ độc lập;
 * - tháng là tầng kích hoạt trên khung 6 trục lưu niên;
 * - lưu niên và Đại vận chỉ là context theo policy V0;
 * - không nhân toàn cột;
 * - không dùng combo Đại vận nguyên xi;
 * - không đọc điểm/normalizedAxes/topDrivers của module khác;
 * - không gọi locTonIndex; interaction/calendar/moving stars vẫn tắt;
 * - chưa có UI.
 */

import type { ZiweiAnalysisModule } from "./common";
import type { AnnualAxisDomain } from "./annual-axes";
import type { MonthlyFlowResult } from "../modules/monthly-flow";

export const MONTHLY_FLOW_MODULE: ZiweiAnalysisModule = "monthly-flow";

/** Every domain the module scores is one of the annual-axes domain IDs —
 * reused verbatim so the six-axis overlay stays comparable. */
export type MonthlyFlowDomain = AnnualAxisDomain;

export type MonthlyFlowContract = {
  module: "monthly-flow";
  /** Cung Lưu Nguyệt Mệnh — độc lập Can Chi lịch tháng. */
  focusPalaceIndependentOfCalendar: true;
  outputSchema: MonthlyFlowResult;
};
