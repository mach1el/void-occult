/**
 * Tam hợp branch groups — pure geometry (same mapping as CompactChart).
 * Not an astrology interpretation layer.
 */
export const TAM_HOP_BRANCHES: Record<string, readonly string[]> = {
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

export function oppositePalaceIndex(focusIndex: number): number {
  return (focusIndex + 6) % 12;
}

export function trineBranches(branch: string): string[] {
  const group = TAM_HOP_BRANCHES[branch] ?? [];
  return group.filter((b) => b !== branch);
}
