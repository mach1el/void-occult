import { describe, expect, it } from "vitest";
import type { AnnualAxisNamPhaiV08Result, AnnualAxisScoreTraceV08 } from "../../../types";
import { toDomainObservationV09, collectV09Observation } from "../collect-v09-observations";
import { buildAuditBirthInputs, expandAnnualYears, FAST_CORPUS_CONTRACT } from "../../build-audit-corpus";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";

function baseTrace(overrides: Partial<AnnualAxisScoreTraceV08> = {}): AnnualAxisScoreTraceV08 {
  return {
    formulaVersion: "v0.8-annual-palace-weighted-score",
    primary: {
      role: "primary",
      palaceName: "Tật Ách",
      palaceIndex: 3,
      configuredWeight: 0.6,
      positivePoints: 2,
      negativePoints: 0,
      palaceRaw: 2,
      matchedFacts: [],
    },
    cooperating: [],
    axisRawBeforeThaiTue: 1.2,
    isThaiTueHighlighted: false,
    thaiTueMultiplier: 1,
    prominenceAdjustedRaw: 1.2,
    rawScore: 56,
    absoluteScore: 56,
    scoreState: "scored",
    availability: "available",
    coverage: { resolvedWeight: 1, totalWeight: 1, missingPalaces: [] },
    configuredPalaceCount: 1,
    resolvedPalaceCount: 1,
    matchedStarCount: 1,
    missingInputs: [],
    ...overrides,
  };
}

function resultFrom(trace: AnnualAxisScoreTraceV08, opts: Partial<AnnualAxisNamPhaiV08Result> = {}) {
  return {
    domain: "health",
    engine: "v0.8",
    status: trace.availability,
    score: trace.absoluteScore,
    band: trace.absoluteScore == null ? null : "balanced",
    scoreTrace: trace,
    coverage: trace.coverage,
    v08Evidence: [],
    topSupportDriversV08: [],
    topPressureDriversV08: [],
    ...opts,
  } as unknown as AnnualAxisNamPhaiV08Result;
}

