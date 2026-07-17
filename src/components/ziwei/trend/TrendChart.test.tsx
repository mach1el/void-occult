import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TrendPoint } from "@/lib/ziwei/trend";
import { TrendChart } from "./TrendChart";

const POINTS: TrendPoint[] = [
  {
    label: "5-14",
    cat: 30,
    hung: 80,
    isCurrent: false,
    breakdown: { cat: [], hung: [] },
  },
  {
    label: "15-24",
    cat: 70,
    hung: 40,
    isCurrent: true,
    breakdown: { cat: [], hung: [] },
  },
];

describe("TrendChart layered bars", () => {
  it("Cát và Hung cùng x/width trên mỗi mốc; lớp thấp vẽ sau", () => {
    const { container } = render(
      <TrendChart title="Xu hướng Đại vận" points={POINTS} currentLabel="Chính vận" />,
    );

    const slot = container.querySelector('[data-slot="15-24"]')!;
    const rects = slot.querySelectorAll("rect[data-layer]");
    expect(rects).toHaveLength(2);

    const first = rects[0]!;
    const second = rects[1]!;
    expect(first.getAttribute("x")).toBe(second.getAttribute("x"));
    expect(first.getAttribute("width")).toBe(second.getAttribute("width"));

    // cat 70 > hung 40 → cat strong trước, hung weak sau.
    expect(first.getAttribute("data-layer")).toBe("cat");
    expect(first.getAttribute("data-strength")).toBe("strong");
    expect(second.getAttribute("data-layer")).toBe("hung");
    expect(second.getAttribute("data-strength")).toBe("weak");

    const early = container.querySelector('[data-slot="5-14"]')!;
    const earlyRects = early.querySelectorAll("rect[data-layer]");
    expect(earlyRects[0]!.getAttribute("data-layer")).toBe("hung");
    expect(earlyRects[1]!.getAttribute("data-layer")).toBe("cat");
  });

  it("ẩn một lớp → lớp còn lại strong và vẫn cùng cột", () => {
    const { container } = render(
      <TrendChart title="Xu hướng Đại vận" points={POINTS} currentLabel="Chính vận" />,
    );

    fireEvent.click(screen.getByLabelText("Cát"));
    const slot = container.querySelector('[data-slot="15-24"]')!;
    let rects = slot.querySelectorAll("rect[data-layer]");
    expect(rects).toHaveLength(1);
    expect(rects[0]!.getAttribute("data-layer")).toBe("hung");
    expect(rects[0]!.getAttribute("data-strength")).toBe("strong");

    fireEvent.click(screen.getByLabelText("Cát"));
    fireEvent.click(screen.getByLabelText("Hung"));
    rects = slot.querySelectorAll("rect[data-layer]");
    expect(rects).toHaveLength(1);
    expect(rects[0]!.getAttribute("data-layer")).toBe("cat");
    expect(rects[0]!.getAttribute("data-strength")).toBe("strong");
  });
});
