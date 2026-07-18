import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { resolveMonthContexts } from "../resolve-month-contexts";
import { emptyMonthlyFlowYearDiagnostics } from "../types";
import { REGRESSION_BIRTH, trungChauProvider } from "./test-providers";

describe("coordinate independence — focus vs calendar", () => {
  it("changing focus palace does not change calendar stem/branch", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });

    // Now build a synthetic chart where we deliberately rotate palace
    // indices for flowMonths but keep the annualStem the same. Calendar
    // stem/branch (which the provider derives from annualStem + month)
    // must not shift.
    const rotated = {
      ...chart,
      monthlyPalaces: (chart.monthlyPalaces ?? []).map((entry) => ({
        ...entry,
        palace: chart.palaces[(entry.palace.index + 5) % 12] ?? entry.palace,
      })),
    };

    const diag2 = emptyMonthlyFlowYearDiagnostics();
    const { contexts: rotatedContexts } = resolveMonthContexts({
      chart: rotated,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics: diag2,
    });

    expect(contexts.map((c) => c.identity.calendarStem)).toEqual(
      rotatedContexts.map((c) => c.identity.calendarStem),
    );
    expect(contexts.map((c) => c.identity.calendarBranch)).toEqual(
      rotatedContexts.map((c) => c.identity.calendarBranch),
    );
    expect(contexts.map((c) => c.identity.focusPalaceIndex)).not.toEqual(
      rotatedContexts.map((c) => c.identity.focusPalaceIndex),
    );
  });

  it("changing annualStem via provider swap changes calendar stem/branch but not focus", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const baseline = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });

    // Simulate a different calendar table by injecting a provider that
    // shifts every stem forward by one — focus palace never touches
    // stem/branch so it must stay stable.
    const stems = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
    const shift = (s: string) => stems[(stems.indexOf(s) + 1) % stems.length]!;
    const shiftedProvider = {
      ...trungChauProvider(),
      stemBranchForLunarMonth: (yearStem: string, lunarMonth: number) => {
        const inner = trungChauProvider().stemBranchForLunarMonth(yearStem, lunarMonth);
        return { stem: shift(inner.stem), branch: inner.branch };
      },
    };

    const diag2 = emptyMonthlyFlowYearDiagnostics();
    const shifted = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider: shiftedProvider,
      diagnostics: diag2,
    });

    expect(baseline.contexts.map((c) => c.identity.focusPalaceIndex)).toEqual(
      shifted.contexts.map((c) => c.identity.focusPalaceIndex),
    );
    expect(baseline.contexts.map((c) => c.identity.calendarStem)).not.toEqual(
      shifted.contexts.map((c) => c.identity.calendarStem),
    );
  });

  it("never uses palace.stem/branch or FlowMonthEntry.stem as calendar identity", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const providerCalendar = trungChauProvider().stemBranchForLunarMonth(chart.annualStem, 1);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const poisoned = {
      ...chart,
      monthlyPalaces: (chart.monthlyPalaces ?? []).map((entry) => ({
        ...entry,
        stem: "Quý",
        branch: "Hợi",
        palace: {
          ...entry.palace,
          stem: "Tân",
          branch: "Dậu",
        },
      })),
    };

    const { contexts } = resolveMonthContexts({
      chart: poisoned,
      school: "trung-chau",
      provider: trungChauProvider(),
      diagnostics,
    });
    const first = contexts.find((c) => c.identity.lunarMonth === 1);
    expect(first?.identity.calendarStem).toBe(providerCalendar.stem);
    expect(first?.identity.calendarBranch).toBe(providerCalendar.branch);
    expect(first?.identity.calendarStem).not.toBe("Quý");
    expect(first?.identity.calendarStem).not.toBe("Tân");
  });
});
