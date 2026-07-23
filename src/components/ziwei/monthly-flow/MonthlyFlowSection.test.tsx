import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import {
  analyzeMonthlyFlowProduction,
  resolveDefaultSelectedMonthKey,
} from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production";
import { MonthlyFlowSection } from "./MonthlyFlowSection";
import { MonthlyFlowTimelineChart } from "./MonthlyFlowTimelineChart";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const NOW_JULY_2026 = new Date(2026, 6, 15);

describe("MonthlyFlowTimelineChart", () => {
  it("renders Y-axis 0–100, 12 month labels, and current month marker", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const currentKey = resolveDefaultSelectedMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries: analysis.monthSummaries,
      now: NOW_JULY_2026,
    })!;

    const { container } = render(
      <MonthlyFlowTimelineChart
        summaries={analysis.monthSummaries}
        selectedMonthKey={currentKey}
        currentMonthKey={currentKey}
        onSelectMonthKey={() => {}}
      />,
    );

    for (const t of [0, 20, 40, 60, 80, 100]) {
      expect(container.querySelector(".mf-flow-timeline__y-axis")?.textContent).toContain(
        String(t),
      );
    }

    for (let m = 1; m <= 12; m += 1) {
      expect(container.textContent).toContain(`Th.${m}`);
    }

    expect(screen.getAllByText("Tháng hiện tại")).toHaveLength(1);
    expect(container.querySelector("[data-testid='mf-flow-timeline-scroll']")).not.toBeNull();
    expect(container.querySelectorAll(".mf-flow-timeline__bar-placeholder").length).toBe(0);
  });

  it("renders partial and unavailable bars safely", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const summaries = analysis.monthSummaries.map((summary, index) => {
      if (index === 0) {
        return { ...summary, status: "unavailable" as const, compositeScore: null };
      }
      if (index === 1) {
        return { ...summary, status: "partial" as const };
      }
      return summary;
    });

    const { container } = render(
      <MonthlyFlowTimelineChart
        summaries={summaries}
        selectedMonthKey={summaries[2]!.monthKey}
        currentMonthKey={summaries[2]!.monthKey}
        onSelectMonthKey={() => {}}
      />,
    );

    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
    expect(container.querySelector(".mf-flow-timeline__bar-composite.is-partial")).not.toBeNull();
  });

  it("supports keyboard activation of another month", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const currentKey = resolveDefaultSelectedMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries: analysis.monthSummaries,
      now: NOW_JULY_2026,
    })!;
    const other = analysis.monthSummaries.find((m) => m.monthKey !== currentKey)!;
    const selected: string[] = [];

    render(
      <MonthlyFlowTimelineChart
        summaries={analysis.monthSummaries}
        selectedMonthKey={currentKey}
        currentMonthKey={currentKey}
        onSelectMonthKey={(key) => selected.push(key)}
      />,
    );

    const hit = screen.getByRole("button", {
      name: new RegExp(`Tháng ${other.lunarMonth} âm lịch`),
    });
    hit.focus();
    fireEvent.keyDown(hit, { key: "Enter" });
    expect(selected).toContain(other.monthKey);
  });
});

