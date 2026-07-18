import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { analyzeMonthlyFlow, resolveYearStatus } from "../analyze";
import { resolveMonthContexts } from "../resolve-month-contexts";
import {
  emptyMonthlyFlowMonthDiagnostics,
  emptyMonthlyFlowYearDiagnostics,
  type MonthResult,
} from "../types";
import { REGRESSION_BIRTH, trungChauProvider } from "./test-providers";

function availableMonth(lunarMonth: number, isLeapMonth = false): MonthResult {
  return {
    identity: {
      annualYear: 2026,
      lunarMonth,
      isLeapMonth,
      monthKey: `2026-${isLeapMonth ? "LM" : "M"}${String(lunarMonth).padStart(2, "0")}`,
      focusPalaceIndex: 0,
      calendarStem: "Giáp",
      calendarBranch: "Tý",
    },
    status: "available",
    axes: {} as MonthResult["axes"],
    diagnostics: emptyMonthlyFlowMonthDiagnostics(),
  };
}

describe("resolveYearStatus", () => {
  it("returns available only when all twelve regular months are available", () => {
    const months = Array.from({ length: 12 }, (_, i) => availableMonth(i + 1));
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    expect(resolveYearStatus(months, diagnostics)).toBe("available");
  });

  it("returns partial when a regular month is missing", () => {
    const months = Array.from({ length: 11 }, (_, i) => availableMonth(i + 1));
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    diagnostics.missingMonthlyEntries.push("2026-M12");
    expect(resolveYearStatus(months, diagnostics)).toBe("partial");
  });

  it("returns partial when duplicate month keys are diagnosed", () => {
    const months = Array.from({ length: 11 }, (_, i) => availableMonth(i === 10 ? 12 : i + 1));
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    diagnostics.duplicateMonthKeys.push("2026-M06:palaces=0,1");
    diagnostics.missingMonthlyEntries.push("2026-M06");
    expect(resolveYearStatus(months, diagnostics)).toBe("partial");
  });

  it("returns unavailable when no month is scoreable", () => {
    const months: MonthResult[] = [
      { ...availableMonth(1), status: "unavailable" },
      { ...availableMonth(2), status: "unavailable" },
    ];
    expect(resolveYearStatus(months, emptyMonthlyFlowYearDiagnostics())).toBe("unavailable");
  });

  it("keeps available when an invalid leap does not disturb twelve regular months", () => {
    const months = [
      ...Array.from({ length: 12 }, (_, i) => availableMonth(i + 1)),
    ];
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    diagnostics.invalidMonthNumber.push("leap:13");
    diagnostics.missingFocusPalace.push("2026-LM04");
    expect(resolveYearStatus(months, diagnostics)).toBe("available");
  });
});

describe("analyzeMonthlyFlow — year status integration", () => {
  it("missing month yields year status partial, never available", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const missing = {
      ...chart,
      monthlyPalaces: (chart.monthlyPalaces ?? []).filter((e) => e.month !== 6),
    };
    const result = analyzeMonthlyFlow(missing, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.months).toHaveLength(11);
    expect(result.diagnostics.missingMonthlyEntries).toContain("2026-M06");
    expect(result.status).toBe("partial");
    expect(result.status).not.toBe("available");
  });

  it("duplicate month yields year status partial", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const entries = [...(chart.monthlyPalaces ?? [])];
    const first = entries[0]!;
    const otherPalace = chart.palaces.find((p) => p.index !== first.palace.index)!;
    const duped = {
      ...chart,
      monthlyPalaces: [
        ...entries,
        { ...first, palace: otherPalace },
      ],
    };
    const result = analyzeMonthlyFlow(duped, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.diagnostics.duplicateMonthKeys.length).toBeGreaterThan(0);
    expect(result.status).toBe("partial");
  });

  it("eleven valid months never report year available", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const eleven = {
      ...chart,
      monthlyPalaces: (chart.monthlyPalaces ?? []).filter((e) => e.month !== 12),
    };
    const result = analyzeMonthlyFlow(eleven, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.months).toHaveLength(11);
    expect(result.months.every((m) => m.status === "available" || m.status === "partial")).toBe(
      true,
    );
    expect(result.status).toBe("partial");
  });

  it("invalid leap month does not downgrade twelve valid regular months", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
      explicitLeapContexts: [
        {
          lunarMonth: 13,
          focusPalaceIndex: 0,
          calendarStem: "Giáp",
          calendarBranch: "Tý",
        },
      ],
    });
    expect(result.months).toHaveLength(12);
    expect(result.diagnostics.invalidMonthNumber).toContain("leap:13");
    expect(result.status).toBe("available");
  });
});

