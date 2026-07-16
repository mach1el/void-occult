/**
 * Engine chấm điểm xu hướng Tử Vi — TẤT ĐỊNH.
 *
 * Đường cong = kết quả heuristic cấu hình qua `scoring-weights.ts`, không phải
 * chân lý. LLM không được gọi từ đây. Hai lớp `taiLoc` / `thachThuc` độc lập,
 * không trừ nhau.
 *
 * Chỉ ĐỌC ChartData / gọi lại engine.calculate với annualYear khác — không đổi
 * logic an sao.
 */

import type {
  BirthInput,
  ChartData,
  ChartPalace,
  ChartStar,
  MutagenRecord,
  School,
} from "@/types/chart";
import { getEngine } from "./chart";
import {
  baseStarName,
  isStrongBrightness,
} from "./star-classification";
import {
  CAT_TINH_NAMES,
  KEY_PALACE_NAMES,
  SAT_TINH_NAMES,
  SCORING_WEIGHTS,
  TAI_TUE_HUNG_NAMES,
  type ScoringWeights,
} from "./scoring-weights";

export interface ScoreLine {
  source: string;
  points: number;
  reason: string;
}

export interface TrendPoint {
  label: string;
  /** Cơ hội — thang 0–100, độc lập với thachThuc. */
  taiLoc: number;
  /** Rủi ro — thang 0–100, độc lập với taiLoc. */
  thachThuc: number;
  isCurrent: boolean;
  breakdown: {
    taiLoc: ScoreLine[];
    thachThuc: ScoreLine[];
  };
}

// Cùng bảng đã dùng trong CompactChart — không invent, chỉ tái dùng quan hệ địa chi.
const TAM_HOP: Record<string, string[]> = {
  Dần: ["Dần", "Ngọ", "Tuất"],
  Ngọ: ["Dần", "Ngọ", "Tuất"],
  Tuất: ["Dần", "Ngọ", "Tuất"],
  Thân: ["Thân", "Tý", "Thìn"],
  Tý: ["Thân", "Tý", "Thìn"],
  Thìn: ["Thân", "Tý", "Thìn"],
  Tỵ: ["Tỵ", "Dậu", "Sửu"],
  Dậu: ["Tỵ", "Dậu", "Sửu"],
  Sửu: ["Tỵ", "Dậu", "Sửu"],
  Hợi: ["Hợi", "Mão", "Mùi"],
  Mão: ["Hợi", "Mão", "Mùi"],
  Mùi: ["Hợi", "Mão", "Mùi"],
};

const XUNG_CHIEU: Record<string, string> = {
  Tý: "Ngọ",
  Sửu: "Mùi",
  Dần: "Thân",
  Mão: "Dậu",
  Thìn: "Tuất",
  Tỵ: "Hợi",
  Ngọ: "Tý",
  Mùi: "Sửu",
  Thân: "Dần",
  Dậu: "Mão",
  Tuất: "Thìn",
  Hợi: "Tỵ",
};

const CAT_SET = new Set<string>(CAT_TINH_NAMES);
const SAT_SET = new Set<string>(SAT_TINH_NAMES);
const TAI_TUE_HUNG_SET = new Set<string>(TAI_TUE_HUNG_NAMES);
const KEY_SET = new Set<string>(KEY_PALACE_NAMES);

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sumLines(lines: ScoreLine[]): number {
  return lines.reduce((total, line) => total + line.points, 0);
}

function finalizeLayer(lines: ScoreLine[]): { score: number; lines: ScoreLine[] } {
  const raw = sumLines(lines);
  const score = clamp100(raw);
  // Giữ tổng breakdown = điểm hiển thị: nếu clamp cắt, ghi một dòng điều chỉnh.
  if (score !== raw) {
    return {
      score,
      lines: [
        ...lines,
        {
          source: "Chuẩn hóa",
          points: score - raw,
          reason: `Clamp về thang 0–100 (thô ${raw})`,
        },
      ],
    };
  }
  return { score, lines };
}

function starBase(star: ChartStar): string {
  return baseStarName(star.name).replace(/^ĐV\s+/, "").replace(/^Hóa\s+/, "Hóa ");
}

function isMutagenStar(star: ChartStar): boolean {
  return (star.source ?? "").endsWith("-mutagen") || Boolean(star.mutagen);
}

function mutagenKind(star: ChartStar): "Lộc" | "Quyền" | "Khoa" | "Kỵ" | null {
  const blob = `${star.name} ${star.mutagen ?? ""}`;
  if (/Kỵ/.test(blob)) return "Kỵ";
  if (/Lộc/.test(blob)) return "Lộc";
  if (/Quyền/.test(blob)) return "Quyền";
  if (/Khoa/.test(blob)) return "Khoa";
  return null;
}

function palaceByName(chart: ChartData, name: string): ChartPalace | undefined {
  return chart.palaces.find((palace) => palace.name === name);
}

