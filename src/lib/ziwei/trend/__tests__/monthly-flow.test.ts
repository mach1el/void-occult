import { describe, expect, it } from "vitest";
import type { BirthInput, ChartPalace, MutagenRecord } from "@/types/chart";
import { calculate as calculateNamPhai } from "../../engine-nam-phai";
import { calculate as calculateTrungChau } from "../../engine-trung-chau";
import { getEngine } from "../../chart";
import { findDauQuanPalace } from "../util";
import { scoreLuuNguyetFrame } from "../monthly-flow";
import { getLuuNienTrend } from "../score";
import type { MonthlyFocusEntry } from "../types";
import { makeChart, palace } from "./fixtures";

/**
 * Engine Tầng 4 (Lưu Nguyệt) — độc lập với scoreFortuneFrame (Đại Vận).
 * Fixture dùng đúng thứ tự BRANCHES thật của engine-nam-phai (Dần=0 …
 * Sửu=11) để locTonIndex/TAM_HOP/XUNG_CHIEU khớp hình học thật, thay vì
 * bảng chi tùy ý của `makeChart`.
 *
 * Hai hệ tọa độ tách biệt xuyên suốt file này:
 * - focusPalace: cung Lưu Nguyệt Mệnh (TP4C).
 * - calendarStem/calendarBranch: Can Chi lịch tháng âm — ĐỘC LẬP focusPalace.
 */

const engine = getEngine("nam-phai")!;
const BRANCHES = [
  "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi",
  "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu",
] as const;

/** Lá số hồi quy đã thầy xác nhận: 1991-09-21 giờ Dậu, nữ, xem năm 2026 (Bính Ngọ). */
const REGRESSION_INPUT: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function emptyPalaces(
  starsByIndex: Record<number, ChartPalace["stars"]> = {},
): ChartPalace[] {
  return BRANCHES.map((branch, index) =>
    palace({ index, branch, name: branch, stars: starsByIndex[index] ?? [] }),
  );
}

function buildChart(opts: {
  palaces: ChartPalace[];
  annualBranch: string;
  natalMutagens?: NonNullable<ReturnType<typeof makeChart>["natalMutagens"]>;
  annualMutagens?: NonNullable<ReturnType<typeof makeChart>["annualMutagens"]>;
}) {
  return makeChart({
    palaces: opts.palaces,
    annualBranch: opts.annualBranch,
    natalMutagens: opts.natalMutagens ?? [],
    annualMutagens: opts.annualMutagens ?? [],
    voidMarkers: [],
  });
}

function entryFor(
  p: ChartPalace,
  calendarStem: string,
  calendarBranch = p.branch,
): MonthlyFocusEntry {
  return { month: 1, label: "Giêng", focusPalace: p, calendarStem, calendarBranch };
}

