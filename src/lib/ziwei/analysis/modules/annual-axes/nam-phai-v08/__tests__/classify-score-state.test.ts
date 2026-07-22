import { describe, expect, it } from "vitest";
import {
  V08_RAW_ZERO_EPSILON,
  V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION,
  classifyV08ScoreState,
  isEffectivelyZeroRaw,
  legacyClassifyV08ScoreState,
} from "../classify-score-state";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";

describe("V08_RAW_ZERO_EPSILON policy", () => {
  it("is far above observed float residues and far below smallest meaningful contribution", () => {
    const observedResidue = 5.551115123125783e-17;
    expect(V08_RAW_ZERO_EPSILON).toBeGreaterThan(observedResidue * 1e6);
    expect(V08_RAW_ZERO_EPSILON).toBeLessThan(V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION / 1e6);
  });

  it("is below the smallest contribution derivable from current V0.8 knowledge", () => {
    const loaded = loadAnnualAxesKnowledgeV08NamPhai();
    if (!loaded.ok) throw new Error("v0.8 knowledge invalid");
    const classes = Object.values(loaded.knowledge.pointClasses.classes);
    const minAbsPoints = Math.min(...classes.map((p) => Math.abs(p)).filter((p) => p > 0));
    let minWeight = Infinity;
    for (const domain of Object.values(loaded.knowledge.domainMapping.domains)) {
      minWeight = Math.min(minWeight, domain.primary.weight);
      for (const c of domain.cooperating) {
        minWeight = Math.min(minWeight, c.weight);
      }
    }
    const derivedMin = minAbsPoints * minWeight;
    expect(derivedMin).toBe(V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION);
    expect(V08_RAW_ZERO_EPSILON).toBeLessThan(derivedMin);
  });
});

describe("isEffectivelyZeroRaw", () => {
  it.each([
    [0, true],
    [-0, true],
    [Number.EPSILON, true],
    [-Number.EPSILON, true],
    [5.551115123125783e-17, true],
    [-5.551115123125783e-17, true],
    [V08_RAW_ZERO_EPSILON, true],
    [-V08_RAW_ZERO_EPSILON, true],
    [V08_RAW_ZERO_EPSILON * 0.999, true],
    [-(V08_RAW_ZERO_EPSILON * 0.999), true],
    [V08_RAW_ZERO_EPSILON * 1.0000001, false],
    [-(V08_RAW_ZERO_EPSILON * 1.0000001), false],
    [0.2, false],
    [-0.2, false],
    [1, false],
    [-1, false],
  ] as const)("value %s → %s", (value, expected) => {
    expect(isEffectivelyZeroRaw(value)).toBe(expected);
  });

  it("fails closed for non-finite values", () => {
    expect(isEffectivelyZeroRaw(Number.NaN)).toBe(false);
    expect(isEffectivelyZeroRaw(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isEffectivelyZeroRaw(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});

describe("classifyV08ScoreState", () => {
  it.each([
    {
      matchedStarCount: 0,
      prominenceAdjustedRaw: 0,
      hasCooperatingGap: false,
      expected: "no-signal",
    },
    {
      matchedStarCount: 0,
      prominenceAdjustedRaw: 5.551115123125783e-17,
      hasCooperatingGap: false,
      expected: "no-signal",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: 0,
      hasCooperatingGap: false,
      expected: "balanced-signal",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: 5.551115123125783e-17,
      hasCooperatingGap: false,
      expected: "balanced-signal",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: 0.2,
      hasCooperatingGap: false,
      expected: "scored",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: -0.2,
      hasCooperatingGap: false,
      expected: "scored",
    },
    {
      matchedStarCount: 0,
      prominenceAdjustedRaw: 0,
      hasCooperatingGap: true,
      expected: "partial-data",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: 5.551115123125783e-17,
      hasCooperatingGap: true,
      expected: "partial-data",
    },
    {
      matchedStarCount: 3,
      prominenceAdjustedRaw: 1.5,
      hasCooperatingGap: true,
      expected: "partial-data",
    },
  ])(
    "$matchedStarCount stars raw=$prominenceAdjustedRaw gap=$hasCooperatingGap → $expected",
    ({ matchedStarCount, prominenceAdjustedRaw, hasCooperatingGap, expected }) => {
      expect(
        classifyV08ScoreState({ matchedStarCount, prominenceAdjustedRaw, hasCooperatingGap }),
      ).toBe(expected);
    },
  );

  it("throws on non-finite raw (does not silently treat NaN as balanced)", () => {
    expect(() =>
      classifyV08ScoreState({
        matchedStarCount: 2,
        prominenceAdjustedRaw: Number.NaN,
        hasCooperatingGap: false,
      }),
    ).toThrow(/finite prominenceAdjustedRaw/);
    expect(() =>
      classifyV08ScoreState({
        matchedStarCount: 2,
        prominenceAdjustedRaw: Number.POSITIVE_INFINITY,
        hasCooperatingGap: false,
      }),
    ).toThrow(/finite prominenceAdjustedRaw/);
  });

  it("does not classify via absoluteScore === 50: tiny-but-meaningful raw stays scored", () => {
    // |raw| > epsilon but 5×raw rounds to 0 at precision 1 → public score 50.
    const prominenceAdjustedRaw = 0.008;
    expect(isEffectivelyZeroRaw(prominenceAdjustedRaw)).toBe(false);
    const rawScore = 50 + 5 * prominenceAdjustedRaw; // 50.04
    const absoluteScore = Math.round(rawScore * 10) / 10; // 50.0
    expect(absoluteScore).toBe(50);
    expect(
      classifyV08ScoreState({
        matchedStarCount: 2,
        prominenceAdjustedRaw,
        hasCooperatingGap: false,
      }),
    ).toBe("scored");
  });

  it("legacy strict-zero still mislabels epsilon residues as scored", () => {
    expect(
      legacyClassifyV08ScoreState({
        matchedStarCount: 3,
        prominenceAdjustedRaw: 5.551115123125783e-17,
        hasCooperatingGap: false,
      }),
    ).toBe("scored");
    expect(
      classifyV08ScoreState({
        matchedStarCount: 3,
        prominenceAdjustedRaw: 5.551115123125783e-17,
        hasCooperatingGap: false,
      }),
    ).toBe("balanced-signal");
  });
});
