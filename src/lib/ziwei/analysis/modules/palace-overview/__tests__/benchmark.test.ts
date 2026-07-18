import { describe, expect, it } from "vitest";
import { listBenchmarkCaseIds, runBenchmarkCase } from "@/lib/ziwei/analysis/modules/palace-overview";

describe("benchmark scaffold (dev/test only)", () => {
  it("lists the seed case", () => {
    expect(listBenchmarkCaseIds()).toContain("female-1991-09-21-dau");
  });

  it("produces the full structured output for both schools without touching expert labels", () => {
    const run = runBenchmarkCase("female-1991-09-21-dau");
    expect(run.schools.map((s) => s.school).sort()).toEqual(["nam-phai", "trung-chau"]);

    for (const school of run.schools) {
      expect(school.results).toHaveLength(12);
      expect(school.versions.contractVersion).toBeTruthy();
      expect(school.versions.engineVersion).toBeTruthy();
      expect(school.versions.knowledgeVersion).toBeTruthy();
      for (const r of school.results) {
        expect(typeof r.score).toBe("number");
        expect(r.axes).toBeDefined();
        expect(r.rawAxes).toBeDefined();
        expect(Array.isArray(r.menhThanAnnotations)).toBe(true);
        expect(Array.isArray(r.pairAnnotations)).toBe(true);
        expect(Array.isArray(r.transformationTargetAnnotations)).toBe(true);
        expect(Array.isArray(r.domainProjections)).toBe(true);
      }
    }

    // Seed labels are carried through verbatim — never back-filled from the
    // engine run above.
    expect(run.labels).toHaveLength(12);
    expect(run.labels.every((l) => l.reviewStatus === "unreviewed")).toBe(true);
    expect(run.labels.every((l) => l.support === null && l.pressure === null)).toBe(true);
  });

  it("throws on an unknown case id rather than fabricating one", () => {
    expect(() => runBenchmarkCase("no-such-case")).toThrow();
  });
});
