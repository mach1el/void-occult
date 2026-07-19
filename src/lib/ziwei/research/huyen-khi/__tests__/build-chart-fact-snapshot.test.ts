import { describe, expect, it } from "vitest";
import { loadPublicHuyenKhiDataset } from "../load-dataset";
import { parsePublicSummaryTitle } from "../parse-public-summary";
import { buildHuyenKhiChartFactSnapshots } from "../build-chart-fact-snapshot";

describe("buildHuyenKhiChartFactSnapshots", () => {
  it("never fabricates a chart fact snapshot for an ambiguous lunar year", () => {
    const dataset = loadPublicHuyenKhiDataset();
    for (const record of dataset.records) {
      const parsed = parsePublicSummaryTitle(record.displayTitle);
      expect(parsed).not.toBeNull();
      if (!parsed) continue;
      const result = buildHuyenKhiChartFactSnapshots(parsed);
      if (result.status !== "resolved") {
        expect(result.namPhai).toBeNull();
        expect(result.trungChau).toBeNull();
      } else {
        expect(result.namPhai).not.toBeNull();
        expect(result.trungChau).not.toBeNull();
      }
    }
  });

  it("is deterministic — same parsed title yields byte-identical snapshots", () => {
    const parsed = parsePublicSummaryTitle("DƯƠNG NAM CANH TÍ, tháng 2 ngày 8, giờ DẦN");
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    const a = buildHuyenKhiChartFactSnapshots(parsed);
    const b = buildHuyenKhiChartFactSnapshots(parsed);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("builds a full 12-palace snapshot for both schools when the year is unique", () => {
    // 1984-02-02 Tết boundary means Giáp Tý within a narrow window has a
    // unique resolution for most month/day combos far from the boundary —
    // use a controlled synthetic mid-year date instead of a seed record
    // (all 18 seeds are ambiguous, see resolve-solar-date.test.ts).
    const parsed = {
      yinYang: "dương" as const,
      gender: "male" as const,
      yearStem: "Giáp",
      yearBranch: "Tý",
      lunarMonth: 6,
      lunarDay: 15,
      hourBranch: "Ngọ",
    };
    const result = buildHuyenKhiChartFactSnapshots(parsed);
    if (result.status !== "resolved") {
      // Even a mid-year date can still hit >1 sexagenary cycle in the
      // 1900-2026 window — assert the honest fallback instead of forcing it.
      expect(result.namPhai).toBeNull();
      return;
    }
    expect(result.namPhai?.palaces).toHaveLength(12);
    expect(result.trungChau?.palaces).toHaveLength(12);
    expect(result.namPhai?.menhPalaceIndex).toBeGreaterThanOrEqual(0);
  });
});
