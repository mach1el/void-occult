/**
 * Writes V0.4.3 ablation + spatial-budget audit artifacts.
 * Gated by ANNUAL_AXES_V043_AUDIT=1 (same pattern as full V0.4 audit).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeV043AblationReports } from "../run-v043-ablation";

const ENABLED = process.env.ANNUAL_AXES_V043_AUDIT === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.4.3");

describe.runIf(ENABLED)("annual-axes V0.4.3 ablation audit", () => {
  it("writes deterministic ablation + corpus + diagnostics artifacts", () => {
    const { summary, selectedVariant } = writeV043AblationReports(OUT_DIR);
    expect(summary.length).toBe(5);
    expect(selectedVariant).toBe("E-d-plus-diminishing-geometryBucket");

    for (const name of [
      "annual-axes-v0.4.3-ablation-summary.json",
      "annual-axes-v0.4.3-full-corpus.json",
      "annual-axes-v0.4.3-spatial-budget-audit.json",
      "annual-axes-v0.4.3-dedupe-audit.json",
      "annual-axes-v0.4.3-human-diagnostics.md",
    ]) {
      expect(existsSync(join(OUT_DIR, name))).toBe(true);
    }

    const corpus = JSON.parse(
      readFileSync(join(OUT_DIR, "annual-axes-v0.4.3-full-corpus.json"), "utf8"),
    );
    expect(corpus.resultCount).toBe(1200);
    expect(corpus.spatialBudget.maxAbsTp4cContribution).toBeLessThanOrEqual(0.1 + 1e-9);
  }, 600_000);
});