describe("annual axes v0.9 audit contract — synthetic traces", () => {
  it("retains partial-data scores instead of nulling them", () => {
    const trace = baseTrace({
      availability: "partial-data",
      scoreState: "partial-data",
      coverage: { resolvedWeight: 0.6, totalWeight: 1, missingPalaces: ["Phúc Đức"] },
      absoluteScore: 54,
    });
    const obs = toDomainObservationV09(resultFrom(trace, { status: "partial-data", score: 54 }));
    expect(obs.status).toBe("partial-data");
    expect(obs.score).toBe(54);
    expect(obs.scoreState).toBe("partial-data");
    expect(obs.missingPalaces).toEqual(["Phúc Đức"]);
    expect(obs.resolvedWeight).toBe(0.6);
    expect(obs.totalWeight).toBe(1);
  });

  it("keeps unavailable scores as null, never fabricated", () => {
    const trace = baseTrace({
      availability: "unavailable",
      scoreState: "unavailable",
      absoluteScore: null,
      rawScore: 50,
      coverage: { resolvedWeight: 0, totalWeight: 1, missingPalaces: ["Tật Ách"] },
    });
    const obs = toDomainObservationV09(
      resultFrom(trace, { status: "unavailable", score: null, band: null }),
    );
    expect(obs.status).toBe("unavailable");
    expect(obs.score).toBeNull();
    expect(obs.scoreState).toBe("unavailable");
  });

  it("distinguishes no-signal, balanced-signal, and scored states", () => {
    const noSignal = toDomainObservationV09(
      resultFrom(baseTrace({ scoreState: "no-signal", axisRawBeforeThaiTue: 0, prominenceAdjustedRaw: 0, absoluteScore: 50 })),
    );
    const balanced = toDomainObservationV09(
      resultFrom(baseTrace({ scoreState: "balanced-signal", axisRawBeforeThaiTue: 0, prominenceAdjustedRaw: 0, absoluteScore: 50 })),
    );
    const scored = toDomainObservationV09(resultFrom(baseTrace({ scoreState: "scored", absoluteScore: 62 })));
    expect(noSignal.scoreState).toBe("no-signal");
    expect(balanced.scoreState).toBe("balanced-signal");
    expect(scored.scoreState).toBe("scored");
  });

  it("reconstructs raw score fields (axisRawBeforeThaiTue, thaiTue, prominenceAdjustedRaw)", () => {
    const trace = baseTrace({
      axisRawBeforeThaiTue: 2,
      isThaiTueHighlighted: true,
      thaiTueMultiplier: 1.25,
      prominenceAdjustedRaw: 2.5,
    });
    const obs = toDomainObservationV09(resultFrom(trace));
    expect(obs.axisRawBeforeThaiTue).toBe(2);
    expect(obs.thaiTueApplied).toBe(true);
    expect(obs.thaiTueMultiplier).toBe(1.25);
    expect(obs.prominenceAdjustedRaw).toBe(2.5);
  });

  it("detects palace-level clamp when positive-negative exceeds the configured band", () => {
    const trace = baseTrace({
      primary: {
        role: "primary",
        palaceName: "Tật Ách",
        palaceIndex: 3,
        configuredWeight: 0.6,
        positivePoints: 10,
        negativePoints: 0,
        palaceRaw: 8, // clamped from 10 to 8
        matchedFacts: [],
      },
    });
    const obs = toDomainObservationV09(resultFrom(trace));
    expect(obs.palaceClampApplied).toBe(true);
  });

  it("does not report a palace clamp when raw stays inside the configured band", () => {
    const obs = toDomainObservationV09(resultFrom(baseTrace()));
    expect(obs.palaceClampApplied).toBe(false);
  });

  it("detects axis-level clamp when axisRaw × multiplier exceeds the configured band", () => {
    const trace = baseTrace({
      axisRawBeforeThaiTue: 7,
      isThaiTueHighlighted: true,
      thaiTueMultiplier: 1.25,
      prominenceAdjustedRaw: 8, // clamped from 8.75
    });
    const obs = toDomainObservationV09(resultFrom(trace));
    expect(obs.axisClampApplied).toBe(true);
  });

  it("does not report axis clamp when the multiplied raw stays inside the band", () => {
    const trace = baseTrace({ axisRawBeforeThaiTue: 2, thaiTueMultiplier: 1, prominenceAdjustedRaw: 2 });
    const obs = toDomainObservationV09(resultFrom(trace));
    expect(obs.axisClampApplied).toBe(false);
  });
});

describe("annual axes v0.9 audit contract — real engine corpus (fast smoke)", () => {
  it("produces well-formed observations for every domain across the fast corpus", () => {
    const bases = buildAuditBirthInputs(FAST_CORPUS_CONTRACT);
    let checked = 0;
    for (const [i, base] of bases.entries()) {
      const chartId = `${FAST_CORPUS_CONTRACT.contractId}:nam-phai:c${i}`;
      for (const yearly of expandAnnualYears(base, FAST_CORPUS_CONTRACT.baseAnnualYear, FAST_CORPUS_CONTRACT.yearsPerChart)) {
        const chart = calculateNamPhai(yearly);
        const obs = collectV09Observation(chartId, chart);
        for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
          const d = obs.domains[domain];
          expect(["available", "partial-data", "unavailable"]).toContain(d.status);
          if (d.status === "unavailable") {
            expect(d.score).toBeNull();
          } else {
            expect(typeof d.score).toBe("number");
          }
          expect(d.totalWeight).toBeGreaterThan(0);
          checked += 1;
        }
      }
    }
    expect(checked).toBe(bases.length * FAST_CORPUS_CONTRACT.yearsPerChart * 6);
  });
});
