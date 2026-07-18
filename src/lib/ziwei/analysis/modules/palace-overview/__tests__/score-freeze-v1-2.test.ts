/**
 * V1.2 Semantic Completion — score freeze (prompt §14 "Score freeze").
 * Every numeric field + driver identity on the regression chart, both
 * schools, must be byte-identical to the locked V1.1 baseline. New
 * annotation-only fields (annotations/isMenh/isThan/versions) are checked
 * separately for presence, never mixed into the numeric comparison.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview";
import type { BirthInput, School } from "@/types/chart";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const SCHOOLS: Array<{ school: School; calculate: typeof calculateNamPhai }> = [
  { school: "nam-phai", calculate: calculateNamPhai },
  { school: "trung-chau", calculate: calculateTrungChau },
];

function numericSnapshot(school: School, calculate: typeof calculateNamPhai) {
  const chart = calculate(REGRESSION);
  const { results } = analyzeAllPalaces(chart, { school });
  return results
    .map((r) => ({
      palaceIndex: r.palaceIndex,
      score: r.score,
      band: r.band,
      axes: r.axes,
      rawAxes: r.rawAxes,
      intensity: r.intensity,
      evidenceCompleteness: r.evidenceCompleteness,
      topSupportDriverIds: r.topSupportDrivers.map((e) => e.id),
      topPressureDriverIds: r.topPressureDrivers.map((e) => e.id),
    }))
    .sort((a, b) => a.palaceIndex - b.palaceIndex);
}

describe("V1.2 score freeze — regression chart", () => {
  it.each(SCHOOLS)(
    "$school: score/axes/rawAxes/intensity/band/driver identities match the locked baseline",
    ({ school, calculate }) => {
      expect(numericSnapshot(school, calculate)).toMatchSnapshot();
    },
  );

  it.each(SCHOOLS)(
    "$school: new V1.2 fields are present without altering numeric output",
    ({ school, calculate }) => {
      const chart = calculate(REGRESSION);
      const { results } = analyzeAllPalaces(chart, { school });
      for (const r of results) {
        expect(Array.isArray(r.annotations)).toBe(true);
        expect(typeof r.isMenh).toBe("boolean");
        expect(typeof r.isThan).toBe("boolean");
        expect(r.versions.contractVersion).toBeTruthy();
        expect(r.versions.engineVersion).toBeTruthy();
        expect(r.versions.knowledgeVersion).toBeTruthy();
      }
    },
  );
});

describe("V1.2 score freeze — 100-chart distribution fixture", () => {
  function buildMatrixInputs(): BirthInput[] {
    const inputs: BirthInput[] = [];
    for (let i = 0; i < 100; i++) {
      const year = 1960 + i;
      const month = (i % 12) + 1;
      const day = 3 + (i % 24);
      inputs.push({
        solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        birthHour: ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"][i % 6]!,
        gender: i % 2 === 0 ? "male" : "female",
        timezone: "7",
        annualYear: "2026",
        flowBase: "luu-nien",
      });
    }
    return inputs;
  }

  it.each(SCHOOLS)(
    "$school: 1200 palace scores stay within the existing distribution bounds",
    ({ school, calculate }) => {
      const inputs = buildMatrixInputs();
      const scores: number[] = [];
      for (const input of inputs) {
        const chart = calculate(input);
        const { results } = analyzeAllPalaces(chart, { school });
        for (const r of results) scores.push(r.score);
      }
      expect(scores).toHaveLength(1200);
      const extreme = scores.filter((s) => s <= 0 || s >= 100).length;
      expect(extreme / scores.length).toBeLessThanOrEqual(0.05);
    },
  );
});

describe("V1.2 annual isolation — annotations and versions", () => {
  it("changing annualYear does not alter annotations, isMenh/isThan, or versions", () => {
    const a = analyzeAllPalaces(calculateNamPhai({ ...REGRESSION, annualYear: "2026" }), {
      school: "nam-phai",
    });
    const b = analyzeAllPalaces(calculateNamPhai({ ...REGRESSION, annualYear: "2027" }), {
      school: "nam-phai",
    });

    const strip = (res: typeof a.results) =>
      res
        .map((r) => ({
          palaceIndex: r.palaceIndex,
          isMenh: r.isMenh,
          isThan: r.isThan,
          annotationIds: r.annotations.map((ann) => ann.id).sort(),
          versions: r.versions,
        }))
        .sort((x, y) => x.palaceIndex - y.palaceIndex);

    expect(strip(a.results)).toEqual(strip(b.results));
    expect(a.semanticStatus).toBe(b.semanticStatus);
  });
});