describe("MonthlyFlowSection", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders production module instead of rebuilding placeholder", () => {
    const chart = calculateTrungChau(REGRESSION);
    const { container } = render(
      <MonthlyFlowSection chart={chart} school="trung-chau" now={NOW_JULY_2026} />,
    );

    expect(screen.getByLabelText("Lưu Nguyệt V0.1")).toHaveAttribute("data-version", "0.1.2");
    expect(container.querySelector('[data-module="monthly-flow"]')).toBeInTheDocument();
    expect(screen.getByText("Lưu Nguyệt")).toBeInTheDocument();
    expect(screen.getByText("Điểm tổng hợp 5 trục hiển thị")).toBeInTheDocument();
    expect(screen.queryByText(/Module vận khí đang được tái cấu trúc/i)).not.toBeInTheDocument();
  });

  it("selects current lunar month by default for July 2026", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const currentKey = resolveDefaultSelectedMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries: analysis.monthSummaries,
      now: NOW_JULY_2026,
    })!;
    const current = analysis.monthSummaries.find((m) => m.monthKey === currentKey)!;

    render(<MonthlyFlowSection chart={chart} school="trung-chau" now={NOW_JULY_2026} />);

    expect(screen.getAllByText(new RegExp(`Tháng ${current.lunarMonth}`)).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Tháng hiện tại")).toHaveLength(1);
    expect(screen.queryByText(/Đang xem:/)).not.toBeInTheDocument();
  });

  it("clicking another month updates summary and six-axis; marker stays", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const currentKey = resolveDefaultSelectedMonthKey({
      annualYear: 2026,
      school: "trung-chau",
      monthSummaries: analysis.monthSummaries,
      now: NOW_JULY_2026,
    })!;
    const other = analysis.monthSummaries.find((m) => m.monthKey !== currentKey)!;

    render(<MonthlyFlowSection chart={chart} school="trung-chau" now={NOW_JULY_2026} />);

    const hit = screen.getByRole("button", {
      name: new RegExp(`Tháng ${other.lunarMonth} âm lịch`),
    });
    fireEvent.click(hit);

    expect(
      screen.getByText(
        new RegExp(`Đang xem: Tháng ${other.lunarMonth} âm lịch`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Về tháng hiện tại" })).toBeInTheDocument();
    expect(screen.getAllByText("Tháng hiện tại")).toHaveLength(1);
    expect(screen.getAllByTestId("mf-flow-six-axis")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Về tháng hiện tại" }));
    expect(screen.queryByText(/Đang xem:/)).not.toBeInTheDocument();
  });

  it("shows five visible domain labels and Vietnamese bands without raw IDs", () => {
    const chart = calculateTrungChau(REGRESSION);
    const { container } = render(
      <MonthlyFlowSection chart={chart} school="trung-chau" now={NOW_JULY_2026} />,
    );

    for (const label of [
      "Gia đạo",
      "Tài lộc",
      "Công việc",
      "Giao hữu",
      "Tình duyên",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Sức khỏe")).not.toBeInTheDocument();
    expect(container.querySelector('[data-domain="health"]')).toBeNull();

    expect(container.querySelectorAll(".mf-flow-six-axis__row")).toHaveLength(5);
    expect(container.textContent).toMatch(/Cần thận trọng|Cân bằng|Thuận lợi|Rất thuận/);

    const html = container.innerHTML;
    expect(html).not.toMatch(/RULE-MFS-|SRC-MONTHLY|physicalFactId|stackingGroup|sourceIds/);
  });

  it("exposes evidence disclosure and mobile scroll container", () => {
    const chart = calculateTrungChau(REGRESSION);
    const { container } = render(
      <MonthlyFlowSection chart={chart} school="trung-chau" now={NOW_JULY_2026} />,
    );

    expect(screen.getByTestId("mf-flow-evidence-details")).toBeInTheDocument();
    expect(screen.getByText("Bằng chứng được ghi nhận")).toBeInTheDocument();
    expect(screen.getAllByText(/Tín hiệu hỗ trợ:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tín hiệu áp lực:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mức kích hoạt:/).length).toBeGreaterThan(0);
    expect(container.querySelector("[data-testid='mf-flow-timeline-scroll']")).not.toBeNull();
  });

  it("Nam Phái regression chart renders safely", () => {
    const chart = calculateNamPhai(REGRESSION);
    render(<MonthlyFlowSection chart={chart} school="nam-phai" now={NOW_JULY_2026} />);
    expect(screen.getByLabelText("Lưu Nguyệt V0.1")).toBeInTheDocument();
    expect(screen.getByTestId("mf-flow-six-axis")).toBeInTheDocument();
  });
});
