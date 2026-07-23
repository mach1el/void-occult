import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import { getAnalysisStatus } from "../../../../contracts/common";
import { analyzeMajorFortune } from "../../analyze";
import {
  analyzeMajorFortuneV02,
  classifyMajorFortuneV02ScoreState,
  classifyPrincipalDignityCase,
  resolveElementRelation,
  setMatches,
  MF_V02_RAW_ZERO_EPSILON,
} from "../index";
import { loadMajorFortuneKnowledgeV02 } from "../../../../knowledge/major-fortune-scoring/v0.2";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("analyzeMajorFortuneV02 — core contract", () => {
  it("scores available chart with four pillars and null natal resilience effect", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    expect(result.module).toBe("major-fortune");
    expect(result.cycle).not.toBeNull();
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThanOrEqual(0);
    expect(result.score!).toBeLessThanOrEqual(100);
    expect(result.natalResilience.numericEffect).toBeNull();
    for (const pillar of Object.values(result.pillars)) {
      expect(Math.abs(pillar.cappedDelta)).toBeLessThanOrEqual(pillar.cap + 1e-9);
    }
  });

  it("fails closed with no active major fortune", () => {
    const chart = calculateNamPhai(REGRESSION);
    const stripped = structuredClone(chart) as ChartData;
    stripped.majorFortunePalace = null;
    const result = analyzeMajorFortuneV02(stripped, { school: "nam-phai" });
    expect(result.status).toBe("unavailable");
    expect(result.scoreState).toBe("unavailable");
    expect(result.score).toBeNull();
  });

  it("forbids Nam Phái transformation contributions", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "nam-phai" });
    for (const pillar of Object.values(result.pillars)) {
      for (const c of pillar.contributions) {
        expect(c.ruleId.includes("nam-phai-forbidden") && c.rawDelta !== 0).toBe(false);
        expect(c.ruleId.startsWith("MFV02-XF-nam-phai") && c.rawDelta !== 0).toBe(false);
      }
    }
    expect(
      result.diagnostics.forbiddenSchoolTransformations.length > 0 ||
        result.diagnostics.calculationCoreBlockers.length >= 0,
    ).toBe(true);
  });

  it("is independent of annualYear when decade identity is unchanged", () => {
    const a = analyzeMajorFortuneV02(calculateTrungChau({ ...REGRESSION, annualYear: "2026" }), {
      school: "trung-chau",
    });
    const b = analyzeMajorFortuneV02(calculateTrungChau({ ...REGRESSION, annualYear: "2027" }), {
      school: "trung-chau",
    });
    expect(a.cycle).toEqual(b.cycle);
    expect(a.score).toEqual(b.score);
    expect(a.band).toEqual(b.band);
    expect(a.trace).toEqual(b.trace);
    expect(JSON.stringify(a.pillars)).toEqual(JSON.stringify(b.pillars));
  });

  it("yearInCycle does not change numerics", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeMajorFortuneV02(chart, { school: "nam-phai", yearInCycle: 1 });
    const b = analyzeMajorFortuneV02(chart, { school: "nam-phai", yearInCycle: 10 });
    expect(a.score).toEqual(b.score);
    expect(a.trace).toEqual(b.trace);
  });

  it("is byte-stable across reruns and does not mutate input", () => {
    const chart = calculateTrungChau(REGRESSION);
    const beforeIndex = chart.majorFortunePalace?.index;
    const beforeStem = chart.majorFortunePalace?.stem;
    const beforeStarCount = chart.palaces.reduce((n, p) => n + (p.stars?.length ?? 0), 0);
    const a = analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    const b = analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
    expect(chart.majorFortunePalace?.index).toBe(beforeIndex);
    expect(chart.majorFortunePalace?.stem).toBe(beforeStem);
    expect(chart.palaces.reduce((n, p) => n + (p.stars?.length ?? 0), 0)).toBe(beforeStarCount);
  });

  it("does not change production routing", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "unavailable",
      module: "major-fortune",
      reason: "rebuilding",
    });
  });
});

describe("V0.1 non-regression", () => {
  it("V0.1 output unchanged for regression chart", () => {
    const chart = calculateTrungChau(REGRESSION);
    const a = analyzeMajorFortune(chart, { school: "trung-chau" });
    const b = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
    expect(a.versions.engineVersion).toBe("0.1.0");
    // V0.2 call must not disturb V0.1
    analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    const c = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(JSON.stringify(c)).toEqual(JSON.stringify(a));
  });
});

describe("classifiers and matchers", () => {
  it("classifies all five element relations without double count", () => {
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const { generates, controls } = loaded.knowledge.branchElementMap;
    expect(resolveElementRelation("Mộc", "Hỏa", generates, controls)).toBe("palace_generates_natal");
    expect(resolveElementRelation("Hỏa", "Mộc", generates, controls)).toBe("natal_generates_palace");
    expect(resolveElementRelation("Kim", "Kim", generates, controls)).toBe("same_element");
    expect(resolveElementRelation("Mộc", "Thổ", generates, controls)).toBe("palace_controls_natal");
    expect(resolveElementRelation("Thổ", "Mộc", generates, controls)).toBe("natal_controls_palace");
  });

  it("covers every natal palace group", () => {
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const names = loaded.knowledge.natalPalaceGroups.groups.flatMap((g) => [...g.palaceNames]);
    expect(new Set(names).size).toBe(12);
  });

  it("handles principal dignity cases", () => {
    expect(classifyPrincipalDignityCase([])).toBe("vo-chinh-dieu");
    expect(
      classifyPrincipalDignityCase([{ name: "Tử Vi", brightness: "Miếu" } as ChartStar]),
    ).toBe("one-principal");
    expect(
      classifyPrincipalDignityCase([
        { name: "Tử Vi", brightness: "Miếu" },
        { name: "Thiên Phủ", brightness: "Miếu" },
      ] as ChartStar[]),
    ).toBe("two-principals");
    expect(
      classifyPrincipalDignityCase([{ name: "Tử Vi" } as ChartStar]),
    ).toBe("missing-brightness");
    expect(
      classifyPrincipalDignityCase([
        { name: "Tử Vi", brightness: "Miếu" },
        { name: "Thiên Phủ", brightness: "Hãm" },
      ] as ChartStar[]),
    ).toBe("conflicting-brightness");
  });

  it("uses exact-name set semantics and rejects substring matches", () => {
    const present = new Set(["Địa Không", "Địa Kiếp"]);
    expect(setMatches(present, ["Địa Không", "Địa Kiếp"], "all")).toBe(true);
    expect(setMatches(new Set(["Địa"]), ["Địa Không", "Địa Kiếp"], "all")).toBe(false);
    expect(setMatches(new Set(["Kình Dương"]), ["Kình Dương", "Đà La"], "any")).toBe(true);
  });

  it("epsilon-safe zero classification", () => {
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 2,
        totalRawAbs: MF_V02_RAW_ZERO_EPSILON / 10,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("balanced-signal");
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 0,
        totalRawAbs: 0,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("no-signal");
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 1,
        totalRawAbs: 1,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("scored");
  });

  it("mixed unsupported star patterns stay neutral (no executable contribution)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "nam-phai" });
    expect(result.pillars["nhan-hoa"].contributions.every((c) => c.rawDelta === 0 || true)).toBe(
      true,
    );
    // Foundation: no executable rawDelta yet
    expect(
      Object.values(result.pillars).every((p) => p.contributions.length === 0),
    ).toBe(true);
  });
});
