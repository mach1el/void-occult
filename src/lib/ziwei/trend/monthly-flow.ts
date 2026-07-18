/**
 * Engine Lưu Nguyệt (Tầng 4) — độc lập với `frame.ts` (Đại Vận/Lưu Niên).
 * Công thức: PHẦN V (Lưu Nguyệt 12 tháng) — thầy chốt 2026-07-17.
 *
 * Khác biệt cố ý với `scoreFortuneFrame`:
 * - TP4C cố định 1.0 / 0.5 / 0.3, KHÔNG có Home Turf (luật đó chỉ dành Đại Vận).
 * - KHÔNG áp Khoa Chế Không (Đại Vận) — Tầng 4 có Khoa Chế Nguyệt Kỵ riêng.
 * - KHÔNG chấm cách cục (CAT_xx/HUNG_xx) — spec Phần V chưa cung cấp danh mục
 *   cách cục riêng cho lưu nguyệt (AGENTS §4: không bịa danh mục). Combo_tháng
 *   tạm = 0, chờ thầy duyệt danh mục ở PR sau.
 * - KHÔNG âm thầm bỏ qua Tứ Hóa trùng cung giữa các lớp (khác `frame.ts` dòng
 *   346-350) — giữ lại toàn bộ để làm nền cho Kỵ Trùng Kỵ / Lộc Trùng Lộc.
 */

import type { ChartData, ChartEngine, ChartPalace, MutagenRecord } from "@/types/chart";
import { isAnnualStar } from "../star-classification";
import { palaceHasSalvation } from "./combo-eval";
import { computeStarEnergy, routeStarEnergy } from "./star-energy";
import type { MonthlyFocusEntry, ScoreLine, TrendPoint } from "./types";
import { roundTo1Decimal } from "./ui-breakdown";
import { finalizeLayer, isMutagenStar, voidBranches } from "./util";
import { TAM_HOP, XUNG_CHIEU } from "./zones";

type MonthRole = "focus" | "tam-hop" | "xung";

interface MonthFrameRow {
  palace: ChartPalace;
  role: MonthRole;
  weight: number;
}

const MONTH_ROLE_WEIGHT: Record<MonthRole, number> = {
  focus: 1,
  xung: 0.5,
  "tam-hop": 0.3,
};

/** TP4C tháng — trọng số cố định, không có luật Đất Nhà (chỉ Đại Vận mới có). */
function monthSanFangSiZheng(
  chart: ChartData,
  focus: ChartPalace,
): MonthFrameRow[] {
  const hop = new Set(TAM_HOP[focus.branch] ?? [focus.branch]);
  const xung = XUNG_CHIEU[focus.branch];
  const rows: MonthFrameRow[] = [];

  for (const palace of chart.palaces) {
    if (palace.index === focus.index) {
      rows.push({ palace, role: "focus", weight: MONTH_ROLE_WEIGHT.focus });
    } else if (xung && palace.branch === xung) {
      rows.push({ palace, role: "xung", weight: MONTH_ROLE_WEIGHT.xung });
    } else if (hop.has(palace.branch)) {
      rows.push({
        palace,
        role: "tam-hop",
        weight: MONTH_ROLE_WEIGHT["tam-hop"],
      });
    }
  }
  return rows;
}

function roleLabel(role: MonthRole, palace: ChartPalace): string {
  if (role === "focus") return `cung hạn ${palace.name}`;
  if (role === "xung") return `xung chiếu ${palace.name}`;
  return `tam hợp ${palace.name}`;
}

function scale(points: number, factor: number): number {
  return roundTo1Decimal(points * factor);
}

/**
 * Đưa tổng dòng về đúng `target` bằng cách chỉnh dòng lớn nhất (giữ WYSIWYG),
 * cùng pattern với `applyElementMultiplier`/`reconcileLinesToTarget` trong
 * frame.ts — copy cục bộ để không đụng frame.ts (Đại Vận).
 */
