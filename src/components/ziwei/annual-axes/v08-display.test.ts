import { describe, expect, it } from "vitest";
import {
  formatPalaceStars,
  hasPalaceStarSignal,
  isRelevantCooperatingPalace,
  shouldShowCoverage,
} from "@/components/ziwei/annual-axes/v08-display";

describe("v08-display helpers", () => {
  it("hides full coverage and empty cooperating palaces", () => {
    expect(
      shouldShowCoverage({
        resolvedWeight: 1,
        totalWeight: 1,
        missingPalaces: [],
      }),
    ).toBe(false);

    expect(
      isRelevantCooperatingPalace({
        role: "cooperating",
        palaceName: "Phúc Đức",
        palaceIndex: 1,
        configuredWeight: 0.2,
        positivePoints: 0,
        negativePoints: 0,
        palaceRaw: 0,
        matchedFacts: [],
      }),
    ).toBe(false);

    expect(
      isRelevantCooperatingPalace({
        role: "cooperating",
        palaceName: "Điền Trạch",
        palaceIndex: 2,
        configuredWeight: 0.2,
        positivePoints: 1,
        negativePoints: 0,
        palaceRaw: 1,
        matchedFacts: [
          {
            starName: "Lưu Hóa Lộc",
            canonicalStarName: "Lưu Hóa Lộc",
            ruleId: "r1",
            polarity: "positive",
            points: 1,
            palaceIndex: 2,
            annualPalaceName: "Điền Trạch",
            sourceId: "SRC",
          },
        ],
      }),
    ).toBe(true);
  });

  it("formats only non-empty star lines", () => {
    expect(
      formatPalaceStars(
        [{ starName: "Lưu Lộc Tồn", points: 2, polarity: "positive" }],
        "positive",
      ),
    ).toBe("Lưu Lộc Tồn (+2)");
    expect(
      formatPalaceStars(
        [{ starName: "Lưu Lộc Tồn", points: 2, polarity: "positive" }],
        "negative",
      ),
    ).toBeNull();
    expect(hasPalaceStarSignal([])).toBe(false);
  });
});
