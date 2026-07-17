/**
 * Chấm một khung hạn = cung hạn + tam phương tứ chính.
 * Đại vận: công thức 6 bước (P_csv × M_pos × W_cung → Cát/Hung độc lập).
 * Không còn hệ số Ngũ Hành Bản Mệnh (M_nh) — thầy chốt bỏ 2026-07-18.
 */

import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import { baseStarName, isAnnualStar } from "../star-classification";
import {
  evaluateCombos,
  palaceHasSalvation,
  type FrameRow,
} from "./combo-eval";
import {
  computeStarEnergy,
  routeStarEnergy,
  SAT_KHONG_HOA,
} from "./star-energy";
import { findStarScore } from "./star-scores";
import type { ScoringWeights } from "./weights";
import type { ScoreLine, TrendPoint } from "./types";
import { finalizeLayer, isMutagenStar, mutagenKind, voidBranches } from "./util";
import { roundTo1Decimal } from "./ui-breakdown";
import {
  extractBaseElement,
  getBranchElement,
  getDaiVanElementFactors,
  TAM_HOP,
  XUNG_CHIEU,
} from "./zones";

function sanFangSiZheng(
  chart: ChartData,
  focus: ChartPalace,
): Array<{ palace: ChartPalace; role: "focus" | "tam-hop" | "xung" }> {
  const hop = new Set(TAM_HOP[focus.branch] ?? [focus.branch]);
  const xung = XUNG_CHIEU[focus.branch];
  const rows: Array<{ palace: ChartPalace; role: "focus" | "tam-hop" | "xung" }> =
    [];

  for (const palace of chart.palaces) {
    if (palace.index === focus.index) {
      rows.push({ palace, role: "focus" });
    } else if (xung && palace.branch === xung) {
      rows.push({ palace, role: "xung" });
    } else if (hop.has(palace.branch)) {
      rows.push({ palace, role: "tam-hop" });
    }
  }
  return rows;
}

/**
 * Luật Đất Nhà: cung thuộc tam hợp Mệnh hoặc tam hợp Thân → W tam hợp = 0.6.
 * (Mệnh–Tài–Quan luôn là một bộ tam hợp; Thân + hai cung hợp cũng là Đất Nhà.)
 */
function isHomeTurfPalace(chart: ChartData, palace: ChartPalace): boolean {
  const menh =
    chart.palaces.find((p) => p.isMenh) ??
    chart.palaces.find((p) => p.index === chart.menhIndex);
  if (menh) {
    const menhHop = new Set(TAM_HOP[menh.branch] ?? [menh.branch]);
    if (menhHop.has(palace.branch)) return true;
  }
  const than =
    chart.palaces.find((p) => p.isThan) ??
    (typeof chart.thanIndex === "number"
      ? chart.palaces.find((p) => p.index === chart.thanIndex)
      : undefined);
  if (than) {
    const thanHop = new Set(TAM_HOP[than.branch] ?? [than.branch]);
    if (thanHop.has(palace.branch)) return true;
  }
  return false;
}

function roleWeight(
  role: "focus" | "tam-hop" | "xung",
  palace: ChartPalace,
  weights: ScoringWeights,
  chart: ChartData,
  applyHomeTurf: boolean,
): number {
  if (role === "focus") return 1;
  if (role === "xung") return weights.xungFactor;
  if (applyHomeTurf && isHomeTurfPalace(chart, palace)) return 0.6;
  return weights.tamHopFactor;
}

function roleLabel(
  role: "focus" | "tam-hop" | "xung",
  palace: ChartPalace,
): string {
  if (role === "focus") return `cung hạn ${palace.name}`;
  if (role === "xung") return `xung chiếu ${palace.name}`;
  return `tam hợp ${palace.name}`;
}

function scale(points: number, factor: number): number {
  return roundTo1Decimal(points * factor);
}

/**
 * Đưa tổng các dòng về đúng `target` bằng cách chỉnh dòng lớn nhất
 * (giữ WYSIWYG; không thêm dòng delta âm giả).
 */