describe("stemBranchForLunarMonth — Can Chi 12 tháng năm Bính (§9.1)", () => {
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

describe("stemBranchForLunarMonth — nhóm Ngũ Hổ Độn tháng Giêng (§9.2)", () => {
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

describe("calendarStem/calendarBranch độc lập với focusPalace (§9.3)", () => {
  it("cùng năm Bính tháng 5 → luôn Giáp Ngọ dù focusPalace đặt ở Mệnh/Quan Lộc/Tài Bạch khác nhau", () => {
    const palaces = emptyPalaces();
    const { stem, branch } = engine.stemBranchForLunarMonth("Bính", 5);
    expect({ stem, branch }).toEqual({ stem: "Giáp", branch: "Ngọ" });

    // Can Chi lịch tháng chỉ phụ thuộc (yearStem, lunarMonth) — không nhận
    // tham số cung, nên đặt focusPalace ở đâu cũng ra cùng calendarStem/Branch.
    const focusCandidates = ["Dần", "Thìn", "Ngọ"] as const;
    const entries: MonthlyFocusEntry[] = focusCandidates.map((b) => ({
      month: 5,
      focusPalace: palaces.find((p) => p.branch === b)!,
      calendarStem: stem,
      calendarBranch: branch,
    }));

    for (const entry of entries) {
      expect(entry.calendarStem).toBe("Giáp");
      expect(entry.calendarBranch).toBe("Ngọ");
    }
    // Chính focusPalace mới là thứ khác nhau giữa các entry — xác nhận 2 hệ
    // tọa độ độc lập nhau, không cùng biến thiên.
    expect(new Set(entries.map((e) => e.focusPalace.branch)).size).toBe(3);
  });
});

describe("Regression: mapping lá số mẫu T1–T5 (§9.4)", () => {
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

    // Cung Đẩu Quân (nguồn T1 dùng chung giữa hiển thị và scoring) phải khớp
    // đúng cung T1 hiển thị — không được lệch nhau (AGENTS/spec §15.1).
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
    // Không được dùng thay thế lẫn nhau.
    expect(branch).not.toBe(focusPalace?.branch);
  });
});

describe("Tứ Hóa tháng 5 năm Bính dùng can Giáp (§9.5)", () => {
  it("Liêm Trinh→Lộc, Phá Quân→Quyền, Vũ Khúc→Khoa, Thái Dương→Kỵ", () => {
    const targets = engine.tuHoaTargets("Giáp");
    const byMutagen = new Map(targets.map((t) => [t.mutagen, t.starName]));
    expect(byMutagen.get("Lộc")).toBe("Liêm Trinh");
    expect(byMutagen.get("Quyền")).toBe("Phá Quân");
    expect(byMutagen.get("Khoa")).toBe("Vũ Khúc");
    expect(byMutagen.get("Kỵ")).toBe("Thái Dương");
  });
});

describe("scoreLuuNguyetFrame — điểm tuyệt đối Tứ Hóa theo vị trí TP4C (§9.6)", () => {
  const focusIndex = BRANCHES.indexOf("Mùi"); // tam hợp Mùi = Hợi · Mão
  const xungIndex = BRANCHES.indexOf("Sửu"); // xung chiếu Mùi
  const tamHopIndex = BRANCHES.indexOf("Hợi"); // tam hợp Mùi

  function chartWithMutagenAt(index: number): ReturnType<typeof buildChart> {
    const palaces = emptyPalaces();
    const target = palaces[index]!;
    return buildChart({
      palaces,
      annualBranch: "Ngọ",
      natalMutagens: [
        { mutagen: "Lộc", starName: "F1", palace: target },
        { mutagen: "Quyền", starName: "F2", palace: target },
        { mutagen: "Khoa", starName: "F3", palace: target },
        { mutagen: "Kỵ", starName: "F4", palace: target },
      ],
    });
  }

  function linesAt(index: number) {
    const chart = chartWithMutagenAt(index);
    const focus = chart.palaces.find((p) => p.index === focusIndex)!;
    const scored = scoreLuuNguyetFrame(
      chart,
      engine,
      entryFor(focus, "Ất"), // can Ất không tạo Tứ Hóa trùng — cô lập tín hiệu Gốc
    );
    return scored;
  }

  it("tại cung hạn (weight 1.0): Lộc 10 · Quyền 8 · Khoa 6 · Kỵ 15", () => {
    const scored = linesAt(focusIndex);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Lộc")?.points).toBe(10);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Quyền")?.points).toBe(8);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Khoa")?.points).toBe(6);
    expect(scored.breakdown.hung.find((l) => l.source === "Gốc Hóa Kỵ")?.points).toBe(15);
  });

  it("tại xung chiếu (weight 0.5): Lộc 5 · Quyền 4 · Khoa 3 · Kỵ 7.5", () => {
    const scored = linesAt(xungIndex);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Lộc")?.points).toBe(5);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Quyền")?.points).toBe(4);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Khoa")?.points).toBe(3);
    expect(scored.breakdown.hung.find((l) => l.source === "Gốc Hóa Kỵ")?.points).toBe(7.5);
  });

  it("tại tam hợp (weight 0.3): Lộc 3 · Quyền 2.4 · Khoa 1.8 · Kỵ 4.5", () => {
    const scored = linesAt(tamHopIndex);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Lộc")?.points).toBe(3);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Quyền")?.points).toBe(2.4);
    expect(scored.breakdown.cat.find((l) => l.source === "Gốc Hóa Khoa")?.points).toBe(1.8);
    expect(scored.breakdown.hung.find((l) => l.source === "Gốc Hóa Kỵ")?.points).toBe(4.5);
  });
});

