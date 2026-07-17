import { describe, expect, it } from "vitest";
import {
  getBranchZone,
  pairGeometry,
  pairGeometryFactor,
} from "../zones";

describe("zones", () => {
  it("phân đúng tứ mộ / mã / bại", () => {
    expect(getBranchZone("Thìn")).toBe("mo");
    expect(getBranchZone("Tuất")).toBe("mo");
    expect(getBranchZone("Sửu")).toBe("mo");
    expect(getBranchZone("Mùi")).toBe("mo");
    expect(getBranchZone("Dần")).toBe("ma");
    expect(getBranchZone("Hợi")).toBe("ma");
    expect(getBranchZone("Tý")).toBe("bai");
    expect(getBranchZone("Dậu")).toBe("bai");
  });

  it("hình học đồng / xung / tam hợp", () => {
    expect(pairGeometry("Thìn", "Thìn")).toBe("dong");
    expect(pairGeometry("Thìn", "Tuất")).toBe("xung");
    expect(pairGeometry("Dần", "Ngọ")).toBe("tam-hop");
    expect(pairGeometryFactor("dong", 0.3)).toBe(1);
    expect(pairGeometryFactor("xung", 0.3)).toBe(0.85);
    expect(pairGeometryFactor("tam-hop", 0.3)).toBe(0.3);
  });
});

describe("getDaiVanElementFactors", () => {
  it("bảng hệ số khớp công thức Đại vận", async () => {
    const { getDaiVanElementFactors } = await import("../zones");
    expect(getDaiVanElementFactors("Hỏa", "Thổ")).toEqual({
      cat: 1.2,
      hung: 0.8,
      label: "Tương Sinh / Thuận Vận",
    });
    expect(getDaiVanElementFactors("Kim", "Thổ")).toEqual({
      cat: 1.0,
      hung: 1.0,
      label: "Sinh Xuất / Sinh Kế",
    });
    expect(getDaiVanElementFactors("Thủy", "Thổ")).toEqual({
      cat: 0.9,
      hung: 1.0,
      label: "Khắc Xuất / Chế Ngự",
    });
    expect(getDaiVanElementFactors("Mộc", "Thổ")).toEqual({
      cat: 0.75,
      hung: 1.25,
      label: "Khắc Nhập / Nghịch Vận",
    });
  });
});