function reconcileLinesToTarget(
  lines: ScoreLine[],
  target: number,
): ScoreLine[] {
  if (!lines.length) return lines;
  const result = lines.map((line) => ({ ...line }));
  const sum = roundTo1Decimal(
    result.reduce((total, line) => total + line.points, 0),
  );
  const diff = roundTo1Decimal(target - sum);
  if (diff === 0) return result;

  let bestIdx = 0;
  for (let i = 1; i < result.length; i++) {
    if ((result[i]?.points ?? 0) > (result[bestIdx]?.points ?? 0)) {
      bestIdx = i;
    }
  }
  const best = result[bestIdx]!;
  const next = roundTo1Decimal(best.points + diff);
  result[bestIdx] = {
    ...best,
    points: Math.max(0, next),
  };

  // Nếu clamp 0 làm lệch (hiếm), trải phần dư lên dòng dương khác.
  const after = roundTo1Decimal(
    result.reduce((total, line) => total + line.points, 0),
  );
  let leftover = roundTo1Decimal(target - after);
  if (leftover !== 0) {
    for (const line of result) {
      if (leftover === 0) break;
      if (leftover < 0 && line.points <= 0) continue;
      const step =
        leftover > 0
          ? leftover
          : -Math.min(line.points, Math.abs(leftover));
      line.points = roundTo1Decimal(line.points + step);
      leftover = roundTo1Decimal(leftover - step);
    }
  }
  return result;
}

/**
 * Nhân hệ số Ngũ hành vào TỪNG dòng đóng góp (giữ ≥0 trên Hung),
 * không chèn delta âm giả. Ghi chú hệ số bằng dòng points=0.
 * Tổng dòng đóng góp = round(thô × M) để khớp điểm hiển thị.
 */
function applyElementMultiplier(
  lines: ScoreLine[],
  multiplier: number,
  meta: {
    label: string;
    palaceElement: string;
    menhElement: string;
  },
): { lines: ScoreLine[]; target: number } {
  const raw = roundTo1Decimal(
    lines.reduce((sum, line) => sum + line.points, 0),
  );
  const target = Math.round(raw * multiplier);
  let scaled = lines.map((line) => ({
    ...line,
    points: roundTo1Decimal(line.points * multiplier),
  }));
  scaled = reconcileLinesToTarget(scaled, target);

  if (multiplier !== 1) {
    scaled.push({
      source: "Ngũ Hành Vận",
      points: 0,
      reason: `${meta.label}: Cung ${meta.palaceElement} ↔ Mệnh ${meta.menhElement} · hệ số ×${multiplier} (thô ${raw} → ${target})`,
    });
  }
  return { lines: scaled, target };
}

export interface FrameScoreOptions {
  includeAnnual: boolean;
}

