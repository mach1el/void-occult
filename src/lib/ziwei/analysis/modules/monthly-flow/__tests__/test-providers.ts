import * as namPhaiEngine from "@/lib/ziwei/engine-nam-phai";
import * as trungChauEngine from "@/lib/ziwei/engine-trung-chau";
import type { MonthlyCalculationProvider } from "../types";

/** Wrap the Trung Châu engine's exported Tứ Hóa + Ngũ Hổ Độn helpers as a
 * `MonthlyCalculationProvider`. Kept in tests only — the scorer itself
 * never imports either engine module directly. */
export function trungChauProvider(): MonthlyCalculationProvider {
  return {
    school: "trung-chau",
    tuHoaTargets: (stem) => trungChauEngine.tuHoaTargets(stem),
    stemBranchForLunarMonth: (yearStem, lunarMonth) =>
      trungChauEngine.stemBranchForLunarMonth(yearStem, lunarMonth),
  };
}

export function namPhaiProvider(): MonthlyCalculationProvider {
  return {
    school: "nam-phai",
    tuHoaTargets: (stem) => namPhaiEngine.tuHoaTargets(stem),
    stemBranchForLunarMonth: (yearStem, lunarMonth) =>
      namPhaiEngine.stemBranchForLunarMonth(yearStem, lunarMonth),
  };
}

export const REGRESSION_BIRTH = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};
