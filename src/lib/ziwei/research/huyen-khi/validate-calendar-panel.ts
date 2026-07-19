import type { HuyenKhiCalendarMenhPanel, HuyenKhiCalendarPanelReport } from "./types-v02-1";

const CANONICAL_HOURS = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

/**
 * §"Complete panel validation" — a panel is complete only when all 12
 * canonical hours appear exactly once. Rejects missing/duplicated hours;
 * malformed-score and mixed-date/mixed-sex rejection are enforced by the
 * type system (one `solarDate`/`sex` per panel) plus the numeric checks
 * below.
 */
export function validateCalendarPanel(panel: HuyenKhiCalendarMenhPanel): HuyenKhiCalendarPanelReport {
  const seen = new Map<string, number>();
  for (const h of panel.hours) {
    seen.set(h.hourBranch, (seen.get(h.hourBranch) ?? 0) + 1);
  }

  const missingHours = CANONICAL_HOURS.filter((h) => !seen.has(h));
  const duplicateHours = [...seen.entries()].filter(([, count]) => count > 1).map(([h]) => h);

  const malformed = panel.hours.some(
    (h) => !Number.isFinite(h.menhHuyenKhi) || !Number.isFinite(h.wholeChartTotal),
  );

  const complete = missingHours.length === 0 && duplicateHours.length === 0 && !malformed && panel.hours.length === 12;

  const invariantFacts = ["solarDate", "sex", "lunarDate"];
  const changedFacts = ["hourBranch", "menhHuyenKhi", "wholeChartTotal", "cuc", "thanCu", "menhPalaceStemBranch"];

  return {
    solarDate: panel.solarDate,
    sex: panel.sex,
    complete,
    invariantFacts,
    changedFacts,
    missingHours,
    duplicateHours,
  };
}
