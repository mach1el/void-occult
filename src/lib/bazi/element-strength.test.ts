import { expect, test } from "vitest";
import { calculateElementStrength } from "./element-strength";
import { generateBaziChart } from "./bazi-engine";
import { DEFAULT_CONVENTIONS } from "./conventions";

test("calculateElementStrength should sum up to total breakdown", () => {
  const chart = generateBaziChart(new Date("1990-01-01T12:00:00Z"), 105.8, 420, "M");
  const strength = calculateElementStrength(chart);
  
  let totalFromBreakdown = 0;
  for (const item of strength.breakdown) {
    totalFromBreakdown += item.points;
  }
  
  let totalFromScores = 0;
  for (const el of Object.values(strength.scores)) {
    totalFromScores += el;
  }
  
  expect(Math.abs(totalFromBreakdown - totalFromScores)).toBeLessThan(0.01);
});

test("month branch has highest multiplier", () => {
  const chart = generateBaziChart(new Date("1990-01-01T12:00:00Z"), 105.8, 420, "M");
  const customConventions = { ...DEFAULT_CONVENTIONS, elementWeights: { ...DEFAULT_CONVENTIONS.elementWeights, monthBranchMultiplier: 5.0 } };
  const strength = calculateElementStrength(chart, customConventions);
  
  const monthItems = strength.breakdown.filter(i => i.source.includes("Tháng") && i.source.includes("Tàng Can"));
  expect(monthItems.length).toBeGreaterThan(0);
  
  // They should be scaled by 5 * 1.2 = 6.0 basically
  const firstMonthItem = monthItems[0]!;
  expect(firstMonthItem.reason).toContain("5 (Nguyệt Lệnh)");
});