describe("scoreLuuNguyetFrame — chống double-count Tứ Hóa (§9.7)", () => {
  it("marker Hóa Kỵ vừa trong palace.stars vừa trong natalMutagens → chỉ 1 signal Gốc", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [
        { name: "Thái Dương", layer: "major", brightness: "Bình" },
        {
          name: "Hóa Kỵ",
          source: "natal-mutagen",
          mutagen: "Kỵ",
          targetStar: "Thái Dương",
        },
      ],
    });
    const focus = palaces[focusIndex]!;
    const chart = buildChart({
      palaces,
      annualBranch: "Ngọ",
      natalMutagens: [{ mutagen: "Kỵ", starName: "Thái Dương", palace: focus }],
    });

    const scored = scoreLuuNguyetFrame(chart, engine, entryFor(focus, "Ất"));

    const gocKyLines = scored.breakdown.hung.filter(
      (l) => l.source === "Gốc Hóa Kỵ",
    );
    expect(gocKyLines).toHaveLength(1);
    expect(gocKyLines[0]?.points).toBe(15); // weight 1.0 × 15, không cộng dồn 2 lần

    // Marker "Hóa Kỵ" không được xuất hiện như một dòng sao nền riêng ở Bước A.
    expect(
      scored.breakdown.hung.some((l) => l.source === "Hóa Kỵ"),
    ).toBe(false);
    // Thái Dương (chính tinh thật) vẫn được chấm năng lượng sao nền bình thường.
    expect(
      scored.breakdown.hung.some((l) => l.source === "Thái Dương") ||
        scored.breakdown.cat.some((l) => l.source === "Thái Dương"),
    ).toBe(true);
  });

  it("annual mutagen marker (Lưu Hóa X) cũng không double-count", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [
        { name: "Cự Môn", layer: "major", brightness: "Bình" },
        {
          name: "Lưu Hóa Lộc",
          source: "annual-mutagen",
          mutagen: "Lộc",
          targetStar: "Cự Môn",
        },
      ],
    });
    const focus = palaces[focusIndex]!;
    const chart = buildChart({
      palaces,
      annualBranch: "Ngọ",
      annualMutagens: [{ mutagen: "Lộc", starName: "Cự Môn", palace: focus }],
    });

    const scored = scoreLuuNguyetFrame(chart, engine, entryFor(focus, "Ất"));
    const locLines = scored.breakdown.cat.filter(
      (l) => l.source === "Lưu niên Hóa Lộc",
    );
    expect(locLines).toHaveLength(1);
    expect(locLines[0]?.points).toBe(10);
  });
});

describe("scoreLuuNguyetFrame — Nguyệt Lộc Tồn / Kình Dương / Đà La", () => {
  it("Nguyệt Lộc Tồn cộng đúng +10 cát tại đúng cung theo can tháng (Giáp → Dần)", () => {
    const locIndex = engine.locTonIndex("Giáp");
    const palaces = emptyPalaces();
    const chart = buildChart({ palaces, annualBranch: "Ngọ" });
    const scored = scoreLuuNguyetFrame(
      chart,
      engine,
      entryFor(palaces[locIndex]!, "Giáp"),
    );
    const line = scored.breakdown.cat.find((l) => l.source === "Nguyệt Lộc Tồn");
    expect(line?.points).toBe(10);
    expect(scored.cat).toBe(10);
  });

  it("Nguyệt Kình Dương trừ đúng -8 hung tại cung Lộc Tồn+1", () => {
    const kinhIndex = (engine.locTonIndex("Giáp") + 1) % 12;
    const palaces = emptyPalaces();
    const chart = buildChart({ palaces, annualBranch: "Ngọ" });
    const scored = scoreLuuNguyetFrame(
      chart,
      engine,
      entryFor(palaces[kinhIndex]!, "Giáp"),
    );
    const line = scored.breakdown.hung.find((l) => l.source === "Nguyệt Kình Dương");
    expect(line?.points).toBe(8);
    expect(scored.hung).toBe(8);
  });

  it("Nguyệt Đà La trừ đúng -8 hung tại cung Lộc Tồn-1", () => {
    const daIndex = (engine.locTonIndex("Giáp") + 11) % 12;
    const palaces = emptyPalaces();
    const chart = buildChart({ palaces, annualBranch: "Ngọ" });
    const scored = scoreLuuNguyetFrame(
      chart,
      engine,
      entryFor(palaces[daIndex]!, "Giáp"),
    );
    const line = scored.breakdown.hung.find((l) => l.source === "Nguyệt Đà La");
    expect(line?.points).toBe(8);
    expect(scored.hung).toBe(8);
  });

  it("đổi tháng (Canh → Giáp) tại CÙNG focusPalace vẫn đổi vị trí Lộc Tồn — dùng calendarStem, không dùng focusPalace.stem (§9.9)", () => {
    const palaces = emptyPalaces();
    const fixedFocus = palaces[BRANCHES.indexOf("Ngọ")]!; // focusPalace cố định, không đổi

    const monthGieng = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Dậu" }),
      engine,
      entryFor(fixedFocus, "Canh", "Dần"),
    );
    const monthNam = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Dậu" }),
      engine,
      entryFor(fixedFocus, "Giáp", "Ngọ"),
    );

    expect(engine.locTonIndex("Canh")).not.toBe(engine.locTonIndex("Giáp"));
    // Cùng focusPalace nhưng khác calendarStem → breakdown Nguyệt Lộc Tồn khác nhau.
    expect(monthGieng.breakdown.cat.some((l) => l.source === "Nguyệt Lộc Tồn")).not.toBe(
      monthNam.breakdown.cat.some((l) => l.source === "Nguyệt Lộc Tồn"),
    );
  });
});

