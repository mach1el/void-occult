import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData } from "@/types/chart";
import { buildHuyenKhiPreview } from "../build-preview";
import { oppositePalaceIndex, trinePalaceIndexes } from "../geometry";
import { HUYEN_KHI_DIMENSION_IDS } from "../types";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("huyen-khi-preview geometry", () => {
  it("uses modulo-12 opposite and trines", () => {
    expect(oppositePalaceIndex(0)).toBe(6);
    expect(trinePalaceIndexes(0)).toEqual([4, 8]);
    expect(oppositePalaceIndex(7)).toBe(1);
    expect(trinePalaceIndexes(7)).toEqual([11, 3]);
  });
});

describe("buildHuyenKhiPreview — adapter", () => {
  it("returns 12 palaces with exactly one Mệnh and one Thân", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });

    expect(result.status).toBe("available");
    expect(result.module).toBe("huyen-khi");
    expect(result.mode).toBe("research-preview");
    expect(result.evaluatorStatus).toBe("not-promoted");
    expect(result.palaces).toHaveLength(12);
    expect(result.palaces.map((p) => p.palaceIndex)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(result.palaces.filter((p) => p.isMenh)).toHaveLength(1);
    expect(result.palaces.filter((p) => p.isThan)).toHaveLength(1);
  });

  it("marks VCD when no resident major and lists opposite majors as borrowed", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const vcd = result.palaces.filter((p) => p.isVoChinhDieu);
    expect(vcd.length).toBeGreaterThan(0);

    for (const palace of vcd) {
      expect(palace.majorStars).toHaveLength(0);
      const opposite = result.palaces.find((p) => p.palaceIndex === palace.oppositePalaceIndex);
      expect(opposite).toBeDefined();
      expect(palace.borrowedMajorStars.map((s) => s.factId)).toEqual(
        (opposite?.majorStars ?? []).map((s) => s.factId),
      );
    }
  });

  it("preserves brightness, natal Tứ Hóa, void markers and Trường Sinh", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });

    const withBrightness = result.palaces.flatMap((p) =>
      p.majorStars.filter((s) => s.brightness),
    );
    expect(withBrightness.length).toBeGreaterThan(0);

    const withTf = result.palaces.filter((p) => p.natalTransformations.length > 0);
    expect(withTf.length).toBeGreaterThan(0);

    const withVoid = result.palaces.filter((p) => p.voidMarkers.length > 0);
    expect(withVoid.length).toBeGreaterThan(0);

    const withChangSheng = result.palaces.filter((p) => p.changShengStage);
    expect(withChangSheng.length).toBe(12);
  });

  it("keeps all five dimension states null with not-promoted reason", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    for (const palace of result.palaces) {
      expect(palace.dimensionStateReason).toBe("symbolic-evaluator-not-promoted");
      for (const id of HUYEN_KHI_DIMENSION_IDS) {
        expect(palace.dimensionStates[id]).toBeNull();
      }
    }
  });

  it("is deterministic for identical inputs", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const b = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    expect(a).toEqual(b);
  });
});

