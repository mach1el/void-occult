/**
 * Full distribution audit — only runs when ANNUAL_AXES_FULL_AUDIT=1.
 * Writes aggregate JSON under research/annual-axes/distribution/.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeAuditReports } from "../run-distribution-audit";

const ENABLED = process.env.ANNUAL_AXES_FULL_AUDIT === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution");

describe.runIf(ENABLED)("annual-axes full distribution audit", () => {
  it("writes Nam Phái + Trung Châu baseline reports for the 100×12 corpus", () => {
    const started = Date.now();
    const reports = writeAuditReports({ full: true, outDir: OUT_DIR });
    const elapsedMs = Date.now() - started;
    expect(reports).toHaveLength(2);
    expect(existsSync(join(OUT_DIR, "corpus-contract.json"))).toBe(true);
    for (const report of reports) {
      expect(report.chartCount).toBe(100);
      expect(report.yearsPerChart).toBe(12);
      expect(report.resultCount).toBe(1200);
      const path = join(
        OUT_DIR,
        `${report.profileId}-${report.school}-annual-axes-audit-full-v0.4.json`,
      );
      expect(existsSync(path)).toBe(true);
      const loaded = JSON.parse(readFileSync(path, "utf8"));
      expect(loaded.allSixAbove60Rate).toBeTypeOf("number");
    }
    // Soft budget signal — recorded in the assertion message for the report.
    expect(elapsedMs, `full audit took ${elapsedMs}ms`).toBeGreaterThan(0);
  }, 600_000);
});