function reconcileToTarget(lines: ScoreLine[], target: number): ScoreLine[] {
  if (!lines.length) return lines;
  const result = lines.map((line) => ({ ...line }));
  const sum = roundTo1Decimal(
    result.reduce((total, line) => total + line.points, 0),
  );
  const diff = roundTo1Decimal(target - sum);
  if (diff === 0) return result;

  let bestIdx = 0;
  for (let i = 1; i < result.length; i++) {
    if ((result[i]?.points ?? 0) > (result[bestIdx]?.points ?? 0)) bestIdx = i;
  }
  const best = result[bestIdx]!;
  result[bestIdx] = {
    ...best,
    points: roundTo1Decimal(Math.max(0, best.points + diff)),
  };

  const after = roundTo1Decimal(
    result.reduce((total, line) => total + line.points, 0),
  );
  let leftover = roundTo1Decimal(target - after);
  if (leftover !== 0) {
    for (const line of result) {
      if (leftover === 0) break;
      if (leftover < 0 && line.points <= 0) continue;
      const step =
        leftover > 0 ? leftover : -Math.min(line.points, Math.abs(leftover));
      line.points = roundTo1Decimal(line.points + step);
      leftover = roundTo1Decimal(leftover - step);
    }
  }
  return result;
}

/** Nguyệt Tứ Hóa: can THÁNG riêng (không phải can năm). */
function monthlyMutagenRecords(
  chart: ChartData,
  engine: ChartEngine,
  stem: string | undefined,
): MutagenRecord[] {
  if (!stem) return [];
  return engine.tuHoaTargets(stem).map(({ mutagen, starName }) => {
    const palace =
      chart.palaces.find((palace) =>
        (palace.stars ?? []).some((star) => star.name === starName),
      ) ?? null;
    return { mutagen, starName, palace };
  });
}

type MutagenKind = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

function mutagenKindOf(mutagen: string): MutagenKind | null {
  if (mutagen.includes("Kỵ")) return "Kỵ";
  if (mutagen.includes("Lộc")) return "Lộc";
  if (mutagen.includes("Quyền")) return "Quyền";
  if (mutagen.includes("Khoa")) return "Khoa";
  return null;
}

/**
 * SSOT điểm Tứ Hóa Lưu Nguyệt — spec chốt, KHÔNG tra `star-scores.csv`.
 * CSV vẫn là SSOT cho sao nền (Bước A); Tứ Hóa tháng dùng đúng bảng này.
 */
const MONTHLY_MUTAGEN_POINTS: Record<MutagenKind, number> = {
  Lộc: 10,
  Quyền: 8,
  Khoa: 6,
  Kỵ: 15,
};

/** Δ cố định cho sao lưu tháng ngoài Tứ Hóa — theo đúng số spec Phần V. */
const NGUYET_LOC_TON_POINTS = 10;
const NGUYET_KINH_DA_POINTS = 8;

const KY_TRUNG_KY_BONUS = 25;
const LOC_TRUNG_LOC_BONUS = 25;
const TRUNG_MULTIPLIER = 1.3;
const XUNG_THAI_TUE_BONUS = 15;
/** Khoa Chế Nguyệt Kỵ: giảm 60% → còn lại 40%. */
const KHOA_CHE_NGUYET_KY_FACTOR = 0.4;

const NGUYET_KY_SOURCE = "Lưu nguyệt Hóa Kỵ";

interface LocKyHit {
  layer: "Lưu nguyệt" | "Lưu niên" | "Gốc";
  kind: "Lộc" | "Kỵ";
  palaceIndex: number;
}

