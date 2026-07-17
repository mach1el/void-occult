import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "../../engine-nam-phai";
import { SCORING_WEIGHTS, type ScoringWeights } from "../weights";
import { getDaiVanTrend, getLuuNienTrend } from "../score";
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

  it("scoring lưu nguyệt luôn theo Lưu niên (T1 = Lưu Đẩu Quân) dù lá số an Tiểu Hạn", () => {
    const input = {
      ...birthInput,
      flowBase: "luu-nien",
      annualYear: "2026",
    };
    const tieuHan = calculateNamPhai({ ...input, flowBase: "tieu-han" });
    const luuNien = calculateNamPhai({ ...input, flowBase: "luu-nien" });
    const dauQuan = tieuHan.palaces.find((palace) =>
      (palace.stars ?? []).some((star) => star.name === "Lưu Đẩu Quân"),
    );

    expect(tieuHan.monthlyPalaces?.[0]?.palace?.index).not.toBe(
      dauQuan?.index,
    );
    expect(luuNien.monthlyPalaces?.[0]?.palace?.index).toBe(dauQuan?.index);

    const opts = { school: "nam-phai" as const, birthInput: input };
    expect(getLuuNienTrend(tieuHan, opts)).toEqual(
      getLuuNienTrend(luuNien, opts),
    );
  });
});
