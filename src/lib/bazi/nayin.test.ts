import { describe, expect, it } from "vitest";
import { getNayin, getNayinByStemBranch } from "./nayin";

describe("Nạp Âm Lục Thập Hoa Giáp", () => {
  it("tra đúng Lộ Bàng Thổ cho Canh Ngọ và Tân Mùi", () => {
    expect(getNayinByStemBranch("Canh", "Ngọ")).toBe("Lộ Bàng Thổ");
    expect(getNayinByStemBranch("Tân", "Mùi")).toBe("Lộ Bàng Thổ");
  });

  it("chuẩn hóa Tỵ của Tử Vi sang Tị của bảng Can Chi", () => {
    expect(getNayinByStemBranch("Kỷ", "Tỵ")).toBe("Đại Lâm Mộc");
    expect(getNayin({ stem: "Kỷ", branch: "Tị" })).toBe("Đại Lâm Mộc");
  });

  it("giữ fallback khi Can Chi không hợp lệ", () => {
    expect(getNayinByStemBranch("Không", "Có")).toBe("Unknown");
  });
});