describe("scoreLuuNguyetFrame — guardrail Kỵ Trùng Kỵ / Lộc Trùng Lộc", () => {
  it("Kỵ Trùng Kỵ: Nguyệt Hóa Kỵ (Giáp→Thái Dương) trùng cung Gốc Kỵ → cộng bonus + nhân cột Hung", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [{ name: "Thái Dương", layer: "major", brightness: "Bình" }],
    });
    const focus = palaces[focusIndex]!;
    const entry = entryFor(focus, "Giáp");

    const control = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Ngọ" }),
      engine,
      entry,
    );
    const trung = scoreLuuNguyetFrame(
      buildChart({
        palaces,
        annualBranch: "Ngọ",
        natalMutagens: [{ mutagen: "Kỵ", starName: "Filler", palace: focus }],
      }),
      engine,
      entry,
    );

    expect(control.breakdown.hung.some((l) => l.source === "Kỵ Trùng Kỵ")).toBe(
      false,
    );
    expect(trung.breakdown.hung.some((l) => l.source === "Kỵ Trùng Kỵ")).toBe(
      true,
    );
    expect(trung.hung).toBeGreaterThan(control.hung);
  });

  it("Lộc Trùng Lộc: Nguyệt Hóa Lộc (Giáp→Liêm Trinh) trùng cung Lưu Lộc năm → cộng bonus + nhân cột Cát", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [{ name: "Liêm Trinh", layer: "major", brightness: "Bình" }],
    });
    const focus = palaces[focusIndex]!;
    const entry = entryFor(focus, "Giáp");

    const control = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Ngọ" }),
      engine,
      entry,
    );
    const trung = scoreLuuNguyetFrame(
      buildChart({
        palaces,
        annualBranch: "Ngọ",
        annualMutagens: [{ mutagen: "Lộc", starName: "Filler", palace: focus }],
      }),
      engine,
      entry,
    );

    expect(control.breakdown.cat.some((l) => l.source === "Lộc Trùng Lộc")).toBe(
      false,
    );
    expect(trung.breakdown.cat.some((l) => l.source === "Lộc Trùng Lộc")).toBe(
      true,
    );
    expect(trung.cat).toBeGreaterThan(control.cat);
  });
});

