import { describe, expect, it } from "vitest";
import {
  brightnessOpacityFactor,
  compareNatalBeforeAnnual,
  isAnnualStar,
  isBeneficStar,
  isStrongBrightness,
  starDisplayOpacity,
  starTier,
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

describe("starTier", () => {
  it("chính tinh (layer major) luôn tầng 1", () => {
    expect(starTier({ name: "Tử Vi", layer: "major" })).toBe(1);
    expect(starTier({ name: "Phá Quân", layer: "major", source: "natal" })).toBe(1);
  });

  it("13 phụ tinh chính theo spec chỉ định luôn tầng 2", () => {
    expect(starTier({ name: "Tả Phụ", layer: "helper" })).toBe(2);
    expect(starTier({ name: "Văn Xương", layer: "helper" })).toBe(2);
    expect(starTier({ name: "Địa Kiếp", layer: "harm" })).toBe(2);
  });

  it("tạp diệu (không thuộc tầng 1/2) rơi về tầng 3", () => {
    expect(starTier({ name: "Thiên Khốc", layer: "tough" })).toBe(3);
    expect(starTier({ name: "Đào Hoa", layer: "romance" })).toBe(3);
    expect(starTier({ name: "Lưu Hà", layer: "harm", source: "natal" })).toBe(3);
  });

  it("sao lưu niên/lưu nguyệt luôn tầng 3, dù trùng tên phụ tinh chính tầng 2", () => {
    expect(
      starTier({ name: "Lưu Văn Xương", layer: "helper", source: "annual" }),
    ).toBe(3);
    expect(
      starTier({ name: "Lưu Kình Dương", layer: "tough", source: "annual" }),
    ).toBe(3);
  });
});

describe("brightnessOpacityFactor / isStrongBrightness", () => {
  it("chỉ Hãm mới giảm độ sáng, Miếu/Vượng/Đắc/Bình giữ chói đầy đủ", () => {
    expect(brightnessOpacityFactor("Hãm")).toBeLessThan(1);
    expect(brightnessOpacityFactor("Miếu")).toBe(1);
    expect(brightnessOpacityFactor("Vượng")).toBe(1);
    expect(brightnessOpacityFactor("Đắc")).toBe(1);
    expect(brightnessOpacityFactor("Bình")).toBe(1);
    expect(brightnessOpacityFactor(undefined)).toBe(1);
    expect(brightnessOpacityFactor("")).toBe(1);
  });

  it("Miếu/Vượng được đánh dấu 'mạnh', các mức khác không", () => {
    expect(isStrongBrightness("Miếu")).toBe(true);
    expect(isStrongBrightness("Vượng")).toBe(true);
    expect(isStrongBrightness("Đắc")).toBe(false);
    expect(isStrongBrightness("Bình")).toBe(false);
    expect(isStrongBrightness("Hãm")).toBe(false);
  });
});

describe("starDisplayOpacity", () => {
  it("chính tinh Hãm vẫn rõ hơn tạp diệu Hãm, nhưng cả hai mờ hơn khi bình thường", () => {
    const majorNormal = starDisplayOpacity({ name: "Tử Vi", layer: "major", brightness: "Miếu" });
    const majorHam = starDisplayOpacity({ name: "Tử Vi", layer: "major", brightness: "Hãm" });
    const miscNormal = starDisplayOpacity({ name: "Thiên Khốc", layer: "tough" });
    const miscHam = starDisplayOpacity({ name: "Thiên Khốc", layer: "tough", brightness: "Hãm" });

    expect(majorHam).toBeLessThan(majorNormal);
    expect(miscHam).toBeLessThan(miscNormal);
    expect(majorHam).toBeGreaterThan(miscHam);
  });

  it("không bao giờ mờ dưới sàn 0.5 dù kết hợp tầng 3 + Hãm", () => {
    const opacity = starDisplayOpacity({ name: "Thiên Khốc", layer: "tough", brightness: "Hãm" });
    expect(opacity).toBeGreaterThanOrEqual(0.5);
  });

  it("tầng 2/3 sáng hơn 1 tông so với bản đầu, vẫn phân biệt được với tầng 1", () => {
    const tier1 = starDisplayOpacity({ name: "Tử Vi", layer: "major" });
    const tier2 = starDisplayOpacity({ name: "Tả Phụ", layer: "helper" });
    const tier3 = starDisplayOpacity({ name: "Thiên Khốc", layer: "tough" });

    // Sáng hơn giá trị cũ (0.9 / 0.62) và gần với full opacity để dễ đọc trên nền void.
    expect(tier2).toBeGreaterThan(0.96);
    expect(tier3).toBeGreaterThan(0.75);
    // Vẫn giữ thứ bậc tầng 1 > tầng 2 > tầng 3 để không mất phân cấp thị giác.
    expect(tier1).toBeGreaterThan(tier2);
    expect(tier2).toBeGreaterThan(tier3);
  });
});
