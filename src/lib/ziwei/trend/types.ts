/** Kiểu dữ liệu public của engine xu hướng. */

import type { BirthInput, ChartPalace, School } from "@/types/chart";
import type { ScoringWeights } from "./weights";

/** Nhóm tín hiệu breakdown — UI phân nhóm theo field này, không parse reason. */
export type ScoreSignalCategory =
  | "major-star"
  | "minor-star"
  | "mutagen"
  | "void"
  | "chang-sheng"
  | "guardrail"
  | "normalization"
  | "other";

/** Vai trò cung trong khung TP4C. */
export type ScorePalaceRole = "focus" | "xung" | "tam-hop";

/** Tầng nguồn tín hiệu (Tứ Hóa / kỹ thuật). */
export type ScoreLayer = "natal" | "annual" | "monthly" | "technical";

export interface ScoreLine {
  source: string;
  points: number;
  reason: string;
  /** Metadata optional — Lưu Nguyệt luôn set; Đại vận/radar có thể thiếu. */
  category?: ScoreSignalCategory;
  palaceRole?: ScorePalaceRole;
  palaceName?: string;
  palaceBranch?: string;
  starTier?: 1 | 2 | 3 | 4;
  brightness?: string;
  layer?: ScoreLayer;
  transform?: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  targetStar?: string;
}

/** Cung trong TP4C không có chính tinh (Vô chính diệu) — chỉ context UI. */
export interface VoidMajorPalaceInfo {
  palaceRole: ScorePalaceRole;
  palaceName: string;
  palaceBranch: string;
}

export interface TrendPoint {
  label: string;
  /** Điểm Cát — thang 0–100, độc lập với hung. */
  cat: number;
  /** Điểm Hung — thang 0–100, độc lập với cat. */
  hung: number;
  isCurrent: boolean;
  /** Số tháng âm 1–12 — chỉ Lưu Nguyệt. */
  monthNumber?: number;
  calendarStem?: string;
  calendarBranch?: string;
  focusPalaceName?: string;
  focusPalaceBranch?: string;
  /** Ngữ cảnh chính tinh / VCD trong TP4C — không cộng điểm. */
  majorStarContext?: {
    voidMajorPalaces: VoidMajorPalaceInfo[];
  };
  breakdown: {
    cat: ScoreLine[];
    hung: ScoreLine[];
  };
}

export interface PalaceStrength {
  palace: string;
  /** Vận khí cung 0–100 (thang tuyệt đối) — mô hình tham khảo, không phải định mệnh. */
  score: number;
  /** Điểm thô trước chuẩn hóa — đúng bằng tổng `breakdown`. */
  raw: number;
  /**
   * Chi tiết từng sao của BẢN CUNG: đóng góp nguyên bản vào nội lực cung (đã
   * nhân độ sáng + ngũ hành), CHƯA nhân trọng số tam phương tứ chính.
   */
  detail: ScoreLine[];
  /** Rollup tam phương tứ chính: bản cung · đối cung · tam hợp. Tổng = `raw`. */
  breakdown: ScoreLine[];
}

/**
 * Một tháng Lưu Nguyệt cho engine chấm điểm (Tầng 4) — KHÔNG dùng cho hiển thị
 * lá số (đó vẫn là `ChartPalace.flowMonths` / `ChartData.monthlyPalaces`,
 * kiểu `FlowMonthEntry` trong `@/types/chart`, cố tình giữ nguyên để không đổi
 * UI chart — xem AGENTS §3 "lá số không được đổi trong im lặng").
 *
 * Hai hệ tọa độ độc lập, KHÔNG được dùng thay thế lẫn nhau:
 * - `focusPalace`: cung Lưu Nguyệt Mệnh — dùng cho TP4C/trọng số cung.
 * - `calendarStem`/`calendarBranch`: Can Chi lịch thật của tháng âm (Ngũ Hổ
 *   Độn theo can năm xem) — dùng cho Tứ Hóa/Lộc Tồn/Kình/Đà/Xung Thái Tuế.
 *   KHÔNG suy ra từ `focusPalace.stem`/`focusPalace.branch`.
 */
export interface MonthlyFocusEntry {
  month: number;
  label?: string;
  /** Cung Lưu Nguyệt Mệnh của tháng — dùng cho TP4C, không dùng để suy Can Chi. */
  focusPalace: ChartPalace;
  /** Thiên can lịch tháng âm (Ngũ Hổ Độn) — độc lập với focusPalace. */
  calendarStem: string;
  /** Địa chi lịch tháng âm — độc lập với focusPalace. */
  calendarBranch: string;
}

export interface LuuNienTrendOptions {
  school: School;
  birthInput: BirthInput;
  weights?: ScoringWeights;
}

export type AnnualAxisName =
  | "Sức khỏe"
  | "Gia đạo"
  | "Tài lộc"
  | "Công việc"
  | "Giao hữu"
  | "Tình duyên";

export interface AnnualAxisStrength {
  axis: AnnualAxisName;
  /** Điểm 0–100 sau clamp. */
  score: number;
  /** Điểm nền B_D từ trọng số cung. */
  base: number;
  breakdown: ScoreLine[];
  year: number;
  /** Tiểu Hạn — ngữ cảnh năm, không tự cộng điểm. */
  smallLimitPalace?: string | null;
}

