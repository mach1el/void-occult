import { describe, expect, it } from "vitest";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { normalizeMonthlyFlowAxes } from "../normalize";

describe("normalizeMonthlyFlowAxes — calibration fixtures (exact match)", () => {
  const loaded = loadMonthlyFlowScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("monthly flow knowledge failed to load");
  const { scoringProfile, calibrationFixtures } = loaded.knowledge;

  it.each(calibrationFixtures.formulaCases)("$fixtureId — $label", (fixture) => {
    const result = normalizeMonthlyFlowAxes(fixture.rawAxes, scoringProfile);

    expect(result.score).toBeCloseTo(fixture.expected.score, 1);
    expect(result.intensity).toBe(fixture.expected.intensity);
    expect(result.conflict).toBe(fixture.expected.conflict);
    expect(result.normalizedAxes.support).toBeCloseTo(
      fixture.expected.normalizedAxes.support,
      5,
    );
    expect(result.normalizedAxes.pressure).toBeCloseTo(
      fixture.expected.normalizedAxes.pressure,
      5,
    );
    expect(result.normalizedAxes.stability).toBeCloseTo(
      fixture.expected.normalizedAxes.stability,
      5,
    );
    expect(result.normalizedAxes.activation).toBeCloseTo(
      fixture.expected.normalizedAxes.activation,
      5,
    );
  });

  it("activation-only evidence leaves score exactly at neutral", () => {
    const result = normalizeMonthlyFlowAxes(
      { support: 0, pressure: 0, stability: 0, activation: 3 },
      scoringProfile,
    );
    expect(result.score).toBe(50);
  });
});
