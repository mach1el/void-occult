import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import {
  MONTHLY_FLOW_VISIBLE_DOMAINS,
  MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT,
  projectVisibleMonthSummary,
  projectVisibleMonthSummaries,
} from "../display-projection";
import { analyzeMonthlyFlowProduction } from "../analyze-production";
import { REGRESSION_BIRTH } from "../../__tests__/test-providers";

describe("projectVisibleMonthSummary", () => {
  const chart = calculateTrungChau(REGRESSION_BIRTH);
  const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });

  it("visible composite excludes health from mean", () => {
    for (const summary of analysis.monthSummaries) {
      const visible = projectVisibleMonthSummary(summary);
      if (visible.visibleCompositeScore == null) continue;

      const visibleScores = MONTHLY_FLOW_VISIBLE_DOMAINS.map(
        (d) => visible.visibleDomainScores[d],
      ).filter((s): s is number => s != null);

      const healthAxis = summary.result.axes.health;
      const allSix = ANNUAL_AXIS_DOMAINS.map((d) => summary.result.axes[d])
        .filter((a) => a.status === "available" && a.score != null)
        .map((a) => (a.status === "available" ? a.score : 0));
      const meanSix =
        allSix.length === 0 ? null : allSix.reduce((s, n) => s + n, 0) / allSix.length;

      expect(visibleScores.length).toBe(visible.visibleAxisCount);
      expect(visible.visibleAxisCount).toBeLessThanOrEqual(MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT);
      expect("health" in visible.visibleDomainScores).toBe(false);

      const meanFive = visibleScores.reduce((s, n) => s + n, 0) / visibleScores.length;
      expect(visible.visibleCompositeScore).toBe(Math.round(meanFive * 10) / 10);

      if (
        healthAxis.status === "available" &&
        healthAxis.score != null &&
        allSix.length === 6 &&
        meanSix != null
      ) {
        expect(visible.visibleCompositeScore).not.toBe(Math.round(meanSix * 10) / 10);
      }
    }
  });

  it("strongest and weakest domains are never health", () => {
    for (const visible of projectVisibleMonthSummaries(analysis.monthSummaries)) {
      if (visible.visibleStrongestDomain) {
        expect(visible.visibleStrongestDomain).not.toBe("health");
        expect(MONTHLY_FLOW_VISIBLE_DOMAINS).toContain(visible.visibleStrongestDomain);
      }
      if (visible.visibleWeakestDomain) {
        expect(visible.visibleWeakestDomain).not.toBe("health");
        expect(MONTHLY_FLOW_VISIBLE_DOMAINS).toContain(visible.visibleWeakestDomain);
      }
    }
  });

  it("mean uses five visible domains only", () => {
    for (const summary of analysis.monthSummaries) {
      if (summary.status === "unavailable") continue;
      const visible = projectVisibleMonthSummary(summary);
      const scores = MONTHLY_FLOW_VISIBLE_DOMAINS.map((d) => visible.visibleDomainScores[d]).filter(
        (s): s is number => s != null,
      );
      if (scores.length === 0) {
        expect(visible.visibleCompositeScore).toBeNull();
        continue;
      }
      const expected = Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10;
      expect(visible.visibleCompositeScore).toBe(expected);
      expect(visible.visibleAxisCoverage).toBe(scores.length / MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT);
    }
  });
});
