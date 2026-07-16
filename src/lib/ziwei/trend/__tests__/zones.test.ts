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
    expect(pairGeometryFactor("dong", 0.55)).toBe(1);
    expect(pairGeometryFactor("xung", 0.55)).toBe(0.85);
    expect(pairGeometryFactor("tam-hop", 0.55)).toBe(0.55);
  });
});
