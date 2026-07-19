import { describe, expect, it } from "vitest";
import { adjudicateLunarDate } from "../lunar-date-adjudication";

describe("adjudicateLunarDate · real V0.2 disagreement (1994-05-20)", () => {
  it("records the real engine-vs-site 1-day disagreement without forcing a winner", () => {
    const result = adjudicateLunarDate("1994-05-20", { year: 1994, month: 4, day: 10, isLeapMonth: false });
    expect(result.calculationCore).toEqual({ year: 1994, month: 4, day: 11, isLeapMonth: false });
    expect(result.sourceCalendar.day).toBe(10);
    // No independent third reference supplied — genuinely unresolved, not
    // defaulted to either side.
    expect(result.outcome).toBe("unresolved");
    expect(result.possibleFactors).toContain("new-moon-boundary");
  });

  it("agrees exactly for 1969-04-08 (the first real cross-check, V0.2)", () => {
    const result = adjudicateLunarDate("1969-04-08", { year: 1969, month: 2, day: 22, isLeapMonth: false });
    expect(result.outcome).toBe("all-agree");
    expect(result.possibleFactors).toEqual([]);
  });

  it("with a third independent reference agreeing with the source, majority favors the source", () => {
    const result = adjudicateLunarDate(
      "1994-05-20",
      { year: 1994, month: 4, day: 10, isLeapMonth: false },
      [{ sourceId: "independent-lunar-calendar-tool", value: { year: 1994, month: 4, day: 10, isLeapMonth: false } }],
    );
    expect(result.outcome).toBe("source-and-majority-agree");
  });
});
