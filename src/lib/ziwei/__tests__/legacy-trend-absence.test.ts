/**
 * Phase 0 — protect Calculation Core & assert legacy trend scorers are gone.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANALYSIS_MODULES,
  getAnalysisStatus,
} from "@/lib/ziwei/analysis";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|tsx|js|jsx|css|csv|md)$/.test(name)) out.push(full);
  }
  return out;
}

function readSrcProduction(): Array<{ path: string; text: string }> {
  return walkFiles(SRC)
    .filter((p) => !p.includes(`${join("src", "lib", "ziwei", "trend")}`))
    .filter((p) => !p.includes(`${join("docs", "archive")}`))
    .map((p) => ({ path: relative(ROOT, p), text: readFileSync(p, "utf8") }));
}

describe("legacy trend scoring absence", () => {
  it("does not keep production trend weight/scorer trees", () => {
    expect(existsSync(join(SRC, "lib/ziwei/trend"))).toBe(false);
    expect(existsSync(join(SRC, "components/ziwei/trend"))).toBe(false);
    expect(existsSync(join(SRC, "lib/ziwei/trend/weights.ts"))).toBe(false);
    expect(existsSync(join(SRC, "lib/ziwei/trend/star-scores.csv"))).toBe(false);
  });

  it("has no runtime production references to legacy scoring symbols", () => {
    const forbidden = [
      "SCORING_WEIGHTS",
      "RADAR_WEIGHTS",
      "ScoringWeights",
      "RadarWeights",
      "scoreFortuneFrame",
      "scoreLuuNguyetFrame",
      "getPalaceStrengths",
      "getAnnualAxisStrengths",
      "getDaiVanTrend",
      "getLuuNienTrend",
      "findStarScore",
      "STAR_SCORES",
      "star-scores.csv",
      "Kỵ Trùng Kỵ",
      "Lộc Trùng Lộc",
      "Nhân toàn cột",
    ];

    const hits: string[] = [];
    for (const file of readSrcProduction()) {
      // Absence tests may mention symbols; skip this file and similar guards.
      if (file.path.includes("legacy-trend-absence")) continue;
      if (file.path.includes("invariants.test")) continue;
      // The annual-axes import-boundary guard is its own dedicated
      // legacy-symbol denylist test — it mentions the tokens on purpose.
      if (file.path.includes("import-boundary.test")) continue;
      for (const token of forbidden) {
        if (file.text.includes(token)) {
          hits.push(`${file.path}: ${token}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("analysis availability after reset", () => {
  it("marks major-fortune and monthly-flow unavailable/rebuilding (no UI published)", () => {
    for (const module of ["major-fortune", "monthly-flow"] as const) {
      expect(getAnalysisStatus(module)).toEqual({
        status: "unavailable",
        module,
        reason: "rebuilding",
      });
    }
  });

  it("marks palace-overview available (default-on since the chart UI publish)", () => {
    const status = getAnalysisStatus("palace-overview");
    expect(status.status).toBe("available");
  });

  it("marks annual-axes available by default (V0.4 default-on)", () => {
    const status = getAnalysisStatus("annual-axes");
    expect(status.status).toBe("available");
  });

  it("still enumerates all four modules in ANALYSIS_MODULES", () => {
    expect(ANALYSIS_MODULES).toEqual([
      "palace-overview",
      "annual-axes",
      "major-fortune",
      "monthly-flow",
    ]);
  });
});
