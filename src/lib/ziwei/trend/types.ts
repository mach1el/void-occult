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
  /** Độ vững tĩnh 0–100 — không phải nhãn tốt/xấu vận hạn. */
  score: number;
  breakdown: ScoreLine[];
}

export interface LuuNienTrendOptions {
  school: School;
  birthInput: BirthInput;
  weights?: ScoringWeights;
}

