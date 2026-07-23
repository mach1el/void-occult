import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZiweiAnalysisRebuilding } from "./ZiweiAnalysisRebuilding";

describe("ZiweiAnalysisRebuilding", () => {
  it("reports monthly-flow as available at V0.1.2 production", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="monthly-flow" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });

  it("shows rebuilding copy when status is explicitly unavailable", () => {
    const { container } = render(
      <ZiweiAnalysisRebuilding
        module="monthly-flow"
        status={{ status: "unavailable", module: "monthly-flow", reason: "rebuilding" }}
      />,
    );

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
  });

  it("reports palace-overview as available now that the flag defaults on", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="palace-overview" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });

  it("reports annual-axes as available now that the V0.2 flag defaults on", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="annual-axes" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });

  it("reports major-fortune as available at V0.3.2 production", () => {
    const { container } = render(<ZiweiAnalysisRebuilding module="major-fortune" />);
    expect(container.querySelector("[data-status='available']")).not.toBeNull();
  });
});
