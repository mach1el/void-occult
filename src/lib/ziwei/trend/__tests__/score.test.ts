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

  it("nghiệm thu ĐV 35–44 (nữ Tân Mùi 1991): SPT Hãm→Hung, Khắc Nhập, Hung áp đảo Cát", () => {
    const chart = calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const point = getDaiVanTrend(chart).find((item) => item.label === "35-44");
    expect(point).toBeDefined();

    expect(
      point!.breakdown.hung.some((line) => line.source.includes("satPhaThamHung")),
    ).toBe(true);
    expect(
      point!.breakdown.cat.some((line) => line.source === "Cách satPhaTham"),
    ).toBe(false);
    expect(
      point!.breakdown.cat.some(
        (line) => line.source === "Ngũ Hành Vận" && line.reason.includes("×0.75"),
      ),
    ).toBe(true);
    expect(
      point!.breakdown.hung.some(
        (line) => line.source === "Ngũ Hành Vận" && line.reason.includes("×1.25"),
      ),
    ).toBe(true);
    expect(point!.hung).toBeGreaterThan(point!.cat);
    // Tay thầy ~35/73 (có tính Lưu Hóa Kỵ); Đại vận loại sao lưu → khoảng này.
    expect(point!.cat).toBeGreaterThanOrEqual(18);
    expect(point!.cat).toBeLessThanOrEqual(40);
    expect(point!.hung).toBeGreaterThanOrEqual(65);
    expect(point!.hung).toBeLessThanOrEqual(90);
    expect(point!.breakdown.hung.every((line) => {
      if (line.source === "Ngũ Hành Vận" || line.source === "Chuẩn hóa") return true;
      return line.points >= 0;
    })).toBe(true);
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
