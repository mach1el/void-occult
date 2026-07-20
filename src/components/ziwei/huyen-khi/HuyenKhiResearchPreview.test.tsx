import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import {
  HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
  isHuyenKhiPreviewV01Enabled,
} from "@/lib/ziwei/analysis";
import { HuyenKhiResearchPreview } from "./HuyenKhiResearchPreview";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("isHuyenKhiPreviewV01Enabled", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("defaults OFF", () => {
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });

  it("opts in via query and persists for the session", () => {
    window.history.replaceState({}, "", `/?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=1`);
    expect(isHuyenKhiPreviewV01Enabled()).toBe(true);
    window.history.replaceState({}, "", "/");
    expect(isHuyenKhiPreviewV01Enabled()).toBe(true);
  });

  it("opts out via query", () => {
    window.sessionStorage.setItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG, "1");
    window.history.replaceState({}, "", `/?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=0`);
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });
});

describe("HuyenKhiResearchPreview", () => {
  it("selects Mệnh by default and exposes 12 accessible palace controls", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    expect(screen.getByText("Huyền Khí")).toBeInTheDocument();
    expect(screen.getByText("Research Preview")).toBeInTheDocument();
    expect(
      screen.getByText(/Đây là bản xem trước dữ liệu cấu trúc/),
    ).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(12);

    const menh = chart.palaces.find((p) => p.isMenh);
    expect(menh).toBeDefined();
    const selected = options.find((o) => o.getAttribute("aria-selected") === "true");
    expect(selected?.textContent ?? "").toContain(menh!.name);
    expect(container.querySelector(".huyen-khi-preview__detail")).toBeTruthy();
  });

  it("keeps phụ tinh and dimension frame collapsed by default", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    const minors = container.querySelector<HTMLDetailsElement>(
      '[data-minors-collapsed="true"]',
    );
    const dims = container.querySelector<HTMLDetailsElement>(
      '[data-dimensions-collapsed="true"]',
    );
    expect(minors).toBeTruthy();
    expect(dims).toBeTruthy();
    expect(minors?.open).toBe(false);
    expect(dims?.open).toBe(false);
  });

  it("shows five Chưa đánh giá states when the dimension frame is opened", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    const dims = container.querySelector('[data-dimensions-collapsed]');
    expect(dims).toBeTruthy();
    fireEvent.click(within(dims as HTMLElement).getByText("Khung đánh giá Huyền Khí"));

    const states = container.querySelectorAll(".huyen-khi-preview__dim-state");
    expect(states).toHaveLength(5);
    for (const el of states) {
      expect(el.textContent).toBe("Chưa đánh giá");
    }
    expect(container.textContent ?? "").toMatch(/cổng kiểm chứng chuyên gia/);
  });

  it("does not render a numeric score label", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bĐiểm\b/);
    expect(text).not.toMatch(/\bscore\b/i);
    expect(text).not.toMatch(/\b[0-9]+(\.[0-9]+)?\s*%/);
  });

  it("resets selection to Mệnh when a natal identity field (birth hour) changes", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { rerender, container } = render(
      <HuyenKhiResearchPreview chart={chartA} school="nam-phai" />,
    );

    const nonMenh = screen.getAllByRole("option").find(
      (o) => o.getAttribute("aria-selected") !== "true",
    );
    expect(nonMenh).toBeDefined();
    fireEvent.click(nonMenh!);

    const chartB = calculateNamPhai({ ...REGRESSION, birthHour: "Tý" });
    rerender(<HuyenKhiResearchPreview chart={chartB} school="nam-phai" />);

    const menh = chartB.palaces.find((p) => p.isMenh);
    const selected = container.querySelector('.huyen-khi-preview__palace.is-selected');
    expect(selected?.textContent ?? "").toContain(menh!.name);
  });

  it("preserves a non-Mệnh selection across an annualYear-only rerender (same natal input)", () => {
    const chartA = calculateNamPhai({ ...REGRESSION, annualYear: "2026" });
    const { rerender, container } = render(
      <HuyenKhiResearchPreview chart={chartA} school="nam-phai" />,
    );

    const nonMenh = screen.getAllByRole("option").find(
      (o) => o.getAttribute("aria-selected") !== "true",
    );
    expect(nonMenh).toBeDefined();
    const nonMenhLabel = nonMenh!.textContent;
    fireEvent.click(nonMenh!);

    const selectedBefore = container.querySelector(".huyen-khi-preview__palace.is-selected");
    expect(selectedBefore?.textContent).toBe(nonMenhLabel);

    // Same natal input, only annualYear differs — mirrors what ChartPage
    // does when the user changes the viewed year.
    const chartB = calculateNamPhai({ ...REGRESSION, annualYear: "2031" });
    rerender(<HuyenKhiResearchPreview chart={chartB} school="nam-phai" />);

    const selectedAfter = container.querySelector(".huyen-khi-preview__palace.is-selected");
    expect(selectedAfter?.textContent).toBe(nonMenhLabel);
  });

  it("resets selection to the new school's own Mệnh when school changes", () => {
    const chartNamPhai = calculateNamPhai(REGRESSION);
    const { rerender, container } = render(
      <HuyenKhiResearchPreview chart={chartNamPhai} school="nam-phai" />,
    );

    const nonMenh = screen.getAllByRole("option").find(
      (o) => o.getAttribute("aria-selected") !== "true",
    );
    fireEvent.click(nonMenh!);

    const chartTrungChau = calculateTrungChau(REGRESSION);
    rerender(<HuyenKhiResearchPreview chart={chartTrungChau} school="trung-chau" />);

    const menh = chartTrungChau.palaces.find((p) => p.isMenh);
    const selected = container.querySelector(".huyen-khi-preview__palace.is-selected");
    expect(selected?.textContent ?? "").toContain(menh!.name);
  });

  it("renders dimension labels and definitions matching ontology V0.1 vocabulary", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    const dims = container.querySelector('[data-dimensions-collapsed]');
    fireEvent.click(within(dims as HTMLElement).getByText("Khung đánh giá Huyền Khí"));

    const text = container.textContent ?? "";
    expect(text).toContain("Sức chứa");
    expect(text).toContain("Tính kết nối");
    expect(text).toContain("Khả năng biểu hiện");
    expect(text).toContain("Khả năng điều tiết");
    expect(text).toContain("Khuynh hướng");
    expect(text).toContain(
      "Khả năng duy trì và chứa đựng lực cấu trúc tại cung.",
    );
    expect(text).toContain(
      "Mức độ các thành phần tại cung phối hợp hoặc kéo ngược nhau.",
    );
    expect(text).toContain(
      "Mức độ cấu trúc tại cung có thể biểu hiện ra ngoài hay bị cản trở.",
    );
    expect(text).toContain(
      "Khả năng kiềm chế, điều hòa hoặc chuyển hóa các yếu tố gây nhiễu.",
    );
    expect(text).toContain(
      "Nhãn định hướng định tính của toàn cấu trúc; không phải điểm tốt hoặc xấu.",
    );
    // Guard against the two rejected definitions the finalization prompt
    // explicitly calls out.
    expect(text).not.toContain("nuôi dưỡng");
    expect(text).not.toMatch(/ổn định khí/);
  });

  it("renders stem and branch with a space between them (no concatenation)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );
    const menh = chart.palaces.find((p) => p.isMenh)!;
    const detail = container.querySelector(".huyen-khi-preview__detail");
    expect(detail?.textContent ?? "").toContain(`${menh.stem} ${menh.branch}`);
  });
});