function isKeyPalace(palace: ChartPalace): boolean {
  return KEY_SET.has(palace.name) || Boolean(palace.isMenh);
}

function voidBranches(chart: ChartData): Set<string> {
  const set = new Set<string>();
  for (const marker of chart.voidMarkers ?? []) {
    for (const branch of marker.branches) set.add(branch);
  }
  return set;
}

function mutagenAtPalace(
  records: MutagenRecord[] | undefined,
  palace: ChartPalace,
): MutagenRecord[] {
  return (records ?? []).filter(
    (record) =>
      record.palace &&
      (record.palace.index === palace.index ||
        record.palace.branch === palace.branch ||
        record.palace.name === palace.name),
  );
}

function scoreFocusPalaces(
  chart: ChartData,
  focus: ChartPalace[],
  weights: ScoringWeights,
  mutagenSources: {
    label: string;
    records: MutagenRecord[] | undefined;
  }[],
): Pick<TrendPoint, "taiLoc" | "thachThuc" | "breakdown"> {
  const taiLoc: ScoreLine[] = [];
  const thachThuc: ScoreLine[] = [];
  const voids = voidBranches(chart);
  const focusBranches = new Set(focus.map((palace) => palace.branch));
  const xungBranches = new Set(
    [...focusBranches]
      .map((branch) => XUNG_CHIEU[branch])
      .filter(Boolean),
  );

  for (const palace of focus) {
    const stars = palace.stars ?? [];
    let satCount = 0;

    for (const star of stars) {
      const base = baseStarName(star.name);

      if (isMutagenStar(star)) {
        const kind = mutagenKind(star);
        if (kind === "Lộc" && isKeyPalace(palace)) {
          taiLoc.push({
            source: star.name,
            points: weights.mutagenLocKeyPalace,
            reason: `${star.name} tại ${palace.name} (cung trọng)`,
          });
        } else if (kind === "Quyền" && isKeyPalace(palace)) {
          taiLoc.push({
            source: star.name,
            points: weights.mutagenQuyenKeyPalace,
            reason: `${star.name} tại ${palace.name} (cung trọng)`,
          });
        } else if (kind === "Khoa" && isKeyPalace(palace)) {
          taiLoc.push({
            source: star.name,
            points: weights.mutagenKhoaKeyPalace,
            reason: `${star.name} tại ${palace.name} (cung trọng)`,
          });
        } else if (kind === "Kỵ") {
          thachThuc.push({
            source: star.name,
            points: weights.mutagenKyKeyOrXung,
            reason: `${star.name} tại ${palace.name}`,
          });
        }
      }

      if (CAT_SET.has(base) || CAT_SET.has(starBase(star))) {
        taiLoc.push({
          source: star.name,
          points: weights.beneficMeet,
          reason: `Cát tinh ${star.name} hội tại ${palace.name}`,
        });
      }

      if (SAT_SET.has(base)) {
        satCount += 1;
        thachThuc.push({
          source: star.name,
          points: weights.maleficMeet,
          reason: `Sát tinh ${star.name} hội tại ${palace.name}`,
        });
      }

      if (TAI_TUE_HUNG_SET.has(base)) {
        thachThuc.push({
          source: star.name,
          points: weights.taiTueHung,
          reason: `Thái Tuế hung ${star.name} tại ${palace.name}`,
        });
      }

      if (star.layer === "major") {
        if (isStrongBrightness(star.brightness)) {
          taiLoc.push({
            source: star.name,
            points: weights.majorMieuVuong,
            reason: `Chính tinh ${star.name} ${star.brightness} tại ${palace.name}`,
          });
        } else if (star.brightness === "Hãm") {
          thachThuc.push({
            source: star.name,
            points: weights.majorHam,
            reason: `Chính tinh ${star.name} Hãm tại ${palace.name}`,
          });
        }
      }
    }

    if (satCount >= 2) {
      thachThuc.push({
        source: "Trùng phùng sát",
        points: weights.maleficClusterBonus,
        reason: `${satCount} sát tinh đồng cung ${palace.name}`,
      });
    }

    if (voids.has(palace.branch)) {
      thachThuc.push({
        source: "Tuần/Triệt",
        points: weights.voidOnFocus,
        reason: `Tuần/Triệt án ngữ ${palace.name} (${palace.branch})`,
      });
    }

    // Tam hợp cát: cung cùng bộ với focus có cát tinh.
    const hop = TAM_HOP[palace.branch] ?? [];
    for (const branch of hop) {
      if (branch === palace.branch) continue;
      const peer = chart.palaces.find((item) => item.branch === branch);
      if (!peer) continue;
      const hasCat = (peer.stars ?? []).some((star) =>
        CAT_SET.has(baseStarName(star.name)),
      );
      if (hasCat) {
        taiLoc.push({
          source: `Tam hợp ${branch}`,
          points: weights.tamHopCat,
          reason: `Cát tinh hội tam hợp với ${palace.name} qua ${branch}`,
        });
      }
    }
  }

  // Mutagen records (đôi khi sao chưa gắn vào palace.stars đủ rõ nguồn)
  for (const { label, records } of mutagenSources) {
    for (const record of records ?? []) {
      const palace = record.palace;
      if (!palace) continue;
      const onKey = isKeyPalace(palace) || focus.some((item) => item.index === palace.index);
      const onXung = xungBranches.has(palace.branch);
      if (record.mutagen.includes("Kỵ") && (onKey || onXung)) {
        // Tránh double-count nếu đã ghi từ stars
        const already = thachThuc.some(
          (line) =>
            line.source.includes("Kỵ") && line.reason.includes(palace.name),
        );
        if (!already) {
          thachThuc.push({
            source: `${label} Hóa Kỵ`,
            points: weights.mutagenKyKeyOrXung,
            reason: `${label} Hóa Kỵ→${record.starName} tại/xung ${palace.name}`,
          });
        }
      }
      if (!onKey) continue;
      if (record.mutagen.includes("Lộc")) {
        const already = taiLoc.some(
          (line) =>
            line.source.includes("Lộc") && line.reason.includes(palace.name),
        );
        if (!already) {
          taiLoc.push({
            source: `${label} Hóa Lộc`,
            points: weights.mutagenLocKeyPalace,
            reason: `${label} Hóa Lộc→${record.starName} tại ${palace.name}`,
          });
        }
      } else if (record.mutagen.includes("Quyền")) {
        const already = taiLoc.some(
          (line) =>
            line.source.includes("Quyền") && line.reason.includes(palace.name),
        );
        if (!already) {
          taiLoc.push({
            source: `${label} Hóa Quyền`,
            points: weights.mutagenQuyenKeyPalace,
            reason: `${label} Hóa Quyền→${record.starName} tại ${palace.name}`,
          });
        }
      } else if (record.mutagen.includes("Khoa")) {
        const already = taiLoc.some(
          (line) =>
            line.source.includes("Khoa") && line.reason.includes(palace.name),
        );
        if (!already) {
          taiLoc.push({
            source: `${label} Hóa Khoa`,
            points: weights.mutagenKhoaKeyPalace,
            reason: `${label} Hóa Khoa→${record.starName} tại ${palace.name}`,
          });
        }
      }
    }
  }

  const tai = finalizeLayer(taiLoc);
  const thach = finalizeLayer(thachThuc);
  return {
    taiLoc: tai.score,
    thachThuc: thach.score,
    breakdown: { taiLoc: tai.lines, thachThuc: thach.lines },
  };
}

