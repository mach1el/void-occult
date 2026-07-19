import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_MODULES } from "@/lib/ziwei/analysis";
import { ZiweiAnalysisRebuilding } from "./ZiweiAnalysisRebuilding";

// palace-overview and annual-axes are default-on now — ChartPage swaps
// in the real UI for both once chart data exists, so this placeholder
// component only ever renders "unavailable" for major-fortune and
// monthly-flow (whose scoring engines exist but have no UI yet).
const STILL_REBUILDING_MODULES = ANALYSIS_MODULES.filter(
  (m) => m !== "palace-overview" && m !== "annual-axes",
);

describe("ZiweiAnalysisRebuilding", () => {
  it.each(STILL_REBUILDING_MODULES)(
    "shows rebuilding copy for %s without numeric scores",
    (module) => {
      const { container } = render(<ZiweiAnalysisRebuilding module={module} />);

      expect(
        screen.getByText(/Module vận khí đang được tái cấu trúc/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Lá số và dữ liệu an sao không bị ảnh hưởng/i),
      ).toBeInTheDocument();
      expect(container.querySelector("[data-status='unavailable']")).not.toBeNull();
      expect(container.textContent).not.toMatch(/\b(0|50|100)\b/);
      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector(".trend-bar")).toBeNull();
    },
  );

  it("reports palace-overview as available now that the flag defaults on", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="palace-overview" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });

  it("reports annual-axes as available now that the V0.2 flag defaults on", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="annual-axes" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });
});
