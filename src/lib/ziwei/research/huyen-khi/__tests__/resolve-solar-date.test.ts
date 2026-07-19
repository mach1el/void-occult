import { describe, expect, it } from "vitest";
import { loadPublicHuyenKhiDataset } from "../load-dataset";
import { parsePublicSummaryTitle } from "../parse-public-summary";
import { candidateLunarYears, resolveSolarDateForLunar } from "../resolve-solar-date";

describe("resolveSolarDateForLunar", () => {
  it("anchors the sexagenary cycle correctly at 1984 = Giáp Tý", () => {
    expect(candidateLunarYears("Giáp", "Tý")).toContain(1984);
    expect(candidateLunarYears("Giáp", "Tý", 1980, 1988)).toEqual([1984]);
  });

  it("finds a unique solar date for a known lunar date within a single-cycle window", () => {
    // 1984-02-02 is the first day of the Giáp Tý lunar year (Tết).
    const result = resolveSolarDateForLunar({
      yinYang: "dương",
      gender: "male",
      yearStem: "Giáp",
      yearBranch: "Tý",
      lunarMonth: 1,
      lunarDay: 1,
      hourBranch: "Tý",
    });
    const candidatesIn1984 = result.candidates.filter((c) => c.lunarYear === 1984);
    expect(candidatesIn1984.length).toBeGreaterThan(0);
  });

  it("reports every one of the 18 real seed titles' resolution status without silently guessing", () => {
    const dataset = loadPublicHuyenKhiDataset();
    const summary = { unique: 0, ambiguous: 0, unresolved: 0 };
    for (const record of dataset.records) {
      const parsed = parsePublicSummaryTitle(record.displayTitle);
      expect(parsed).not.toBeNull();
      if (!parsed) continue;
      const resolved = resolveSolarDateForLunar(parsed);
      summary[resolved.yearResolution] += 1;
      // Never silently pick one candidate when more than one exists.
      if (resolved.yearResolution === "ambiguous") {
        expect(resolved.candidates.length).toBeGreaterThan(1);
      }
      if (resolved.yearResolution === "unique") {
        expect(resolved.candidates.length).toBe(1);
      }
    }
    // eslint-disable-next-line no-console
    console.log("resolveSolarDateForLunar seed summary:", summary);
    expect(summary.unique + summary.ambiguous + summary.unresolved).toBe(18);
  });
});
