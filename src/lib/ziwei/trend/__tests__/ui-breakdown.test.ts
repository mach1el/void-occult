import { describe, expect, it } from "vitest";
import { formatUIBreakdown, roundTo1Decimal } from "../ui-breakdown";

describe("formatUIBreakdown (WYSIWYG)", () => {
  it("làm tròn từng phần rồi cộng — khớp nhẩm mắt [21.68, 5.68, 5.56] → 33.0", () => {
    const raw = [
      { source: "Điền Trạch", points: 21.68, reason: "Nền 70%" },
      { source: "Phụ Mẫu", points: 5.68, reason: "Nền 15%" },
      { source: "Tử Tức", points: 5.56, reason: "Nền 15%" },
    ];

    const { items, total } = formatUIBreakdown(raw);

    expect(items.map((item) => item.points)).toEqual([21.7, 5.7, 5.6]);
    expect(total).toBe(33.0);
    // Không dùng round(sum): 21.68+5.68+5.56 = 32.92 → 32.9
    expect(roundTo1Decimal(21.68 + 5.68 + 5.56)).toBe(32.9);
    expect(total).not.toBe(32.9);
  });

  it("chặn trôi dạt float 0.1 + 0.2", () => {
    const { items, total } = formatUIBreakdown([
      { source: "a", points: 0.1, reason: "Nền" },
      { source: "b", points: 0.2, reason: "Nền" },
    ]);
    expect(items.map((item) => item.points)).toEqual([0.1, 0.2]);
    expect(total).toBe(0.3);
    expect(String(total)).not.toContain("000000");
  });
});
