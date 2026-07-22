import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput, ChartData } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { AnnualAxesSection } from "@/components/ziwei/annual-axes/AnnualAxesSection";
import { buildRadarSegments } from "@/components/ziwei/annual-axes/AnnualAxesRadar";
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
const UI_PROOF_PATH = join(OUT_DIR, "annual-axes-v0.8-ui-proof.json");
const PRODUCT_PATH = join(OUT_DIR, "annual-axes-v0.8-product-fixture.json");

interface UiProofFixture {
  engineVersion: string;
  formulaVersion: string;
  knowledgeVersion: string;
  scores: Record<string, number | null>;
  noConfidencePercentage: boolean;
  expectedStatusLabels?: Record<string, string>;
}

interface ProductFixture {
  birth: BirthInput;
  formulaVersion: string;
  productFixture: Record<string, number | null>;
  statuses?: Record<string, string>;
}

describe("Annual Axes V0.8 UI proof (read-only)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("default DOM shows year without engine badge or confidence percentage", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.8.0");

    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(container.textContent ?? "").toContain(`Năm ${result.annualYear}`);
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.8");
    expect(container.textContent ?? "").not.toContain("Engine 0.8.0");
    expect(container.textContent ?? "").not.toContain("Độ tin cậy");
    expect(container.textContent ?? "").not.toContain("domainCenter");
    expect(container.textContent ?? "").not.toContain("robustScale");
    expect(container.textContent ?? "").not.toContain("directZ");
    expect(container.textContent ?? "").not.toContain("effectiveZ");

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      expect(["available", "partial-data", "unavailable"]).toContain(axis.status);
      if (axis.engine !== "v0.8" || axis.status === "unavailable") continue;
      const trace = axis.scoreTrace;
      expect(trace.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
      expect(trace.absoluteScore).toBe(axis.score);
      expect(axis.score).toBeGreaterThanOrEqual(10);
      expect(axis.score).toBeLessThanOrEqual(90);
    }

    const wealthPoint = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(wealthPoint).toBeTruthy();
    fireEvent.click(wealthPoint!);
    const wealth = result.axes.wealth;
    expect(wealth.status).not.toBe("unavailable");
    if (wealth.engine !== "v0.8" || wealth.status === "unavailable") return;
    expect(container.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);
    expect(container.textContent ?? "").not.toMatch(/Độ tin cậy\s+\d+%/);
    expect(container.textContent ?? "").not.toContain("Hỗ trợ nổi bật");
    expect(container.textContent ?? "").not.toContain("Áp lực nổi bật");
    expect(container.textContent ?? "").not.toContain("Tín hiệu có trọng số");
    expect(container.textContent ?? "").not.toContain("Tín hiệu sau Thái Tuế");
    expect(container.textContent ?? "").not.toContain("Ánh xạ cung lưu niên");
    expect(container.textContent ?? "").not.toContain("Độ phủ");
    expect(container.textContent ?? "").not.toContain("Lưu Thái Tuế: Không");
    if (wealth.engine === "v0.8") {
      expect(container.textContent ?? "").toContain("Cung trọng tâm");
      if (wealth.scoreTrace.scoreState === "no-signal") {
        expect(container.textContent ?? "").not.toContain("Cân bằng");
      }
    }
  });

  it("committed UI proof and product fixtures match live scoring exactly", () => {
    expect(existsSync(UI_PROOF_PATH)).toBe(true);
    expect(existsSync(PRODUCT_PATH)).toBe(true);
    const uiProof = JSON.parse(readFileSync(UI_PROOF_PATH, "utf8")) as UiProofFixture;
    const product = JSON.parse(readFileSync(PRODUCT_PATH, "utf8")) as ProductFixture;

    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const scores = Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => {
        const axis = result.axes[d];
        return [d, axis.status === "unavailable" ? null : axis.score];
      }),
    );
    const statuses = Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [d, result.axes[d].status]),
    );

    expect(uiProof.engineVersion).toBe(result.versions.engineVersion);
    expect(uiProof.knowledgeVersion).toBe(result.versions.knowledgeVersion);
    expect(uiProof.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
    expect(uiProof.noConfidencePercentage).toBe(true);
    expect(uiProof.scores).toEqual(scores);
    if (uiProof.expectedStatusLabels) {
      expect(uiProof.expectedStatusLabels).toEqual(statuses);
    }

    expect(product.birth).toEqual(REGRESSION);
    expect(product.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
    expect(product.productFixture).toEqual(scores);
    if (product.statuses) {
      expect(product.statuses).toEqual(statuses);
    }
  });

  it("unavailable axis is keyboard/click inspectable and not plotted at zero", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken: ChartData = {
      ...chart,
      annualHeadPalace: null,
      palaces: chart.palaces.map((p) => ({ ...p, annualPalaceName: undefined })),
    };
    const result = analyzeAnnualAxes(broken, { school: "nam-phai" });
    expect(result.axes.wealth.status).toBe("unavailable");

    const { container } = render(
      <AnnualAxesSection chart={broken} school="nam-phai" result={result} />,
    );
    const wealthPoint = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(wealthPoint).toBeTruthy();
    expect(wealthPoint!.getAttribute("tabindex")).toBe("0");
    expect(wealthPoint!.getAttribute("data-status")).toBe("unavailable");
    expect(wealthPoint!.getAttribute("data-radius")).toBe("gap");
    expect(wealthPoint!.querySelector('[data-plot="unavailable"]')).toBeTruthy();

    fireEvent.keyDown(wealthPoint!, { key: "Enter" });
    expect(container.textContent ?? "").toContain("Không đủ dữ liệu");
    expect(container.textContent ?? "").toMatch(/thiếu|Cung trọng tâm|reason|missing/i);
    expect(container.querySelector(".annual-axis-detail")).toBeTruthy();

    // Toggle closed then reopen via click.
    fireEvent.click(wealthPoint!);
    fireEvent.click(wealthPoint!);
    expect(container.textContent ?? "").toContain("Không đủ dữ liệu");
    expect(container.querySelector(".annual-axis-detail")).toBeTruthy();
  });

  it("radar segments omit center vertices for unavailable axes", () => {
    const scores = [60, null, 55, 40, null, 70];
    const segments = buildRadarSegments(scores);
    for (const segment of segments) {
      for (const point of segment) {
        const radius = Math.hypot(point.x - 210, point.y - 210);
        expect(radius).toBeGreaterThan(1);
      }
    }
    const plottedIndexes = segments.flatMap((s) => s.map((p) => p.index));
    expect(plottedIndexes).not.toContain(1);
    expect(plottedIndexes).not.toContain(4);
    expect(plottedIndexes).toEqual(expect.arrayContaining([0, 2, 3, 5]));
  });
});
