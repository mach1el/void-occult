/**
 * Engine xu hướng Tử Vi — tất định, không LLM.
 * Đại vận · Lưu niên · độ vững 12 cung.
 */

import type { ChartData } from "@/types/chart";
import { getEngine } from "../chart";
import { baseStarName, isStrongBrightness } from "../star-classification";
import { CAT_SET, SAT_SET } from "./star-sets";
import { SCORING_WEIGHTS, type ScoringWeights } from "./weights";
import { scoreFortuneFrame } from "./frame";
import type {
  LuuNienTrendOptions,
  PalaceStrength,
  ScoreLine,
  TrendPoint,
} from "./types";
import {
  finalizeLayer,
  isMutagenStar,
  mutagenKind,
  voidBranches,
} from "./util";

export type {
  ScoreLine,
  TrendPoint,
  PalaceStrength,
  LuuNienTrendOptions,
} from "./types";

export function getDaiVanTrend(
  chart: ChartData,
  weights: ScoringWeights = SCORING_WEIGHTS,
): TrendPoint[] {
  const fortunes = chart.palaces
    .filter((palace) => palace.majorFortune)
    .sort(
      (a, b) =>
        (a.majorFortune?.start ?? 0) - (b.majorFortune?.start ?? 0),
    );

  return fortunes.map((palace) => {
    const fortune = palace.majorFortune!;
    // Tứ Hóa gốc / ĐV: truyền cả bảng — scorer chỉ giữ record rơi vào khung
    // tam phương tứ chính của cung đại vận (không chỉ đồng cung hạn).
    const scored = scoreFortuneFrame(chart, palace, weights, [
      {
        label: "ĐV",
        records: fortune.active ? chart.majorMutagens : [],
      },
      {
        label: "Gốc",
        records: chart.natalMutagens,
      },
    ]);

    return {
      label: `${fortune.start}-${fortune.end}`,
      cat: scored.cat,
      hung: scored.hung,
      isCurrent: Boolean(fortune.active),
      breakdown: scored.breakdown,
    };
  });
}

/**
 * Xu hướng Lưu niên ±span quanh centerYear.
 * Cung hạn = annualPalace (hoặc taiTuePalace) của lá năm đó.
 */
export function getLuuNienTrend(
  chart: ChartData,
  centerYear: number,
  span: number,
  opts: LuuNienTrendOptions,
): TrendPoint[] {
  const engine = getEngine(opts.school);
  if (!engine) return [];

  const weights = opts.weights ?? SCORING_WEIGHTS;
  const points: TrendPoint[] = [];

  for (let year = centerYear - span; year <= centerYear + span; year += 1) {
    const yearChart =
      year === chart.annualYear
        ? chart
        : engine.calculate({
            ...opts.birthInput,
            annualYear: String(year),
          });

    const focus =
      yearChart.annualPalace ??
      yearChart.taiTuePalace ??
      yearChart.palaces.find((palace) => palace.isMenh) ??
      yearChart.palaces[0];
    if (!focus) continue;

    const scored = scoreFortuneFrame(yearChart, focus, weights, [
      { label: "Lưu", records: yearChart.annualMutagens },
      { label: "Gốc", records: yearChart.natalMutagens },
    ]);

    points.push({
      label: `${year} · ${yearChart.nominalAge}t`,
      cat: scored.cat,
      hung: scored.hung,
      isCurrent: year === chart.annualYear,
      breakdown: scored.breakdown,
    });
  }

  return points;
}

const PALACE_SHORT: Record<string, string> = {
  Mệnh: "Mệnh",
  "Phụ Mẫu": "P.Mẫu",
  "Phúc Đức": "P.Đức",
  "Điền Trạch": "Đ.Trạch",
  "Quan Lộc": "Q.Lộc",
  "Nô Bộc": "N.Bộc",
  "Thiên Di": "T.Di",
  "Tật Ách": "T.Ách",
  "Tài Bạch": "T.Bạch",
  "Tử Tức": "T.Tức",
  "Phu Thê": "P.Thê",
  "Huynh Đệ": "H.Đệ",
};

export function shortPalaceName(name: string): string {
  return PALACE_SHORT[name] ?? name;
}

/**
 * Độ vững tĩnh 12 cung (radar). Dùng chung scoring-weights.
 */
export function getPalaceStrengths(
  chart: ChartData,
  weights: ScoringWeights = SCORING_WEIGHTS,
): PalaceStrength[] {
  const voids = voidBranches(chart);
  const menhIndex = chart.menhIndex;
  const ordered = [...chart.palaces].sort((a, b) => {
    const aOffset = (a.index - menhIndex + 12) % 12;
    const bOffset = (b.index - menhIndex + 12) % 12;
    return aOffset - bOffset;
  });

  return ordered.map((palace) => {
    const lines: ScoreLine[] = [
      {
        source: "Nền",
        points: weights.palaceBase,
        reason: "Điểm nền độ vững cung",
      },
    ];
    const majors = (palace.stars ?? []).filter((star) => star.layer === "major");

    if (majors.length === 0) {
      lines.push({
        source: "Vô chính diệu",
        points: -weights.palaceEmptyMajor,
        reason: `${palace.name} không có chính tinh thủ cung`,
      });
    } else {
      lines.push({
        source: "Có chính tinh",
        points: weights.palaceHasMajor,
        reason: `${palace.name} có ${majors.length} chính tinh`,
      });
    }

    for (const star of palace.stars ?? []) {
      const base = baseStarName(star.name);

      if (star.layer === "major") {
        if (isStrongBrightness(star.brightness)) {
          lines.push({
            source: star.name,
            points: weights.majorMieuVuong,
            reason: `${star.name} ${star.brightness}`,
          });
        } else if (star.brightness === "Hãm") {
          lines.push({
            source: star.name,
            points: -weights.majorHam,
            reason: `${star.name} Hãm địa`,
          });
        }
      }

      if (CAT_SET.has(base)) {
        lines.push({
          source: star.name,
          points: weights.lucCat,
          reason: `Cát tinh ${star.name}`,
        });
      }

      if (SAT_SET.has(base)) {
        lines.push({
          source: star.name,
          points: -weights.lucSat,
          reason: `Sát tinh ${star.name}`,
        });
      }

      if (isMutagenStar(star)) {
        const kind = mutagenKind(star);
        if (kind === "Lộc") {
          lines.push({
            source: star.name,
            points: Math.round(weights.hoaLoc * 0.7),
            reason: `${star.name} tăng độ vững`,
          });
        } else if (kind === "Quyền") {
          lines.push({
            source: star.name,
            points: Math.round(weights.hoaQuyen * 0.7),
            reason: `${star.name} tăng độ vững`,
          });
        } else if (kind === "Khoa") {
          lines.push({
            source: star.name,
            points: Math.round(weights.hoaKhoa * 0.7),
            reason: `${star.name} tăng độ vững`,
          });
        } else if (kind === "Kỵ") {
          lines.push({
            source: star.name,
            points: -Math.round(weights.hoaKy * 0.7),
            reason: `${star.name} giảm độ vững`,
          });
        }
      }
    }

    if (voids.has(palace.branch)) {
      lines.push({
        source: "Tuần/Triệt",
        points: -weights.tuanTriet,
        reason: `Tuần/Triệt án ngữ ${palace.branch}`,
      });
    }

    const { score, lines: finalLines } = finalizeLayer(lines);
    return {
      palace: palace.name,
      score,
      breakdown: finalLines,
    };
  });
}

