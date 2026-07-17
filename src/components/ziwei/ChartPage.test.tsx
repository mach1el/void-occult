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
  it("exposes profile fields in a natural input sequence", () => {
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
    for (const className of [
      "profile-name",
      "profile-date",
      "profile-hour",
      "profile-gender",
      "profile-flow",
      "profile-year",
      "profile-timezone",
      "profile-work",
      "profile-relationship",
    ]) {
      expect(container.querySelector(`.${className}`)).not.toBeNull();
    }
    expect(chartCss).toContain('"name date"');
    expect(chartCss).toContain('"hour gender"');
    expect(chartCss).toContain('"school school"');
    expect(chartCss).toContain('"flow flow"');
    expect(chartCss).toContain('"year timezone"');
    expect(chartCss).toContain('"work relation"');
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
    // Cột 1 = --ziwei-chart-fit; chat 1fr — không khoảng trống giữa chart và chat.
    expect(chartCss).toMatch(/\.wrap\{[^}]*width:min\(2100px,100%\)/);
    expect(chartCss).toMatch(
      /\.shell\{[^}]*--ziwei-chart-fit:\s*min\(1280px,\s*calc\(\(100svh\s*-\s*80px\)\s*\*\s*880\s*\/\s*992\)\)/,
    );
    expect(chartCss).toMatch(
      /\.shell\{[^}]*grid-template-columns:minmax\(780px,var\(--ziwei-chart-fit\)\)\s+minmax\(400px,1fr\)/,
    );
    expect(compactChartCss).toMatch(
      /--ziwei-chart-fit:\s*min\(1280px,\s*calc\(\(100svh\s*-\s*80px\)\s*\*\s*880\s*\/\s*992\)\)/,
    );
    expect(compactChartCss).toMatch(
      /grid-template-columns:\s*minmax\(780px,\s*var\(--ziwei-chart-fit\)\)\s+minmax\(400px,\s*1fr\)/,
    );
    expect(compactChartCss).toMatch(
      /\.shell\s+\.compact-chart-capture\s*\{[^}]*width:\s*100%/,
    );
    expect(compactChartCss).toMatch(
      /\.shell\s+\.compact-chart-capture\s*\{[^}]*max-width:\s*none/,
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

  it("resets chat flex grow on stacked/mobile so chatbox does not collapse", () => {
    // ≤1200px stack 1 cột: bỏ flex-grow desktop, giữ min-height theo viewport.
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*1200px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s*>\s*\.ai-chat[\s\S]*?flex:\s*none/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*1200px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s+\.ai-chat-panel[\s\S]*?flex:\s*none/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*1200px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s+\.ai-chat-panel[\s\S]*?min-height:\s*min\(78svh,\s*820px\)/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*1200px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s+\.ai-chat-msgs[\s\S]*?min-height:\s*min\(52svh,\s*520px\)/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*700px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s+\.ai-chat-panel[\s\S]*?min-height:\s*min\(85svh,\s*900px\)/,
    );
  });

  it("keeps compact chart overflow visible on mobile (no paint clip)", () => {
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*max-width:\s*960px\s*\)[\s\S]*?\.compact-chart-capture\s*\{[^}]*contain:\s*none/,
    );
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*max-width:\s*960px\s*\)[\s\S]*?\.compact-chart-capture\s*\{[^}]*overflow:\s*visible/,
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
