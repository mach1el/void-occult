/** Kiểu dữ liệu public của engine xu hướng. */

import type { BirthInput, School } from "@/types/chart";
import type { ScoringWeights } from "./weights";

export interface ScoreLine {
  source: string;
  points: number;
  reason: string;
}

export interface TrendPoint {
  label: string;
  /** Điểm Cát — thang 0–100, độc lập với hung. */
  cat: number;
  /** Điểm Hung — thang 0–100, độc lập với cat. */
  hung: number;
  isCurrent: boolean;
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

export interface LuuNienTrendOptions {
  school: School;
  birthInput: BirthInput;
  weights?: ScoringWeights;
}

