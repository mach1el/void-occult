/**
 * Full V0.9 research audit — only runs when ANNUAL_AXES_V09_FULL_AUDIT=1.
 * Writes the Part A–F research artifacts under
 * research/annual-axes/v0.9-foundation/audit/. Read-only over V0.8
 * production knowledge/engine; never touches existing V0.8 fixtures.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeV09ResearchArtifacts } from "../write-research-artifacts";

const ENABLED = process.env.ANNUAL_AXES_V09_FULL_AUDIT === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/v0.9-foundation/audit");

describe.runIf(ENABLED)("annual axes v0.9 full research audit", () => {
  it("writes the full 100x12 corpus research artifacts deterministically", () => {
    const artifacts = writeV09ResearchArtifacts({ full: true, outDir: OUT_DIR });

    expect(artifacts.contract.chartCount).toBe(100);
    expect(artifacts.contract.yearsPerChart).toBe(12);

    for (const name of [
      "corpus-contract.v0.9.json",
      "full-distribution-report.v0.8.json",
      "gate-evaluation.v0.8.json",
      "rule-coverage.v0.8.json",
      "capability-coverage.v0.8.json",
      "no-signal-analysis.v0.8.json",
      "contribution-mass.v0.8.json",
    ]) {
      expect(existsSync(join(OUT_DIR, name))).toBe(true);
    }

    expect(artifacts.gateEvaluation.allConfiguredGatesEvaluated).toBe(true);
    expect(artifacts.gateEvaluation.unknownConfiguredGateKeys).toEqual([]);
    expect(artifacts.ruleCoverage.length).toBeGreaterThan(0);

    // Determinism: running generation twice must produce byte-identical JSON.
    const before = readFileSync(join(OUT_DIR, "full-distribution-report.v0.8.json"), "utf8");
    writeV09ResearchArtifacts({ full: true, outDir: OUT_DIR });
    const after = readFileSync(join(OUT_DIR, "full-distribution-report.v0.8.json"), "utf8");
    expect(after).toBe(before);
  }, 600_000);
});
