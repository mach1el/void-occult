/**
 * Radar vận hạn 6 trục theo năm xem — heuristic tất định.
 *
 * B_D lấy từ `getPalaceStrengths` (thang 0–100). Sao Lưu quét cung chính (70%)
 * và đối cung của từng trục. Guardrails áp sau cộng sao, trước clamp.
 */

import type { ChartData, ChartPalace, ChartStar, School } from "@/types/chart";
import { isAnnualStar } from "../star-classification";
import { getPalaceStrengths } from "./palace-radar";
import type { AnnualAxisName, AnnualAxisStrength, ScoreLine } from "./types";
import { XUNG_CHIEU } from "./zones";

export type { AnnualAxisName, AnnualAxisStrength };

export const ANNUAL_AXIS_ORDER: AnnualAxisName[] = [
  "Sức khỏe",
  "Gia đạo",
  "Tài lộc",
  "Công việc",
  "Giao hữu",
  "Tình duyên",
];

interface AxisConfig {
  axis: AnnualAxisName;
  mainPalace: string;
  weights: ReadonlyArray<readonly [string, number]>;
  domainPalaces: readonly string[];
}

const AXIS_CONFIGS: readonly AxisConfig[] = [
  {
    axis: "Sức khỏe",
    mainPalace: "Tật Ách",
    weights: [
      ["Tật Ách", 0.7],
      ["Mệnh", 0.3],
    ],
    domainPalaces: ["Tật Ách", "Mệnh"],
  },
  {
    axis: "Gia đạo",
    mainPalace: "Điền Trạch",
    weights: [
      ["Điền Trạch", 0.7],
      ["Phụ Mẫu", 0.15],
      ["Tử Tức", 0.15],
    ],
    domainPalaces: ["Điền Trạch", "Phụ Mẫu", "Tử Tức"],
  },
  {
    axis: "Tài lộc",
    mainPalace: "Tài Bạch",
    weights: [
      ["Tài Bạch", 0.7],
      ["Phúc Đức", 0.3],
    ],
    domainPalaces: ["Tài Bạch", "Phúc Đức"],
  },
  {
    axis: "Công việc",
    mainPalace: "Quan Lộc",
    weights: [
      ["Quan Lộc", 0.7],
      ["Thiên Di", 0.3],
    ],
    domainPalaces: ["Quan Lộc", "Thiên Di"],
  },
  {
    axis: "Giao hữu",
    mainPalace: "Nô Bộc",
    weights: [
      ["Nô Bộc", 0.7],
      ["Thiên Di", 0.3],
    ],
    domainPalaces: ["Nô Bộc", "Thiên Di"],
  },
  {
    axis: "Tình duyên",
    mainPalace: "Phu Thê",
    weights: [
      ["Phu Thê", 0.7],
      ["Phúc Đức", 0.3],
    ],
    domainPalaces: ["Phu Thê", "Phúc Đức"],
  },
] as const;

const ANNUAL_STAR_POINTS: Record<string, number> = {
  "Lưu Lộc Tồn": 12,
  "Lưu Hóa Lộc": 12,
  "Lưu Hóa Quyền": 10,
  "Lưu Hóa Khoa": 8,
  "Lưu Hóa Kỵ": -15,
  "Lưu Kình Dương": -8,
  "Lưu Đà La": -8,
  "Lưu Tang Môn": -6,
  "Lưu Bạch Hổ": -6,
  "Lưu Thiên Khốc": -6,
  "Lưu Thiên Hư": -6,
};

const LOC_STARS = new Set(["Lưu Hóa Lộc", "Lưu Lộc Tồn"]);
const KY_KHONG_KIEP_STARS = new Set([
  "Lưu Hóa Kỵ",
  "Lưu Địa Không",
  "Lưu Địa Kiếp",
]);
const QUYEN_LOC_STARS = new Set(["Lưu Hóa Quyền", "Lưu Hóa Lộc", "Lưu Lộc Tồn"]);

