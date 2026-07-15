import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartPage } from "./ChartPage";

describe("ChartPage profile form", () => {
  it("exposes the personal context fields and advanced options", () => {
    render(<ChartPage />);

    expect(screen.getByPlaceholderText("Họ và tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng công việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Tình trạng mối quan hệ")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tùy chọn chuyên sâu"));
    expect(screen.getByLabelText("Trường phái")).toBeInTheDocument();
    expect(screen.getByText("Cách xem vận")).toBeInTheDocument();
  });
});
