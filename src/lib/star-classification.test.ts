import { describe, expect, it } from "vitest";
import {
  compareNatalBeforeAnnual,
  isAnnualStar,
  isBeneficStar,
} from "./star-classification";

describe("isBeneficStar", () => {
  it("giữ quy ước cát trái, hung phải cho sao gốc và sao lưu", () => {
    expect(isBeneficStar({ name: "Thiên Khôi", layer: "helper" })).toBe(true);
    expect(
      isBeneficStar({
        name: "Lưu Thiên Khôi",
        layer: "annual",
        source: "annual",
      }),
    ).toBe(true);
    expect(isBeneficStar({ name: "Địa Kiếp", layer: "harm" })).toBe(false);
    expect(
      isBeneficStar({
        name: "Lưu Tang Môn",
        layer: "annual",
        source: "annual",
      }),
    ).toBe(false);
  });

  it("xếp Hóa Kỵ bên hung và ba Hóa còn lại bên cát", () => {
    expect(
      isBeneficStar({ name: "Hóa Kỵ", source: "natal-mutagen" }),
    ).toBe(false);
    expect(
      isBeneficStar({ name: "Hóa Lộc", source: "natal-mutagen" }),
    ).toBe(true);
    expect(
      isBeneficStar({ name: "Lưu Hóa Kỵ", source: "annual-mutagen" }),
    ).toBe(false);
  });

  it("luôn xếp sao tĩnh trước sao lưu niên", () => {
    const stars = [
      { name: "Lưu Thiên Khôi", source: "annual" },
      { name: "Hóa Lộc", source: "natal-mutagen" },
      { name: "Lưu Hóa Kỵ", source: "annual-mutagen" },
      { name: "Thiên Khôi", source: "natal" },
    ].sort(compareNatalBeforeAnnual);

    expect(stars.map((star) => star.name)).toEqual([
      "Hóa Lộc",
      "Thiên Khôi",
      "Lưu Thiên Khôi",
      "Lưu Hóa Kỵ",
    ]);
  });

  it("không nhầm sao tĩnh Lưu Hà thành sao lưu niên", () => {
    expect(
      isAnnualStar({ name: "Lưu Hà", layer: "harm", source: "natal" }),
    ).toBe(false);
    expect(
      isAnnualStar({
        name: "Lưu Thiên Hà",
        layer: "annual",
        source: "annual",
      }),
    ).toBe(true);
  });
});