describe("scoreLuuNguyetFrame — guardrail Xung Thái Tuế dùng calendarBranch (§9.8)", () => {
  it("calendarBranch xung chi năm → kích hoạt dù focusPalace.branch không xung", () => {
    const palaces = emptyPalaces();
    // focusPalace tại Mão (KHÔNG xung Dậu); calendarBranch giả lập = Tý (xung Ngọ).
    const focus = palaces[BRANCHES.indexOf("Mão")]!;

    const control = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Ngọ" }),
      engine,
      entryFor(focus, "Giáp", "Tỵ"), // Tỵ không xung Ngọ
    );
    const xung = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Ngọ" }),
      engine,
      entryFor(focus, "Giáp", "Tý"), // Tý xung Ngọ — kích hoạt dù focusPalace ở Mão
    );

    expect(control.breakdown.hung.some((l) => l.source === "Xung Thái Tuế")).toBe(
      false,
    );
    expect(xung.breakdown.hung.some((l) => l.source === "Xung Thái Tuế")).toBe(
      true,
    );
  });

  it("focusPalace.branch trùng chi xung nhưng calendarBranch không xung → KHÔNG kích hoạt", () => {
    const palaces = emptyPalaces();
    // focusPalace đặt ngay tại Tý (chi xung Ngọ) nhưng calendarBranch = Dần (không xung).
    const focus = palaces[BRANCHES.indexOf("Tý")]!;
    const scored = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Ngọ" }),
      engine,
      entryFor(focus, "Giáp", "Dần"),
    );
    expect(scored.breakdown.hung.some((l) => l.source === "Xung Thái Tuế")).toBe(
      false,
    );
  });
});

describe("scoreLuuNguyetFrame — guardrail Khoa Chế Nguyệt Kỵ", () => {
  it("có Hóa Khoa trong khung → giảm còn 40% điểm dòng Nguyệt Hóa Kỵ", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const withoutKhoa = emptyPalaces({
      [focusIndex]: [{ name: "Thái Dương", layer: "major", brightness: "Bình" }],
    });
    const withKhoa = emptyPalaces({
      [focusIndex]: [
        { name: "Thái Dương", layer: "major", brightness: "Bình" },
        { name: "Hóa Khoa", source: "natal-mutagen", mutagen: "Khoa" },
      ],
    });

    const control = scoreLuuNguyetFrame(
      buildChart({ palaces: withoutKhoa, annualBranch: "Ngọ" }),
      engine,
      entryFor(withoutKhoa[focusIndex]!, "Giáp"),
    );
    const reduced = scoreLuuNguyetFrame(
      buildChart({ palaces: withKhoa, annualBranch: "Ngọ" }),
      engine,
      entryFor(withKhoa[focusIndex]!, "Giáp"),
    );

    const controlLine = control.breakdown.hung.find(
      (l) => l.source === "Lưu nguyệt Hóa Kỵ",
    );
    const reducedLine = reduced.breakdown.hung.find(
      (l) => l.source === "Lưu nguyệt Hóa Kỵ",
    );
    expect(controlLine).toBeDefined();
    expect(reducedLine).toBeDefined();
    expect(reducedLine!.points).toBeCloseTo(controlLine!.points * 0.4, 1);
  });
});

describe("scoreLuuNguyetFrame — WYSIWYG (§9.10)", () => {
  it("tổng breakdown luôn khớp điểm hiển thị (cat/hung)", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [{ name: "Thái Dương", layer: "major", brightness: "Bình" }],
    });
    const focus = palaces[focusIndex]!;
    const scored = scoreLuuNguyetFrame(
      buildChart({
        palaces,
        annualBranch: "Sửu",
        natalMutagens: [{ mutagen: "Kỵ", starName: "Filler", palace: focus }],
      }),
      engine,
      entryFor(focus, "Giáp"),
    );
    expect(
      scored.breakdown.cat.reduce((sum, l) => sum + l.points, 0),
    ).toBe(scored.cat);
    expect(
      scored.breakdown.hung.reduce((sum, l) => sum + l.points, 0),
    ).toBe(scored.hung);
  });
});