function keyPalaces(chart: ChartData): ChartPalace[] {
  const list = chart.palaces.filter((palace) => isKeyPalace(palace));
  if (chart.annualPalace && !list.some((item) => item.index === chart.annualPalace?.index)) {
    list.push(chart.annualPalace);
  }
  if (chart.taiTuePalace && !list.some((item) => item.index === chart.taiTuePalace?.index)) {
    list.push(chart.taiTuePalace);
  }
  return list;
}

/**
 * Xu hướng Đại Vận: một điểm cho mỗi cung có `majorFortune`, sắp theo tuổi bắt đầu.
 */
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
    // Tập trung cung đại vận + tam hợp của nó (không trộn mọi cung trọng mỗi mốc).
    const hopBranches = new Set(TAM_HOP[palace.branch] ?? [palace.branch]);
    const focus = chart.palaces.filter(
      (item) => item.index === palace.index || hopBranches.has(item.branch),
    );
    const scored = scoreFocusPalaces(chart, focus, weights, [
      {
        label: "ĐV",
        records: fortune.active
          ? chart.majorMutagens
          : mutagenAtPalace(chart.majorMutagens, palace),
      },
      {
        label: "Gốc",
        records: mutagenAtPalace(chart.natalMutagens, palace),
      },
    ]);

    return {
      label: `${fortune.start}-${fortune.end}`,
      taiLoc: scored.taiLoc,
      thachThuc: scored.thachThuc,
      isCurrent: Boolean(fortune.active),
      breakdown: scored.breakdown,
    };
  });
}

export interface LuuNienTrendOptions {
  school: School;
  birthInput: BirthInput;
  weights?: ScoringWeights;
}

/**
 * Xu hướng Lưu niên: ±span năm quanh centerYear.
 * Mỗi năm gọi lại engine.calculate với annualYear tương ứng (không đổi an sao).
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

    const focus = keyPalaces(yearChart);
    const scored = scoreFocusPalaces(yearChart, focus, weights, [
      { label: "Lưu", records: yearChart.annualMutagens },
      { label: "Gốc", records: yearChart.natalMutagens },
    ]);

    points.push({
      label: `${year} · ${yearChart.nominalAge}t`,
      taiLoc: scored.taiLoc,
      thachThuc: scored.thachThuc,
      isCurrent: year === chart.annualYear,
      breakdown: scored.breakdown,
    });
  }

  return points;
}
