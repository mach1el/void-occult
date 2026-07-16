import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartPage } from "./ChartPage";

const chartCss = readFileSync(
  resolve(process.cwd(), "src/styles/tu-vi.css"),
  "utf8",
);
const globalStylesCss = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);
const compactChartCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/chart/compact-chart.css"),
  "utf8",
);
const mobileChartCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/chart/mobile-chart.css"),
  "utf8",
);

describe("ChartPage profile form", () => {
  it("exposes profile and chart options in a two-row toolbar", () => {
    const { container } = render(<ChartPage />);

    expect(screen.getByPlaceholderText("Họ và tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng công việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng mối quan hệ")).toBeInTheDocument();

    expect(screen.getByLabelText("Trường phái")).toBeInTheDocument();
    expect(screen.getByLabelText("Cách xem vận")).toBeInTheDocument();
    expect(screen.getByLabelText("Múi giờ")).toBeInTheDocument();
    expect(screen.getByLabelText("Giờ sinh")).toBeInTheDocument();
    expect(screen.queryByText("Tùy chọn")).not.toBeInTheDocument();
    expect(
      container.querySelectorAll(".profile-row-primary > .profile-field"),
    ).toHaveLength(4);
    expect(
      container.querySelector(".profile-row-primary > .profile-school"),
    ).not.toBeNull();
    expect(
      container.querySelectorAll(".profile-row-meta > .profile-field"),
    ).toHaveLength(5);
    expect(container.querySelector(".birth-prefs")).toBeNull();
    expect(container.querySelector(".shell > .chart-section")).not.toBeNull();
    expect(container.querySelector(".shell > .chat-section")).not.toBeNull();
    expect(container.querySelector(".shell > .trend-section")).not.toBeNull();
    // Header "Lá số 12 cung" đã bỏ — Copy/TXT/Ảnh nằm trên thanh nhập liệu.
    expect(screen.queryByRole("heading", { name: "Lá số 12 cung" })).not.toBeInTheDocument();
    expect(container.querySelector(".chart-workspace > .panel-head")).toBeNull();
    expect(container.querySelector(".profile-chart-actions")).not.toBeNull();
    expect(screen.getByLabelText("Sao chép văn bản")).toBeInTheDocument();
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
    expect(chartCss).toContain("--amber:#e2bc5f");
    expect(compactChartCss).toContain("fill: var(--void)");
    expect(compactChartCss).toContain("fill: var(--amber-soft)");
    expect(mobileChartCss).toContain("color: var(--element-kim) !important");
    expect(mobileChartCss).toContain("background: var(--danger-soft)");
  });

  it("keeps desktop chart compact-fit in view (not full-bleed, not collapsed)", () => {
    // Gọn fit view: trần cột 1280px + sized theo viewport, không phình full page.
    expect(chartCss).toMatch(/\.wrap\{[^}]*width:min\(2100px,100%\)/);
    expect(chartCss).toMatch(
      /\.shell\{[^}]*grid-template-columns:minmax\(780px,1280px\)\s+minmax\(400px,1fr\)/,
    );
    expect(compactChartCss).toMatch(
      /grid-template-columns:\s*minmax\(780px,\s*1280px\)\s+minmax\(400px,\s*1fr\)/,
    );
    expect(compactChartCss).toMatch(
      /\.shell\s+\.compact-chart-capture\s*\{[^}]*min\(100%,\s*1280px,\s*calc\(\(100svh\s*-\s*120px\)\s*\*\s*880\s*\/\s*896\)\)/,
    );
    // SVG width:100% trong khung (có width/height attribute) — không collapse.
    expect(compactChartCss).toMatch(
      /\.shell\s+\.compact-chart-svg\s*\{[^}]*width:\s*100%/,
    );
    // Chat cùng hàng phải stretch full chiều cao lá số (không còn layout containment).
    expect(chartCss).not.toMatch(/\.chat-section\{[^}]*\bcontain\s*:/);
    expect(chartCss).toMatch(
      /\.shell\s*>\s*\.chat-section\s*>\s*\.ai-chat\{[^}]*flex:\s*1\s+1\s+0/,
    );
    expect(chartCss).toMatch(
      /\.shell\s*>\s*\.chat-section\s+\.ai-chat-panel\{[^}]*flex:\s*1\s+1\s+0/,
    );
  });

  it("defines ngũ hành + tứ hóa tokens in exactly one place (src/styles.css :root)", () => {
    // Đọc giá trị thật từ CSS (không hard-code lại hex trong test, tránh vướng
    // grep dò hex ngũ hành và tránh test tự khớp với giá trị nó tự đặt ra).
    const readVar = (name: string) => {
      const match = globalStylesCss.match(
        new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`),
      );
      return match?.[1];
    };

    const elementTokens = ["element-moc", "element-hoa", "element-tho", "element-kim", "element-thuy"];
    const mutagenTokens = ["mutagen-loc", "mutagen-quyen", "mutagen-khoa", "mutagen-ky"];
    for (const token of [...elementTokens, ...mutagenTokens]) {
      expect(readVar(token), `--${token} phải được định nghĩa trong src/styles.css`).toBeDefined();
    }

    // Kim (bạc) và Thổ (vàng đất) phải khác màu — bug đã biết cần tránh lặp lại.
    expect(readVar("element-kim")).not.toBe(readVar("element-tho"));

    // tu-vi.css KHÔNG được định nghĩa lại --element-*/--mutagen-*, tránh đè
    // token toàn cục khi trang Tử Vi mount (thứ tự cascade sẽ ưu tiên bản sau).
    expect(chartCss).not.toMatch(/--element-(kim|moc|thuy|hoa|tho)\s*:/);
    expect(chartCss).not.toMatch(/--mutagen-(loc|quyen|khoa|ky)\s*:/);
  });
});
