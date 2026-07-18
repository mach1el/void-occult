import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { MAJOR_FORTUNE_DOMAINS } from "../../../contracts/major-fortune";
import { analyzeMajorFortune } from "../analyze";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("analyzeMajorFortune — domain resolution (Trung Châu chart)", () => {
  it("returns overall + all twelve domains available, with bounded scores and non-empty evidence", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });

    expect(result.status).toBe("available");
    expect(result.domainsStatus).toBe("available");
    expect(result.overall.status).toBe("available");
    if (result.overall.status !== "available") return;
    expect(result.overall.score).toBeGreaterThanOrEqual(0);
    expect(result.overall.score).toBeLessThanOrEqual(100);
    expect(result.overall.evidence.length).toBeGreaterThan(0);

    for (const domain of MAJOR_FORTUNE_DOMAINS) {
      const axis = result.domains[domain];
      expect(axis).toBeDefined();
      expect(axis?.status).toBe("available");
    }
  });

  it("never leaves a cross-frame physical fact duplicated in the final evidence list", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    if (result.overall.status !== "available") throw new Error("expected available overall");

    const identities = result.overall.evidence.map(
      (e) => `${e.category}|${e.physicalFactId}|${e.ruleId}|${e.targetPalaceIndex}`,
    );
    expect(new Set(identities).size).toBe(identities.length);
  });

  it("every evidence item carries full provenance, preserving both natal and Major Fortune palace names", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    if (result.overall.status !== "available") throw new Error("expected available overall");

    let sawDistinctNatalAndMajor = false;
    for (const e of result.overall.evidence) {
      expect(e.physicalFactId).toBeTruthy();
      expect(e.ruleId).toBeTruthy();
      expect(e.sourceIds.length).toBeGreaterThan(0);
      expect(e.factIds.length).toBeGreaterThan(0);
      expect(e.targetNatalPalaceName).toBeTruthy();
      if (e.targetMajorPalaceName && e.targetMajorPalaceName !== e.targetNatalPalaceName) {
        sawDistinctNatalAndMajor = true;
      }
    }
    expect(sawDistinctNatalAndMajor).toBe(true);
  });

  it("never emits interaction-category evidence (disabled rules stay diagnostic-only)", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    if (result.overall.status !== "available") throw new Error("expected available overall");

    expect(result.overall.evidence.some((e) => e.category === "interaction")).toBe(false);
  });

  it("reports split version provenance (capability ≠ calculation policy)", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(result.versions.contractVersion).toBe("0.1.0");
    expect(result.versions.engineVersion).toBe("0.1.0");
    expect(result.versions.scoringKnowledgeVersion).toContain("major-fortune-scoring");
    expect(result.versions.capabilityProfileVersion).toContain("major-fortune-school-capabilities");
    expect(result.versions.calculationPolicyProfileVersion).toBeNull();
    expect(result.diagnostics.missingCalculationPolicyProfile.length).toBeGreaterThan(0);
  });

  it("does not falsely report Palace Overview star source IDs as missing", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(result.diagnostics.missingSourceIds).toEqual([]);
  });

  it("module source tree never reads Palace Overview's normalized 12-palace score", () => {
    const root = join(process.cwd(), "src/lib/ziwei/analysis/modules/major-fortune");
    const files = [
      "collect-major-frames.ts",
      "collect-star-evidence.ts",
      "collect-transformation-evidence.ts",
      "collect-structural-evidence.ts",
      "aggregate.ts",
      "normalize.ts",
      "resolve-context.ts",
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
    analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(chart).toEqual(before);
  });

  it("is byte-stable for identical input", () => {
    const a = analyzeMajorFortune(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    const b = analyzeMajorFortune(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    expect(a).toEqual(b);
  });
});

describe("analyzeMajorFortune — school profiles", () => {
  it("Nam Phái: overall available with star/structural evidence, domains unavailable (partial status), zero transformation evidence", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "nam-phai" });

    expect(result.status).toBe("partial");
    expect(result.domainsStatus).toBe("unavailable");
    expect(Object.keys(result.domains)).toHaveLength(0);
    expect(result.overall.status).toBe("available");
    if (result.overall.status !== "available") return;

    expect(result.overall.evidence.some((e) => e.category === "star")).toBe(true);
    expect(result.overall.evidence.some((e) => e.category === "structural-activation")).toBe(true);
    expect(result.overall.evidence.some((e) => e.category === "transformation")).toBe(false);
    expect(result.capabilities.supportsMajorFortuneTransformations).toBe(false);
    expect(result.capabilities.supportsTwelveDomainOverlay).toBe(false);
  });

  it("Nam Phái: does not falsely report Palace Overview star source IDs as missing", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "nam-phai" });
    expect(result.diagnostics.missingSourceIds).toEqual([]);
  });

  it("preserves static school capabilities when globally unavailable (no active decade)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const stripped = structuredClone(chart);
    stripped.majorFortunePalace = null;
    const result = analyzeMajorFortune(stripped, { school: "nam-phai" });
    expect(result.status).toBe("unavailable");
    expect(result.capabilities.supportsOverallFrame).toBe(true);
    expect(result.capabilities.supportsTwelveDomainOverlay).toBe(false);
    expect(result.capabilities.supportsMajorFortuneTransformations).toBe(false);
  });

  it("Trung Châu: accepts exact-target Major Fortune transformations", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });

    expect(result.capabilities.supportsMajorFortuneTransformations).toBe(true);
    // The overall frame only covers 4 of the 12 palaces for this decade —
    // a transformation target may legitimately fall outside it. Check
    // across all twelve domains (which together cover every palace) for at
    // least one exact-target transformation hit instead.
    const domainTransformationCount = Object.values(result.domains)
      .filter((d) => d?.status === "available")
      .flatMap((d) => (d?.status === "available" ? d.evidence : []))
      .filter((e) => e.category === "transformation").length;
    expect(domainTransformationCount).toBeGreaterThan(0);
  });
});

describe("analyzeMajorFortune — independence from annualYear", () => {
  it("is byte-identical when only annualYear changes", () => {
    const a = analyzeMajorFortune(calculateTrungChau({ ...REGRESSION, annualYear: "2026" }), {
      school: "trung-chau",
    });
    const b = analyzeMajorFortune(calculateTrungChau({ ...REGRESSION, annualYear: "2027" }), {
      school: "trung-chau",
    });
    expect(a).toEqual(b);
  });

  it("logs the presence of forbidden annual facts without letting them change the score", () => {
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeMajorFortune(chart, { school: "trung-chau" });
    expect(result.diagnostics.forbiddenAnnualFacts.length).toBeGreaterThan(0);
  });

  it("period phase is metadata only — entry/core/exit never change the numeric result", () => {
    const chart = calculateTrungChau(REGRESSION);
    const entry = analyzeMajorFortune(chart, { school: "trung-chau", yearInCycle: 1 });
    const core = analyzeMajorFortune(chart, { school: "trung-chau", yearInCycle: 5 });
    const exit = analyzeMajorFortune(chart, { school: "trung-chau", yearInCycle: 10 });

    expect(entry.periodPhase).toEqual({ phaseId: "entry" });
    expect(core.periodPhase).toEqual({ phaseId: "core" });
    expect(exit.periodPhase).toEqual({ phaseId: "exit" });

    const strip = (r: typeof entry) => ({ ...r, periodPhase: null });
    expect(strip(entry)).toEqual(strip(core));
    expect(strip(core)).toEqual(strip(exit));
  });
});
