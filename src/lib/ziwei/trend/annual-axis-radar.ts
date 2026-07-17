/**
 * Radar vận hạn 6 trục theo năm xem — heuristic tất định.
 *
 * B_D lấy từ `getPalaceStrengths` (thang 0–100). Sao Lưu quét cung chính (70%)
 * và đối cung của từng trục. Guardrails áp sau cộng sao, trước clamp.
 */

import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { isAnnualStar } from "../star-classification";
import { getPalaceStrengths } from "./palace-radar";
import type { AnnualAxisName, AnnualAxisStrength, ScoreLine } from "./types";
import { TAM_HOP, XUNG_CHIEU } from "./zones";

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
  "Lưu Tang Môn": -8,
  "Lưu Bạch Hổ": -8,
  "Lưu Thiên Khốc": -5,
  "Lưu Thiên Hư": -5,
  "Lưu Đại Hao": -5,
  "Lưu Thiên Khôi": 6,
  "Lưu Thiên Việt": 6,
  "Lưu Tả Phù": 6,
  "Lưu Hữu Bật": 6,
  "Lưu Đào Hoa": 8,
  "Lưu Hồng Loan": 8,
  "Lưu Thiên Hỷ": 8,
};

const LOC_STARS = new Set(["Lưu Hóa Lộc", "Lưu Lộc Tồn"]);
const KY_KHONG_KIEP_STARS = new Set([
  "Lưu Hóa Kỵ",
  "Lưu Địa Không",
  "Lưu Địa Kiếp",
]);
const QUYEN_LOC_STARS = new Set(["Lưu Hóa Quyền", "Lưu Hóa Lộc", "Lưu Lộc Tồn"]);
const MA_BROKEN_STARS = new Set(["Lưu Hóa Kỵ", "Lưu Đà La"]);
const LOVE_STARS = new Set(["Lưu Đào Hoa", "Lưu Hồng Loan", "Lưu Thiên Hỷ"]);
const LOVE_DRAMA_STARS = new Set(["Lưu Hóa Kỵ", "Lưu Đà La", "Lưu Địa Kiếp"]);

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

function hasVoidMarker(chart: ChartData, palace: ChartPalace): boolean {
  return (chart.voidMarkers ?? []).some(
    (marker) =>
      (marker.type === "Tuần" || marker.type === "Triệt") &&
      marker.branches.includes(palace.branch),
  );
}

