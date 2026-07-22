import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { AnnualAxesSection } from "@/components/ziwei/annual-axes/AnnualAxesSection";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.8");

describe("Annual Axes V0.8 UI proof", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("default DOM shows Engine 0.8.0 without confidence percentage", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.8.0");

    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(container.textContent ?? "").toContain("Nam Phái V0.8");
    expect(container.textContent ?? "").toContain("Engine 0.8.0");
    expect(container.textContent ?? "").not.toContain("Độ tin cậy");
    expect(container.textContent ?? "").not.toContain("domainCenter");
    expect(container.textContent ?? "").not.toContain("robustScale");
    expect(container.textContent ?? "").not.toContain("directZ");
    expect(container.textContent ?? "").not.toContain("effectiveZ");

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") continue;
      const trace = axis.scoreTrace;
      expect(trace?.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
      if (trace?.formulaVersion !== "v0.8-annual-palace-weighted-score") continue;
      expect(trace.absoluteScore).toBe(axis.score);
      expect(axis.score).toBeGreaterThanOrEqual(10);
      expect(axis.score).toBeLessThanOrEqual(90);
    }

    const wealthPoint = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(wealthPoint).toBeTruthy();
    fireEvent.click(wealthPoint!);
    const wealth = result.axes.wealth;
    expect(wealth.status).toBe("available");
    if (wealth.status !== "available") return;
    expect(container.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);
    expect(container.textContent ?? "").not.toMatch(/Độ tin cậy\s+\d+%/);
    if (wealth.scoreTrace?.formulaVersion === "v0.8-annual-palace-weighted-score") {
      if (wealth.scoreTrace.scoreState === "no-signal") {
        expect(container.textContent ?? "").not.toContain("Cân bằng");
      }
    }

    mkdirSync(OUT_DIR, { recursive: true });
    const scores = Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => {
        const axis = result.axes[d];
        return [d, axis.status === "available" ? axis.score : null];
      }),
    );
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-ui-proof.json"),
      `${JSON.stringify(
        {
          engineVersion: result.versions.engineVersion,
          formulaVersion: "v0.8-annual-palace-weighted-score",
          knowledgeVersion: result.versions.knowledgeVersion,
          scores,
          noConfidencePercentage: true,
        },
        null,
        2,
      )}\n`,
    );

    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-product-fixture.json"),
      `${JSON.stringify(
        {
          birth: REGRESSION,
          formulaVersion: "v0.8-annual-palace-weighted-score",
          productFixture: scores,
        },
        null,
        2,
      )}\n`,
    );
  });
});
