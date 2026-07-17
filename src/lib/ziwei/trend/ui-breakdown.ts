/**
 * Presentation-layer rounding for Explainable UI.
 *
 * Core engine scores stay full-precision for radar / clamp.
 * Display totals MUST equal the sum of the rounded parts the user sees
 * (WYSIWYG), never `round(sum(raw))`.
 */

import type { ScoreLine } from "./types";

/** Một chữ số thập phân, tránh trôi dạt float (0.1+0.2). */
export function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface UIBreakdownItem {
  source: string;
  points: number;
  reason: string;
}

export interface UIBreakdownResult<T extends UIBreakdownItem = UIBreakdownItem> {
  /** Từng dòng đã làm tròn 1 chữ số — đúng bằng số hiện trên UI. */
  items: Array<T & { points: number }>;
  /** Tổng hiển thị = sum(round(item)), không phải round(sum). */
  total: number;
}

/**
 * Đồng bộ làm tròn cho chuỗi giải thích UI.
 *
 * `total_display = Σ round_to_1_decimal(item_float)`
 */
export function formatUIBreakdown<T extends UIBreakdownItem>(
  items: readonly T[],
): UIBreakdownResult<T> {
  const formatted = items.map((item) => ({
    ...item,
    points: roundTo1Decimal(item.points),
  }));
  const total = roundTo1Decimal(
    formatted.reduce((sum, item) => sum + item.points, 0),
  );
  return { items: formatted, total };
}

/** Lọc các dòng điểm nền domain (B_D) trong breakdown vận hạn. */
export function isBaseContributionLine(line: ScoreLine): boolean {
  return line.reason.startsWith("Nền");
}
