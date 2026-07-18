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
      point!.breakdown.hung.some((line) => line.source.includes("HUNG_03")),
    ).toBe(true);
    expect(
      point!.breakdown.cat.some((line) => line.source.includes("CAT_02")),
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
    // Tay thầy ~35/73 dùng điểm tay (Tham+10, Kỵ lưu…). Engine bám P_csv×M_pos
    // (từ 2026-07-18 không còn M_nh) → tuyệt đối khác; kiến trúc (SPT Hung +
    // Khắc Nhập) là chân lý nghiệm thu.
    // ## Cần thầy duyệt: có siết điểm CSV cho khớp 35/73 không?
    expect(
      point!.breakdown.hung
        .filter((line) => line.source === "Ngũ Hành Vận")
        .every((line) => line.points === 0),
    ).toBe(true);
    expect(
      point!.breakdown.hung.every(
        (line) => line.points >= 0 || line.source === "Chuẩn hóa",
      ),
    ).toBe(true);
  });

  it("label trục X Đại vận bám cục số: 1991 Thổ Ngũ → 5-14…; không nhầm Thủy Nhị 2-11", () => {
    const chart1991 = calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    expect(chart1991.cuc.number).toBe(5);
    const labels1991 = getDaiVanTrend(chart1991).map((p) => p.label);
    expect(labels1991[0]).toBe("5-14");
    expect(labels1991).toContain("35-44");
    expect(labels1991.some((l) => l.startsWith("2-"))).toBe(false);
  });

  it("cùng BirthInput + cùng đại vận, chỉ đổi annualYear → điểm Đại vận giữ nguyên", () => {
    const base = {
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female" as const,
      timezone: "7",
      flowBase: "luu-nien",
    };
    const chartA = calculateNamPhai({ ...base, annualYear: "2026" });
    const chartB = calculateNamPhai({ ...base, annualYear: "2030" });

    // Cùng cung ĐV đang active (tuổi danh theo năm xem có thể lệch nhãn active,
    // nhưng dải tuổi/cung an ĐV theo cục phải khớp).
    expect(chartA.majorFortunePalace?.index).toBe(
      chartB.majorFortunePalace?.index,
    );
    expect(chartA.majorFortunePalace?.branch).toBe(
      chartB.majorFortunePalace?.branch,
    );

    const dvA = getDaiVanTrend(chartA);
    const dvB = getDaiVanTrend(chartB);
    expect(dvA.map((p) => ({ label: p.label, cat: p.cat, hung: p.hung }))).toEqual(
      dvB.map((p) => ({ label: p.label, cat: p.cat, hung: p.hung })),
    );

    // Lưu nguyệt được phép đổi theo năm xem (Can Chi tháng / Lưu Đẩu Quân…).
    const lnA = getLuuNienTrend(chartA, {
      school: "nam-phai",
      birthInput: { ...base, annualYear: "2026" },
    });
    const lnB = getLuuNienTrend(chartB, {
      school: "nam-phai",
      birthInput: { ...base, annualYear: "2030" },
    });
    expect(
      lnA.map((p) => ({
        m: p.monthNumber,
        cat: p.cat,
        hung: p.hung,
        stem: p.calendarStem,
      })),
    ).not.toEqual(
      lnB.map((p) => ({
        m: p.monthNumber,
        cat: p.cat,
        hung: p.hung,
        stem: p.calendarStem,
      })),
    );
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
