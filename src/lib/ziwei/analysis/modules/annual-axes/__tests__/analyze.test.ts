import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { analyzeAnnualAxes, resolveModuleStatus } from "../analyze";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

// Trung Châu's Calculation Core is the engine that currently populates
// `palace.annualPalaceName` (see engine-trung-chau.ts — "trùng bài" annual
// relabeling is a Trung Châu-specific concept, per the comment above
// `majorPalaceName`/`annualPalaceName` in src/types/chart.ts). Nam Phái's
// engine never sets this field. Under V0.2 Nam Phái resolves domains
// against natal `palace.name` via its own resolver — Nam Phái coverage is
// asserted in the dedicated block below rather than via the shared TC block.
describe("analyzeAnnualAxes — domain resolution (Trung Châu chart, real annual structure)", () => {
  it("returns an available result covering all six domains with bounded scores and non-empty evidence", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });

    expect(result.status).toBe("available");
    expect(Object.keys(result.axes).sort()).toEqual([...ANNUAL_AXIS_DOMAINS].sort());
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);
      expect(["guarded", "balanced", "supportive", "strong"]).toContain(axis.band);
      expect(axis.evidence.length).toBeGreaterThan(0);
    }
  });

  it("never leaves a cross-anchor physical fact duplicated in the final evidence list", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      const identities = axis.evidence.map(
        (e) => `${e.layer}|${e.category}|${e.physicalFactId}|${e.ruleId}|${e.targetPalaceIndex}`,
      );
      expect(new Set(identities).size).toBe(identities.length);
    }
  });

  it("every evidence item carries full provenance", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });

    let total = 0;
    let sawDistinctAnchorAndTarget = false;
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      for (const e of result.axes[domain].evidence) {
        total += 1;
        expect(e.physicalFactId).toBeTruthy();
        expect(e.ruleId).toBeTruthy();
        expect(e.sourceIds.length).toBeGreaterThan(0);
        expect(e.factIds.length).toBeGreaterThan(0);
        expect(e.targetAnnualPalaceName).toBeTruthy();
        if (e.frameRole !== "focus" && e.targetAnnualPalaceName !== e.anchorPalaceName) {
          sawDistinctAnchorAndTarget = true;
        }
      }
    }
    expect(total).toBeGreaterThan(0);
    // Regression guard for the anchorPalaceName provenance bug: on a real
    // chart, at least one opposite/trine evidence item must carry a
    // targetAnnualPalaceName different from its anchor's label.
    expect(sawDistinctAnchorAndTarget).toBe(true);
  });

  it("module source tree never reads Palace Overview's normalized 12-palace score", () => {
    const root = join(process.cwd(), "src/lib/ziwei/analysis/modules/annual-axes");
    const files = [
      "collect-domain-frames.ts",
      "collect-star-evidence.ts",
      "collect-mutagen-evidence.ts",
      "collect-focal-evidence.ts",
      "collect-annual-focus-evidence.ts",
      "build-annual-focus-frame.ts",
      "aggregate.ts",
      "normalize.ts",
      "analyze.ts",
    ];
    const forbidden = ["PalaceOverviewResult", "analyzeAllPalaces", "analyzePalace", ".score" + "Band"];
    for (const file of files) {
      const text = readFileSync(join(root, file), "utf8");
      for (const token of forbidden) {
        expect(text.includes(token), `${file} contains ${token}`).toBe(false);
      }
    }
  });

  it("does not mutate the input chart", () => {
    const chart = calculateTrungChau(REGRESSION);
    const before = structuredClone(chart);
    analyzeAnnualAxes(chart, { school: "trung-chau" });
    expect(chart).toEqual(before);
  });

  it("does not mutate the loaded knowledge object across repeated calls", () => {
    const chart = calculateTrungChau(REGRESSION);
    const a = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const b = analyzeAnnualAxes(chart, { school: "trung-chau" });
    expect(a).toEqual(b);
  });
});

