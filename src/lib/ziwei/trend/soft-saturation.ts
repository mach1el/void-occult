/**
 * Soft saturation cho profile experimental — không tạo ScoreLine "Chuẩn hóa".
 * Công thức SSOT: scoring-profile-v2.json → normalization.formula
 */

export function softSaturate(raw: number, scale: number): number {
  if (scale <= 0) return 0;
  return Math.round(100 * (1 - Math.exp(-Math.max(raw, 0) / scale)));
}