export function scoreFortuneFrame(
  chart: ChartData,
  focus: ChartPalace,
  weights: ScoringWeights,
  mutagenSources: Array<{ label: string; records: MutagenRecord[] | undefined }>,
  options: FrameScoreOptions,
): Pick<TrendPoint, "cat" | "hung" | "breakdown"> {
  const { includeAnnual } = options;

  const cat: ScoreLine[] = [];
  const hung: ScoreLine[] = [];
  const voids = voidBranches(chart);
  const rawFrame = sanFangSiZheng(chart, focus);
  const applyHomeTurf = !includeAnnual;
  // Tứ Hóa đã có mặt là sao thật trong khung (Bước A) — dùng để chặn mutagen
  // record cộng trùng ở dưới. Key theo (kind, palaceIndex), KHÔNG dò text
  // reason (đã bỏ "tại cung X" khỏi reason hiển thị).
  const mutagenHitPalaces = new Set<string>();

  const frame: FrameRow[] = rawFrame.map(({ palace, role }) => ({
    palace,
    role,
    weight: roleWeight(role, palace, weights, chart, applyHomeTurf),
  }));

  // ── BƯỚC 2–3: quét sao + phân luồng + Khoa Chế Không ──
  for (const { palace, role, weight: wCung } of frame) {
    const where = roleLabel(role, palace);
    const salvation = palaceHasSalvation(palace, includeAnnual);

    for (const star of palace.stars ?? []) {
      if (!includeAnnual && isAnnualStar(star)) continue;

      if (isMutagenStar(star)) {
        const kind = mutagenKind(star);
        if (kind) mutagenHitPalaces.add(`${kind}:${palace.index}`);
      }

      const energy = computeStarEnergy(star);
      if (!energy) continue;

      let routed = routeStarEnergy(energy);
      if (!routed) continue;

      // Khoa Chế Không: sát Không/Kiếp/Hỏa/Linh trong cung cứu giải → ×0.5 hung
      const khoaChe =
        routed.layer === "hung" &&
        salvation &&
        SAT_KHONG_HOA.includes(
          energy.base as (typeof SAT_KHONG_HOA)[number],
        );
      if (khoaChe) {
        routed = { layer: "hung", points: routed.points * 0.5 };
      }

      // Bảo vệ Cát: không chiết khấu vùng bại cho Khoa/Quyền/Lộc khi có salvation
      // (không áp zone penalty — điểm CSV thuần đã đủ)

      const points = scale(routed.points, wCung);
      if (points === 0) continue;

      // UI chuẩn: Tên sao + Độ sáng + Nguồn kích hoạt (base/lưu niên) — không
      // còn ghi chú Ngũ Hành Bản Mệnh. Vẫn giữ vị trí TP4C + trọng số cung để
      // không mất minh bạch "hiện bài làm" (AGENTS §5) và không phá dedup Tứ
      // Hóa phía dưới.
      const originTag = isAnnualStar(star) ? "lưu niên" : "base";
      const brightLabel = energy.bright ?? energy.anchor;
      const noteParts = [
        wCung !== 1 ? `W=${wCung}` : "",
        khoaChe ? "Khoa chế ×0.5" : "",
      ].filter(Boolean);
      const line: ScoreLine = {
        source: star.name,
        points,
        reason: `${brightLabel} · ${originTag} tại ${where}${noteParts.length ? ` (${noteParts.join(" · ")})` : ""}`,
      };
      if (routed.layer === "cat") cat.push(line);
      else hung.push(line);
    }

    // Tuần / Triệt — +6 áp lực mỗi loại (6-step)
    if (voids.has(palace.branch)) {
      const types = (chart.voidMarkers ?? [])
        .filter((m) => m.branches.includes(palace.branch))
        .map((m) => m.type);
      const unique = [...new Set(types)];
      for (const type of unique) {
        hung.push({
          source: type,
          points: scale(6, wCung),
          reason: `${type} án ngữ ${where} (${palace.branch})`,
        });
      }
    }

    // Vòng Trường Sinh trên cung
    const cs = palace.changSheng;
    if (cs) {
      const csRow = findStarScore(cs === "Trường Sinh" ? "Tràng Sinh" : cs);
      if (csRow) {
        const bright = null;
        const anchor =
          cs === "Mộ" || cs === "Tuyệt" || cs === "Bệnh" || cs === "Tử" || cs === "Suy" || cs === "Mộc Dục"
            ? csRow.ham
            : csRow.dac || csRow.base;
        // Dùng polarity CSV: dương → cát, âm → hung
        const raw = csRow.polarity === "hung" || anchor < 0 ? -Math.abs(anchor || csRow.base) : Math.abs(anchor || csRow.base);
        // Override theo 6-step bậc
        let layer: "cat" | "hung" = raw >= 0 ? "cat" : "hung";
        let pts = Math.abs(raw);
        if (["Tràng Sinh", "Đế Vượng"].includes(cs)) {
          layer = "cat";
          pts = 6;
        } else if (["Lâm Quan", "Quan Đới"].includes(cs)) {
          layer = "cat";
          pts = 4;
        } else if (["Thai", "Dưỡng"].includes(cs)) {
          layer = "cat";
          pts = 2;
        } else if (["Bệnh", "Tử", "Mộ", "Tuyệt"].includes(cs)) {
          layer = "hung";
          pts = 6;
        } else if (["Suy", "Mộc Dục"].includes(cs)) {
          layer = "hung";
          pts = 4;
        }
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

  // Tứ Hóa từ mutagen records (gốc / ĐV) — nếu chưa có sao tương ứng trong khung
  for (const { label, records } of mutagenSources) {
    for (const record of records ?? []) {
      const palace = record.palace;
      if (!palace) continue;
      const hit = frame.find((row) => row.palace.index === palace.index);
      if (!hit) continue;

      const kind = record.mutagen.includes("Kỵ")
        ? "Kỵ"
        : record.mutagen.includes("Lộc")
          ? "Lộc"
          : record.mutagen.includes("Quyền")
            ? "Quyền"
            : record.mutagen.includes("Khoa")
              ? "Khoa"
              : null;
      if (!kind) continue;

      if (mutagenHitPalaces.has(`${kind}:${palace.index}`)) continue;

      // Điểm CSV Tứ Hóa
      const scoreName =
        kind === "Kỵ"
          ? "Hóa Kỵ"
          : kind === "Lộc"
            ? "Hóa Lộc"
            : kind === "Quyền"
              ? "Hóa Quyền"
              : "Hóa Khoa";
      const row = findStarScore(scoreName);
      const basePts = row
        ? kind === "Kỵ"
          ? Math.abs(row.ham || row.base)
          : Math.abs(row.dac || row.base)
        : kind === "Kỵ"
          ? 15
          : kind === "Lộc"
            ? 10
            : kind === "Quyền"
              ? 8
              : 6;

      const points = scale(basePts, hit.weight);
      const where = roleLabel(hit.role, palace);
      if (kind === "Kỵ") {
        hung.push({
          source: `${label} Hóa Kỵ`,
          points,
          reason: `${label} Hóa Kỵ→${record.starName} tại ${where}`,
        });
      } else {
        cat.push({
          source: `${label} Hóa ${kind}`,
          points,
          reason: `${label} Hóa ${kind}→${record.starName} tại ${where}`,
        });
      }
    }
  }

  // ── BƯỚC 4: Combo ──
  const comboHits = evaluateCombos(frame, chart, includeAnnual);
  let halveCat = false;
  let halveSatHung = false;
  let halveTuyetHung = false;
  let tuanFactor = 1;

  for (const hit of comboHits) {
    const { rule, reason } = hit;
    if (rule.effect?.kind === "halve-cat") halveCat = true;
    if (rule.effect?.kind === "halve-sat-hung") halveSatHung = true;
    if (rule.effect?.kind === "halve-tuyet-hung") halveTuyetHung = true;
    if (rule.effect?.kind === "tuan-factor") tuanFactor = rule.effect.factor;

    if (rule.points === 0) {
      // Override-only rule — ghi chú breakdown
      if (rule.effect) {
        const target = rule.layer === "cat" ? cat : hung;
        target.push({
          source: `Cách ${rule.id}`,
          points: 0,
          reason: `${rule.label}: ${reason}`,
        });
      }
      continue;
    }

    const line: ScoreLine = {
      source: `Cách ${rule.id}`,
      points: rule.points,
      reason: `${rule.label} — ${reason}`,
    };
    if (rule.layer === "cat") cat.push(line);
    else hung.push(line);
  }

  // Áp effect overrides lên dòng đã có
  if (halveCat) {
    for (const line of cat) {
      if (line.source.startsWith("Cách ")) continue;
      line.points = Math.round(line.points * 0.5 * 10) / 10;
      line.reason += " · Cát xứ tàng hung ×0.5";
    }
  }
  if (halveSatHung) {
    for (const line of hung) {
      if (
        SAT_KHONG_HOA.some((n) => line.source.includes(n) || line.reason.includes(n))
      ) {
        line.points = Math.round(line.points * 0.5 * 10) / 10;
        line.reason += " · Khoa chế ×0.5";
      }
    }
  }
  if (halveTuyetHung) {
    for (const line of hung) {
      if (line.source.includes("Tuyệt")) {
        line.points = Math.round(line.points * 0.5 * 10) / 10;
        line.reason += " · Tuyệt phùng sinh ×0.5";
      }
    }
  }
  if (tuanFactor !== 1) {
    for (const line of hung) {
      if (line.source === "Tuần" || line.source === "Triệt") {
        line.points = Math.round(line.points * tuanFactor * 10) / 10;
        line.reason += ` · T×${tuanFactor}`;
      }
    }
  }

  // ── BƯỚC 5–6: Ngũ hành ĐV × từng dòng (không delta âm) + clamp ──
  let mCat = 1;
  let mHung = 1;
  let elementLabel = "";
  let palaceElement = "";
  let menhBaseElement = "";

  if (!includeAnnual) {
    menhBaseElement = extractBaseElement(chart.menhElement);
    palaceElement = getBranchElement(focus.branch);
    const factors = getDaiVanElementFactors(palaceElement, menhBaseElement);
    mCat = factors.cat;
    mHung = factors.hung;
    elementLabel = factors.label;
  }

  const meta = {
    label: elementLabel,
    palaceElement,
    menhElement: menhBaseElement,
  };
  const { lines: catScaled, target: scaledCat } = applyElementMultiplier(
    cat,
    mCat,
    meta,
  );
  const { lines: hungScaled, target: scaledHung } = applyElementMultiplier(
    hung,
    mHung,
    meta,
  );

  const catFinal = finalizeLayer([
    { source: "__scaled__", points: scaledCat, reason: "scaled" },
  ]);
  const hungFinal = finalizeLayer([
    { source: "__scaled__", points: scaledHung, reason: "scaled" },
  ]);

  const finalCatLines = [...catScaled];
  if (catFinal.score !== scaledCat) {
    finalCatLines.push({
      source: "Chuẩn hóa",
      points: roundTo1Decimal(catFinal.score - scaledCat),
      reason: `Clamp 0–100 (thô ${scaledCat})`,
    });
  }

  const finalHungLines = [...hungScaled];
  if (hungFinal.score !== scaledHung) {
    // Clamp chỉ khi lệch 0–100; không dùng cho Ngũ hành (đã nhân từng dòng).
    finalHungLines.push({
      source: "Chuẩn hóa",
      points: roundTo1Decimal(hungFinal.score - scaledHung),
      reason: `Clamp 0–100 (thô ${scaledHung})`,
    });
  }

  return {
    cat: catFinal.score,
    hung: hungFinal.score,
    breakdown: { cat: finalCatLines, hung: finalHungLines },
  };
}
