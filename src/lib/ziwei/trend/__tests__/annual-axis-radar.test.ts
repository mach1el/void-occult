import { describe, expect, it, vi } from "vitest";
import { getAnnualAxisStrengths } from "../annual-axis-radar";
import * as palaceRadar from "../palace-radar";
import { makeChart, palace } from "./fixtures";

function twelvePalaceChart(
  extras: Partial<ReturnType<typeof makeChart>> = {},
  starOverrides: Record<string, NonNullable<ReturnType<typeof palace>>["stars"]> = {},
) {
  const branches = [
    "Mùi", "Ngọ", "Tỵ", "Thìn", "Mão", "Dần",
    "Sửu", "Tý", "Hợi", "Tuất", "Dậu", "Thân",
  ];
  const names = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
    "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
  ];
  return makeChart({
    palaces: branches.map((branch, index) =>
      palace({
        index,
        branch,
        name: names[index]!,
        isMenh: index === 0,
        stars: starOverrides[names[index]!] ?? [],
      }),
    ),
    menhIndex: 0,
    thanIndex: 1,
    annualYear: 2026,
    smallLimitPalace: palace({ index: 4, branch: "Mão", name: "Quan Lộc" }),
    voidMarkers: [],
    natalMutagens: [],
    annualMutagens: [],
    majorMutagens: [],
    ...extras,
  });
}

function mockPalaceScores(scores: Record<string, number>) {
  return vi.spyOn(palaceRadar, "getPalaceStrengths").mockReturnValue(
    Object.entries(scores).map(([palace, score]) => ({
      palace,
      score,
      raw: score,
      detail: [],
      breakdown: [],
    })),
  );
}

