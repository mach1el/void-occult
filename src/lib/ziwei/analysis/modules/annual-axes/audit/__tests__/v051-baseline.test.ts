import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import { verifyV05BaselineReproduction } from "../run-v051-bias-audit";
import { runV051VariantEvaluation } from "../run-v051-variant-evaluation";
import { V051_CANDIDATES } from "../v051-types";
import { deriveV051Calibration } from "../v051-calibration";
import { splitChartIndices } from "../../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "../build-audit-corpus";

describe("V0.5.1 baseline integrity", () => {
  it("reproduces committed V0.5 calibration and holdout metrics", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const check = verifyV05BaselineReproduction(loaded.knowledge);
    expect(check.reproduced).toBe(true);
    expect(check.mismatches).toEqual([]);
  }, 600_000);

  it("BASELINE-V05 calibration matches committed production values", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const baseline = deriveV051Calibration(
      V051_CANDIDATES.find((c) => c.id === "BASELINE-V05")!,
      loaded.knowledge,
    );
    expect(baseline.activationScale).toBe(loaded.knowledge.calibration.activationScale);
    expect(baseline.domainScales).toEqual(loaded.knowledge.calibration.domainScales);
  });

  it("stable chart-ID split is 80/20", () => {
    const { training, holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
    expect(training).toHaveLength(80);
    expect(holdout).toHaveLength(20);
    expect(training[training.length - 1]).toBe(79);
    expect(holdout[0]).toBe(80);
  });
});

describe("V0.5.1 variant evaluation smoke", () => {
  it("evaluates all four candidates deterministically", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const a = runV051VariantEvaluation(loaded.knowledge);
    const b = runV051VariantEvaluation(loaded.knowledge);
    expect(a).toEqual(b);
    expect(a.candidates).toHaveLength(4);
    expect(a.baselineReproduced).toBe(true);
  }, 900_000);
});
