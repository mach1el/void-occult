import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadPublicHuyenKhiDataset, HUYEN_KHI_DATA_DIR } from "../load-dataset";
import { analyzeScoreAlphabet } from "../analyze-score-alphabet";

describe("analyzeScoreAlphabet", () => {
  it("reproduces the pack's own sample-validation-report.v0.1.json numbers", () => {
    const dataset = loadPublicHuyenKhiDataset();
    const report = analyzeScoreAlphabet(dataset);
    const packReport = JSON.parse(
      readFileSync(path.join(HUYEN_KHI_DATA_DIR, "sample-validation-report.v0.1.json"), "utf-8"),
    ) as {
      palaceValueCount: number;
      quarterGridValueCount: number;
      quarterGridShare: number;
      minPalaceScore: number;
      maxPalaceScore: number;
      meanPalaceScore: number;
      medianPalaceScore: number;
    };

    expect(report.palaceValueCount).toBe(packReport.palaceValueCount);
    expect(report.quarterGridValueCount).toBe(packReport.quarterGridValueCount);
    expect(report.quarterGridShare).toBeCloseTo(packReport.quarterGridShare, 5);
    expect(report.minPalaceScore).toBeCloseTo(packReport.minPalaceScore, 6);
    expect(report.maxPalaceScore).toBeCloseTo(packReport.maxPalaceScore, 6);
    expect(report.meanPalaceScore).toBeCloseTo(packReport.meanPalaceScore, 5);
    expect(report.medianPalaceScore).toBeCloseTo(packReport.medianPalaceScore, 6);
  });
});
