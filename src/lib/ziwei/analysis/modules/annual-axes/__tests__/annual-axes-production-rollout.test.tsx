import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { getAnalysisStatus } from "../../../contracts/common";
import { analyzeAnnualAxes } from "../analyze";
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

function resetSession() {
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
}

function scoresFor(result: ReturnType<typeof analyzeAnnualAxes>): number[] {
  return ANNUAL_AXIS_DOMAINS.flatMap((domain) => {
    const axis = result.axes[domain];
    return axis.status === "available" ? [axis.score] : [];
  });
}

describe("Annual Axes V0.5 production routing matrix", () => {
  beforeEach(resetSession);

  it("Nam Phái default → engine 0.5.0", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");
  });

  it("Nam Phái ?ziweiAnnualAxesV05=1 → engine 0.5.0", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");
  });

  it("Nam Phái ?ziweiAnnualAxesV043=1 → engine 0.5.0 (V0.4.3 not publicly routed)", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV043=1");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");
  });

  it("Nam Phái rollback ?ziweiAnnualAxesV05=0 → engine 0.4.2", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.4.2");
  });

  it("Nam Phái rollback wins over ?ziweiAnnualAxesV043=1", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0&ziweiAnnualAxesV043=1");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.4.2");
  });

  it("Trung Châu default → engine 0.2.0", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
    expect(result.versions.engineVersion).toBe("0.2.0");
  });

  it("Trung Châu ignores V0.5/V0.4.3 query flags", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1&ziweiAnnualAxesV043=1");
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
    expect(result.versions.engineVersion).toBe("0.2.0");
  });
});

describe("Annual Axes school-aware analysis status", () => {
  beforeEach(resetSession);

  it("Nam Phái default status version matches analyzer", () => {
    const status = getAnalysisStatus("annual-axes", { school: "nam-phai" });
    expect(status).toEqual({
      status: "available",
      module: "annual-axes",
      version: "0.5.0",
    });
    const result = analyzeAnnualAxes(calculateNamPhai(REGRESSION), { school: "nam-phai" });
    if (status.status === "available") {
      expect(result.versions.engineVersion).toBe(status.version);
    }
  });

  it("Nam Phái rollback status version matches analyzer", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
    const status = getAnalysisStatus("annual-axes", { school: "nam-phai" });
    expect(status).toEqual({
      status: "available",
      module: "annual-axes",
      version: "0.4.2",
    });
    const result = analyzeAnnualAxes(calculateNamPhai(REGRESSION), { school: "nam-phai" });
    if (status.status === "available") {
      expect(result.versions.engineVersion).toBe(status.version);
    }
  });

  it("Trung Châu status version matches analyzer", () => {
    const status = getAnalysisStatus("annual-axes", { school: "trung-chau" });
    expect(status).toEqual({
      status: "available",
      module: "annual-axes",
      version: "0.2.0",
    });
    const result = analyzeAnnualAxes(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    if (status.status === "available") {
      expect(result.versions.engineVersion).toBe(status.version);
    }
  });

  it("invalid V0.5 knowledge fails closed without silent V0.4.2 fallback", async () => {
    vi.resetModules();
    vi.doMock("../../../knowledge/annual-axes/v0.5/loader", () => ({
      loadAnnualAxesKnowledgeV05NamPhai: () => ({
        ok: false,
        issues: [{ path: "test", message: "broken" }],
      }),
      resetAnnualAxesKnowledgeV05NamPhaiCache: () => {},
    }));

    const { getAnalysisStatus: statusFn } = await import("../../../contracts/common");
    const { analyzeAnnualAxes: analyzeFn } = await import("../analyze");

    const status = statusFn("annual-axes", { school: "nam-phai" });
    expect(status).toEqual({
      status: "unavailable",
      module: "annual-axes",
      reason: "invalid-knowledge",
    });

    const result = analyzeFn(calculateNamPhai(REGRESSION), { school: "nam-phai" });
    expect(result.status).toBe("unavailable");
    expect(result.versions.engineVersion).toBe("0.5.0");
    expect(result.diagnostics.invalidKnowledge.some((m) => m.includes("v0.5:"))).toBe(true);

    vi.doUnmock("../../../knowledge/annual-axes/v0.5/loader");
    vi.resetModules();
  });
});