describe("analyzeAnnualAxes — Nam Phái V0.8 production default", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("defaults to V0.8 palace-weighted core with score traces", () => {
    const chart = calculateNamPhai(REGRESSION);
    expect(chart.palaces.every((p) => p.annualPalaceName === undefined)).toBe(true);
    expect(chart.annualHeadPalace).toBeTruthy();

    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });

    expect(result.status).not.toBe("unavailable");
    expect(result.versions.engineVersion).toBe("0.8.0");
    expect(result.capabilities.domainAnchorCoordinate).toBe("natal-palace-name");
    expect(result.capabilities.domainAnchorProvenance).toBe("nam-phai-luu-nien-palace-mapping");
    expect(result.capabilities.primaryAnnualFocus).toBe("annual-major-fortune");
    expect(result.capabilities.supportsDomainScoring).toBe(true);
    expect(result.annualFocus).not.toBeNull();
    expect(result.annualFocus?.mode).toBe("annual-major-fortune");

    const availableDomains = ANNUAL_AXIS_DOMAINS.filter(
      (d) => result.axes[d].status === "available",
    );
    expect(availableDomains.length).toBeGreaterThan(0);

    for (const domain of availableDomains) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);
      expect(axis.annualDelta).toBeDefined();
      expect(axis.scoreTrace?.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
      if (axis.scoreTrace?.formulaVersion === "v0.8-annual-palace-weighted-score") {
        expect(axis.scoreTrace.absoluteScore).toBe(axis.score);
      }
    }
  });

  it("honors V08=0 rollback to V0.7", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV08=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(result.versions.engineVersion).toBe("0.7.0");
  });
});

// Under V0.2 Nam Phái *does* resolve domain frames (natal-name resolver)
// AND both engines set `isSmallLimitPalace`, so Nam Phái legitimately
// exercises the small-limit focal marker path end-to-end. This test
// pair guards the school-forbidden marker: Trung Châu must never emit
// small-limit evidence, regardless of chart shape.
describe("analyzeAnnualAxes — school-specific focal markers", () => {
  it("Trung Châu never emits small-limit evidence", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const smallLimitMarkers = result.axes[domain].evidence.filter(
        (e) => e.category === "focal-marker" && e.physicalFactId.includes("small-limit"),
      );
      expect(smallLimitMarkers).toHaveLength(0);
    }
  });
});

describe("analyzeAnnualAxes — temporal behavior", () => {
  it("changes results when annualYear changes", () => {
    const a = analyzeAnnualAxes(calculateTrungChau({ ...REGRESSION, annualYear: "2026" }), {
      school: "trung-chau",
    });
    const b = analyzeAnnualAxes(calculateTrungChau({ ...REGRESSION, annualYear: "2027" }), {
      school: "trung-chau",
    });

    const flatten = (r: typeof a) =>
      ANNUAL_AXIS_DOMAINS.map((d) => ({
        score: r.axes[d].score,
        evidenceIds: r.axes[d].evidence.map((e) => e.id).sort(),
      }));

    expect(flatten(a)).not.toEqual(flatten(b));
  });

  it("is byte-stable for identical input", () => {
    const a = analyzeAnnualAxes(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    const b = analyzeAnnualAxes(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    expect(a).toEqual(b);
  });
});

describe("resolveModuleStatus", () => {
  it("is available only when every domain is available", () => {
    expect(resolveModuleStatus(["available", "available", "available"])).toBe("available");
  });

  it("is unavailable only when every domain is unavailable", () => {
    expect(resolveModuleStatus(["unavailable", "unavailable"])).toBe("unavailable");
  });

  it("is partial for any mix of available and unavailable domains", () => {
    expect(resolveModuleStatus(["available", "unavailable"])).toBe("partial");
    expect(resolveModuleStatus(["unavailable", "available", "available"])).toBe("partial");
  });
});
