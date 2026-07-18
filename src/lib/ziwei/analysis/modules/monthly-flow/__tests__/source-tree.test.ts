import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src/lib/ziwei/analysis/modules/monthly-flow");
const SOURCE_FILES = readdirSync(ROOT).filter((f) => f.endsWith(".ts"));

describe("monthly-flow source tree — no forbidden dependencies", () => {
  it.each(SOURCE_FILES)("%s does not call locTonIndex or previous module scoring APIs", (file) => {
    const text = readFileSync(join(ROOT, file), "utf8");
    const forbidden = [
      "analyzeAnnualAxes",
      "analyzeMajorFortune",
      "locTonIndex",
      "PalaceOverviewResult",
      "analyzeAllPalaces",
      ".score" + "Band",
    ];
    for (const token of forbidden) {
      expect(text.includes(token), `${file} contains ${token}`).toBe(false);
    }
  });

  it("scorer files never import engine-nam-phai or engine-trung-chau", () => {
    for (const file of SOURCE_FILES) {
      const text = readFileSync(join(ROOT, file), "utf8");
      expect(text.includes("engine-nam-phai")).toBe(false);
      expect(text.includes("engine-trung-chau")).toBe(false);
    }
  });
});
