import { solarToLunar } from "../../engine-nam-phai";
import type { LunarDateAdjudication, LunarDateFactor, LunarDateValue } from "./types-v02-1";

function valuesAgree(a: LunarDateValue, b: LunarDateValue): boolean {
  return a.month === b.month && a.day === b.day && (a.year == null || b.year == null || a.year === b.year);
}

/**
 * §"Lunar-date adjudication" — never automatically calls a Calculation
 * Core / source-site disagreement a Core bug, and never treats the site
 * as automatically authoritative for deciding which side is "right"
 * (only for identifying which detail record on the site corresponds to a
 * V0.1 sample — a distinct, narrower use already handled by
 * `recover-v01-dates.ts`).
 */
export function adjudicateLunarDate(
  solarDate: string,
  sourceCalendar: LunarDateValue,
  independentReferences: Array<{ sourceId: string; value: LunarDateValue; methodology?: string }> = [],
): LunarDateAdjudication {
  const [y, m, d] = solarDate.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`invalid solarDate ${solarDate}`);
  }
  const coreLunar = solarToLunar(d, m, y, 7);
  const calculationCore: LunarDateValue = {
    year: coreLunar.year,
    month: coreLunar.month,
    day: coreLunar.day,
    isLeapMonth: coreLunar.leap === 1,
  };

  const allValues = [
    { id: "source-calendar", value: sourceCalendar },
    { id: "calculation-core", value: calculationCore },
    ...independentReferences.map((r) => ({ id: r.sourceId, value: r.value })),
  ];

  const agreesWithSource = allValues.filter((v) => v.id !== "source-calendar" && valuesAgree(v.value, sourceCalendar));
  const agreesWithCore = allValues.filter((v) => v.id !== "calculation-core" && valuesAgree(v.value, calculationCore));

  let outcome: LunarDateAdjudication["outcome"];
  if (valuesAgree(sourceCalendar, calculationCore)) {
    outcome = independentReferences.length > 0 && independentReferences.some((r) => !valuesAgree(r.value, sourceCalendar))
      ? "public-sources-disagree"
      : "all-agree";
  } else if (independentReferences.length === 0) {
    outcome = "unresolved";
  } else if (agreesWithSource.length > agreesWithCore.length) {
    outcome = "source-and-majority-agree";
  } else if (agreesWithCore.length > agreesWithSource.length) {
    outcome = "core-and-majority-agree";
  } else {
    outcome = "unresolved";
  }

  const possibleFactors: LunarDateFactor[] = [];
  if (!valuesAgree(sourceCalendar, calculationCore)) {
    const dayDiff = Math.abs(sourceCalendar.day - calculationCore.day);
    if (sourceCalendar.month === calculationCore.month && dayDiff === 1) {
      possibleFactors.push("new-moon-boundary");
    }
    if (sourceCalendar.isLeapMonth !== calculationCore.isLeapMonth) {
      possibleFactors.push("leap-month-policy");
    }
    if (possibleFactors.length === 0) possibleFactors.push("unknown");
    possibleFactors.push("timezone", "ephemeris-version");
  }

  return { solarDate, sourceCalendar, calculationCore, independentReferences, outcome, possibleFactors };
}
