import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "../../engine-nam-phai";
import { SCORING_WEIGHTS, type ScoringWeights } from "../weights";
import {
  getDaiVanTrend,
  getLuuNienTrend,
  getPalaceStrengths,
} from "../score";
import { birthInput, makeChart, palace } from "./fixtures";

describe("getDaiVanTrend", () => {
  it("tất định: gọi 2 lần cùng lá số ra cùng mảng", () => {
    const chart = makeChart();
    expect(getDaiVanTrend(chart)).toEqual(getDaiVanTrend(chart));
  });

  it("tổng breakdown khớp điểm; đúng một isCurrent", () => {
    const points = getDaiVanTrend(makeChart());
    expect(points.filter((point) => point.isCurrent)).toHaveLength(1);
    for (const point of points) {
      expect(point.breakdown.cat.reduce((sum, line) => sum + line.points, 0)).toBe(
        point.cat,
      );
      expect(
        point.breakdown.hung.reduce((sum, line) => sum + line.points, 0),
      ).toBe(point.hung);
    }
  });

  it("mốc Lộc + cát có cat cao; mốc Kỵ + sát có hung cao", () => {
    const points = getDaiVanTrend(makeChart());
    const current = points.find((point) => point.isCurrent);
    const risky = points.find((point) => point.label === "35-44");
    expect(current!.cat).toBeGreaterThan(risky!.cat);
    expect(risky!.hung).toBeGreaterThan(current!.hung);
  });

  it("đổi trọng số → điểm đổi", () => {
    const chart = makeChart();
    const baseline = getDaiVanTrend(chart);
    // Đại vận không tính sao lưu niên; Hóa Lộc của makeChart là annual-mutagen
    // (thuộc lưu niên), nên boost lục cát — Tả Phụ/Văn Khúc thực có trong khung.
    const boosted: ScoringWeights = {
      ...SCORING_WEIGHTS,
      lucCat: SCORING_WEIGHTS.lucCat + 40,
    };
    const next = getDaiVanTrend(chart, boosted);
    expect(next).not.toEqual(baseline);
  });
});

describe("getLuuNienTrend", () => {
  it("tất định theo 12 tháng âm; đúng một isCurrent khi xem năm hiện tại", () => {
    const chart = calculateNamPhai(birthInput);
    const asOf = new Date(chart.annualYear, 5, 15);
    const first = getLuuNienTrend(chart, {
      school: "nam-phai",
      birthInput,
    }, asOf);
    const second = getLuuNienTrend(chart, {
      school: "nam-phai",
      birthInput,
    }, asOf);
    expect(first).toEqual(second);
    expect(first).toHaveLength(12);
    expect(first.filter((point) => point.isCurrent)).toHaveLength(1);
    expect(first[0]?.label).toBe("Giêng");
  });

  it("không đánh dấu isCurrent khi xem năm khác năm hiện tại", () => {
    const current = calculateNamPhai(birthInput);
    const chart = calculateNamPhai({
      ...birthInput,
      annualYear: String(current.annualYear - 3),
    });
    const points = getLuuNienTrend(chart, {
      school: "nam-phai",
      birthInput,
    });
    expect(points).toHaveLength(12);
    expect(points.filter((point) => point.isCurrent)).toHaveLength(0);
  });
});

describe("getPalaceStrengths", () => {
  it("trả đúng 12 cung, tất định, breakdown khớp", () => {
    const chart = calculateNamPhai(birthInput);
    const first = getPalaceStrengths(chart);
    expect(first).toEqual(getPalaceStrengths(chart));
    expect(first).toHaveLength(12);
    expect(first[0]?.palace).toBe("Mệnh");
    for (const item of first) {
      expect(item.breakdown.reduce((sum, line) => sum + line.points, 0)).toBe(
        item.score,
      );
    }
  });

  it("cung miếu + cát vững hơn cung sát; đổi weight đổi radar lẫn trend", () => {
    const chart = makeChart({
      palaces: [
        palace({
          index: 0,
          branch: "Mùi",
          name: "Mệnh",
          isMenh: true,
          majorFortune: { active: true, start: 25, end: 34 },
          stars: [
            { name: "Tử Vi", layer: "major", brightness: "Miếu" },
            { name: "Tả Phụ", layer: "helper" },
            { name: "Hữu Bật", layer: "helper" },
          ],
        }),
        palace({
          index: 1,
          branch: "Ngọ",
          name: "Phụ Mẫu",
          stars: [
            { name: "Kình Dương", layer: "tough" },
            { name: "Đà La", layer: "tough" },
          ],
        }),
        ...Array.from({ length: 10 }, (_, offset) =>
          palace({
            index: offset + 2,
            branch: ["Tỵ", "Thìn", "Mão", "Dần", "Sửu", "Tý", "Hợi", "Tuất", "Dậu", "Thân"][
              offset
            ]!,
            name: [
              "Phúc Đức",
              "Điền Trạch",
              "Quan Lộc",
              "Nô Bộc",
              "Thiên Di",
              "Tật Ách",
              "Tài Bạch",
              "Tử Tức",
              "Phu Thê",
              "Huynh Đệ",
            ][offset]!,
            stars: [],
          }),
        ),
      ],
      menhIndex: 0,
      thanIndex: 1,
      voidMarkers: [],
    });

    const strengths = getPalaceStrengths(chart);
    expect(
      strengths.find((item) => item.palace === "Mệnh")!.score,
    ).toBeGreaterThan(strengths.find((item) => item.palace === "Phụ Mẫu")!.score);

    const boosted: ScoringWeights = {
      ...SCORING_WEIGHTS,
      lucCat: SCORING_WEIGHTS.lucCat + 20,
    };
    expect(getDaiVanTrend(chart, boosted)).not.toEqual(getDaiVanTrend(chart));
    expect(getPalaceStrengths(chart, boosted)).not.toEqual(getPalaceStrengths(chart));
  });
});
