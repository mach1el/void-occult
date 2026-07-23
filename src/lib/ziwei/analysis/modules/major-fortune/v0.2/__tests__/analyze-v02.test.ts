import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { getAnalysisStatus } from "../../../../contracts/common";
import { analyzeMajorFortune } from "../../analyze";
import {
  analyzeMajorFortuneV02,
  applyPillarClip,
  classifyMajorFortuneV02ScoreState,
  classifyPrincipalDignityCase,
  detectPalacePattern,
  isCappedDeltaOutOfBounds,
  resolveElementRelation,
  resolveModuleStatusFromPillars,
  resolveStarPatternCompatibility,
  setMatches,
  MF_V02_RAW_ZERO_EPSILON,
} from "../index";
import { loadMajorFortuneKnowledgeV02 } from "../../../../knowledge/major-fortune-scoring/v0.2";
import type { MajorFortuneV02PillarResult } from "../types";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function pillar(
  partial: Partial<MajorFortuneV02PillarResult> & { status: MajorFortuneV02PillarResult["status"] },
): MajorFortuneV02PillarResult {
  return {
    cap: 30,
    rawDelta: 0,
    cappedDelta: 0,
    contributions: [],
    reasonCodes: [],
    matchedStructuralRuleIds: [],
    ...partial,
  };
}

describe("analyzeMajorFortuneV02 — core contract", () => {
  it("scores available/partial chart with four pillars and null natal resilience effect", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    expect(result.module).toBe("major-fortune");
    expect(result.cycle).not.toBeNull();
    expect(result.natalResilience.numericEffect).toBeNull();
    if (result.status !== "unavailable") {
      expect(result.score).not.toBeNull();
      expect(result.score!).toBeGreaterThanOrEqual(0);
      expect(result.score!).toBeLessThanOrEqual(100);
    }
    for (const p of Object.values(result.pillars)) {
      expect(Math.abs(p.cappedDelta)).toBeLessThanOrEqual(p.cap + 1e-9);
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

  it("forbids Nam Phái transformation numeric contributions", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "nam-phai" });
    const xfContributions = Object.values(result.pillars).flatMap((p) =>
      p.contributions.filter((c) => c.ruleId.includes("XF")),
    );
    expect(xfContributions).toEqual([]);
    expect(result.pillars["tu-hoa-sat-tinh"].contributions).toEqual([]);
  });

  it("is independent of annualYear when decade identity is unchanged", () => {
    const a = analyzeMajorFortuneV02(calculateTrungChau({ ...REGRESSION, annualYear: "2026" }), {
      school: "trung-chau",
    });
    const b = analyzeMajorFortuneV02(calculateTrungChau({ ...REGRESSION, annualYear: "2027" }), {
      school: "trung-chau",
    });
    expect(a.cycle).toEqual(b.cycle);
    expect(a.status).toEqual(b.status);
    expect(a.scoreState).toEqual(b.scoreState);
    expect(a.score).toEqual(b.score);
    expect(a.band).toEqual(b.band);
    expect(a.trace).toEqual(b.trace);
    expect(JSON.stringify(a.pillars)).toEqual(JSON.stringify(b.pillars));
    expect(a.natalResilience).toEqual(b.natalResilience);
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

  it("does not change Monthly Flow routing; Major Fortune is production V0.3.1", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.2",
    });
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.1.2",
    });
  });
});

describe("pillar clipping", () => {
  it("clips +40 at cap 30 without hard failure", () => {
    const r = applyPillarClip(40, 30);
    expect(r.rawDelta).toBe(40);
    expect(r.cappedDelta).toBe(30);
    expect(r.clipped).toBe(true);
    expect(isCappedDeltaOutOfBounds(r.cappedDelta, 30)).toBe(false);
  });

  it("clips -40 at cap 30 without hard failure", () => {
    const r = applyPillarClip(-40, 30);
    expect(r.rawDelta).toBe(-40);
    expect(r.cappedDelta).toBe(-30);
    expect(r.clipped).toBe(true);
    expect(isCappedDeltaOutOfBounds(r.cappedDelta, 30)).toBe(false);
  });

  it("flags capped values outside cap as hard failure", () => {
    expect(isCappedDeltaOutOfBounds(30.1, 30)).toBe(true);
    expect(isCappedDeltaOutOfBounds(-30.1, 30)).toBe(true);
  });
});

describe("scoreState — net capped delta", () => {
  it("classifies cross-pillar cancellation as balanced-signal", () => {
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 2,
        netCappedDelta: 10 + -10,
        signalMass: 20,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("balanced-signal");
  });

  it("keeps epsilon residue as balanced-signal when contributions exist", () => {
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 2,
        netCappedDelta: MF_V02_RAW_ZERO_EPSILON / 10,
        signalMass: 20,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("balanced-signal");
  });

  it("classifies zero contributions as no-signal", () => {
    expect(
      classifyMajorFortuneV02ScoreState({
        matchedExecutableContributionCount: 0,
        netCappedDelta: 0,
        signalMass: 0,
        hasPartialData: false,
        unavailable: false,
      }),
    ).toBe("no-signal");
  });
});

