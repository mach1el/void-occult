/**
 * Ba vùng địa chi cố định trên địa bàn Tử Vi.
 *
 * - mo (tứ mộ/khố): Thìn · Tuất · Sửu · Mùi — tụ, kho, thu liễm
 * - ma (tứ sinh/mã): Dần · Thân · Tỵ · Hợi — trường sinh + chỗ Thiên Mã
 * - bai (tứ bại/chính): Tý · Ngọ · Mão · Dậu — đế vượng / lộ rõ
 *
 * Nguồn định nghĩa: 紫微斗数 四墓 / 四生四马 / 四败 (zhycw, ziweicn).
 * KHÔNG dùng blog gọi nhầm Dần–Thân–Tỵ–Hợi là “tứ mộ”.
 */

export type BranchZone = "mo" | "ma" | "bai";

export const MO_BRANCHES = ["Thìn", "Tuất", "Sửu", "Mùi"] as const;
export const MA_BRANCHES = ["Dần", "Thân", "Tỵ", "Hợi"] as const;
export const BAI_BRANCHES = ["Tý", "Ngọ", "Mão", "Dậu"] as const;

const MO_SET = new Set<string>(MO_BRANCHES);
const MA_SET = new Set<string>(MA_BRANCHES);
const BAI_SET = new Set<string>(BAI_BRANCHES);

export function getBranchZone(branch: string): BranchZone | null {
  if (MO_SET.has(branch)) return "mo";
  if (MA_SET.has(branch)) return "ma";
  if (BAI_SET.has(branch)) return "bai";
  return null;
}

export function isMoBranch(branch: string): boolean {
  return MO_SET.has(branch);
}

export function isMaBranch(branch: string): boolean {
  return MA_SET.has(branch);
}

/** Nhãn tiếng Việt cho breakdown. */
export function zoneLabel(zone: BranchZone): string {
  if (zone === "mo") return "vùng mộ";
  if (zone === "ma") return "vùng mã";
  return "vùng bại";
}

export const XUNG_CHIEU: Record<string, string> = {
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

export const TAM_HOP: Record<string, string[]> = {
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

export type PairGeometry = "dong" | "xung" | "tam-hop";

/** Quan hệ hình học giữa hai chi trên địa bàn. */
export function pairGeometry(a: string, b: string): PairGeometry | null {
  if (a === b) return "dong";
  if (XUNG_CHIEU[a] === b) return "xung";
  const hop = TAM_HOP[a];
  if (hop && hop.includes(b) && a !== b) return "tam-hop";
  return null;
}

/** Hệ số lực cặp: đồng cung > xung > tam hợp. */
export function pairGeometryFactor(
  geometry: PairGeometry,
  sanFangFactor: number,
): number {
  if (geometry === "dong") return 1;
  if (geometry === "xung") return 0.85;
  return sanFangFactor;
}

export function geometryLabel(geometry: PairGeometry): string {
  if (geometry === "dong") return "đồng cung";
  if (geometry === "xung") return "xung chiếu";
  return "tam hợp";
}
