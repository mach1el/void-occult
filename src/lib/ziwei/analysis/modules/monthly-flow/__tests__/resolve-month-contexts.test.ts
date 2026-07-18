import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { resolveMonthContexts } from "../resolve-month-contexts";
import { emptyMonthlyFlowYearDiagnostics } from "../types";
import { REGRESSION_BIRTH, trungChauProvider } from "./test-providers";

describe("resolveMonthContexts — regular months 1..12", () => {
  it("produces twelve month keys 'YYYY-M01'..'YYYY-M12' in sorted order", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const { contexts, rejected } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });

    expect(rejected).toBe(false);
    expect(contexts).toHaveLength(12);
    expect(contexts.map((c) => c.identity.monthKey)).toEqual([
      "2026-M01",
      "2026-M02",
      "2026-M03",
      "2026-M04",
      "2026-M05",
      "2026-M06",
      "2026-M07",
      "2026-M08",
      "2026-M09",
      "2026-M10",
      "2026-M11",
      "2026-M12",
    ]);
    expect(diagnostics.duplicateMonthKeys).toEqual([]);
    expect(diagnostics.missingMonthlyEntries).toEqual([]);
  });

  it("leap month key uses LM prefix and is distinct from regular", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const focus = chart.palaces[3]!.index;
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: trungChauProvider(),
      explicitLeapContexts: [
        {
          lunarMonth: 3,
          focusPalaceIndex: focus,
          calendarStem: "Bính",
          calendarBranch: "Dần",
        },
      ],
      diagnostics,
    });

    const keys = contexts.map((c) => c.identity.monthKey);
    expect(keys.filter((k) => k === "2026-M03")).toHaveLength(1);
    expect(keys.filter((k) => k === "2026-LM03")).toHaveLength(1);
    expect(keys).toContain("2026-LM03");

    const leap = contexts.find((c) => c.identity.monthKey === "2026-LM03");
    expect(leap?.identity.calendarStem).toBe("Bính");
    expect(leap?.identity.calendarBranch).toBe("Dần");
    expect(leap?.identity.focusPalaceIndex).toBe(focus);

    const idx = keys.indexOf("2026-M03");
    const leapIdx = keys.indexOf("2026-LM03");
    expect(leapIdx).toBe(idx + 1);
  });

  it("input order does not affect sorted output", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const shuffled = { ...chart, monthlyPalaces: [...(chart.monthlyPalaces ?? [])].reverse() };
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const { contexts } = resolveMonthContexts({
      chart: shuffled,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });
    expect(contexts.map((c) => c.identity.lunarMonth)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("missing regular month produces a partial year plus diagnostic", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const missingSix = {
      ...chart,
      monthlyPalaces: (chart.monthlyPalaces ?? []).filter((e) => e.month !== 6),
    };
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const { contexts } = resolveMonthContexts({
      chart: missingSix,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });
    expect(contexts.map((c) => c.identity.lunarMonth)).toEqual([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]);
    expect(diagnostics.missingMonthlyEntries).toContain("2026-M06");
  });

  it("bad leap-month input does not wipe regular months out", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: trungChauProvider(),
      explicitLeapContexts: [
        { lunarMonth: 13, focusPalaceIndex: 0, calendarStem: "Giáp", calendarBranch: "Tý" },
        { lunarMonth: 4, focusPalaceIndex: 999, calendarStem: "Ất", calendarBranch: "Sửu" },
        {
          lunarMonth: 5,
          focusPalaceIndex: 0,
          calendarStem: "",
          calendarBranch: "Dần",
        },
      ],
      diagnostics,
    });
    expect(contexts).toHaveLength(12);
    expect(diagnostics.invalidMonthNumber).toContain("leap:13");
    expect(diagnostics.missingFocusPalace.some((k) => k === "2026-LM04")).toBe(true);
    expect(diagnostics.missingCalendarStemBranch.some((k) => k === "2026-LM05")).toBe(true);
  });

  it("does not call stemBranchForLunarMonth when resolving leap contexts", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const monthsAsked: number[] = [];
    const provider = {
      ...trungChauProvider(),
      stemBranchForLunarMonth: (yearStem: string, lunarMonth: number) => {
        monthsAsked.push(lunarMonth);
        return trungChauProvider().stemBranchForLunarMonth(yearStem, lunarMonth);
      },
    };
    const focus = chart.palaces[2]!.index;
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider,
      explicitLeapContexts: [
        {
          lunarMonth: 2,
          focusPalaceIndex: focus,
          calendarStem: "Kỷ",
          calendarBranch: "Mùi",
        },
      ],
      diagnostics,
    });
    // Provider is used for the twelve regular months only — never for leap.
    expect(monthsAsked).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const leap = contexts.find((c) => c.identity.isLeapMonth);
    expect(leap?.identity.calendarStem).toBe("Kỷ");
    expect(leap?.identity.calendarBranch).toBe("Mùi");
  });

  it("rejects provider whose school does not match", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const badProvider = { ...trungChauProvider(), school: "nam-phai" as const };
    const { contexts, rejected } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: badProvider,
      diagnostics,
    });
    expect(rejected).toBe(true);
    expect(contexts).toHaveLength(0);
    expect(diagnostics.providerSchoolMismatch.length).toBeGreaterThan(0);
  });
});
