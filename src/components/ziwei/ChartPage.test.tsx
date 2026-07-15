import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartPage } from "./ChartPage";

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
});
