import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeChart } from "@/lib/ziwei/trend/__tests__/fixtures";
import { PalaceRadar } from "./PalaceRadar";

describe("PalaceRadar", () => {
  it("bấm lại cùng cung để đóng breakdown", () => {
    render(<PalaceRadar chart={makeChart()} school="nam-phai" compact />);

    fireEvent.click(screen.getByText("Mệnh"));
    expect(screen.getByRole("heading", { name: "Mệnh" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Mệnh")[0]!);
    expect(
      screen.queryByRole("heading", { name: "Mệnh" }),
    ).not.toBeInTheDocument();
  });
});