describe("module status propagation", () => {
  it("mutex unavailable never yields available", () => {
    const pillars = {
      "thien-thoi": pillar({ status: "unavailable", reasonCodes: ["mutex-violation"] }),
      "dia-loi": pillar({ status: "available" }),
      "nhan-hoa": pillar({ status: "available" }),
      "tu-hoa-sat-tinh": pillar({ status: "available" }),
    };
    expect(resolveModuleStatusFromPillars(pillars)).toBe("unavailable");
  });

  it("any partial pillar yields partial", () => {
    const pillars = {
      "thien-thoi": pillar({ status: "partial", reasonCodes: ["research-blocked-rule"] }),
      "dia-loi": pillar({ status: "available" }),
      "nhan-hoa": pillar({ status: "available" }),
      "tu-hoa-sat-tinh": pillar({ status: "available" }),
    };
    expect(resolveModuleStatusFromPillars(pillars)).toBe("partial");
  });

  it("all available yields available", () => {
    const pillars = {
      "thien-thoi": pillar({ status: "available" }),
      "dia-loi": pillar({ status: "available" }),
      "nhan-hoa": pillar({ status: "available" }),
      "tu-hoa-sat-tinh": pillar({ status: "available" }),
    };
    expect(resolveModuleStatusFromPillars(pillars)).toBe("available");
  });
});

describe("star-pattern compatibility", () => {
  function palace(name: string, stars: ChartStar[]): ChartPalace {
    return { index: 0, branch: "Tý", name, stars };
  }

  it("detects natal Sát Phá Tham + vận Sát Phá Tham as same-pattern", () => {
    const stars: ChartStar[] = [
      { name: "Thất Sát" },
      { name: "Phá Quân" },
      { name: "Tham Lang" },
    ];
    const r = resolveStarPatternCompatibility(palace("Mệnh", stars), palace("Quan Lộc", stars));
    expect(r.compatibility).toBe("same-pattern");
    expect(r.natalPatternId).toBe("sat-pha-tham");
    expect(r.fortunePatternId).toBe("sat-pha-tham");
  });

  it("detects natal Cơ Nguyệt Đồng Lương + vận Sát Phá Tham as cross-pattern", () => {
    const natal: ChartStar[] = [
      { name: "Thiên Cơ" },
      { name: "Thái Âm" },
      { name: "Thiên Đồng" },
      { name: "Thiên Lương" },
    ];
    const fortune: ChartStar[] = [
      { name: "Thất Sát" },
      { name: "Phá Quân" },
      { name: "Tham Lang" },
    ];
    const r = resolveStarPatternCompatibility(palace("Mệnh", natal), palace("Quan Lộc", fortune));
    expect(r.compatibility).toBe("cross-pattern");
  });

  it("marks mixed/unsupported when no catalog pattern", () => {
    const r = resolveStarPatternCompatibility(
      palace("Mệnh", [{ name: "Văn Xương" }]),
      palace("Quan Lộc", [{ name: "Văn Khúc" }]),
    );
    expect(r.compatibility).toBe("mixed-or-unsupported");
  });

  it("marks missing-data when principals absent", () => {
    expect(detectPalacePattern(palace("Mệnh", []))).toEqual({ status: "missing-data" });
    const r = resolveStarPatternCompatibility(palace("Mệnh", []), palace("Quan Lộc", []));
    expect(r.compatibility).toBe("missing-data");
  });
});

describe("V0.1 non-regression", () => {
  it("V0.1 output unchanged for regression chart after V0.2 call", () => {
    const chart = calculateTrungChau(REGRESSION);
    const a = analyzeMajorFortune(chart, { school: "trung-chau" });
    analyzeMajorFortuneV02(chart, { school: "trung-chau" });
    const c = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(JSON.stringify(c)).toEqual(JSON.stringify(a));
    expect(a.versions.engineVersion).toBe("0.1.0");
  });
});

describe("classifiers", () => {
  it("classifies all five element relations", () => {
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
    expect(classifyPrincipalDignityCase([{ name: "Tử Vi", brightness: "Miếu" }])).toBe(
      "one-principal",
    );
    expect(
      classifyPrincipalDignityCase([
        { name: "Tử Vi", brightness: "Miếu" },
        { name: "Thiên Phủ", brightness: "Miếu" },
      ]),
    ).toBe("two-principals");
    expect(classifyPrincipalDignityCase([{ name: "Tử Vi" }])).toBe("missing-brightness");
    expect(
      classifyPrincipalDignityCase([
        { name: "Tử Vi", brightness: "Miếu" },
        { name: "Thiên Phủ", brightness: "Hãm" },
      ]),
    ).toBe("conflicting-brightness");
  });

  it("uses exact-name set semantics", () => {
    expect(setMatches(new Set(["Địa Không", "Địa Kiếp"]), ["Địa Không", "Địa Kiếp"], "all")).toBe(
      true,
    );
    expect(setMatches(new Set(["Địa"]), ["Địa Không", "Địa Kiếp"], "all")).toBe(false);
  });

  it("foundation has zero executable contributions on live charts", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneV02(chart, { school: "nam-phai" });
    const contributionCount = Object.values(result.pillars).reduce(
      (n, p) => n + p.contributions.length,
      0,
    );
    expect(contributionCount).toBe(0);
  });
});
