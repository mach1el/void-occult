import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "@/lib/ziwei/analysis/modules/annual-axes";
import type { AnnualAxesResult } from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxesSection } from "./AnnualAxesSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

function renderSection(school: "trung-chau" | "nam-phai" = "trung-chau") {
  const chart =
    school === "trung-chau" ? calculateTrungChau(REGRESSION) : calculateNamPhai(REGRESSION);
  return {
    chart,
    school,
    ...render(<AnnualAxesSection chart={chart} school={school} />),
  };
}

function firstAvailablePoint(container: HTMLElement) {
  const points = Array.from(
    container.querySelectorAll<SVGGElement>('.annual-axes-radar__point[role="button"]'),
  );
  return points.find((p) => p.getAttribute("aria-disabled") !== "true");
}

describe("AnnualAxesSection — Trung Châu available result", () => {
  it("renders header, radar, and selection hint", () => {
    const { container } = renderSection("trung-chau");

    expect(screen.getByText(/Sáu trục khí vận năm/)).toBeInTheDocument();
    expect(container.querySelector('[data-module="annual-axes"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.annual-axes-radar__point')).toHaveLength(6);
    expect(container.querySelector('.annual-axes-section__hint')?.textContent ?? "").toMatch(
      /Chọn một trục/,
    );
    expect(container.querySelector('.annual-axes-section__disclaimer')).toBeNull();
    expect(container.querySelector('.annual-axes-section__focus')).toBeNull();
  });

  it("does not show legacy engine badges", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="trung-chau" result={result} />,
    );
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.5");
    expect(container.textContent ?? "").not.toContain("Engine");
  });

  it("opens the detail panel when a radar point is clicked", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    fireEvent.click(point!);
    expect(screen.getByRole("region", { name: /Chi tiết/ })).toBeInTheDocument();
    const detail = container.querySelector('.annual-axis-detail');
    expect(detail?.textContent ?? "").toMatch(/Hỗ trợ|Áp lực|Điểm/);
  });

  it("closing the detail panel restores the previous state", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    fireEvent.click(point!);
    const closeButton = screen.getByRole("button", { name: /Đóng chi tiết/ });
    fireEvent.click(closeButton);
    expect(container.querySelector('.annual-axis-detail')).toBeNull();
  });
});

describe("AnnualAxesSection — Nam Phái available result", () => {
  it("renders the six-axis radar without a focus summary bar", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(container.querySelectorAll('.annual-axes-radar__point')).toHaveLength(6);
    expect(container.querySelector('.annual-axes-section__focus')).toBeNull();
    expect(container.textContent ?? "").toContain(`Năm ${result.annualYear}`);
    expect(container.textContent ?? "").not.toContain("Engine");
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.");
  });

  it("renders the exact core score without React-side rescaling", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    const point = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(point).toBeTruthy();
    fireEvent.click(point!);
    const wealth = result.axes.wealth;
    expect(wealth.status).toBe("available");
    if (wealth.status !== "available") return;
    expect(container.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);
    expect(result.versions.engineVersion).toBe("0.8.0");
    expect(container.textContent ?? "").toContain(`Năm ${result.annualYear}`);
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.8");
  });

  it("V0.8 scores without exposing engine badges", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV08=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(result.versions.engineVersion).toBe("0.8.0");
    expect(container.textContent ?? "").toContain(`Năm ${result.annualYear}`);
    expect(container.textContent ?? "").not.toContain("Engine");
  });
});

describe("AnnualAxesSection — unavailable/partial paths", () => {
  it("keeps unavailable domains keyboard-inspectable without implying a score", () => {
    const chart = calculateTrungChau(REGRESSION);
    const base = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const partial: AnnualAxesResult = {
      ...base,
      axes: {
        ...base.axes,
        romance: {
          domain: "romance",
          engine: "v0.2",
          status: "unavailable",
          score: null,
          band: null,
          evidence: [],
          reasonCodes: ["missing-required-annual-facts"],
        },
      },
    };
    const { container } = render(
      <AnnualAxesSection chart={chart} school="trung-chau" result={partial} />,
    );
    const romancePoint = container.querySelector<SVGGElement>('[data-domain="romance"]');
    expect(romancePoint).toBeDefined();
    expect(romancePoint!.getAttribute("tabindex")).toBe("0");
    expect(romancePoint!.getAttribute("aria-disabled")).toBeNull();
    expect(romancePoint!.getAttribute("data-status")).toBe("unavailable");
    expect(romancePoint!.getAttribute("aria-label") ?? "").toMatch(/không đủ dữ liệu/i);
  });
});

describe("AnnualAxesSection — keyboard accessibility", () => {
  it("radar points are keyboard-focusable and trigger selection on Enter", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    expect(point!.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(point!, { key: "Enter" });
    expect(screen.getByRole("region", { name: /Chi tiết/ })).toBeInTheDocument();
  });

  it("interactive controls expose accessible labels", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    expect((point!.getAttribute("aria-label") ?? "").trim().length).toBeGreaterThan(0);

    fireEvent.click(point!);
    const buttons = container.querySelectorAll("button");
    for (const btn of buttons) {
      const hasLabel = (btn.getAttribute("aria-label") ?? btn.textContent ?? "").trim().length > 0;
      expect(hasLabel).toBe(true);
    }
  });
});

describe("AnnualAxesSection — deterministic (no prediction prose)", () => {
  it("does not render any predictive prose verbs in the detail body", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    fireEvent.click(point!);
    const forbidden = ["sẽ có", "sẽ gặp", "chắc chắn", "vận số"];
    const detail = container.querySelector(".annual-axis-detail");
    expect(detail).toBeTruthy();
    const text = (detail?.textContent ?? "").toLowerCase();
    for (const word of forbidden) {
      expect(text).not.toContain(word.toLowerCase());
    }
  });

  it("emits `data-module=annual-axes` and stable domain data-attributes for e2e hooks", () => {
    const { container } = renderSection("trung-chau");
    expect(container.querySelector('[data-module="annual-axes"]')).toBeInTheDocument();
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"]) {
      expect(container.querySelector(`[data-domain="${domain}"]`)).toBeInTheDocument();
    }
  });
});

describe("AnnualAxesSection — feature flag disabled path", () => {
  it("is a no-op placeholder ChartPage responsibility — this section itself does not gate on the flag", () => {
    const { container } = renderSection("trung-chau");
    expect(within(container).getByText(/Sáu trục khí vận năm/)).toBeInTheDocument();
  });
});
