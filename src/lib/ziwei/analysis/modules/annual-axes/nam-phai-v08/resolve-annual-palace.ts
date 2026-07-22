import type { ChartData, ChartPalace } from "@/types/chart";

/** Forward palace ring used by both chart engines for Lưu Niên labeling. */
export const ANNUAL_PALACE_RING = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

export interface ResolvedAnnualPalace {
  palaceIndex: number;
  natalPalaceName: string;
  annualPalaceName: string;
  branch: string;
  provenance: string;
}

export type ResolveAnnualPalaceResult =
  | { ok: true; palace: ResolvedAnnualPalace }
  | { ok: false; reason: string };

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/**
 * Annual/Lưu Niên identity for a physical palace.
 * Prefer chart-provided `annualPalaceName`; otherwise derive from
 * `annualHeadPalace` as Lưu Mệnh using the standard forward ring.
 */
export function annualIdentityOf(palace: ChartPalace, chart: ChartData): string | null {
  if (palace.annualPalaceName) return palace.annualPalaceName;
  const head = chart.annualHeadPalace;
  if (!head || typeof head.index !== "number") return null;
  return ANNUAL_PALACE_RING[mod12(palace.index - head.index)] ?? null;
}

/**
 * Resolve the palace carrying the requested annual/Lưu Niên palace identity.
 * Never substitutes natal `palace.name` for the annual identity.
 */
export function resolveAnnualPalace(
  chart: ChartData,
  palaceName: string,
): ResolveAnnualPalaceResult {
  const matches = chart.palaces.filter((p) => annualIdentityOf(p, chart) === palaceName);
  if (matches.length === 0) {
    return { ok: false, reason: `missing-annual-palace:${palaceName}` };
  }
  if (matches.length > 1) {
    return { ok: false, reason: `ambiguous-annual-palace:${palaceName}` };
  }
  const palace = matches[0]!;
  const annualPalaceName = annualIdentityOf(palace, chart);
  if (!annualPalaceName) {
    return { ok: false, reason: `unresolved-annual-identity:${palaceName}` };
  }
  return {
    ok: true,
    palace: {
      palaceIndex: palace.index,
      natalPalaceName: palace.name,
      annualPalaceName,
      branch: palace.branch,
      provenance: palace.annualPalaceName
        ? "chart.annualPalaceName"
        : "derived-from-annualHeadPalace-as-luu-menh",
    },
  };
}

/** Resolve the chart's Tiểu Hạn pointer. */
export function resolveSmallLimitPalace(chart: ChartData): ResolveAnnualPalaceResult {
  const palace = chart.smallLimitPalace ?? chart.palaces.find((p) => p.isSmallLimitPalace);
  if (!palace) {
    return { ok: false, reason: "missing-small-limit-palace" };
  }
  const annualPalaceName = annualIdentityOf(palace, chart) ?? palace.name;
  return {
    ok: true,
    palace: {
      palaceIndex: palace.index,
      natalPalaceName: palace.name,
      annualPalaceName,
      branch: palace.branch,
      provenance: "chart.smallLimitPalace",
    },
  };
}
