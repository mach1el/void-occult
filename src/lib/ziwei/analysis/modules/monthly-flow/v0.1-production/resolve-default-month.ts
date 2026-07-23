/**
 * UI-only helpers for Monthly Flow production (current month selection).
 * Inject `now` in tests — never call Date.now inside the scorer.
 */
import type { ZiweiSchool } from "../../../facts";
import { getEngine } from "../../../../chart";
import type { School } from "../../../../../../types/chart";
import type { MonthlyFlowMonthSummary } from "./month-summaries";

export interface ResolveMonthKeyOptions {
  annualYear: number;
  school: ZiweiSchool;
  monthSummaries: readonly MonthlyFlowMonthSummary[];
  /** Injected clock for deterministic tests. */
  now?: Date;
  timezone?: number;
}

/**
 * Resolve the actual current lunar month key when deterministically known.
 *
 * Rules:
 * 1. annualYear !== calendar year → null
 * 2. solar-to-lunar unavailable → null
 * 3. regular lunar month with matching summary → that key
 * 4. leap month with exact leap summary → leap key
 * 5. leap without exact leap summary → null
 * Never falls back to month 1 or first scoreable.
 */
export function resolveActualCurrentMonthKey(
  options: ResolveMonthKeyOptions,
): string | null {
  const {
    annualYear,
    school,
    monthSummaries,
    now = new Date(),
    timezone = 7,
  } = options;

  if (now.getFullYear() !== annualYear) return null;

  const engine = getEngine(school as School);
  if (!engine?.solarToLunar) return null;

  const lunar = engine.solarToLunar(
    now.getDate(),
    now.getMonth() + 1,
    now.getFullYear(),
    timezone,
  );
  if (
    !lunar ||
    !Number.isInteger(lunar.month) ||
    lunar.month < 1 ||
    lunar.month > 12
  ) {
    return null;
  }

  const isLeap = lunar.leap !== 0;

  if (isLeap) {
    const leapMatch = monthSummaries.find(
      (m) => m.isLeapMonth && m.lunarMonth === lunar.month,
    );
    return leapMatch?.monthKey ?? null;
  }

  const regularMatch = monthSummaries.find(
    (m) => !m.isLeapMonth && m.lunarMonth === lunar.month,
  );
  return regularMatch?.monthKey ?? null;
}

/**
 * Default selected lunar month:
 * 1. actual current key when available;
 * 2. otherwise regular month 1;
 * 3. otherwise first scoreable;
 * 4. otherwise first summary or null.
 */
export function resolveDefaultSelectedMonthKey(
  options: ResolveMonthKeyOptions,
): string | null {
  const { monthSummaries } = options;

  const actual = resolveActualCurrentMonthKey(options);
  if (actual) return actual;

  const regular = monthSummaries.filter((m) => !m.isLeapMonth);
  const month1 = regular.find((m) => m.lunarMonth === 1);
  if (month1) return month1.monthKey;

  const firstScoreable = monthSummaries.find((m) => m.status !== "unavailable");
  return firstScoreable?.monthKey ?? monthSummaries[0]?.monthKey ?? null;
}