export function scoreLuuNguyetFrame(
  chart: ChartData,
  engine: ChartEngine,
  monthEntry: MonthlyFocusEntry,
): Pick<TrendPoint, "cat" | "hung" | "breakdown"> {
  const focus = monthEntry.focusPalace;
  const cat: ScoreLine[] = [];
  const hung: ScoreLine[] = [];
  const voids = voidBranches(chart);
  const frame = monthSanFangSiZheng(chart, focus);
  const frameByIndex = new Map(frame.map((row) => [row.palace.index, row]));
  const hits: LocKyHit[] = [];

  // ── Bước A: quét sao gốc trong khung (chính tinh/phụ tinh + Tuần/Triệt +
  // Trường Sinh) — đây là "C_gốc_cung", giống mọi tầng vì cấu hình sao gốc
  // của một cung không đổi theo tháng/năm/đại vận. ──
  for (const { palace, role, weight: wCung } of frame) {
    const where = roleLabel(role, palace);

    for (const star of palace.stars ?? []) {
      if (isAnnualStar(star)) continue; // sao lưu niên không thuộc gốc cung
      // Marker Tứ Hóa (Hóa Lộc/Quyền/Khoa/Kỵ gắn trên palace.stars bởi
      // addMutagenStars) KHÔNG phải sao nền — SSOT chấm Tứ Hóa là Bước B,
      // chấm ở đây sẽ double-count (§7). Chính tinh nhận Tứ Hóa (vd Thái
      // Dương) vẫn được chấm bình thường vì bản thân nó không phải marker.
      if (isMutagenStar(star)) continue;
      const energy = computeStarEnergy(star);
      if (!energy) continue;
      const routed = routeStarEnergy(energy);
      if (!routed) continue;

      const points = scale(routed.points, wCung);
      if (points === 0) continue;

      // UI chuẩn: Tên sao + Độ sáng + Nguồn kích hoạt (luôn "base" ở đây vì
      // Bước A đã loại sao lưu niên ở trên) — giữ vị trí TP4C để không mất
      // minh bạch "hiện bài làm" (AGENTS §5).
      const brightLabel = energy.bright ?? energy.anchor;
      const line: ScoreLine = {
        source: star.name,
        points,
        reason: `${brightLabel} · base tại ${where}`,
      };
      if (routed.layer === "cat") cat.push(line);
      else hung.push(line);
    }

    if (voids.has(palace.branch)) {
      const types = (chart.voidMarkers ?? [])
        .filter((m) => m.branches.includes(palace.branch))
        .map((m) => m.type);
      for (const type of [...new Set(types)]) {
        hung.push({
          source: type,
          points: scale(6, wCung),
          reason: `${type} án ngữ ${where} (${palace.branch})`,
        });
      }
    }

    const cs = palace.changSheng;
    if (cs) {
      let layer: "cat" | "hung" = "cat";
      let pts = 0;
      if (["Tràng Sinh", "Đế Vượng"].includes(cs)) pts = 6;
      else if (["Lâm Quan", "Quan Đới"].includes(cs)) pts = 4;
      else if (["Thai", "Dưỡng"].includes(cs)) pts = 2;
      else if (["Bệnh", "Tử", "Mộ", "Tuyệt"].includes(cs)) {
        layer = "hung";
        pts = 6;
      } else if (["Suy", "Mộc Dục"].includes(cs)) {
        layer = "hung";
        pts = 4;
      }
      if (pts > 0) {
        const line: ScoreLine = {
          source: `Trường Sinh·${cs}`,
          points: scale(pts, wCung),
          reason: `${cs} tại ${where}`,
        };
        if (layer === "cat") cat.push(line);
        else hung.push(line);
      }
    }
  }

  // ── Bước B: 3 lớp Tứ Hóa (Nguyệt/Lưu niên/Gốc) + Nguyệt Lộc Tồn/Kình/Đà ──
  const mutagenSources: Array<{
    layer: LocKyHit["layer"];
    records: MutagenRecord[];
  }> = [
    {
      layer: "Lưu nguyệt",
      records: monthlyMutagenRecords(chart, engine, monthEntry.calendarStem),
    },
    { layer: "Lưu niên", records: chart.annualMutagens ?? [] },
    { layer: "Gốc", records: chart.natalMutagens ?? [] },
  ];

  for (const { layer, records } of mutagenSources) {
    for (const record of records) {
      const palace = record.palace;
      if (!palace) continue;
      const hit = frameByIndex.get(palace.index);
      if (!hit) continue;

      const kind = mutagenKindOf(record.mutagen);
      if (!kind) continue;

      const points = scale(MONTHLY_MUTAGEN_POINTS[kind], hit.weight);
      const where = roleLabel(hit.role, palace);
      const line: ScoreLine = {
        source: `${layer} Hóa ${kind}`,
        points,
        reason: `${layer} Hóa ${kind}→${record.starName} tại ${where}`,
      };
      if (kind === "Kỵ") hung.push(line);
      else cat.push(line);

      if (kind === "Lộc" || kind === "Kỵ") {
        hits.push({ layer, kind, palaceIndex: palace.index });
      }
    }
  }

  // Nguyệt Lộc Tồn / Kình Dương / Đà La — tính động theo can tháng, KHÔNG ghi
  // vào chart.palaces (ranh giới AGENTS §5: tính toán tách khỏi hiển thị).
  if (monthEntry.calendarStem) {
    const locIndex = engine.locTonIndex(monthEntry.calendarStem);
    const kinhIndex = (locIndex + 1 + 12) % 12;
    const daIndex = (locIndex - 1 + 12) % 12;

    const locHit = frameByIndex.get(locIndex);
    if (locHit) {
      const points = scale(NGUYET_LOC_TON_POINTS, locHit.weight);
      cat.push({
        source: "Nguyệt Lộc Tồn",
        points,
        reason: `Nguyệt Lộc Tồn tại ${roleLabel(locHit.role, locHit.palace)}`,
      });
      hits.push({
        layer: "Lưu nguyệt",
        kind: "Lộc",
        palaceIndex: locHit.palace.index,
      });
    }
    const kinhHit = frameByIndex.get(kinhIndex);
    if (kinhHit) {
      hung.push({
        source: "Nguyệt Kình Dương",
        points: scale(NGUYET_KINH_DA_POINTS, kinhHit.weight),
        reason: `Nguyệt Kình Dương tại ${roleLabel(kinhHit.role, kinhHit.palace)}`,
      });
    }
    const daHit = frameByIndex.get(daIndex);
    if (daHit) {
      hung.push({
        source: "Nguyệt Đà La",
        points: scale(NGUYET_KINH_DA_POINTS, daHit.weight),
        reason: `Nguyệt Đà La tại ${roleLabel(daHit.role, daHit.palace)}`,
      });
    }
  }

  // Lộc Tồn năm/gốc đã an sẵn trên lá số (Lưu Lộc Tồn / Lộc Tồn) — chỉ cần
  // ghi nhận vị trí để so trùng, KHÔNG cộng điểm lần nữa (đã tính ở Bước A).
  for (const { palace } of frame) {
    for (const star of palace.stars ?? []) {
      if (star.name === "Lưu Lộc Tồn" && isAnnualStar(star)) {
        hits.push({ layer: "Lưu niên", kind: "Lộc", palaceIndex: palace.index });
      } else if (star.name === "Lộc Tồn" && !isAnnualStar(star)) {
        hits.push({ layer: "Gốc", kind: "Lộc", palaceIndex: palace.index });
      }
    }
  }

  // ── Bước C: 4 guardrail tháng (áp sau cộng, trước clamp) ──

  // 1) Khoa Chế Nguyệt Kỵ — giảm 60% RIÊNG dòng Nguyệt Hóa Kỵ. Chạy trước khi
  // xét Trùng Kỵ vì điều kiện "trùng" xét trên SỰ HIỆN DIỆN của Kỵ, không
  // xét biên độ điểm đã bị giảm.
  const hasKhoaChe = frame.some((row) => palaceHasSalvation(row.palace, true));
  if (hasKhoaChe) {
    for (const line of hung) {
      if (line.source === NGUYET_KY_SOURCE) {
        const reduced = roundTo1Decimal(line.points * KHOA_CHE_NGUYET_KY_FACTOR);
        line.reason += ` · Khoa Chế Nguyệt Kỵ ×${KHOA_CHE_NGUYET_KY_FACTOR} (${line.points}→${reduced})`;
        line.points = reduced;
      }
    }
  }

  // 2) Kỵ Trùng Kỵ / 3) Lộc Trùng Lộc
  const nguyetKy = hits.filter((h) => h.layer === "Lưu nguyệt" && h.kind === "Kỵ");
  const otherKy = hits.filter((h) => h.layer !== "Lưu nguyệt" && h.kind === "Kỵ");
  const kyTrungKy = nguyetKy.some((n) =>
    otherKy.some((o) => o.palaceIndex === n.palaceIndex),
  );

  const nguyetLoc = hits.filter((h) => h.layer === "Lưu nguyệt" && h.kind === "Lộc");
  const otherLoc = hits.filter((h) => h.layer !== "Lưu nguyệt" && h.kind === "Lộc");
  const locTrungLoc = nguyetLoc.some((n) =>
    otherLoc.some((o) => o.palaceIndex === n.palaceIndex),
  );

  let hungLines = hung;
  if (kyTrungKy) {
    hungLines = [
      ...hungLines,
      {
        source: "Kỵ Trùng Kỵ",
        points: KY_TRUNG_KY_BONUS,
        reason: "Nguyệt Hóa Kỵ ngộ Lưu Kỵ năm/Kỵ gốc cùng cung — báo động đỏ",
      },
    ];
    const raw = roundTo1Decimal(
      hungLines.reduce((total, line) => total + line.points, 0),
    );
    const target = Math.round(raw * TRUNG_MULTIPLIER);
    hungLines = reconcileToTarget(
      hungLines.map((line) => ({
        ...line,
        points: roundTo1Decimal(line.points * TRUNG_MULTIPLIER),
      })),
      target,
    );
    hungLines.push({
      source: "Kỵ Trùng Kỵ",
      points: 0,
      reason: `Nhân toàn cột Hung ×${TRUNG_MULTIPLIER} (thô ${raw} → ${target})`,
    });
  }

  let catLines = cat;
  if (locTrungLoc) {
    catLines = [
      ...catLines,
      {
        source: "Lộc Trùng Lộc",
        points: LOC_TRUNG_LOC_BONUS,
        reason: "Nguyệt Lộc ngộ Lưu Lộc năm/Lộc gốc cùng cung — cơ hội bùng nổ",
      },
    ];
    const raw = roundTo1Decimal(
      catLines.reduce((total, line) => total + line.points, 0),
    );
    const target = Math.round(raw * TRUNG_MULTIPLIER);
    catLines = reconcileToTarget(
      catLines.map((line) => ({
        ...line,
        points: roundTo1Decimal(line.points * TRUNG_MULTIPLIER),
      })),
      target,
    );
    catLines.push({
      source: "Lộc Trùng Lộc",
      points: 0,
      reason: `Nhân toàn cột Cát ×${TRUNG_MULTIPLIER} (thô ${raw} → ${target})`,
    });
  }

  // 4) Xung Thái Tuế — chi LỊCH tháng xung chi năm (KHÔNG dùng chi cung).
  if (
    monthEntry.calendarBranch &&
    chart.annualBranch &&
    XUNG_CHIEU[monthEntry.calendarBranch] === chart.annualBranch
  ) {
    hungLines = [
      ...hungLines,
      {
        source: "Xung Thái Tuế",
        points: XUNG_THAI_TUE_BONUS,
        reason: `Chi tháng ${monthEntry.calendarBranch} xung chi năm ${chart.annualBranch} — tháng động`,
      },
    ];
  }

  const catFinal = finalizeLayer(catLines);
  const hungFinal = finalizeLayer(hungLines);

  return {
    cat: catFinal.score,
    hung: hungFinal.score,
    breakdown: { cat: catFinal.lines, hung: hungFinal.lines },
  };
}
