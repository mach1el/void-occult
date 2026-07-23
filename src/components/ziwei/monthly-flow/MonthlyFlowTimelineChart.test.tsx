import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import {
  analyzeMonthlyFlowProduction,
  resolveDefaultSelectedMonthKey,
} from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production";
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

describe("MonthlyFlowTimelineChart — focused chart tests", () => {
  it("shows tooltip with composite, coverage, and strongest/weakest domains", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const selected = analysis.monthSummaries[0]!;

    render(
      <MonthlyFlowTimelineChart
        summaries={analysis.monthSummaries}
        selectedMonthKey={selected.monthKey}
        currentMonthKey={null}
        onSelectMonthKey={() => {}}
      />,
    );

    const tooltip = screen.getByTestId("mf-flow-timeline-tooltip");
    expect(tooltip.textContent).toMatch(/Điểm tổng hợp:/);
    expect(tooltip.textContent).toMatch(/Độ phủ: \d\/5 trục/);
    expect(tooltip.textContent).toMatch(/Trục mạnh nhất:/);
    expect(tooltip.textContent).toMatch(/Trục thấp nhất:/);
  });

  it("legend includes composite score and current month labels", () => {
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

    expect(container.querySelector(".mf-flow-timeline__legend")?.textContent).toContain(
      "Điểm tổng hợp 5 trục hiển thị",
    );
    expect(container.querySelector(".mf-flow-timeline__legend")?.textContent).toContain(
      "Tháng hiện tại",
    );
  });

  it("arrow-key navigation moves selection across months", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMonthlyFlowProduction(chart, { school: "trung-chau" });
    const start = analysis.monthSummaries[0]!;
    const selected: string[] = [];

    render(
      <MonthlyFlowTimelineChart
        summaries={analysis.monthSummaries}
        selectedMonthKey={start.monthKey}
        currentMonthKey={null}
        onSelectMonthKey={(key) => selected.push(key)}
      />,
    );

    const hit = screen.getByRole("button", {
      name: new RegExp(`Tháng ${start.lunarMonth} âm lịch`),
    });
    hit.focus();
    fireEvent.keyDown(hit, { key: "ArrowRight" });
    expect(selected[selected.length - 1]).toBe(analysis.monthSummaries[1]!.monthKey);
  });
});