describe("buildHuyenKhiPreview — Mệnh/Thân canonical index SSOT", () => {
  it("output isMenh/isThan follow chart.menhIndex/chart.thanIndex exactly", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const menh = result.palaces.find((p) => p.isMenh);
    const than = result.palaces.find((p) => p.isThan);
    expect(menh?.palaceIndex).toBe(chart.menhIndex);
    expect(than?.palaceIndex).toBe(chart.thanIndex);
  });

  it("a flag on the wrong palace creates a diagnostic but does not change canonical output", () => {
    const chart = calculateNamPhai(REGRESSION);
    const wrongIndex = (chart.menhIndex + 1) % 12;
    const mutated: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) => ({
        ...p,
        isMenh: p.index === wrongIndex,
      })),
    };
    const result = buildHuyenKhiPreview(mutated, { school: "nam-phai" });
    const menh = result.palaces.find((p) => p.isMenh);
    expect(menh?.palaceIndex).toBe(chart.menhIndex);
    expect(result.diagnostics.some((d) => d.code === "menh-index-flag-mismatch")).toBe(true);
  });

  it("zero Mệnh flags create a diagnostic but does not change canonical output", () => {
    const chart = calculateNamPhai(REGRESSION);
    const mutated: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) => ({ ...p, isMenh: false })),
    };
    const result = buildHuyenKhiPreview(mutated, { school: "nam-phai" });
    const menh = result.palaces.find((p) => p.isMenh);
    expect(menh?.palaceIndex).toBe(chart.menhIndex);
    expect(result.diagnostics.some((d) => d.code === "menh-index-flag-mismatch")).toBe(true);
  });

  it("multiple Mệnh flags create a diagnostic but does not change canonical output", () => {
    const chart = calculateNamPhai(REGRESSION);
    const extraIndex = (chart.menhIndex + 1) % 12;
    const mutated: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) => ({
        ...p,
        isMenh: p.index === chart.menhIndex || p.index === extraIndex,
      })),
    };
    const result = buildHuyenKhiPreview(mutated, { school: "nam-phai" });
    const menhPalaces = result.palaces.filter((p) => p.isMenh);
    expect(menhPalaces).toHaveLength(1);
    expect(menhPalaces[0]?.palaceIndex).toBe(chart.menhIndex);
    expect(result.diagnostics.some((d) => d.code === "menh-index-flag-mismatch")).toBe(true);
  });

  it("a correct flag produces no mismatch diagnostic", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    expect(result.diagnostics.some((d) => d.code === "menh-index-flag-mismatch")).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "than-index-flag-mismatch")).toBe(false);
  });

  it("an invalid chart.menhIndex fails closed to unavailable", () => {
    const chart = calculateNamPhai(REGRESSION);
    const mutated: ChartData = { ...chart, menhIndex: 12 };
    const result = buildHuyenKhiPreview(mutated, { school: "nam-phai" });
    expect(result.status).toBe("unavailable");
    expect(result.palaces).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === "invalid-menh-index")).toBe(true);
  });

  it("an invalid chart.thanIndex fails closed to unavailable", () => {
    const chart = calculateNamPhai(REGRESSION);
    const mutated: ChartData = { ...chart, thanIndex: -1 };
    const result = buildHuyenKhiPreview(mutated, { school: "nam-phai" });
    expect(result.status).toBe("unavailable");
    expect(result.palaces).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === "invalid-than-index")).toBe(true);
  });
});

describe("buildHuyenKhiPreview — borrowedMajorStars restricted to VCD", () => {
  it("every non-VCD palace has an empty borrowedMajorStars", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    for (const palace of result.palaces) {
      if (!palace.isVoChinhDieu) {
        expect(palace.borrowedMajorStars).toEqual([]);
      }
    }
  });

  it("every VCD palace references exactly the opposite palace's resident majors, in order", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    for (const palace of result.palaces.filter((p) => p.isVoChinhDieu)) {
      const opposite = result.palaces.find((p) => p.palaceIndex === palace.oppositePalaceIndex);
      expect(palace.borrowedMajorStars.map((s) => s.factId)).toEqual(
        (opposite?.majorStars ?? []).map((s) => s.factId),
      );
    }
  });
});

