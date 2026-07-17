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
const annualRadarCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/trend/annual-radar.css"),
  "utf8",
);
const trendChartCss = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/trend/trend-chart.css"),
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
    expect(mobileChartCss).toMatch(
      /\.mobile-chart-switch button\.is-active\s*\{[^}]*background:\s*linear-gradient\(145deg,\s*#fff3c4/,
    );
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*max-width:\s*960px\s*\)[\s\S]*?\.compact-phi-flow\s*\{[^}]*font-family:\s*"Be Vietnam Pro"[^}]*font-size:\s*11px/,
    );
    expect(mobileChartCss).toMatch(
      /\.mobile-phi-section span\s*\{[^}]*font-family:\s*"Be Vietnam Pro"[^}]*font-size:\s*0\.84rem/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*max-width:\s*700px\s*\)[\s\S]*?\.profile-toggles \.toggle\.is-phi-toggle\s*\{[^}]*font-family:\s*'Be Vietnam Pro'/,
    );
  });

  it("keeps desktop page shell and compact chart fit under min-width 1201", () => {
    expect(chartCss).toMatch(/\.wrap\{[^}]*width:min\(2100px,100%\)/);
    expect(chartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.shell\{[\s\S]*?--ziwei-chart-fit:\s*min\(1280px,\s*calc\(\(100svh\s*-\s*80px\)\s*\*\s*880\s*\/\s*992\)\)/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?grid-template-columns:minmax\(780px,var\(--ziwei-chart-fit\)\)\s+minmax\(400px,1fr\)/,
    );
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.compact-chart-capture\s*\{[^}]*width:\s*100%/,
    );
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.compact-chart-capture\s*\{[^}]*max-width:\s*none/,
    );
    expect(compactChartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.compact-chart-svg\s*\{[^}]*width:\s*100%/,
    );
    expect(chartCss).not.toMatch(/\.chat-section\{[^}]*\bcontain\s*:/);
    expect(chartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s*>\s*\.ai-chat\{[^}]*flex:\s*1\s+1\s+0/,
    );
    expect(chartCss).toMatch(
      /@media\s*\(\s*min-width:\s*1201px\s*\)[\s\S]*?\.shell\s*>\s*\.chat-section\s+\.ai-chat-panel\{[^}]*flex:\s*1\s+1\s+0/,
    );
  });

  it("keeps stylesheet ownership: page shell only in tu-vi.css", () => {
    expect(compactChartCss).not.toMatch(/(^|[^\w-])\.shell(\s|>|,|\{)/);
    expect(compactChartCss).not.toMatch(/\.chat-section/);
    expect(compactChartCss).not.toMatch(/\.ai-chat-panel/);
    expect(mobileChartCss).not.toMatch(/(^|[^\w-])\.shell(\s|>|,|\{)/);
    expect(mobileChartCss).not.toMatch(/\.profile-form/);
    expect(mobileChartCss).not.toMatch(/\.chart-panel\s+\.panel-head/);
  });

  it("resets chat flex grow on stacked/mobile so chatbox does not collapse", () => {
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

  it("keeps annual radar stylesheet ownership and trend-radars layout in trend-chart.css", () => {
    expect(annualRadarCss).not.toMatch(/(^|[^\w-])\.shell(\s|>|,|\{)/);
    expect(annualRadarCss).not.toMatch(/\.trend-charts/);
    expect(annualRadarCss).not.toMatch(/\.trend-radars/);
    expect(trendChartCss).toMatch(
      /\.trend-charts\s*>\s*\.trend-radars[\s\S]*grid-column:\s*1\s*\/\s*-1/,
    );
    expect(trendChartCss).toMatch(
      /\.trend-radars\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(trendChartCss).toMatch(
      /@media\s*\(\s*max-width:\s*900px\s*\)[\s\S]*?\.trend-radars\s*\{[^}]*grid-template-columns:\s*1fr/,
    );
  });
});
