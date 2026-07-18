import { baseStarName } from "@/lib/ziwei/star-classification";

const MUTAGEN_MARKER =
  /^(?:Lưu\s+)?Hóa\s+(Lộc|Quyền|Khoa|Kỵ)$/;

const VOID_STAR_NAMES = new Set([
  "Tuần",
  "Triệt",
  "Tuần Không",
  "Triệt Không",
]);

/** Canonical natal star name; preserves Lưu Hà; strips lưu prefix otherwise. */
export function canonicalStarName(name: string): string {
  return baseStarName(name);
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
