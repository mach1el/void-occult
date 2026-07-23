import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import {
  resolveActualCurrentMonthKey,
  resolveDefaultSelectedMonthKey,
} from "../resolve-default-month";
import { analyzeMonthlyFlowProduction } from "../analyze-production";
import { REGRESSION_BIRTH } from "../../__tests__/test-providers";
import type { MonthlyFlowMonthSummary } from "../month-summaries";

const NOW_JULY_2026 = new Date(2026, 6, 15);
const NOW_LEAP_AUG_2025 = new Date(2025, 7, 1);

function syntheticSummaries(
  overrides: Partial<MonthlyFlowMonthSummary>[] = [],
): MonthlyFlowMonthSummary[] {
  const base = analyzeMonthlyFlowProduction(calculateTrungChau(REGRESSION_BIRTH), {
    school: "trung-chau",
  }).monthSummaries;
  return base.map((s, i) => ({ ...s, ...overrides[i] }));
}

describe("resolveActualCurrentMonthKey / resolveDefaultSelectedMonthKey", () => {
  it("resolves regular lunar month when calendar year matches annual year", () => {
    const monthSummaries = syntheticSummaries();
    const actual = resolveActualCurrentMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries,
      now: NOW_JULY_2026,
    });
    expect(actual).toBe("2026-M06");
    expect(resolveDefaultSelectedMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries,
      now: NOW_JULY_2026,
    })).toBe(actual);
  });

  it("resolves leap month when explicit leap summary exists", () => {
    const monthSummaries = syntheticSummaries();
    const leapSummary: MonthlyFlowMonthSummary = {
      ...monthSummaries[5]!,
      monthKey: "2025-M06-L",
      lunarMonth: 6,
      isLeapMonth: true,
    };
    const withLeap = [...monthSummaries.map((m) => ({ ...m, monthKey: m.monthKey.replace("2026", "2025") })), leapSummary];

    const actual = resolveActualCurrentMonthKey({
      annualYear: 2025,
      school: "trung-chau",
      monthSummaries: withLeap,
      now: NOW_LEAP_AUG_2025,
    });
    expect(actual).toBe("2025-M06-L");
  });

  it("leap without leap summary → actual null; default → M01; no false current", () => {
    const monthSummaries = syntheticSummaries().map((m) => ({
      ...m,
      monthKey: m.monthKey.replace("2026", "2025"),
    }));

    const actual = resolveActualCurrentMonthKey({
      annualYear: 2025,
      school: "trung-chau",
      monthSummaries,
      now: NOW_LEAP_AUG_2025,
    });
    expect(actual).toBeNull();

    const defaultKey = resolveDefaultSelectedMonthKey({
      annualYear: 2025,
      school: "trung-chau",
      monthSummaries,
      now: NOW_LEAP_AUG_2025,
    });
    expect(defaultKey).toBe("2025-M01");
    expect(actual).not.toBe("2025-M06");
    expect(actual).not.toBe("2025-M01");
  });

  it("returns null when annual year differs from calendar year", () => {
    const monthSummaries = syntheticSummaries();
    expect(
      resolveActualCurrentMonthKey({
        annualYear: 2026,
        school: "trung-chau",
        monthSummaries,
        now: NOW_LEAP_AUG_2025,
      }),
    ).toBeNull();
    expect(
      resolveDefaultSelectedMonthKey({
        annualYear: 2026,
        school: "trung-chau",
        monthSummaries,
        now: NOW_LEAP_AUG_2025,
      }),
    ).toBe("2026-M01");
  });

  it("never returns regular M01 when in leap month without leap summary", () => {
    const monthSummaries = syntheticSummaries().map((m) => ({
      ...m,
      monthKey: m.monthKey.replace("2026", "2025"),
    }));

    const actual = resolveActualCurrentMonthKey({
      annualYear: 2025,
      school: "trung-chau",
      monthSummaries,
      now: NOW_LEAP_AUG_2025,
    });
    expect(actual).not.toBe("2025-M01");
    expect(actual).toBeNull();
  });
});