export interface AnnualAxisRadarOptions {
  school: School;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function palaceByName(chart: ChartData, name: string): ChartPalace | undefined {
  return chart.palaces.find((p) => p.name === name);
}

function palaceByBranch(chart: ChartData, branch: string): ChartPalace | undefined {
  return chart.palaces.find((p) => p.branch === branch);
}

function oppositePalace(chart: ChartData, palace: ChartPalace): ChartPalace | undefined {
  const oppositeBranch = XUNG_CHIEU[palace.branch];
  if (!oppositeBranch) return undefined;
  return palaceByBranch(chart, oppositeBranch);
}

function hasAnnualStar(palaces: ChartPalace[], names: Set<string>): boolean {
  return palaces.some((palace) =>
    (palace.stars ?? []).some((star) => isAnnualStar(star) && names.has(star.name)),
  );
}

function computeBase(
  weights: ReadonlyArray<readonly [string, number]>,
  scoreMap: Map<string, number>,
): number {
  let base = 0;
  for (const [palace, weight] of weights) {
    base += (scoreMap.get(palace) ?? 0) * weight;
  }
  return base;
}

function scoreAnnualStar(star: ChartStar): number | null {
  return ANNUAL_STAR_POINTS[star.name] ?? null;
}

function collectDynamicLines(
  scanPalaces: ChartPalace[],
): { points: number; lines: ScoreLine[] } {
  const lines: ScoreLine[] = [];
  let points = 0;
  for (const palace of scanPalaces) {
    for (const star of palace.stars ?? []) {
      if (!isAnnualStar(star)) continue;
      const delta = scoreAnnualStar(star);
      if (delta == null) continue;
      points += delta;
      lines.push({
        source: star.name,
        points: delta,
        reason: `Sao lưu tại ${palace.name}`,
      });
    }
  }
  return { points, lines };
}

export function getAnnualAxisStrengths(
  chart: ChartData,
  { school }: AnnualAxisRadarOptions,
): AnnualAxisStrength[] {
  const palaceStrengths = getPalaceStrengths(chart, { school });
  const scoreMap = new Map(palaceStrengths.map((item) => [item.palace, item.score]));
  const year = chart.annualYear;
  const smallLimitPalace = chart.smallLimitPalace?.name ?? null;

  const draft = AXIS_CONFIGS.map((config) => {
    const base = computeBase(config.weights, scoreMap);
    const main = palaceByName(chart, config.mainPalace);
    const scanPalaces = main
      ? [main, oppositePalace(chart, main)].filter(
          (palace): palace is ChartPalace => palace != null,
        )
      : [];

    const baseLines: ScoreLine[] = config.weights.map(([palace, weight]) => ({
      source: palace,
      points: Math.round((scoreMap.get(palace) ?? 0) * weight * 10) / 10,
      reason: `Nền ${Math.round(weight * 100)}%`,
    }));

    const dynamic = collectDynamicLines(scanPalaces);
    const raw = base + dynamic.points;

    return {
      axis: config.axis,
      base,
      raw,
      breakdown: [
        ...baseLines,
        ...dynamic.lines,
      ],
      config,
    };
  });

  const byAxis = new Map(draft.map((item) => [item.axis, item]));

  // Trading guard — trục Tài lộc
  const taiLocPalaces = (AXIS_CONFIGS.find((c) => c.axis === "Tài lộc")?.domainPalaces ?? [])
    .map((name) => palaceByName(chart, name))
    .filter((palace): palace is ChartPalace => palace != null);
  const taiLoc = byAxis.get("Tài lộc");
  if (
    taiLoc &&
    hasAnnualStar(taiLocPalaces, LOC_STARS) &&
    hasAnnualStar(taiLocPalaces, KY_KHONG_KIEP_STARS)
  ) {
    const before = taiLoc.raw;
    taiLoc.raw *= 0.6;
    taiLoc.breakdown.push({
      source: "Trading Guard",
      points: Math.round(taiLoc.raw - before),
      reason: "Lộc/Lộc Tồn gặp Kỵ/Không/Kiếp trên trục Tài lộc ×0.6",
    });
  }

  // Family/Health — Tang + Bạch Hổ trên Gia đạo hoặc Tình duyên → Sức khỏe −10
  const familyPalaces = ["Gia đạo", "Tình duyên"].flatMap((axis) => {
    const config = AXIS_CONFIGS.find((c) => c.axis === axis);
    if (!config) return [];
    return config.domainPalaces
      .map((name) => palaceByName(chart, name))
      .filter((palace): palace is ChartPalace => palace != null);
  });
  const hasTang = hasAnnualStar(familyPalaces, new Set(["Lưu Tang Môn"]));
  const hasHo = hasAnnualStar(familyPalaces, new Set(["Lưu Bạch Hổ"]));
  const sucKhoe = byAxis.get("Sức khỏe");
  if (sucKhoe && hasTang && hasHo) {
    sucKhoe.raw -= 10;
    sucKhoe.breakdown.push({
      source: "Family/Health Guard",
      points: -10,
      reason: "Tang Môn + Bạch Hổ trên Gia đạo hoặc Tình duyên",
    });
  }

  // Career boost — Thiên Mã tại Quan Lộc/Thiên Di gặp Quyền/Lộc
  const careerPalaces = ["Quan Lộc", "Thiên Di"]
    .map((name) => palaceByName(chart, name))
    .filter((palace): palace is ChartPalace => palace != null);
  const congViec = byAxis.get("Công việc");
  if (
    congViec &&
    hasAnnualStar(careerPalaces, new Set(["Lưu Thiên Mã"])) &&
    hasAnnualStar(careerPalaces, QUYEN_LOC_STARS)
  ) {
    congViec.raw += 15;
    congViec.breakdown.push({
      source: "Career Boost",
      points: 15,
      reason: "Lưu Thiên Mã tại Quan Lộc/Thiên Di gặp Lưu Quyền/Lộc",
    });
  }

  return ANNUAL_AXIS_ORDER.map((axis) => {
    const item = byAxis.get(axis)!;
    return {
      axis,
      score: clampScore(item.raw),
      base: Math.round(item.base * 10) / 10,
      breakdown: item.breakdown,
      year,
      smallLimitPalace,
    };
  });
}