describe("resolveMonthContexts — natal physical transformation targets", () => {
  function palace(index: number, stars: ChartStar[], name = `P${index}`): ChartPalace {
    return { index, branch: `b${index}`, name, stars };
  }

  function chartWithStars(palaces: ChartPalace[]): ChartData {
    const all = [...palaces];
    for (let i = 0; i < 12; i++) {
      if (!all.find((p) => p.index === i)) all.push(palace(i, []));
    }
    return {
      annualYear: 2026,
      annualStem: "Bính",
      monthlyPalaces: Array.from({ length: 12 }, (_, offset) => ({
        month: offset + 1,
        palace: all[offset]!,
      })),
      palaces: all,
    } as unknown as ChartData;
  }

  it("accepts natal Văn Xương as the exact physical target", () => {
    const target = palace(4, [
      { name: "Văn Xương", layer: "minor", source: "natal" },
    ]);
    const chart = chartWithStars([target]);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const provider = {
      school: "trung-chau" as const,
      tuHoaTargets: () => [{ mutagen: "Khoa", starName: "Văn Xương" }],
      stemBranchForLunarMonth: trungChauProvider().stemBranchForLunarMonth,
    };
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider,
      diagnostics,
    });
    const month = contexts[0]!;
    expect(month.transformations).toHaveLength(1);
    expect(month.transformations[0]!.targetPalaceIndex).toBe(4);
    expect(month.transformations[0]!.canonicalStarName).toBe("Văn Xương");
    expect(month.transformationsPartial).toBe(false);
  });

  it("rejects Lưu Văn Xương alone (annual moving star)", () => {
    const target = palace(4, [
      { name: "Lưu Văn Xương", layer: "minor", source: "annual" },
    ]);
    const chart = chartWithStars([target]);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const provider = {
      school: "trung-chau" as const,
      tuHoaTargets: () => [{ mutagen: "Khoa", starName: "Văn Xương" }],
      stemBranchForLunarMonth: trungChauProvider().stemBranchForLunarMonth,
    };
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider,
      diagnostics,
    });
    expect(contexts[0]!.transformations).toHaveLength(0);
    expect(contexts[0]!.transformationsPartial).toBe(true);
    expect(diagnostics.unresolvedTransformationTargets.length).toBeGreaterThan(0);
  });

  it("natal Văn Xương plus Lưu Văn Xương is not ambiguous", () => {
    const natalPalace = palace(4, [
      { name: "Văn Xương", layer: "minor", source: "natal" },
    ]);
    const annualPalace = palace(7, [
      { name: "Lưu Văn Xương", layer: "minor", source: "annual" },
    ]);
    const chart = chartWithStars([natalPalace, annualPalace]);
    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const provider = {
      school: "trung-chau" as const,
      tuHoaTargets: () => [{ mutagen: "Khoa", starName: "Văn Xương" }],
      stemBranchForLunarMonth: trungChauProvider().stemBranchForLunarMonth,
    };
    const { contexts } = resolveMonthContexts({
      chart,
      school: "trung-chau",
      provider,
      diagnostics,
    });
    expect(contexts[0]!.transformations).toHaveLength(1);
    expect(contexts[0]!.transformations[0]!.targetPalaceIndex).toBe(4);
    expect(diagnostics.ambiguousTransformationTargets).toEqual([]);
    expect(contexts[0]!.transformationsPartial).toBe(false);
  });
});

describe("analyzeMonthlyFlow — transformationsPartial", () => {
  it("marks the month partial when one TF resolves and one does not", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    // Find a natal star that exists so at least one TF can resolve, and
    // inject an unresolvable target alongside the real table.
    const natalStar = chart.palaces
      .flatMap((p) => (p.stars ?? []).map((s) => ({ palace: p, star: s })))
      .find((x) => (x.star.source ?? "natal") === "natal" && !x.star.name.startsWith("Lưu "));
    expect(natalStar).toBeTruthy();

    const provider = {
      school: "trung-chau" as const,
      tuHoaTargets: () => [
        { mutagen: "Khoa", starName: natalStar!.star.name },
        { mutagen: "Kỵ", starName: "___NO_SUCH_STAR___" },
      ],
      stemBranchForLunarMonth: trungChauProvider().stemBranchForLunarMonth,
    };

    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider,
    });

    expect(result.months.length).toBe(12);
    for (const month of result.months) {
      expect(month.status).toBe("partial");
      expect(month.diagnostics.unresolvedTransformationTargets.length).toBeGreaterThan(0);
      // Fully resolved TF evidence is still retained somewhere in the year.
    }
    const resolvedEvidence = result.months.flatMap((m) =>
      Object.values(m.axes).flatMap((axis) =>
        axis.status === "available"
          ? axis.evidence.filter((e) => e.category === "monthly-transformation")
          : [],
      ),
    );
    expect(resolvedEvidence.length).toBeGreaterThan(0);
    expect(result.status).toBe("partial");
  });
});
