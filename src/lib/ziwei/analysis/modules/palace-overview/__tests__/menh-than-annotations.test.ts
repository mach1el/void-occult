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

describe("menh-than annotations", () => {
  it.each(SCHOOLS)(
    "exactly one Mệnh and one Thân across all 12 results ($school)",
    ({ school, calculate }) => {
      const chart = calculate(REGRESSION);
      const { results, semanticStatus } = analyzeAllPalaces(chart, { school });
      expect(semanticStatus).toBe("available");

      const menh = results.filter((r) => r.isMenh);
      const than = results.filter((r) => r.isThan);
      expect(menh).toHaveLength(1);
      expect(than).toHaveLength(1);

      const menhResult = menh[0]!;
      expect(
        menhResult.annotations.some(
          (a) => a.category === "menh-than" && a.explanationKey === "context.menh.core",
        ),
      ).toBe(true);

      const thanResult = than[0]!;
      expect(
        thanResult.annotations.some(
          (a) => a.category === "menh-than" && a.explanationKey === "context.than.emphasis",
        ),
      ).toBe(true);
    },
  );

  it("same-palace annotation fires only when Mệnh and Thân share a palace", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const sharesPalace = chart.menhIndex === chart.thanIndex;
    const sameCount = results.reduce(
      (acc, r) =>
        acc +
        r.annotations.filter(
          (a) => a.explanationKey === "context.menh-than.same-palace",
        ).length,
      0,
    );
    expect(sameCount).toBe(sharesPalace ? 1 : 0);
  });

  it("Mệnh VCD reference annotation fires only when the Mệnh palace has no natal major star", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const menhResult = results.find((r) => r.isMenh)!;
    const voidRef = menhResult.annotations.find(
      (a) => a.explanationKey === "context.menh-void.than-reference",
    );
    if (menhResult.isVoidMajor) {
      expect(voidRef).toBeDefined();
      expect(voidRef!.palaceIndexes).toEqual([chart.menhIndex, chart.thanIndex]);
    } else {
      expect(voidRef).toBeUndefined();
    }
  });

  it("annotations never enter allEvidence and carry no axes", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      for (const a of r.annotations) {
        expect(r.allEvidence.some((e) => e.id === a.id)).toBe(false);
        expect((a as unknown as Record<string, unknown>).axes).toBeUndefined();
      }
    }
  });
});
