import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import { validateFixture } from "../validate-fixture";
import { validateOntology } from "../validate-ontology";
import { scanHardCodedPrNumbers } from "../pr-number-scan";
import { scanForbiddenScoringKeys } from "../numeric-key-scan";
import type { HuyenKhiExpertFixture } from "../types";

function planned(): HuyenKhiExpertFixture {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) throw new Error("expected load");
  return loaded.ontology.fixturePlan.fixtures[0]!;
}

describe("Huyền Khí ontology — fixture maturity (G)", () => {
  it("planned templates may be incomplete synthetic scenarios", () => {
    expect(validateFixture(planned(), "plan", 0).filter((i) => i.code === "maturity-incomplete")).toEqual([]);
  });

  it("research-ready requires non-empty facts, question, sources and evidence", () => {
    const incomplete: HuyenKhiExpertFixture = { ...planned(), maturity: "research-ready" };
    const issues = validateFixture(incomplete, "plan", 0).filter((i) => i.code === "maturity-incomplete");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("a complete research-ready fixture passes maturity checks", () => {
    const complete: HuyenKhiExpertFixture = {
      ...planned(),
      maturity: "research-ready",
      inputFacts: { majorStars: ["Tử Vi"], brightness: "Miếu" },
      researchQuestion: "Which dimensions change under Miếu Tử Vi?",
      candidateSourceIds: ["HK-SRC-CLASSIC-001"],
      expectedEvidence: ["locator-verified brightness claim"],
    };
    expect(validateFixture(complete, "plan", 0).filter((i) => i.code === "maturity-incomplete")).toEqual([]);
  });

  it("reviewable additionally requires rationale and proposed expectations", () => {
    const notQuite: HuyenKhiExpertFixture = {
      ...planned(),
      maturity: "reviewable",
      inputFacts: { majorStars: ["Tử Vi"] },
      researchQuestion: "q",
      candidateSourceIds: ["HK-SRC-CLASSIC-001"],
      expectedEvidence: ["e"],
      // missing rationale + expectations
    };
    expect(validateFixture(notQuite, "plan", 0).some((i) => i.code === "maturity-incomplete")).toBe(true);
  });

  it("the count gate is named so templates cannot imply approval", () => {
    const loaded = loadHuyenKhiOntology();
    if (!loaded.ok) throw new Error("expected load");
    const gates = loaded.ontology.releaseGates.hardGates;
    expect(gates).toHaveProperty("fixtureTemplateCountMin");
    expect(gates).not.toHaveProperty("fixtureScenarioCountMin");
    const promo = loaded.ontology.releaseGates.symbolicEvaluatorPhasePromotionGates;
    expect(promo).toHaveProperty("approvedExpertFixtureCountMin");
  });
});

describe("Huyền Khí ontology — hygiene (B, C)", () => {
  it("B: no hard-coded PR number in ontology data or docs", () => {
    const hits = scanHardCodedPrNumbers();
    expect(hits).toEqual([]);
    expect(validateOntology().summary.hardCodedPrNumberCount).toBe(0);
  });

  it("C: every dimension declares an ApexVoid engineered-construct epistemic status", () => {
    const loaded = loadHuyenKhiOntology();
    if (!loaded.ok) throw new Error("expected load");
    for (const spec of Object.values(loaded.ontology.symbolicDimensions.dimensions)) {
      expect(spec.epistemicStatus).toBe("apexvoid-engineered-construct");
      expect(spec.aggregationDeferred).toBe(true);
      expect(spec.numericMappingForbidden).toBe(true);
      expect(spec.nonClaims.length).toBeGreaterThan(0);
      expect(spec.observableIndicators.length).toBeGreaterThan(0);
    }
  });

  it("C: tendency explicitly disclaims the old support/pressure axis", () => {
    const loaded = loadHuyenKhiOntology();
    if (!loaded.ok) throw new Error("expected load");
    const tendency = loaded.ontology.symbolicDimensions.dimensions.tendency;
    expect(tendency.nonClaims.some((n) => /support\/pressure/i.test(n))).toBe(true);
  });

  it("new artifacts carry no forbidden scoring key", () => {
    const loaded = loadHuyenKhiOntology();
    if (!loaded.ok) throw new Error("expected load");
    const o = loaded.ontology;
    for (const value of [
      o.dimensionOperationCompatibility,
      o.claimProvenancePolicy,
      o.sourceWitnessMatrix,
      o.fixtureMaturityPolicy,
      o.researchTopicCoverage,
    ]) {
      expect(scanForbiddenScoringKeys(value)).toEqual([]);
    }
  });
});