describe("Annual Axes V0.5 score trace and UI parity", () => {
  beforeEach(resetSession);

  it("scoreTrace reconstructs axis.score on every available domain", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.5.0");

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      expect(axis.scoreTrace?.formulaVersion).toBe("v0.5-calibrated-core");
      const trace = axis.scoreTrace!;
      expect(trace.absoluteScore).toBe(axis.score);
      expect(trace.activationGate).toBe(axis.activationGate);
      expect(trace.latent).toBe(axis.latent);
      expect(Number.isFinite(trace.annualActivationRaw)).toBe(true);
      expect(Number.isFinite(trace.natalGain)).toBe(true);
      expect(Number.isFinite(trace.spatialSigned)).toBe(true);
      expect(trace.domainScale).toBeGreaterThan(0);
    }
  });

  it("tooltip, detail, and radar all show the exact core score", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );

    const wealth = result.axes.wealth;
    expect(wealth.status).toBe("available");
    if (wealth.status !== "available") return;

    const point = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(point).toBeTruthy();
    fireEvent.click(point!);

    expect(container.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);

    const detail = container.querySelector(".annual-axis-detail");
    expect(detail?.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);
    expect(detail?.textContent ?? "").toContain("Kích hoạt năm:");
    expect(detail?.textContent ?? "").not.toContain("Amplitude:");
  });

  it("production V0.5 spreads beyond the former V0.4.2 compression band", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
    const chart = calculateNamPhai(REGRESSION);
    const v042Scores = scoresFor(analyzeAnnualAxes(chart, { school: "nam-phai" }));
    const v042Min = Math.min(...v042Scores);
    const v042Max = Math.max(...v042Scores);
    const v042Range = v042Max - v042Min;

    resetSession();
    const v05Scores = scoresFor(analyzeAnnualAxes(chart, { school: "nam-phai" }));
    const outsideBand = v05Scores.filter((s) => s < v042Min || s > v042Max);
    expect(outsideBand.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...v05Scores) - Math.min(...v05Scores)).toBeGreaterThan(v042Range * 0.5);
  });

  it("changing annual year recalculates V0.5 results", () => {
    const a = analyzeAnnualAxes(
      calculateNamPhai({ ...REGRESSION, annualYear: "2026" }),
      { school: "nam-phai" },
    );
    const b = analyzeAnnualAxes(
      calculateNamPhai({ ...REGRESSION, annualYear: "2027" }),
      { school: "nam-phai" },
    );
    const flatten = (r: typeof a) =>
      ANNUAL_AXIS_DOMAINS.map((d) =>
        r.axes[d].status === "available" ? r.axes[d].score : null,
      );
    expect(flatten(a)).not.toEqual(flatten(b));
  });
});

describe("Annual Axes production badges", () => {
  beforeEach(resetSession);

  it("default Nam Phái shows V0.5 production badge", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
    expect(screen.getByText("Nam Phái V0.5 · Fallback")).toBeInTheDocument();
    expect(screen.getByText("Engine 0.5.0")).toBeInTheDocument();
  });

  it("rollback Nam Phái shows V0.4.2 Fallback badge", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
    expect(screen.getByText("Nam Phái V0.4.2 · Fallback")).toBeInTheDocument();
    expect(screen.getByText("Engine 0.4.2")).toBeInTheDocument();
  });

  it("Trung Châu never displays a Nam Phái badge", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1&ziweiAnnualAxesV043=1");
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="trung-chau" result={result} />,
    );
    expect(container.textContent ?? "").toContain("Trung Châu · Experimental");
    expect(container.textContent ?? "").not.toContain("Nam Phái");
  });

  it("V0.4.3 session flag does not change badge or engine", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV043=1");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
    expect(screen.getByText("Nam Phái V0.5 · Fallback")).toBeInTheDocument();
    expect(screen.getByText("Engine 0.5.0")).toBeInTheDocument();
  });
});

describe("isAnnualAxesV05Enabled production flag", () => {
  beforeEach(() => {
    vi.resetModules();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults ON in browser with no overrides", async () => {
    const { isAnnualAxesV05Enabled: enabled } = await import("../../../feature-flags");
    expect(enabled()).toBe(true);
  });

  it("env false cannot be overridden by query 1", async () => {
    vi.stubEnv("VITE_ZIWEI_ANNUAL_AXES_V05", "false");
    const { isAnnualAxesV05Enabled: enabled } = await import("../../../feature-flags");
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
    expect(enabled()).toBe(false);
  });

  it("query 0 persists rollback for the session", async () => {
    const { isAnnualAxesV05Enabled: enabled, ANNUAL_AXES_V05_FEATURE_FLAG: flag } =
      await import("../../../feature-flags");
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
    expect(enabled()).toBe(false);
    window.history.replaceState({}, "", "/");
    expect(enabled()).toBe(false);
    expect(window.sessionStorage.getItem(flag)).toBe("0");
  });

  it("query 1 persists enable for the session", async () => {
    const { isAnnualAxesV05Enabled: enabled } = await import("../../../feature-flags");
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
    expect(enabled()).toBe(true);
    window.history.replaceState({}, "", "/");
    expect(enabled()).toBe(true);
  });
});
