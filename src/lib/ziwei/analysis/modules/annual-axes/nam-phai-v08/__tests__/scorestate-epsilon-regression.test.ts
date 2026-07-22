import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import {
  loadAnnualAxesKnowledgeV08NamPhai,
  type AnnualAxesKnowledgeV08NamPhai,
} from "../../../../knowledge/annual-axes/v0.8";
import { analyzeAnnualAxes } from "../../analyze";
import { analyzeAnnualAxesNamPhaiV08 } from "../analyze";
import { resolveAnnualPalace } from "../resolve-annual-palace";
import { scoreV08Domain } from "../score-domain";
import {
  V08_RAW_ZERO_EPSILON,
  classifyV08ScoreState,
  isEffectivelyZeroRaw,
  legacyClassifyV08ScoreState,
} from "../classify-score-state";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
} from "../../audit/build-audit-corpus";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { computeV09ResearchArtifacts } from "../../audit/v0.9/write-research-artifacts";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const loaded = loadAnnualAxesKnowledgeV08NamPhai();
if (!loaded.ok) throw new Error("v0.8 knowledge invalid");
const knowledge: AnnualAxesKnowledgeV08NamPhai = loaded.knowledge;

function clearAllStars(chart: ChartData): ChartData {
  return {
    ...chart,
    palaces: chart.palaces.map((p) => ({ ...p, stars: [] })),
    annualMutagens: [],
    natalMutagens: [],
    annualStars: [],
    taiTuePalace: null,
  };
}

function withPalaceStars(
  chart: ChartData,
  placements: Array<{ palaceName: string; stars: ChartStar[] }>,
): ChartData {
  let next = chart;
  for (const placement of placements) {
    const resolved = resolveAnnualPalace(next, placement.palaceName);
    if (!resolved.ok) throw new Error(resolved.reason);
    const idx = resolved.palace.palaceIndex;
    next = {
      ...next,
      palaces: next.palaces.map((p) =>
        p.index === idx ? { ...p, stars: [...placement.stars] } : p,
      ),
    };
  }
  return next;
}

describe("Annual Axes V0.8 scoreState epsilon — engine fixtures", () => {
  it("weighted cancellation with float residue classifies as balanced-signal", () => {
    // 0.6×(+1) + 0.2×(−1) + 0.2×(−2) → −5.55e-17 in IEEE-754.
    const chart = withPalaceStars(clearAllStars(calculateNamPhai(REGRESSION)), [
      { palaceName: "Điền Trạch", stars: [{ name: "Long Trì", source: "natal" }] },
      { palaceName: "Phúc Đức", stars: [{ name: "Địa Không", source: "natal" }] },
      {
        palaceName: "Phụ Mẫu",
        stars: [
          { name: "Địa Không", source: "natal" },
          { name: "Địa Kiếp", source: "natal" },
        ],
      },
    ]);

    const scored = scoreV08Domain({ chart, domain: "family", knowledge });
    expect(scored.matchedFacts.length).toBeGreaterThan(0);
    expect(scored.matchedFacts.some((f) => f.polarity === "positive")).toBe(true);
    expect(scored.matchedFacts.some((f) => f.polarity === "negative")).toBe(true);
    expect(scored.trace.prominenceAdjustedRaw).not.toBe(0);
    expect(Math.abs(scored.trace.prominenceAdjustedRaw)).toBeLessThan(V08_RAW_ZERO_EPSILON);
    expect(isEffectivelyZeroRaw(scored.trace.prominenceAdjustedRaw)).toBe(true);
    expect(scored.score).toBe(50);
    expect(scored.scoreState).toBe("balanced-signal");
    expect(
      legacyClassifyV08ScoreState({
        matchedStarCount: scored.matchedFacts.length,
        prominenceAdjustedRaw: scored.trace.prominenceAdjustedRaw,
        hasCooperatingGap: scored.coverage.missingPalaces.length > 0,
      }),
    ).toBe("scored");
  });

  it("no-star fixture remains no-signal", () => {
    const chart = clearAllStars(calculateNamPhai(REGRESSION));
    const scored = scoreV08Domain({ chart, domain: "social", knowledge });
    expect(scored.matchedFacts).toHaveLength(0);
    expect(scored.score).toBe(50);
    expect(scored.scoreState).toBe("no-signal");
  });

  it("meaningfully non-zero fixture remains scored", () => {
    const chart = withPalaceStars(clearAllStars(calculateNamPhai(REGRESSION)), [
      {
        palaceName: "Tài Bạch",
        stars: [{ name: "Lưu Hóa Lộc", source: "annual-mutagen" }],
      },
    ]);
    const scored = scoreV08Domain({ chart, domain: "wealth", knowledge });
    expect(Math.abs(scored.trace.prominenceAdjustedRaw)).toBeGreaterThan(V08_RAW_ZERO_EPSILON);
    expect(scored.score).not.toBe(50);
    expect(scored.scoreState).toBe("scored");
  });

  it("partial-data fixture remains partial-data", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = {
      ...base,
      smallLimitPalace: null,
      palaces: base.palaces.map((p) => ({
        ...p,
        isSmallLimitPalace: false,
      })),
    };
    const scored = scoreV08Domain({ chart, domain: "health", knowledge });
    expect(scored.scoreState).toBe("partial-data");
  });

  it("unavailable fixture remains unavailable", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken: ChartData = {
      ...chart,
      annualHeadPalace: null,
      palaces: chart.palaces.map((p) => ({ ...p, annualPalaceName: undefined })),
    };
    const scored = scoreV08Domain({ chart: broken, domain: "wealth", knowledge });
    expect(scored.scoreState).toBe("unavailable");
    expect(scored.score).toBeNull();
  });

  it("production versions remain 0.8.0", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxesNamPhaiV08(chart);
    expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).versions.engineVersion).toBe(
      "0.8.0",
    );
    expect(result.versions.engineVersion).toBe("0.8.0");
    expect(result.versions.knowledgeVersion).toBe("0.8.0");
    expect(result.versions.contractVersion).toBe("0.8.0");
  });
});