describe("scoreLuuNguyetFrame — metadata ScoreLine (semantic UI)", () => {
  it("tier 1 focus/xung/tam-hop → major-star; tier khác → minor-star", () => {
    // Tý focus · Ngọ xung · Thìn+Thân tam hợp
    const palaces = emptyPalaces({
      [BRANCHES.indexOf("Tý")]: [
        { name: "Thái Dương", layer: "major", brightness: "Hãm" },
        { name: "Văn Xương", layer: "soft", brightness: "Đắc" },
      ],
      [BRANCHES.indexOf("Ngọ")]: [
        { name: "Thiên Lương", layer: "major", brightness: "Miếu" },
      ],
      [BRANCHES.indexOf("Thìn")]: [
        { name: "Cự Môn", layer: "major", brightness: "Hãm" },
      ],
    });
    for (const p of palaces) {
      if (p.branch === "Tý") p.name = "Mệnh";
      if (p.branch === "Ngọ") p.name = "Thiên Di";
      if (p.branch === "Thìn") p.name = "Quan Lộc";
      if (p.branch === "Thân") p.name = "Tài Bạch";
    }
    const focus = palaces[BRANCHES.indexOf("Tý")]!;
    const scored = scoreLuuNguyetFrame(
      buildChart({ palaces, annualBranch: "Sửu" }),
      engine,
      entryFor(focus, "Giáp", "Ngọ"),
    );
    const all = [...scored.breakdown.cat, ...scored.breakdown.hung];
    const duong = all.find((l) => l.source === "Thái Dương")!;
    expect(duong.category).toBe("major-star");
    expect(duong.palaceRole).toBe("focus");
    expect(duong.starTier).toBe(1);

    const luong = all.find((l) => l.source === "Thiên Lương")!;
    expect(luong.category).toBe("major-star");
    expect(luong.palaceRole).toBe("xung");

    const cu = all.find((l) => l.source === "Cự Môn")!;
    expect(cu.category).toBe("major-star");
    expect(cu.palaceRole).toBe("tam-hop");

    const xuong = all.find((l) => l.source === "Văn Xương")!;
    expect(xuong.category).toBe("minor-star");
    expect(xuong.starTier).toBeGreaterThan(1);

    expect(scored.majorStarContext?.voidMajorPalaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          palaceRole: "tam-hop",
          palaceName: "Tài Bạch",
          palaceBranch: "Thân",
        }),
      ]),
    );
  });

  it("Tứ Hóa / Tuần / Trường Sinh có category đúng", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [
        { name: "Thái Dương", layer: "major", brightness: "Bình" },
      ],
    });
    palaces[focusIndex]!.changSheng = "Bệnh";
    const focus = palaces[focusIndex]!;
    const scored = scoreLuuNguyetFrame(
      makeChart({
        palaces,
        annualBranch: "Sửu",
        natalMutagens: [
          { mutagen: "Kỵ", starName: "Thái Dương", palace: focus },
        ],
        annualMutagens: [],
        voidMarkers: [{ type: "Tuần", branches: ["Mùi"] }],
      }),
      engine,
      entryFor(focus, "Giáp", "Ngọ"),
    );
    const all = [...scored.breakdown.cat, ...scored.breakdown.hung];
    const nguyetKy = all.find((l) => l.source === "Lưu nguyệt Hóa Kỵ");
    expect(nguyetKy).toMatchObject({
      category: "mutagen",
      layer: "monthly",
      transform: "Kỵ",
      targetStar: "Thái Dương",
    });

    const gocKy = all.find((l) => l.source === "Gốc Hóa Kỵ");
    expect(gocKy).toMatchObject({
      category: "mutagen",
      layer: "natal",
      transform: "Kỵ",
      targetStar: "Thái Dương",
    });

    expect(all.some((l) => l.source === "Tuần" && l.category === "void")).toBe(
      true,
    );
    expect(
      all.some(
        (l) =>
          l.source.startsWith("Trường Sinh") && l.category === "chang-sheng",
      ),
    ).toBe(true);
  });

  it("Kỵ Trùng Kỵ / Xung Thái Tuế → guardrail; Chuẩn hóa → normalization", () => {
    const focusIndex = BRANCHES.indexOf("Mùi");
    const palaces = emptyPalaces({
      [focusIndex]: [{ name: "Thái Dương", layer: "major", brightness: "Bình" }],
    });
    const focus = palaces[focusIndex]!;
    // Giáp → Dương Kỵ; natal Kỵ cùng cung → Trùng Kỵ; calendarBranch Tý xung Ngọ năm.
    const scored = scoreLuuNguyetFrame(
      buildChart({
        palaces,
        annualBranch: "Ngọ",
        natalMutagens: [
          { mutagen: "Kỵ", starName: "Thái Dương", palace: focus },
        ],
      }),
      engine,
      entryFor(focus, "Giáp", "Tý"),
    );
    const hung = scored.breakdown.hung;
    expect(
      hung.some((l) => l.source === "Kỵ Trùng Kỵ" && l.category === "guardrail"),
    ).toBe(true);
    expect(
      hung.some(
        (l) => l.source === "Xung Thái Tuế" && l.category === "guardrail",
      ),
    ).toBe(true);
  });
});

