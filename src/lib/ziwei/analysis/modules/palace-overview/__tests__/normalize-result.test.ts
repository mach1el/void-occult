import { describe, it, expect } from "vitest";
import { bandForScore } from "../normalize-result";

describe("normalize-result bands", () => {
  it("enforces approved score boundaries", () => {
    const cases: [number, string][] = [
      [0, "low"],
      [24, "low"],
      [24.1, "guarded"],
      [39, "guarded"],
      [40, "guarded"],
      [49.9, "guarded"],
      [50, "balanced"],
      [59, "balanced"],
      [59.9, "balanced"],
      [60, "supportive"],
      [74, "supportive"],
      [74.9, "supportive"],
      [75, "strong"],
      [100, "strong"],
    ];

    for (const [score, expected] of cases) {
      expect(bandForScore(score)).toBe(expected);
    }
  });

  it("most importantly respects 50 threshold", () => {
    expect(bandForScore(40)).toBe("guarded");
    expect(bandForScore(49.9)).toBe("guarded");
    expect(bandForScore(50)).toBe("balanced");
  });
});
