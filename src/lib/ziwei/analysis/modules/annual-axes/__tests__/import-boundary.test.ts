/**
 * Import-boundary lock for the annual-axes module tree.
 *
 * The scoring pipeline must remain independent of Monthly Flow and
 * Major Fortune analyzers, Palace Overview's normalized 12-palace
 * scores, and every legacy trend/radar/weight symbol we removed in the
 * Phase 0 reset. A regression here would allow one temporal module to
 * silently double-count another's output — precisely what the module
 * boundary rules exist to prevent.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src/lib/ziwei/analysis/modules/annual-axes");

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "audit") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkFiles(full, out);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

const FORBIDDEN_TOKENS = [
  // Palace Overview API surface (annual-axes must build its own evidence).
  "PalaceOverviewResult",
  "analyzeAllPalaces",
  "analyzePalace",
  // Major Fortune analyzer entry point.
  "analyzeMajorFortune",
  // Monthly Flow analyzer entry point.
  "analyzeMonthlyFlow",
  // Calculation Core placement APIs — V0.3 §18 dynamic-resolution gate.
  "getAnnualMajorFortuneIndex",
  "assignSmallLimits",
  "engine-nam-phai",
  "engine-trung-chau",
  // Legacy trend/radar/weight symbols removed at Phase 0.
  "SCORING_WEIGHTS",
  "RADAR_WEIGHTS",
  "scoreFortuneFrame",
  "scoreLuuNguyetFrame",
  "getPalaceStrengths",
  "getAnnualAxisStrengths",
  "getDaiVanTrend",
  "getLuuNienTrend",
  "STAR_SCORES",
  "star-scores.csv",
];

// Match imports from `major-fortune`, `monthly-flow`, or the removed
// legacy `trend/` tree — regardless of the exact symbol imported.
const FORBIDDEN_IMPORT_PATHS = [
  /from ["'][^"']*\/modules\/major-fortune["']/,
  /from ["'][^"']*\/modules\/monthly-flow["']/,
  /from ["'][^"']*\/lib\/ziwei\/trend[/"']/,
];

describe("annual-axes module import boundary", () => {
  const files = walkFiles(ROOT);

  it("finds a non-empty module tree", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("does not reference forbidden analyzers or legacy scoring symbols", () => {
    const hits: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      for (const token of FORBIDDEN_TOKENS) {
        if (text.includes(token)) {
          hits.push(`${path}: ${token}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("does not import from major-fortune, monthly-flow, or legacy trend paths", () => {
    const hits: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      for (const pattern of FORBIDDEN_IMPORT_PATHS) {
        if (pattern.test(text)) {
          hits.push(`${path}: matches ${pattern.source}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
