import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV0 } from "../../../knowledge/annual-axes";
import { aggregateDomainEvidence } from "../aggregate";
import type { AnnualAxisEvidence } from "../types";

function makeEvidence(overrides: Partial<AnnualAxisEvidence>): AnnualAxisEvidence {
  return {
    id: "test",
    domain: "health",
    layer: "annual",
    category: "star",
    physicalFactId: "star:0:Test",
    ruleId: "RULE-TEST",
    targetPalaceIndex: 0,
    targetPalaceName: "Mệnh",
    targetAnnualPalaceName: "Mệnh",
    frameRole: "focus",
    anchorPalaceName: "Mệnh",
    stackingGroup: "test-group",
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    factIds: ["star:0:Test"],
    sourceIds: ["SRC-TEST"],
    knowledgeStatus: "experimental",
    ...overrides,
  };
}

describe("aggregateDomainEvidence", () => {
  const loaded = loadAnnualAxesKnowledgeV0();
  if (!loaded.ok) throw new Error("annual axes knowledge failed to load");
  const profile = loaded.knowledge.scoringProfile;

  it("keeps only the highest-effective-weight candidate when the same physical fact reaches a domain via two anchors", () => {
    const weaker = makeEvidence({
      anchorPalaceName: "Mệnh",
      effectiveWeight: 0.3,
      frameRole: "trine",
    });
    const stronger = makeEvidence({
      anchorPalaceName: "Tật Ách",
      effectiveWeight: 0.7,
      frameRole: "opposite",
    });

    const result = aggregateDomainEvidence([weaker, stronger], profile);

    expect(result).toHaveLength(1);
    expect(result[0]?.anchorPalaceName).toBe("Tật Ách");
    expect(result[0]?.frameRole).toBe("opposite");
  });

  it("applies inverse-square-root diminishing returns within the same layer+stackingGroup, ranked by base weight then physicalFactId", () => {
    const a = makeEvidence({ physicalFactId: "star:0:A", factIds: ["star:0:A"], effectiveWeight: 1 });
    const b = makeEvidence({ physicalFactId: "star:0:B", factIds: ["star:0:B"], effectiveWeight: 1 });
    const c = makeEvidence({ physicalFactId: "star:0:C", factIds: ["star:0:C"], effectiveWeight: 1 });

    const result = aggregateDomainEvidence([a, b, c], profile);
    const byFactId = new Map(result.map((e) => [e.physicalFactId, e]));

    const baseWeight =
      1 * profile.frameRoleWeights.focus * profile.layerWeights.annual * profile.confidenceWeights.experimental;

    expect(byFactId.get("star:0:A")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(1), 10);
    expect(byFactId.get("star:0:B")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(2), 10);
    expect(byFactId.get("star:0:C")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(3), 10);
  });

  it("ranks separately per stackingGroup — two isolated groups both start at rank 1", () => {
    const a = makeEvidence({
      physicalFactId: "star:0:A",
      factIds: ["star:0:A"],
      stackingGroup: "group-a",
    });
    const b = makeEvidence({
      physicalFactId: "star:0:B",
      factIds: ["star:0:B"],
      stackingGroup: "group-b",
    });

    const result = aggregateDomainEvidence([a, b], profile);
    const baseWeight =
      1 * profile.frameRoleWeights.focus * profile.layerWeights.annual * profile.confidenceWeights.experimental;

    for (const e of result) {
      expect(e.effectiveWeight).toBeCloseTo(baseWeight, 10);
    }
  });

  it("scales weightedAxes by the final effectiveWeight", () => {
    const a = makeEvidence({
      rawAxes: { support: 2, pressure: 1, stability: 0.5, activation: 3 },
    });
    const result = aggregateDomainEvidence([a], profile);
    const e = result[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.weightedAxes.support).toBeCloseTo(2 * e.effectiveWeight, 10);
    expect(e.weightedAxes.pressure).toBeCloseTo(1 * e.effectiveWeight, 10);
    expect(e.weightedAxes.stability).toBeCloseTo(0.5 * e.effectiveWeight, 10);
    expect(e.weightedAxes.activation).toBeCloseTo(3 * e.effectiveWeight, 10);
  });
});
