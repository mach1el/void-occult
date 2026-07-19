import { canonicalStarName } from "../../analysis/facts";
import type { Brightness, ParsedMenhGeometry, ParsedStarFact, RelationName } from "./types-v02-1";

const BRIGHTNESS_LETTERS = new Set(["M", "V", "Đ", "B", "H"]);
const TRANSFORMATIONS = new Set(["Hóa lộc", "Hóa quyền", "Hóa khoa", "Hóa kỵ"]);
const VOID_MARKERS = new Set(["Tuần", "Triệt"]);

/** Minor/context stars, mutagen-adjacent flying stars and Thái Tuế-cycle
 * markers that appear in these lists but are not (yet) in this repo's
 * canonical star catalog — recognized so they aren't misfiled as
 * "unknown", without asserting a numeric scoring role for them. */
const KNOWN_CONTEXT_ONLY = new Set([
  "Trực phù", "Phi liêm", "Tử phù", "Bác sĩ", "Long đức", "Phục binh", "Điếu khách", "Hỉ thần",
  "Quan phù", "Lực sĩ", "Tuế phá", "Thái tuế", "Tấu thư", "Bạch hổ", "Đại hao", "Tiểu hao",
  "Tang môn", "Thanh long", "Quan đới", "Lâm quan", "Đế vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt",
  "Thai", "Dưỡng", "Trường sinh", "Mộc dục",
  "Thiên khôi", "Thiên việt", "Thiên hỉ", "Thiên trù", "Văn tinh", "Thiên quan", "Thiên khốc",
  "Thiên hư", "Thiên hình", "Thiên riêu", "Thiên y", "Đường phù", "Thiên mã", "Thiên tài", "Thiên thọ",
  "Phá toái", "Hoa cái", "Tam thai", "Thiên la", "Địa võng", "Lưu hà", "Đào hoa", "Thiên giải",
  "Nguyệt đức", "Bát tọa", "Phượng các", "Giải thần", "Long trì", "Địa giải", "Thai phụ", "Phong cáo",
  "Cô thần", "Thiên phúc", "Kiếp sát", "Thiên không", "Hồng loan", "Quốc ấn", "Tướng quân", "Thiên quý",
  "Đẩu quân", "Quả tú",
]);

function stripBrightness(rawLabel: string): { name: string; brightness: Brightness } {
  const match = /^(.*?)\s*\(([MVĐBH])\)$/u.exec(rawLabel.trim());
  if (match?.[1] && match[2] && BRIGHTNESS_LETTERS.has(match[2])) {
    return { name: match[1].trim(), brightness: match[2] as Brightness };
  }
  return { name: rawLabel.trim(), brightness: null };
}

function parseStarFact(rawLabel: string, relation: RelationName): ParsedStarFact {
  const { name, brightness } = stripBrightness(rawLabel);
  const isTransformation = TRANSFORMATIONS.has(name);
  const isVoidMarker = VOID_MARKERS.has(name);

  if (name === "Vô chính diệu") {
    return { rawLabel, canonicalName: null, brightness, relation, isTransformation: false, isVoidMarker: false, parseStatus: "known-context-only" };
  }
  if (isTransformation || isVoidMarker) {
    return { rawLabel, canonicalName: name, brightness, relation, isTransformation, isVoidMarker, parseStatus: "canonical" };
  }

  const canonical = canonicalStarName(name);
  // `canonicalStarName` normalizes spelling/diacritics but doesn't itself
  // confirm catalog membership — treat a name we recognize as a known
  // context marker (flying stars, life-cycle stages, etc.) distinctly
  // from a genuinely unrecognized token.
  if (KNOWN_CONTEXT_ONLY.has(name) || KNOWN_CONTEXT_ONLY.has(canonical)) {
    return { rawLabel, canonicalName: canonical, brightness, relation, isTransformation: false, isVoidMarker: false, parseStatus: "known-context-only" };
  }
  return { rawLabel, canonicalName: canonical, brightness, relation, isTransformation: false, isVoidMarker: false, parseStatus: "canonical" };
}

/**
 * §"Parse Mệnh relation geometry" — preserves the four relation groups
 * unflattened. Every fact retains its raw label, relation tag,
 * transformation/void flags, and a parse-status distinguishing catalog
 * stars from recognized-but-uncataloged context markers from genuinely
 * unknown tokens (retained, not dropped).
 */
export function parseMenhGeometry(row: {
  toaThu: string[];
  xungChieu: string[];
  tamHop1: string[];
  tamHop2: string[];
  nhiHop1: string[];
  nhiHop2: string[];
}): ParsedMenhGeometry {
  return {
    toaThu: row.toaThu.map((s) => parseStarFact(s, "toa-thu")),
    xungChieu: row.xungChieu.map((s) => parseStarFact(s, "xung-chieu")),
    tamHop: [row.tamHop1.map((s) => parseStarFact(s, "tam-hop-1")), row.tamHop2.map((s) => parseStarFact(s, "tam-hop-2"))],
    nhiHop: [row.nhiHop1.map((s) => parseStarFact(s, "nhi-hop-1")), row.nhiHop2.map((s) => parseStarFact(s, "nhi-hop-2"))],
  };
}

/** Diagnostics — every fact whose `parseStatus` is `"unknown"`, retained
 * for review rather than silently dropped. */
export function unknownFacts(geometry: ParsedMenhGeometry): ParsedStarFact[] {
  const all = [
    ...geometry.toaThu,
    ...geometry.xungChieu,
    ...geometry.tamHop[0],
    ...geometry.tamHop[1],
    ...geometry.nhiHop[0],
    ...geometry.nhiHop[1],
  ];
  return all.filter((f) => f.parseStatus === "unknown");
}
