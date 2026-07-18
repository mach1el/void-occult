/**
 * Calculation Core — Can Chi Lưu Nguyệt & mapping (không scoring).
 * Tách từ legacy monthly-flow tests sau Phase 0 trend reset.
 */
import { describe, expect, it } from "vitest";
import type { BirthInput, ChartData, ChartPalace } from "@/types/chart";
import { calculate as calculateNamPhai } from "../engine-nam-phai";
import { calculate as calculateTrungChau } from "../engine-trung-chau";
import { getEngine } from "../chart";

const engine = getEngine("nam-phai")!;

const REGRESSION_INPUT: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function findDauQuanPalace(chart: ChartData): ChartPalace | null {
  for (const palace of chart.palaces) {
    if (
      (palace.stars ?? []).some(
        (star) => star.name === "Lưu Đẩu Quân" && star.source === "annual",
      )
    ) {
      return palace;
    }
  }
  return null;
}

describe("stemBranchForLunarMonth — Can Chi 12 tháng năm Bính", () => {
  it("khớp đúng bảng 12 tháng Bính Ngọ 2026", () => {
    const expected: Array<[string, string]> = [
      ["Canh", "Dần"],
      ["Tân", "Mão"],
      ["Nhâm", "Thìn"],
      ["Quý", "Tỵ"],
      ["Giáp", "Ngọ"],
      ["Ất", "Mùi"],
      ["Bính", "Thân"],
      ["Đinh", "Dậu"],
      ["Mậu", "Tuất"],
      ["Kỷ", "Hợi"],
      ["Canh", "Tý"],
      ["Tân", "Sửu"],
    ];
    expected.forEach(([stem, branch], i) => {
      expect(engine.stemBranchForLunarMonth("Bính", i + 1)).toEqual({
        stem,
        branch,
      });
    });
  });

  it("Nam Phái và Trung Châu ra cùng Can Chi tháng (SSOT dùng chung)", () => {
    const tc = getEngine("trung-chau")!;
    for (let month = 1; month <= 12; month++) {
      expect(tc.stemBranchForLunarMonth("Bính", month)).toEqual(
        engine.stemBranchForLunarMonth("Bính", month),
      );
    }
  });
});

describe("stemBranchForLunarMonth — nhóm Ngũ Hổ Độn tháng Giêng", () => {
  const groups: Array<[string[], string]> = [
    [["Giáp", "Kỷ"], "Bính"],
    [["Ất", "Canh"], "Mậu"],
    [["Bính", "Tân"], "Canh"],
    [["Đinh", "Nhâm"], "Nhâm"],
    [["Mậu", "Quý"], "Giáp"],
  ];

  it.each(groups)("nhóm can %j → tháng Giêng %s Dần", (stems, expectedStem) => {
    for (const stem of stems) {
      expect(engine.stemBranchForLunarMonth(stem, 1)).toEqual({
        stem: expectedStem,
        branch: "Dần",
      });
    }
  });
});

describe("calendarStem/calendarBranch độc lập với focusPalace", () => {
  it("cùng năm Bính tháng 5 → luôn Giáp Ngọ dù cung focus khác nhau", () => {
    const { stem, branch } = engine.stemBranchForLunarMonth("Bính", 5);
    expect({ stem, branch }).toEqual({ stem: "Giáp", branch: "Ngọ" });
    // API không nhận cung — Can Chi lịch không phụ thuộc focusPalace.
    expect(engine.stemBranchForLunarMonth.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Regression: mapping lá số mẫu T1–T5", () => {
  it("Nam Phái: T1 Tài Bạch/Thân … T5 Mệnh/Tý", () => {
    const chart = calculateNamPhai(REGRESSION_INPUT);
    expect(chart.menhBranch).toBe("Tý");

    const expected = [
      ["Tài Bạch", "Thân"],
      ["Tử Tức", "Dậu"],
      ["Phu Thê", "Tuất"],
      ["Huynh Đệ", "Hợi"],
      ["Mệnh", "Tý"],
    ];
    const months = chart.monthlyPalaces ?? [];
    expected.forEach(([name, branch], i) => {
      expect(months[i]?.palace?.name).toBe(name);
      expect(months[i]?.palace?.branch).toBe(branch);
    });

    const dauQuan = findDauQuanPalace(chart);
    expect(dauQuan?.index).toBe(months[0]?.palace?.index);
  });

  it("Trung Châu: cùng mapping T1–T5 (không lệch phái)", () => {
    const chart = calculateTrungChau(REGRESSION_INPUT);
    expect(chart.menhBranch).toBe("Tý");
    const expected = [
      ["Tài Bạch", "Thân"],
      ["Tử Tức", "Dậu"],
      ["Phu Thê", "Tuất"],
      ["Huynh Đệ", "Hợi"],
      ["Mệnh", "Tý"],
    ];
    const months = chart.monthlyPalaces ?? [];
    expected.forEach(([name, branch], i) => {
      expect(months[i]?.palace?.name).toBe(name);
      expect(months[i]?.palace?.branch).toBe(branch);
    });
  });

  it("tháng 5: focusPalace = Mệnh/Tý, calendarStem/Branch = Giáp/Ngọ — hai giá trị khác nhau", () => {
    const chart = calculateNamPhai(REGRESSION_INPUT);
    const focusPalace = chart.monthlyPalaces?.[4]?.palace;
    expect(focusPalace?.name).toBe("Mệnh");
    expect(focusPalace?.branch).toBe("Tý");

    const { stem, branch } = engine.stemBranchForLunarMonth(
      chart.annualStem,
      5,
    );
    expect(stem).toBe("Giáp");
    expect(branch).toBe("Ngọ");
    expect(branch).not.toBe(focusPalace?.branch);
  });
});

describe("Tứ Hóa tháng 5 năm Bính dùng can Giáp", () => {
  it("Liêm Trinh→Lộc, Phá Quân→Quyền, Vũ Khúc→Khoa, Thái Dương→Kỵ", () => {
    const targets = engine.tuHoaTargets("Giáp");
    const byMutagen = new Map(targets.map((t) => [t.mutagen, t.starName]));
    expect(byMutagen.get("Lộc")).toBe("Liêm Trinh");
    expect(byMutagen.get("Quyền")).toBe("Phá Quân");
    expect(byMutagen.get("Khoa")).toBe("Vũ Khúc");
    expect(byMutagen.get("Kỵ")).toBe("Thái Dương");
  });
});

describe("annualYear không đổi cấu trúc natal / lịch ĐV an cung", () => {
  it("cùng BirthInput, đổi annualYear → Mệnh/cục/sao gốc và dải ĐV giữ nguyên", () => {
    const base = {
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female" as const,
      timezone: "7",
      flowBase: "luu-nien",
    };
    const a = calculateNamPhai({ ...base, annualYear: "2026" });
    const b = calculateNamPhai({ ...base, annualYear: "2030" });

    expect(a.menhBranch).toBe(b.menhBranch);
    expect(a.cuc).toEqual(b.cuc);
    expect(a.palaces.map((p) => p.majorFortune)).toEqual(
      b.palaces.map((p) => p.majorFortune),
    );
    // Sao gốc / Tứ Hóa gốc — loại sao lưu niên (annual / annual-mutagen).
    const natalNames = (chart: ChartData) =>
      chart.palaces.map((p) =>
        (p.stars ?? [])
          .filter(
            (s) => s.source === "natal" || s.source === "natal-mutagen",
          )
          .map((s) => s.name)
          .sort(),
      );
    expect(natalNames(a)).toEqual(natalNames(b));
  });
});
