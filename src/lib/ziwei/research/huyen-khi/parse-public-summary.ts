import type { ParsedBirthTitle } from "./types";

const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const STEM_SET = new Set(STEMS);
const BRANCH_SET = new Set(BRANCHES);

/** Regional alternate spellings the source site uses that differ from the
 * Calculation Core's canonical branch names (Northern vs Southern Vietnamese
 * convention for the same branch). */
const BRANCH_SPELLING_ALIASES: Record<string, string> = {
  Tí: "Tý",
  Tị: "Tỵ",
};

/** Vietnamese uppercase display form → canonical title-case form used
 * throughout the Calculation Core (e.g. "GIÁP" → "Giáp", "TÍ" → "Tý"). */
function toCanonicalWord(word: string): string {
  const lower = word.toLocaleLowerCase("vi");
  const titleCase = lower.charAt(0).toLocaleUpperCase("vi") + lower.slice(1);
  return BRANCH_SPELLING_ALIASES[titleCase] ?? titleCase;
}

const TITLE_PATTERN =
  /^(DƯƠNG|ÂM)\s+(NAM|NỮ)\s+(\S+)\s+(\S+),\s*tháng\s+(\d{1,2})\s+ngày\s+(\d{1,2}),\s*giờ\s+(\S+)$/iu;

/**
 * §3 — deterministic offline parser for the `displayTitle` text already
 * present in the pack (no network access; the title is the only free text
 * retained per the source's minimal-metadata rule). Format observed across
 * all 18 seeds:
 *   "{DƯƠNG|ÂM} {NAM|NỮ} {Stem} {Branch}, tháng {M} ngày {D}, giờ {Hour}"
 */
export function parsePublicSummaryTitle(displayTitle: string): ParsedBirthTitle | null {
  const match = TITLE_PATTERN.exec(displayTitle.trim());
  if (!match) return null;
  const [, yinYangRaw, genderRaw, stemRaw, branchRaw, monthRaw, dayRaw, hourRaw] = match;
  if (!yinYangRaw || !genderRaw || !stemRaw || !branchRaw || !monthRaw || !dayRaw || !hourRaw) {
    return null;
  }

  const yearStem = toCanonicalWord(stemRaw);
  const yearBranch = toCanonicalWord(branchRaw);
  const hourBranch = toCanonicalWord(hourRaw);
  if (!STEM_SET.has(yearStem) || !BRANCH_SET.has(yearBranch) || !BRANCH_SET.has(hourBranch)) {
    return null;
  }

  const lunarMonth = Number.parseInt(monthRaw, 10);
  const lunarDay = Number.parseInt(dayRaw, 10);
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) return null;
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) return null;

  return {
    yinYang: yinYangRaw.toLocaleUpperCase("vi") === "DƯƠNG" ? "dương" : "âm",
    gender: genderRaw.toLocaleUpperCase("vi") === "NAM" ? "male" : "female",
    yearStem,
    yearBranch,
    lunarMonth,
    lunarDay,
    hourBranch,
  };
}