describe("getAnnualAxisStrengths", () => {
  it("trả đúng 6 trục, tất định, score trong [0,100]", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const chart = twelvePalaceChart();
    const first = getAnnualAxisStrengths(chart, { school: "nam-phai" });
    const second = getAnnualAxisStrengths(chart, { school: "nam-phai" });
    expect(first).toEqual(second);
    expect(first).toHaveLength(6);
    expect(first.map((item) => item.axis)).toEqual([
      "Sức khỏe",
      "Gia đạo",
      "Tài lộc",
      "Công việc",
      "Giao hữu",
      "Tình duyên",
    ]);
    for (const item of first) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
      expect(item.year).toBe(2026);
      expect(item.smallLimitPalace).toBe("Quan Lộc");
    }
    spy.mockRestore();
  });

  it("tính B_D đúng trọng số domain", () => {
    const spy = mockPalaceScores({
      Mệnh: 40,
      "Phụ Mẫu": 20,
      "Phúc Đức": 30,
      "Điền Trạch": 70,
      "Quan Lộc": 80,
      "Nô Bộc": 60,
      "Thiên Di": 50,
      "Tật Ách": 60,
      "Tài Bạch": 90,
      "Tử Tức": 10,
      "Phu Thê": 55,
      "Huynh Đệ": 0,
    });
    const chart = twelvePalaceChart();
    const axes = getAnnualAxisStrengths(chart, { school: "nam-phai" });
    expect(axes.find((a) => a.axis === "Sức khỏe")?.base).toBeCloseTo(0.7 * 60 + 0.3 * 40, 5);
    expect(axes.find((a) => a.axis === "Gia đạo")?.base).toBeCloseTo(
      0.7 * 70 + 0.15 * 20 + 0.15 * 10,
      5,
    );
    expect(axes.find((a) => a.axis === "Tài lộc")?.base).toBeCloseTo(0.7 * 90 + 0.3 * 30, 5);
    expect(axes.find((a) => a.axis === "Công việc")?.base).toBeCloseTo(0.7 * 80 + 0.3 * 50, 5);
    expect(axes.find((a) => a.axis === "Giao hữu")?.base).toBeCloseTo(0.7 * 60 + 0.3 * 50, 5);
    expect(axes.find((a) => a.axis === "Tình duyên")?.base).toBeCloseTo(0.7 * 55 + 0.3 * 30, 5);
    spy.mockRestore();
  });

  it("cộng sao Lưu trên cung chính và đối cung", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const chart = twelvePalaceChart(
      {},
      {
        "Tài Bạch": [{ name: "Lưu Hóa Lộc", layer: "soft", source: "annual-mutagen", mutagen: "Lộc" }],
      },
    );
    const taiLoc = getAnnualAxisStrengths(chart, { school: "nam-phai" }).find(
      (a) => a.axis === "Tài lộc",
    )!;
    expect(taiLoc.score).toBe(62);
    expect(taiLoc.breakdown.some((line) => line.source === "Lưu Hóa Lộc")).toBe(true);
    spy.mockRestore();
  });

  it("Trading Guard ×0.6 khi Lộc gặp Kỵ trên trục Tài lộc", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const chart = twelvePalaceChart(
      {},
      {
        "Tài Bạch": [{ name: "Lưu Hóa Lộc", layer: "soft", source: "annual-mutagen", mutagen: "Lộc" }],
        "Phúc Đức": [{ name: "Lưu Hóa Kỵ", layer: "soft", source: "annual-mutagen", mutagen: "Kỵ" }],
      },
    );
    const taiLoc = getAnnualAxisStrengths(chart, { school: "nam-phai" }).find(
      (a) => a.axis === "Tài lộc",
    )!;
    // base 50 +12 −15 = 47, Trading Guard ×0.6 → 28
    expect(taiLoc.score).toBe(28);
    expect(taiLoc.breakdown.some((line) => line.source === "Trading Guard")).toBe(true);
    spy.mockRestore();
  });

  it("Family/Health Guard trừ 10 điểm Sức khỏe khi Tang+Bạch Hổ trên Gia đạo", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const chart = twelvePalaceChart(
      {},
      {
        "Điền Trạch": [
          { name: "Lưu Tang Môn", layer: "harm", source: "annual" },
          { name: "Lưu Bạch Hổ", layer: "harm", source: "annual" },
        ],
      },
    );
    const sucKhoe = getAnnualAxisStrengths(chart, { school: "nam-phai" }).find(
      (a) => a.axis === "Sức khỏe",
    )!;
    expect(sucKhoe.score).toBe(40);
    expect(sucKhoe.breakdown.some((line) => line.source === "Family/Health Guard")).toBe(true);
    spy.mockRestore();
  });

  it("Career Boost +15 khi Thiên Mã gặp Quyền/Lộc tại Quan Lộc/Thiên Di", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const chart = twelvePalaceChart(
      {},
      {
        "Quan Lộc": [
          { name: "Lưu Thiên Mã", layer: "soft", source: "annual" },
          { name: "Lưu Hóa Quyền", layer: "soft", source: "annual-mutagen", mutagen: "Quyền" },
        ],
      },
    );
    const congViec = getAnnualAxisStrengths(chart, { school: "nam-phai" }).find(
      (a) => a.axis === "Công việc",
    )!;
    expect(congViec.score).toBe(75);
    expect(congViec.breakdown.some((line) => line.source === "Career Boost")).toBe(true);
    spy.mockRestore();
  });

  it("đổi annualYear / sao lưu làm điểm đổi", () => {
    const spy = mockPalaceScores({
      Mệnh: 50,
      "Phụ Mẫu": 50,
      "Phúc Đức": 50,
      "Điền Trạch": 50,
      "Quan Lộc": 50,
      "Nô Bộc": 50,
      "Thiên Di": 50,
      "Tật Ách": 50,
      "Tài Bạch": 50,
      "Tử Tức": 50,
      "Phu Thê": 50,
      "Huynh Đệ": 50,
    });
    const plain = twelvePalaceChart();
    const boosted = twelvePalaceChart(
      {},
      {
        "Tài Bạch": [{ name: "Lưu Hóa Lộc", layer: "soft", source: "annual-mutagen", mutagen: "Lộc" }],
      },
    );
    const yearOther = twelvePalaceChart({ annualYear: 2027 });
    const plainTaiLoc = getAnnualAxisStrengths(plain, { school: "nam-phai" }).find(
      (a) => a.axis === "Tài lộc",
    )!.score;
    const boostedTaiLoc = getAnnualAxisStrengths(boosted, { school: "nam-phai" }).find(
      (a) => a.axis === "Tài lộc",
    )!.score;
    expect(boostedTaiLoc).toBeGreaterThan(plainTaiLoc);
    expect(getAnnualAxisStrengths(yearOther, { school: "nam-phai" })[0]?.year).toBe(2027);
    spy.mockRestore();
  });
});