function collectDynamicLines(
  chart: ChartData,
  mainPalace: ChartPalace,
  opposite: ChartPalace | undefined,
): { points: number; lines: ScoreLine[] } {
  const lines: ScoreLine[] = [];
  let points = 0;
  const scanPalaces: Array<{ palace: ChartPalace; geometry: number }> = [
    { palace: mainPalace, geometry: 1 },
    ...(opposite ? [{ palace: opposite, geometry: 0.5 }] : []),
  ];
  const scanned = scanPalaces.map(({ palace }) => palace);
  const maHasBadStar = hasAnnualStar(scanned, MA_BROKEN_STARS);

  for (const { palace, geometry } of scanPalaces) {
    for (const star of palace.stars ?? []) {
      if (!isAnnualStar(star)) continue;
      const maBroken = maHasBadStar || hasVoidMarker(chart, palace);
      const baseDelta =
        star.name === "Lưu Thiên Mã"
          ? maBroken
            ? -6
            : 6
          : scoreAnnualStar(star);
      if (baseDelta == null) continue;
      const delta = baseDelta * geometry;
      points += delta;
      lines.push({
        source: star.name,
        points: Math.round(delta * 10) / 10,
        reason: [
          `Sao lưu tại ${palace.name}`,
          geometry === 0.5 ? "đối cung ×0.5" : "",
          star.name === "Lưu Thiên Mã" && maBroken
            ? "gặp Kỵ/Đà/Tuần/Triệt"
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }
  return { points, lines };
}

function activationLine(
  chart: ChartData,
  main: ChartPalace,
): ScoreLine | null {
  const activators = [chart.smallLimitPalace, chart.taiTuePalace].filter(
    (palace): palace is ChartPalace => palace != null,
  );
  const exact = activators.some((palace) => palace.branch === main.branch);
  const tamHop = activators.some((palace) =>
    (TAM_HOP[main.branch] ?? []).includes(palace.branch),
  );
  if (!exact && !tamHop) return null;

  const mainHasKy = (main.stars ?? []).some(
    (star) => isAnnualStar(star) && star.name === "Lưu Hóa Kỵ",
  );
  const points = exact ? (mainHasKy ? 0 : 10) : 5;
  return {
    source: "Kích hoạt năm",
    points,
    reason: exact
      ? mainHasKy
        ? "Tiểu Hạn/Lưu Thái Tuế trùng cung chính (+10) gặp Lưu Hóa Kỵ (−10)"
        : "Tiểu Hạn/Lưu Thái Tuế trùng cung chính"
      : "Tiểu Hạn/Lưu Thái Tuế tam hợp cung chính",
  };
}

export function getAnnualAxisStrengths(
  chart: ChartData,
): AnnualAxisStrength[] {
  const palaceStrengths = getPalaceStrengths(chart);
  const scoreMap = new Map(palaceStrengths.map((item) => [item.palace, item.score]));
  const year = chart.annualYear;
  const smallLimitPalace = chart.smallLimitPalace?.name ?? null;

  const draft = AXIS_CONFIGS.map((config) => {
    const base = computeBase(config.weights, scoreMap);
    const main = palaceByName(chart, config.mainPalace);
    const opposite = main ? oppositePalace(chart, main) : undefined;
    const scanPalaces = [main, opposite].filter(
      (palace): palace is ChartPalace => palace != null,
    );

    // Giữ float gốc cho từng dòng nền — làm tròn hiển thị ở presentation
    // (`formatUIBreakdown`) để B_D trên UI = tổng các số đã hiện (WYSIWYG).
    const baseLines: ScoreLine[] = config.weights.map(([palace, weight]) => ({
      source: palace,
      points: (scoreMap.get(palace) ?? 0) * weight,
      reason: `Nền ${Math.round(weight * 100)}%`,
    }));

    const dynamic = main
      ? collectDynamicLines(chart, main, opposite)
      : { points: 0, lines: [] };
    const activation = main ? activationLine(chart, main) : null;
    const raw = base + dynamic.points + (activation?.points ?? 0);

    return {
      axis: config.axis,
      base,
      raw,
      breakdown: [
        ...baseLines,
        ...dynamic.lines,
        ...(activation ? [activation] : []),
      ],
      config,
      scanPalaces,
    };
  });

  const byAxis = new Map(draft.map((item) => [item.axis, item]));

  // Trading guard — trục Tài lộc
  const taiLoc = byAxis.get("Tài lộc");
  if (
    taiLoc &&
    hasAnnualStar(taiLoc.scanPalaces, LOC_STARS) &&
    hasAnnualStar(taiLoc.scanPalaces, KY_KHONG_KIEP_STARS)
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
  const familyTriggered = (["Gia đạo", "Tình duyên"] as AnnualAxisName[]).some(
    (axis) => {
      const palaces = byAxis.get(axis)?.scanPalaces ?? [];
      return (
        hasAnnualStar(palaces, new Set(["Lưu Tang Môn"])) &&
        hasAnnualStar(palaces, new Set(["Lưu Bạch Hổ"]))
      );
    },
  );
  const sucKhoe = byAxis.get("Sức khỏe");
  if (sucKhoe && familyTriggered) {
    sucKhoe.raw -= 10;
    sucKhoe.breakdown.push({
      source: "Family/Health Guard",
      points: -10,
      reason: "Tang Môn + Bạch Hổ trên Gia đạo hoặc Tình duyên",
    });
  }

  // Career boost — Thiên Mã tại Quan Lộc/Thiên Di gặp Quyền/Lộc
  const congViec = byAxis.get("Công việc");
  if (
    congViec &&
    hasAnnualStar(congViec.scanPalaces, new Set(["Lưu Thiên Mã"])) &&
    hasAnnualStar(congViec.scanPalaces, QUYEN_LOC_STARS)
  ) {
    congViec.raw += 15;
    congViec.breakdown.push({
      source: "Career Boost",
      points: 15,
      reason: "Lưu Thiên Mã tại Quan Lộc/Thiên Di gặp Lưu Quyền/Lộc",
    });
  }

  // Đào Hoa Sát — điểm +8 của từng Đào/Hồng/Hỷ đổi thành −10.
  const tinhDuyen = byAxis.get("Tình duyên");
  if (
    tinhDuyen &&
    hasAnnualStar(tinhDuyen.scanPalaces, LOVE_STARS) &&
    hasAnnualStar(tinhDuyen.scanPalaces, LOVE_DRAMA_STARS)
  ) {
    let reversal = 0;
    for (const palace of tinhDuyen.scanPalaces) {
      const geometry =
        palace.name === tinhDuyen.config.mainPalace ? 1 : 0.5;
      const count = (palace.stars ?? []).filter(
        (star) => isAnnualStar(star) && LOVE_STARS.has(star.name),
      ).length;
      reversal += count * -18 * geometry;
    }
    tinhDuyen.raw += reversal;
    tinhDuyen.breakdown.push({
      source: "Đào Hoa Sát",
      points: reversal,
      reason: "Đào/Hồng/Hỷ gặp Kỵ/Đà/Địa Kiếp: mỗi điểm +8 đổi thành −10",
    });
  }

  return ANNUAL_AXIS_ORDER.map((axis) => {
    const item = byAxis.get(axis)!;
    return {
      axis,
      score: clampScore(item.raw),
      // Float gốc cho radar (nét đứt); UI tự format B_D hiển thị.
      base: item.base,
      breakdown: item.breakdown,
      year,
      smallLimitPalace,
    };
  });
}
