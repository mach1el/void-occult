/**
 * Engine xu hướng Tử Vi — tất định, không LLM.
 * Đại vận · Lưu niên · độ vững 12 cung.
 */

import type { ChartData, FlowMonthEntry } from "@/types/chart";
import { getEngine } from "../chart";
import {
  baseStarName,
  isAnnualStar,
  isStrongBrightness,
} from "../star-classification";
import { CAT_SET, SAT_SET } from "./star-sets";
import { SCORING_WEIGHTS, type ScoringWeights } from "./weights";
import { scoreFortuneFrame } from "./frame";
import { scoreLuuNguyetFrame } from "./monthly-flow";
import type {
  LuuNienTrendOptions,
  PalaceStrength,
  ScoreLine,
  TrendPoint,
} from "./types";
import {
  finalizeLayer,
  findDauQuanPalace,
  isMutagenStar,
  mutagenKind,
  palaceStemForYear,
  voidBranches,
} from "./util";

const LUUN_NIEN_MONTH_LABELS = [
  "Giêng",
  "Hai",
  "Ba",
  "Tư",
  "Năm",
  "Sáu",
  "Bảy",
  "Tám",
  "Chín",
  "Mười",
  "Một",
  "Chạp",
] as const;

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
    // Spec 6 bước: Tứ Hóa GỐC only — không lấy sao lưu / ĐV mutagen.
    const scored = scoreFortuneFrame(
      chart,
      palace,
      weights,
      [{ label: "Gốc", records: chart.natalMutagens }],
      { includeAnnual: false },
    );

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
 * 12 khung lưu nguyệt cho biểu đồ Lưu niên — luôn theo công thức Lưu niên:
 * Tháng Giêng khởi tại cung Lưu Đẩu Quân, các tháng kế tiếp đếm thuận;
 * can Tứ Hóa tháng theo cung an vị (không phụ thuộc flowBase an trên lá số).
 */
function buildLuuNienScoreMonths(chart: ChartData): FlowMonthEntry[] {
  const fallback = chart.monthlyPalaces ?? [];
  const startPalace = findDauQuanPalace(chart);
  if (!startPalace || !chart.palaces.length) return fallback;

  return Array.from({ length: 12 }, (_, offset) => {
    const palaceIndex = (startPalace.index + offset) % 12;
    const palace =
      chart.palaces.find((item) => item.index === palaceIndex) ??
      chart.palaces[palaceIndex]!;
    const month = offset + 1;
    return {
      month,
      label: LUUN_NIEN_MONTH_LABELS[offset] ?? `Th.${month}`,
      palace,
      stem: palaceStemForYear(chart.annualStem, palace.index),
      branch: palace.branch,
    };
  });
}

/**
 * Xu hướng Lưu niên: 12 tháng âm trong năm xem.
 * Cung hạn = cung nguyệt hạn Lưu niên (T1 = Lưu Đẩu Quân, không lấy thẳng
 * monthlyPalaces khi lá số đang an theo Tiểu Hạn).
 * Chấm điểm qua engine Tầng 4 độc lập (`scoreLuuNguyetFrame`, monthly-flow.ts)
 * — Nguyệt Tứ Hóa/Lộc Tồn/Kình/Đà + guardrail Kỵ Trùng Kỵ/Lộc Trùng Lộc/
 * Xung Thái Tuế/Khoa Chế Nguyệt Kỵ. Không dùng `scoreFortuneFrame` (Đại Vận).
 */
export function getLuuNienTrend(
  chart: ChartData,
  opts: LuuNienTrendOptions,
  asOf: Date = new Date(),
): TrendPoint[] {
  const months = buildLuuNienScoreMonths(chart);
  if (!months.length) return [];

  const engine = getEngine(opts.school);
  if (!engine) return [];

  const currentMonth = resolveCurrentFlowMonth(chart, months, opts, asOf);
  const points: TrendPoint[] = [];

  for (const entry of months) {
    if (!entry.palace) continue;

    const scored = scoreLuuNguyetFrame(chart, engine, entry);

    const monthLabel = entry.label ?? `Th.${entry.month}`;
    points.push({
      label: monthLabel,
      cat: scored.cat,
      hung: scored.hung,
      isCurrent: entry.month === currentMonth,
      breakdown: scored.breakdown,
    });
  }

  return points;
}

function resolveCurrentFlowMonth(
  chart: ChartData,
  months: NonNullable<ChartData["monthlyPalaces"]>,
  opts: LuuNienTrendOptions,
  asOf: Date,
): number | null {
  if (chart.annualYear !== asOf.getFullYear()) return null;
  const engine = getEngine(opts.school);
  if (!engine) return null;

  const timeZone = Number(opts.birthInput.timezone) || 7;
  const lunar = engine.solarToLunar(
    asOf.getDate(),
    asOf.getMonth() + 1,
    asOf.getFullYear(),
    timeZone,
  );
  const exact = months.find((entry) => entry.month === lunar.month);
  if (exact) return exact.month;
  const fallback =
    months[Math.min(Math.max(lunar.month - 1, 0), months.length - 1)];
  return fallback?.month ?? null;
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