describe("Annual Axes V0.8 scoreState epsilon — full corpus regression", () => {
  it(
    "reclassifies only epsilon scored→balanced-signal; numerics and gates unchanged",
    () => {
      const artifacts = computeV09ResearchArtifacts(FULL_CORPUS_CONTRACT);
      const breakdown = artifacts.noSignalAnalysis.neutralScoreBreakdown;
      const metrics = artifacts.metrics;
      const gates = artifacts.gateEvaluation;

      expect(artifacts.noSignalAnalysis.totalDomainObservations).toBe(7200);
      expect(breakdown.totalScore50Count).toBe(1027);
      expect(breakdown.noSignalScore50Count).toBe(522);
      expect(breakdown.balancedSignalScore50Count).toBe(505);
      expect(breakdown.scoredStateScore50Count).toBe(0);
      expect(breakdown.partialDataScore50Count).toBe(0);
      expect(metrics.scoredStateNeutralScoreCount).toBe(0);

      const bases = buildAuditBirthInputs(FULL_CORPUS_CONTRACT);
      let scoredToBalanced = 0;
      let otherTransitions = 0;
      let observations = 0;

      bases.forEach((base, i) => {
        for (const yearly of expandAnnualYears(
          base,
          FULL_CORPUS_CONTRACT.baseAnnualYear,
          FULL_CORPUS_CONTRACT.yearsPerChart,
        )) {
          const chart = calculateNamPhai(yearly);
          void i;
          for (const domain of ANNUAL_AXIS_DOMAINS) {
            observations += 1;
            const scored = scoreV08Domain({ chart, domain, knowledge });
            if (scored.scoreState === "unavailable") continue;

            const input = {
              matchedStarCount: scored.matchedFacts.length,
              prominenceAdjustedRaw: scored.trace.prominenceAdjustedRaw,
              hasCooperatingGap: scored.coverage.missingPalaces.length > 0,
            };
            const legacy = legacyClassifyV08ScoreState(input);
            const next = classifyV08ScoreState(input);
            expect(next).toBe(scored.scoreState);

            if (legacy !== next) {
              if (legacy === "scored" && next === "balanced-signal") {
                scoredToBalanced += 1;
                expect(scored.trace.prominenceAdjustedRaw).not.toBe(0);
                expect(Math.abs(scored.trace.prominenceAdjustedRaw)).toBeLessThanOrEqual(
                  V08_RAW_ZERO_EPSILON,
                );
                expect(scored.score).toBe(50);
              } else {
                otherTransitions += 1;
              }
            }
          }
        }
      });

      expect(observations).toBe(7200);
      expect(scoredToBalanced).toBe(107);
      expect(otherTransitions).toBe(0);

      const passed = gates.evaluations.filter((e) => e.passed).length;
      const failed = gates.evaluations.filter((e) => !e.passed).length;
      expect(passed).toBe(19);
      expect(failed).toBe(9);
      expect(gates.allConfiguredGatesEvaluated).toBe(true);

      // Score-derived spread metrics unchanged vs historical V0.8 foundation snapshot.
      expect(metrics.meanIntraYearAxisStandardDeviation).toBeCloseTo(5.901296999446484, 12);
      expect(metrics.medianIntraYearAxisRange).toBe(15);
      expect(metrics.neutralScoreRate).toBeCloseTo(1027 / 7200, 12);
    },
    600_000,
  );
});
