import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { analyzeAnnualAxesNamPhaiV05 } from "../nam-phai-v05/analyze";
import { analyzeAnnualAxesNamPhaiV06 } from "../nam-phai-v06/analyze";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { AnnualAxesSection } from "@/components/ziwei/annual-axes/AnnualAxesSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function scoresOf(result: ReturnType<typeof analyzeAnnualAxesNamPhaiV05>) {
  return Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => {
      const axis = result.axes[d];
      return [d, axis.status === "available" ? axis.score : null];
    }),
  );
}

describe("Annual Axes V0.6 UI proof (product fixture)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("default production remains V0.5 with exact fixture scores", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");
    expect(scoresOf(result)).toEqual({
      health: 41.9,
      family: 59.2,
      wealth: 47.5,
      career: 50,
      social: 53.7,
      romance: 58.9,
    });
    render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
    expect(screen.getByText("Nam Phái V0.5 · Fallback")).toBeTruthy();
    expect(screen.getByText("Engine 0.5.0")).toBeTruthy();
  });

  it("opt-in V0.6 changes scores and badge; radar uses exact core scores", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV06=1");
    const chart = calculateNamPhai(REGRESSION);
    const v05 = analyzeAnnualAxesNamPhaiV05(chart);
    const v06 = analyzeAnnualAxesNamPhaiV06(chart);
    const routed = analyzeAnnualAxes(chart, { school: "nam-phai" });

    expect(routed.versions.engineVersion).toBe("0.6.0");
    expect(v06.versions.engineVersion).toBe("0.6.0");

    const s05 = scoresOf(v05) as Record<string, number>;
    const s06 = scoresOf(v06) as Record<string, number>;
    const vals06 = ANNUAL_AXIS_DOMAINS.map((d) => s06[d]!);
    const range = Math.max(...vals06) - Math.min(...vals06);
    const l1 = ANNUAL_AXIS_DOMAINS.reduce((s, d) => s + Math.abs(s06[d]! - s05[d]!), 0);

    expect(s06).not.toEqual(s05);
    expect(range).toBeGreaterThan(0);
    expect(l1).toBeGreaterThan(0);

    render(<AnnualAxesSection chart={chart} school="nam-phai" result={v06} />);
    expect(screen.getByText("Nam Phái V0.6 · Experimental")).toBeTruthy();
    expect(screen.getByText("Engine 0.6.0")).toBeTruthy();

    // Accessibility / visible score labels equal Calculation Core.
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = v06.axes[domain];
      if (axis.status !== "available") continue;
      expect(axis.scoreTrace?.absoluteScore).toBe(axis.score);
      expect(axis.scoreTrace?.formulaVersion).toBe("v0.6-annual-dominant-core");
    }

    // Persist proof artifact for PR body.
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        proof: "annual-axes-v06-ui-dom",
        v05: { badge: "Nam Phái V0.5 · Fallback", engine: "0.5.0", scores: s05 },
        v06: {
          badge: "Nam Phái V0.6 · Experimental",
          engine: "0.6.0",
          scores: s06,
          radarRange: range,
          l1FromV05: l1,
        },
        selectionStatus: "no-variant-approved",
      }),
    );
  });

  it("V06=0 keeps V0.5 fallback chain", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV06=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");
  });
});
