import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartPage } from "./ChartPage";

const chartCss = readFileSync(
  resolve(process.cwd(), "src/styles/tu-vi.css"),
  "utf8",
);
const compactChartCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/compact-chart.css"),
  "utf8",
);
const mobileChartCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/mobile-chart.css"),
  "utf8",
);

describe("ChartPage profile form", () => {
  it("exposes profile and chart options in one toolbar", () => {
    const { container } = render(<ChartPage />);

    expect(screen.getByPlaceholderText("Họ và tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng công việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng mối quan hệ")).toBeInTheDocument();

    expect(screen.getByLabelText("Trường phái")).toBeInTheDocument();
    expect(screen.getByLabelText("Cách xem vận")).toBeInTheDocument();
    expect(screen.getByLabelText("Múi giờ")).toBeInTheDocument();
    expect(screen.queryByText("Tùy chọn")).not.toBeInTheDocument();
    expect(
      container.querySelectorAll(".profile-fields-grid > .profile-field"),
    ).toHaveLength(7);
    expect(container.querySelector(".shell > .chart-section")).not.toBeNull();
    expect(container.querySelector(".shell > .chat-section")).not.toBeNull();
  });

  it("keeps closed selects transparent and native options dark", () => {
    expect(chartCss).toMatch(
      /\.profile-field select\{[^}]*background-color:transparent;/,
    );
    expect(chartCss).toMatch(
      /\.profile-field select option\{[^}]*background-color:var\(--surface-raised\) !important;/,
    );
    expect(chartCss).toContain("color-scheme:only dark");
  });

  it("keeps the Mystic Gold palette semantic across chart modes", () => {
    expect(chartCss).toContain("--surface-raised:#1b1734");
    expect(chartCss).toContain("--amber:#d6ae55");
    expect(chartCss).toContain("--element-kim:#d8d3c8");
    expect(chartCss).toContain("--element-moc:#79c98f");
    expect(chartCss).toContain("--element-thuy:#78aeea");
    expect(chartCss).toContain("--element-hoa:#ef756c");
    expect(chartCss).toContain("--element-tho:#d9aa5c");
    expect(compactChartCss).toContain("fill: var(--void)");
    expect(compactChartCss).toContain("fill: var(--amber-soft)");
    expect(mobileChartCss).toContain("color: var(--element-kim) !important");
    expect(mobileChartCss).toContain("background: var(--danger-soft)");
  });
});
