import { baseStarName } from "@/lib/ziwei/star-classification";
import starAliasesData from "../knowledge/palace-overview/v1/canonical-star-aliases.json";

const MUTAGEN_MARKER =
  /^(?:Lưu\s+)?Hóa\s+(Lộc|Quyền|Khoa|Kỵ)$/;

const VOID_STAR_NAMES = new Set([
  "Tuần",
  "Triệt",
  "Tuần Không",
  "Triệt Không",
]);

interface StarAliasShape {
  aliases: Array<{ alias: string; canonical: string }>;
}

const ALIAS_MAP: ReadonlyMap<string, string> = new Map(
  (starAliasesData as StarAliasShape).aliases.map((a) => [a.alias, a.canonical]),
);

/**
 * Canonical natal star name: strip lưu prefix (preserving "Lưu Hà" — spec
 * special case, already handled inside `baseStarName`), then apply the exact
 * spelling-alias table (Tả Phù→Tả Phụ, Hỉ Thần→Hỷ Thần, Trường Sinh→Tràng
 * Sinh). Aliases are spelling normalization only, not astrology rules.
 */
export function canonicalStarName(name: string): string {
  const base = baseStarName(name);
  return ALIAS_MAP.get(base) ?? base;
}

export function isMutagenMarkerName(name: string): boolean {
  return MUTAGEN_MARKER.test(name);
}

export function isVoidStarName(name: string): boolean {
  return VOID_STAR_NAMES.has(name);
}

export function parseMutagenFromMarker(
  name: string,
): "Lộc" | "Quyền" | "Khoa" | "Kỵ" | null {
  const match = name.match(MUTAGEN_MARKER);
  const mutagen = match?.[1];
  if (
    mutagen === "Lộc" ||
    mutagen === "Quyền" ||
    mutagen === "Khoa" ||
    mutagen === "Kỵ"
  ) {
    return mutagen;
  }
  return null;
}
