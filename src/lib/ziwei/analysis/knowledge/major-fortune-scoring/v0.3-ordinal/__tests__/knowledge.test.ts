import { describe, expect, it } from "vitest";
import {
  loadMajorFortuneOrdinalKnowledge,
  validateBandContinuity,
  validateMajorFortuneOrdinalKnowledge,
  MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS,
} from "../index";

describe("Major Fortune V0.3 ordinal knowledge", () => {
  it("loads and validates the ordinal contract", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const v = validateMajorFortuneOrdinalKnowledge(loaded.knowledge as never);
    expect(v.ok).toBe(true);
  });

  it("declares engineering-heuristic governance", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) throw new Error("load failed");
    expect(loaded.knowledge.governance.modelNature).toBe("engineering-heuristic");
    expect(loaded.knowledge.governance.doctrineRelationship).toBe(
      "doctrine-informed-not-classical-reconstruction",
    );
    expect(loaded.knowledge.governance.numericAuthority).toBe("engineering-defined");
    expect(loaded.knowledge.governance.productionStatus).toBe("research-only");
    expect(loaded.knowledge.governance.notClaims).toContain("restored-classical-formula");
  });

  it("has budgets summing to 100 with required caps", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) throw new Error("load failed");
    const sum = loaded.knowledge.formula.pillars.reduce((s, p) => s + p.budget, 0);
    expect(sum).toBe(100);
    for (const [id, budget] of Object.entries(MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS)) {
      const pillar = loaded.knowledge.formula.pillars.find((p) => p.pillarId === id);
      expect(pillar?.budget).toBe(budget);
    }
  });

  it("forbids per-rule rawDelta and claims no classical band authority", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) throw new Error("load failed");
    expect(loaded.knowledge.formula.derivation.forbidsPerRuleRawDelta).toBe(true);
    expect(loaded.knowledge.bands.classicalAuthorityClaimed).toBe(false);
    expect(validateBandContinuity(loaded.knowledge.bands.bands as never)).toEqual([]);
  });

  it("excludes annual/monthly and marks yearInCycle metadata-only", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) throw new Error("load failed");
    expect(loaded.knowledge.exclusionRegistry.excludedTemporalScopes).toEqual(
      expect.arrayContaining(["annual", "monthly"]),
    );
    expect(loaded.knowledge.exclusionRegistry.metadataOnlyFields).toContain("yearInCycle");
  });
});