describe("buildHuyenKhiPreview — deterministic semantic ordering", () => {
  it("stars are sorted by canonical Vietnamese name (locale order), then fact id", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    for (const palace of result.palaces) {
      for (const list of [palace.majorStars, palace.minorStars, palace.borrowedMajorStars]) {
        const names = list.map((s) => s.canonicalStarName);
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "vi"));
        // Only assert ordering when names differ — a duplicate-name tie
        // is broken by factId, already covered by the pure-comparator
        // logic; this is a coarse end-to-end sanity check.
        if (new Set(names).size === names.length) {
          expect(names).toEqual(sortedNames);
        }
      }
    }
  });

  it("natal Tứ Hóa follows Lộc/Quyền/Khoa/Kỵ order", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const rank: Record<string, number> = { Lộc: 0, Quyền: 1, Khoa: 2, Kỵ: 3 };
    for (const palace of result.palaces) {
      const ranks = palace.natalTransformations.map((t) => rank[t.transformation] ?? 99);
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    }
  });

  it("void markers follow Tuần/Triệt order", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const rank: Record<string, number> = { "Tuần": 0, "Triệt": 1 };
    for (const palace of result.palaces) {
      const ranks = palace.voidMarkers.map((v) => rank[v.voidType] ?? 99);
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    }
  });

  it("repeated builds are deeply equal (ordering is stable, not just individually sorted)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const b = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    expect(a).toEqual(b);
  });
});

describe("buildHuyenKhiPreview — isolation", () => {
  it("changing annualYear produces a deep-equal preview", () => {
    const a = buildHuyenKhiPreview(
      calculateNamPhai({ ...REGRESSION, annualYear: "2026" }),
      { school: "nam-phai" },
    );
    const b = buildHuyenKhiPreview(
      calculateNamPhai({ ...REGRESSION, annualYear: "2031" }),
      { school: "nam-phai" },
    );
    expect(a).toEqual(b);
  });

  it("changing flowBase produces a deep-equal preview", () => {
    const a = buildHuyenKhiPreview(
      calculateNamPhai({ ...REGRESSION, flowBase: "luu-nien" }),
      { school: "nam-phai" },
    );
    const b = buildHuyenKhiPreview(
      calculateNamPhai({ ...REGRESSION, flowBase: "dai-van" }),
      { school: "nam-phai" },
    );
    expect(a).toEqual(b);
  });

  it("contains only natal-derived fact ids", () => {
    const result = buildHuyenKhiPreview(calculateNamPhai(REGRESSION), {
      school: "nam-phai",
    });
    for (const palace of result.palaces) {
      for (const star of [...palace.majorStars, ...palace.minorStars, ...palace.borrowedMajorStars]) {
        expect(star.factId.startsWith("natal:")).toBe(true);
      }
      for (const tf of palace.natalTransformations) {
        expect(tf.factId.startsWith("natal:transform:")).toBe(true);
      }
      for (const v of palace.voidMarkers) {
        expect(v.factId.startsWith("natal:void:")).toBe(true);
      }
    }
  });

  it("annual stars/mutagens and major-fortune/monthly chart properties never affect the result", () => {
    const chart = calculateNamPhai(REGRESSION);
    const baseline = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const p = chart.palaces;

    const withTemporalNoise: ChartData = {
      ...chart,
      annualStars: [{ name: "Fake Sao", palace: p[0]! }],
      annualMutagens: [{ mutagen: "Lộc", starName: "Fake Sao", palace: p[1]! }],
      majorMutagens: [{ mutagen: "Kỵ", starName: "Fake Sao", palace: p[2]! }],
      majorFortunePalace: p[3]!,
      taiTuePalace: p[4]!,
      smallLimitPalace: p[5]!,
      monthlyPalaces: [],
    };

    const withNoise = buildHuyenKhiPreview(withTemporalNoise, { school: "nam-phai" });
    expect(withNoise).toEqual(baseline);
  });

  it("does not cross-school fallback — school field matches request", () => {
    const chart = calculateNamPhai(REGRESSION);
    const np = buildHuyenKhiPreview(chart, { school: "nam-phai" });
    const tc = buildHuyenKhiPreview(calculateTrungChau(REGRESSION), {
      school: "trung-chau",
    });
    expect(np.school).toBe("nam-phai");
    expect(tc.school).toBe("trung-chau");
    // Different schools produce independently labeled results; no silent merge.
    expect(np.school).not.toBe(tc.school);
  });
});