describe("regression semantic — tháng 5 & 3 lá số thầy", () => {
  it("tháng 5: Giáp Ngọ · Mệnh/Tý · chính tinh + VCD + Tứ Hóa", () => {
    const chart = calculateNamPhai(REGRESSION_INPUT);
    const points = getLuuNienTrend(chart, {
      school: "nam-phai",
      birthInput: REGRESSION_INPUT,
    });
    const p = points.find((x) => x.monthNumber === 5)!;
    expect(p.calendarStem).toBe("Giáp");
    expect(p.calendarBranch).toBe("Ngọ");
    expect(p.focusPalaceName).toBe("Mệnh");
    expect(p.focusPalaceBranch).toBe("Tý");

    const all = [...p.breakdown.cat, ...p.breakdown.hung];
    const duong = all.find((l) => l.source === "Thái Dương")!;
    expect(duong).toMatchObject({
      category: "major-star",
      palaceRole: "focus",
      palaceName: "Mệnh",
      palaceBranch: "Tý",
      brightness: "Hãm",
      points: 5,
    });
    expect(p.breakdown.hung).toContainEqual(duong);

    const luong = all.find((l) => l.source === "Thiên Lương")!;
    expect(luong).toMatchObject({
      category: "major-star",
      palaceRole: "xung",
      palaceName: "Thiên Di",
      palaceBranch: "Ngọ",
      brightness: "Miếu",
      points: 3.6,
    });
    expect(p.breakdown.cat).toContainEqual(luong);

    const cu = all.find((l) => l.source === "Cự Môn")!;
    expect(cu).toMatchObject({
      category: "major-star",
      palaceRole: "tam-hop",
      palaceName: "Quan Lộc",
      palaceBranch: "Thìn",
      brightness: "Hãm",
      points: 2.4,
    });

    expect(p.majorStarContext?.voidMajorPalaces).toEqual([
      {
        palaceRole: "tam-hop",
        palaceName: "Tài Bạch",
        palaceBranch: "Thân",
      },
    ]);

    const ky = all.find((l) => l.source === "Lưu nguyệt Hóa Kỵ")!;
    expect(ky).toMatchObject({
      category: "mutagen",
      layer: "monthly",
      transform: "Kỵ",
      targetStar: "Thái Dương",
      points: 15,
    });
    const quyen = all.find((l) => l.source === "Gốc Hóa Quyền")!;
    expect(quyen).toMatchObject({
      category: "mutagen",
      layer: "natal",
      transform: "Quyền",
      targetStar: "Thái Dương",
      points: 8,
    });
  });

  it("tháng 3: Nhâm Thìn · Phu Thê/Tuất · 5 chính tinh", () => {
    const chart = calculateNamPhai(REGRESSION_INPUT);
    const points = getLuuNienTrend(chart, {
      school: "nam-phai",
      birthInput: REGRESSION_INPUT,
    });
    const p = points.find((x) => x.monthNumber === 3)!;
    expect(p.calendarStem).toBe("Nhâm");
    expect(p.calendarBranch).toBe("Thìn");
    expect(p.focusPalaceName).toBe("Phu Thê");
    expect(p.focusPalaceBranch).toBe("Tuất");

    const all = [...p.breakdown.cat, ...p.breakdown.hung];
    expect(all.find((l) => l.source === "Thiên Đồng")).toMatchObject({
      palaceRole: "focus",
      palaceName: "Phu Thê",
      brightness: "Hãm",
      points: 5,
    });
    expect(all.find((l) => l.source === "Cự Môn")).toMatchObject({
      palaceRole: "xung",
      palaceName: "Quan Lộc",
      brightness: "Hãm",
      points: 4,
    });
    expect(all.find((l) => l.source === "Thiên Cơ")).toMatchObject({
      palaceRole: "tam-hop",
      palaceName: "Phúc Đức",
      brightness: "Đắc",
      points: 1.8,
    });
    expect(all.find((l) => l.source === "Thái Âm")).toMatchObject({
      palaceRole: "tam-hop",
      palaceName: "Phúc Đức",
      brightness: "Hãm",
      points: 1.5,
    });
    expect(all.find((l) => l.source === "Thiên Lương")).toMatchObject({
      palaceRole: "tam-hop",
      palaceName: "Thiên Di",
      brightness: "Miếu",
      points: 2.2,
    });
  });
});
