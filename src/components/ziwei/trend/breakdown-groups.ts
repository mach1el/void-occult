/**
 * Nhóm ScoreLine Lưu Nguyệt theo metadata — không parse reason/tên sao.
 * Mỗi dòng xuất hiện đúng một lần (invariant length).
 */

import type {
  ScoreLayer,
  ScoreLine,
  ScorePalaceRole,
  ScoreSignalCategory,
} from "@/lib/ziwei/trend";

export type BreakdownGroupId =
  | "major-focus"
  | "major-aspect"
  | "mutagen"
  | "void"
  | "chang-sheng"
  | "minor"
  | "guardrail"
  | "technical";

export interface BreakdownGroup {
  id: BreakdownGroupId;
  title: string;
  lines: ScoreLine[];
}

const GROUP_ORDER: BreakdownGroupId[] = [
  "major-focus",
  "major-aspect",
  "mutagen",
  "void",
  "chang-sheng",
  "minor",
  "guardrail",
  "technical",
];

const GROUP_TITLE: Record<BreakdownGroupId, string> = {
  "major-focus": "Chính tinh chủ tháng",
  "major-aspect": "Chính tinh hội chiếu",
  mutagen: "Tứ Hóa",
  void: "Tuần · Triệt",
  "chang-sheng": "Trường Sinh",
  minor: "Phụ tinh và tín hiệu khác",
  guardrail: "Cảnh báo tổ hợp",
  technical: "Kỹ thuật tính điểm",
};

const LAYER_ORDER: ScoreLayer[] = ["monthly", "annual", "natal", "technical"];
const TRANSFORM_ORDER = ["Lộc", "Quyền", "Khoa", "Kỵ"] as const;
const ROLE_ASPECT_ORDER: ScorePalaceRole[] = ["xung", "tam-hop"];

function categoryOf(line: ScoreLine): ScoreSignalCategory {
  return line.category ?? "other";
}

function groupIdOf(line: ScoreLine): BreakdownGroupId {
  const cat = categoryOf(line);
  if (cat === "major-star" && line.palaceRole === "focus") return "major-focus";
  if (
    cat === "major-star" &&
    (line.palaceRole === "xung" || line.palaceRole === "tam-hop")
  ) {
    return "major-aspect";
  }
  if (cat === "mutagen") return "mutagen";
  if (cat === "void") return "void";
  if (cat === "chang-sheng") return "chang-sheng";
  if (cat === "guardrail") return "guardrail";
  if (cat === "normalization") return "technical";
  if (cat === "minor-star" || cat === "other") return "minor";
  return "minor";
}

function sortAspect(a: ScoreLine, b: ScoreLine): number {
  const ra = ROLE_ASPECT_ORDER.indexOf(a.palaceRole as ScorePalaceRole);
  const rb = ROLE_ASPECT_ORDER.indexOf(b.palaceRole as ScorePalaceRole);
  if (ra !== rb) return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
  const nameCmp = (a.palaceName ?? "").localeCompare(b.palaceName ?? "", "vi");
  if (nameCmp !== 0) return nameCmp;
  return 0;
}

function sortMutagen(a: ScoreLine, b: ScoreLine): number {
  const la = LAYER_ORDER.indexOf(a.layer ?? "natal");
  const lb = LAYER_ORDER.indexOf(b.layer ?? "natal");
  if (la !== lb) return la - lb;
  const ta = TRANSFORM_ORDER.indexOf(
    (a.transform ?? "Lộc") as (typeof TRANSFORM_ORDER)[number],
  );
  const tb = TRANSFORM_ORDER.indexOf(
    (b.transform ?? "Lộc") as (typeof TRANSFORM_ORDER)[number],
  );
  return ta - tb;
}

/**
 * Phân nhóm breakdown. Trả về chỉ các nhóm có ≥1 dòng.
 * `allGroupedLines.length === lines.length`.
 */
export function groupScoreLines(lines: ScoreLine[]): BreakdownGroup[] {
  const buckets = new Map<BreakdownGroupId, ScoreLine[]>();
  for (const id of GROUP_ORDER) buckets.set(id, []);

  for (const line of lines) {
    buckets.get(groupIdOf(line))!.push(line);
  }

  const aspect = buckets.get("major-aspect")!;
  aspect.sort(sortAspect);

  const mutagen = buckets.get("mutagen")!;
  mutagen.sort(sortMutagen);

  const groups: BreakdownGroup[] = [];
  for (const id of GROUP_ORDER) {
    const groupLines = buckets.get(id)!;
    if (!groupLines.length) continue;
    groups.push({ id, title: GROUP_TITLE[id], lines: groupLines });
  }
  return groups;
}

export function flattenGroupedLines(groups: BreakdownGroup[]): ScoreLine[] {
  return groups.flatMap((g) => g.lines);
}

const MONTH_HEADER_LABELS: Record<number, string> = {
  1: "Tháng Giêng",
  2: "Tháng Hai",
  3: "Tháng Ba",
  4: "Tháng Tư",
  5: "Tháng Năm",
  6: "Tháng Sáu",
  7: "Tháng Bảy",
  8: "Tháng Tám",
  9: "Tháng Chín",
  10: "Tháng Mười",
  11: "Tháng Một",
  12: "Tháng Chạp",
};

export function lunarMonthHeaderLabel(monthNumber: number): string {
  return MONTH_HEADER_LABELS[monthNumber] ?? `Tháng ${monthNumber}`;
}

export function roleBadgeLabel(role?: ScorePalaceRole): string | null {
  if (role === "focus") return "Chính cung";
  if (role === "xung") return "Xung";
  if (role === "tam-hop") return "Tam hợp";
  return null;
}

export function layerBadgeLabel(layer?: ScoreLayer): string | null {
  if (layer === "monthly") return "Lưu nguyệt";
  if (layer === "annual") return "Lưu niên";
  if (layer === "natal") return "Gốc";
  return null;
}
