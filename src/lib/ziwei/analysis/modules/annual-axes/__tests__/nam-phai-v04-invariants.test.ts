import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { analyzeAnnualAxes } from "../analyze";
import { normalizeAnnualDeltaV04 } from "../nam-phai-v04/normalize-delta";
import { domainFrameCoverage } from "../nam-phai-v04/routing";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function emptyChannel() {
  return {
    supportRaw: 0,
    pressureRaw: 0,
    activationRaw: 0,
    supportNorm: 0,
    pressureNorm: 0,
    signed: 0,
    evidenceIds: [] as string[],
  };
}

describe("Annual Axes V0.4 knowledge", () => {
  it("loads and validates the annual-delta pack", () => {
    const loaded = loadAnnualAxesKnowledgeV04NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.knowledge.channelProfile.routing.floor).toBe(0);
    expect(loaded.knowledge.deltaProfile.neutralScore).toBe(50);
  });
});

describe("Annual Axes V0.4 · neutrality invariants", () => {
  it("support=0 pressure=0 with positive stability/activation maps to score 50", () => {
    const loaded = loadAnnualAxesKnowledgeV04NamPhai();
    if (!loaded.ok) throw new Error("v0.4 knowledge invalid");
    const knowledge = loaded.knowledge;

    const result = normalizeAnnualDeltaV04({
      channels: {
        globalAnnualClimate: emptyChannel(),
        routedHeadImpact: emptyChannel(),
        directDomainImpact: emptyChannel(),
        majorFortuneBackground: emptyChannel(),
      },
      routedStrength: 1,
      natalResponse: {
        sensitivity: 1,
        resilience: 1,
        amplitudeMultiplier: 1,
        provenance: [],
      },
      rawAxes: { support: 0, pressure: 0, stability: 5, activation: 4 },
      knowledge,
    });

    expect(result.score).toBe(50);
    expect(result.annualDelta).toBe(0);
  });

  it("chart with annual layer stripped yields all axes at exactly 50", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart: ChartData = {
      ...base,
      annualStars: [],
      annualMutagens: [],
      majorMutagens: [],
      natalMutagens: [],
      // Keep a valid head, but clear natal stars from the head TP4C so no
      // natal annual-head trigger fires.
      palaces: base.palaces.map((p) => {
        const headIdx = base.annualHeadPalace?.index ?? -1;
        const inHeadTp4c =
          p.index === headIdx ||
          p.index === (headIdx + 6) % 12 ||
          p.index === (headIdx + 4) % 12 ||
          p.index === (headIdx + 8) % 12;
        return inHeadTp4c ? { ...p, stars: [] } : p;
      }),
    };

    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.status).toBe("available");
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status === "available") {
        expect(axis.score).toBe(50);
        expect(axis.annualDelta).toBe(0);
        expect(axis.evidence.every((e) => (e.annualTriggerIds?.length ?? 0) > 0 || e.layer === "annual")).toBe(
          true,
        );
      }
    }
  });
});

describe("Annual Axes V0.4 · trigger and frame coverage", () => {
  it("rejects natal-derived numeric evidence without annualTriggerIds", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      for (const e of axis.evidence) {
        if (e.layer === "natal-activated") {
          expect(e.annualTriggerIds?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("domain frame covering many palaces does not auto-activate all natal stars", () => {
    const base = calculateNamPhai(REGRESSION);
    const loaded = loadAnnualAxesKnowledgeV04NamPhai();
    if (!loaded.ok) throw new Error("v0.4 knowledge invalid");

    const careerCoverage = domainFrameCoverage(base, loaded.knowledge, "career");
    expect(careerCoverage.uniquePhysicalPalaceCount).toBeGreaterThan(4);

    // Strip annual moving/mutagen layers so only head-TP4C natal triggers remain.
    const chart: ChartData = {
      ...base,
      annualStars: [],
      annualMutagens: [],
      majorMutagens: [],
      natalMutagens: [],
    };
    const headIdx = chart.annualHeadPalace?.index ?? -1;
    const headIndexes = new Set([
      headIdx,
      (headIdx + 6) % 12,
      (headIdx + 4) % 12,
      (headIdx + 8) % 12,
    ]);

    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const axis = result.axes.career;
    expect(axis.status).toBe("available");
    if (axis.status !== "available") return;

    const natalStarEvidence = axis.evidence.filter((e) => e.physicalFactId.startsWith("natal-star:"));
    const natalStarPalaces = new Set(natalStarEvidence.map((e) => e.targetPalaceIndex));
    for (const idx of natalStarPalaces) {
      expect(headIndexes.has(idx)).toBe(true);
    }
    expect(natalStarPalaces.size).toBeLessThan(careerCoverage.uniquePhysicalPalaceCount);
  });

  it("identical charts are byte-stable; different annual years change scores or head", () => {
    const a = analyzeAnnualAxes(calculateNamPhai({ ...REGRESSION, annualYear: "2026" }), {
      school: "nam-phai",
    });
    const b = analyzeAnnualAxes(calculateNamPhai({ ...REGRESSION, annualYear: "2026" }), {
      school: "nam-phai",
    });
    const c = analyzeAnnualAxes(calculateNamPhai({ ...REGRESSION, annualYear: "2027" }), {
      school: "nam-phai",
    });

    expect(JSON.stringify(a.axes)).toBe(JSON.stringify(b.axes));
    const sameScores =
      ANNUAL_AXIS_DOMAINS.every((d) => a.axes[d].score === c.axes[d].score) &&
      a.annualFocus?.palaceIndex === c.annualFocus?.palaceIndex;
    expect(sameScores).toBe(false);
  });
});
