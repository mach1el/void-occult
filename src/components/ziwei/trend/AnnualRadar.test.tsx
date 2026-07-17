import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeChart } from "@/lib/ziwei/trend/__tests__/fixtures";
import { AnnualRadar } from "./AnnualRadar";

describe("AnnualRadar", () => {
  it("vẽ đồng thời lớp nền B_D và lớp vận khí năm", () => {
    const { container } = render(
      <AnnualRadar chart={makeChart()} school="nam-phai" compact />,
    );

    expect(
      screen.getByRole("heading", { name: "Vận hạn 6 trục · 2026" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".annual-radar-base-polygon")).not.toBeNull();
    expect(container.querySelector(".annual-radar-polygon")).not.toBeNull();
    expect(container.querySelector("svg title")).toBeNull();
  });

  it("mở breakdown minh bạch khi bấm vào một trục", () => {
    render(<AnnualRadar chart={makeChart()} school="nam-phai" compact />);

    fireEvent.click(screen.getByText("Tài lộc"));

    expect(screen.getByText("Điểm nền B_D")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nền + sao lưu + guardrails" }),
    ).toBeInTheDocument();
  });
});
