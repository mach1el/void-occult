/** Helper nội bộ cho frame / palace scoring. */

import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import type { ScoreLine } from "./types";

export function findDauQuanPalace(chart: ChartData): ChartPalace | null {
  for (const palace of chart.palaces) {
    if (
      (palace.stars ?? []).some(
        (star) => star.name === "Lưu Đẩu Quân" && star.source === "annual",
      )
    ) {
      return palace;
    }
  }
  return null;
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sumLines(lines: ScoreLine[]): number {
  return lines.reduce((total, line) => total + line.points, 0);
}

export function finalizeLayer(
  lines: ScoreLine[],
): { score: number; lines: ScoreLine[] } {
  const raw = sumLines(lines);
  const score = clamp100(raw);
  if (score !== raw) {
    return {
      score,
      lines: [
        ...lines,
        {
          source: "Chuẩn hóa",
          points: score - raw,
          reason: `Clamp về thang 0–100 (thô ${raw})`,
          category: "normalization",
          layer: "technical",
        },
      ],
    };
  }
  return { score, lines };
}

export function isMutagenStar(star: ChartStar): boolean {
  return (star.source ?? "").endsWith("-mutagen") || Boolean(star.mutagen);
}

export function mutagenKind(
  star: ChartStar,
): "Lộc" | "Quyền" | "Khoa" | "Kỵ" | null {
  const blob = `${star.name} ${star.mutagen ?? ""}`;
  if (/Kỵ/.test(blob)) return "Kỵ";
  if (/Lộc/.test(blob)) return "Lộc";
  if (/Quyền/.test(blob)) return "Quyền";
  if (/Khoa/.test(blob)) return "Khoa";
  return null;
}

export function voidBranches(chart: ChartData): Set<string> {
  const set = new Set<string>();
  for (const marker of chart.voidMarkers ?? []) {
    for (const branch of marker.branches) set.add(branch);
  }
  return set;
}
