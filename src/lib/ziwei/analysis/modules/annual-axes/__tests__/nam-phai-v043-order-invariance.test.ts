import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { ChartData, ChartPalace } from "@/types/chart";
import { analyzeAnnualAxesNamPhaiV043 } from "../nam-phai-v043/analyze";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";

/**
 * §7 — analyzer-level order invariance. We permute each of the six input
 * arrays INDEPENDENTLY (and all together), re-run the whole analyzer, and
 * assert every scored quantity plus retained/rejected evidence identity is
 * byte-identical. Determinism is proven by REORDERING inputs, never by calling
 * the same function twice.
 */

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const base = calculateNamPhai(REGRESSION);

/** A deterministic snapshot of everything §7 requires to compare. */
function snapshot(result: ReturnType<typeof analyzeAnnualAxesNamPhaiV043>) {
  return ANNUAL_AXIS_DOMAINS.map((domain) => {
    const axis = result.axes[domain];
    if (axis.status !== "available") {
      return { domain, status: axis.status };
    }
    const sortedRetained = axis.evidence
      .filter((e) => e.retainedForSignedScore || e.retainedForActivation)
      .map(
        (e) =>
          `${e.id}|${e.geometryClass}|${e.geometryBucket}|sig:${e.retainedForSignedScore}|act:${e.retainedForActivation}`,
      )
      .sort();
    const sortedRejected = axis.evidence
      .filter((e) => e.rejectedPathReason)
      .map((e) => `${e.id}|${e.geometryClass}|${e.rejectedPathReason}`)
      .sort();
    return {
      domain,
      status: axis.status,
      score: axis.score,
      band: axis.band,
      rawAxes: axis.rawAxes,
      normalizedAxes: axis.normalizedAxes,
      directSigned: axis.spatialBudgetTrace?.directSigned,
      tp4cSigned: axis.spatialBudgetTrace?.tp4cSigned,
      directContribution: axis.spatialBudgetTrace?.directContribution,
      tp4cContribution: axis.spatialBudgetTrace?.tp4cContribution,
      spatialSigned: axis.spatialBudgetTrace?.spatialSigned,
      activationGate: axis.activationGate,
      dedupe: axis.dedupeTrace,
      retained: sortedRetained,
      rejected: sortedRejected,
    };
  });
}

function reverse<T>(items: T[] | undefined): T[] | undefined {
  return items ? [...items].reverse() : items;
}

/**
 * Remap a palace reference to the semantically identical palace (same stable
 * `index`) inside a reordered palace list. Never leave a reference pointing at
 * a different chart object.
 */
function remapPalace(
  palace: ChartPalace | null | undefined,
  byIndex: Map<number, ChartPalace>,
): ChartPalace | null | undefined {
  if (palace == null) return palace;
  return byIndex.get(palace.index) ?? palace;
}

interface PermuteOptions {
  palaces?: boolean;
  starsInPalace?: boolean;
  annualStars?: boolean;
  annualMutagens?: boolean;
  natalMutagens?: boolean;
  majorMutagens?: boolean;
}

function permute(chart: ChartData, opts: PermuteOptions): ChartData {
  const clone = structuredClone(chart);

  if (opts.starsInPalace) {
    clone.palaces = clone.palaces.map((p) => ({ ...p, stars: reverse(p.stars) }));
  }

  if (opts.palaces) {
    clone.palaces = [...clone.palaces].reverse();
  }
  // Rebuild an index → cloned-palace map AFTER any palace reordering so that
  // every reference below points to the reordered clone's palace object.
  const byIndex = new Map(clone.palaces.map((p) => [p.index, p]));

  if (clone.annualStars) {
    let annualStars = clone.annualStars.map((s) => ({
      ...s,
      palace: remapPalace(s.palace, byIndex) as ChartPalace,
    }));
    if (opts.annualStars) annualStars = [...annualStars].reverse();
    clone.annualStars = annualStars;
  }

  const remapMutagens = (list: ChartData["natalMutagens"], doReverse: boolean) => {
    if (!list) return list;
    let mapped = list.map((m) => ({ ...m, palace: remapPalace(m.palace, byIndex) }));
    if (doReverse) mapped = [...mapped].reverse();
    return mapped;
  };
  clone.natalMutagens = remapMutagens(clone.natalMutagens, opts.natalMutagens === true);
  clone.annualMutagens = remapMutagens(clone.annualMutagens, opts.annualMutagens === true);
  clone.majorMutagens = remapMutagens(clone.majorMutagens, opts.majorMutagens === true);

  return clone;
}

describe("Annual Axes V0.4.3 · analyzer-level order invariance (§7)", () => {
  const baseline = snapshot(analyzeAnnualAxesNamPhaiV043(base));

  const cases: Array<[string, PermuteOptions]> = [
    ["reversed palace order", { palaces: true }],
    ["reversed stars inside every palace", { starsInPalace: true }],
    ["reversed annualStars", { annualStars: true }],
    ["reversed annualMutagens", { annualMutagens: true }],
    ["reversed natalMutagens", { natalMutagens: true }],
    ["reversed majorMutagens", { majorMutagens: true }],
    [
      "all arrays permuted together",
      {
        palaces: true,
        starsInPalace: true,
        annualStars: true,
        annualMutagens: true,
        natalMutagens: true,
        majorMutagens: true,
      },
    ],
  ];

  for (const [label, opts] of cases) {
    it(`is invariant under: ${label}`, () => {
      const permuted = snapshot(analyzeAnnualAxesNamPhaiV043(permute(base, opts)));
      expect(permuted).toEqual(baseline);
    });
  }

  it("the permutation harness actually reordered the inputs (guard against no-op)", () => {
    const p = permute(base, { palaces: true });
    expect(p.palaces.map((x) => x.index)).not.toEqual(base.palaces.map((x) => x.index));
    expect(p.palaces.map((x) => x.index).slice().reverse()).toEqual(base.palaces.map((x) => x.index));
  });
});
