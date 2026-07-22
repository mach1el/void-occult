import { describe, expect, it } from "vitest";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../../../knowledge/annual-axes/v0.8";
import { buildRuleCoverageV09 } from "../rule-coverage";
import type { AnnualAxesEvidenceFactRecordV09 } from "../corpus-collection";

function emptyAxis() {
  return { positive: [], negative: [] };
}

function fixtureKnowledge(): AnnualAxesKnowledgeV08NamPhai {
  return {
    starRegistry: {
      schemaVersion: "0.8.0",
      catalogId: "test",
      axes: {
        health: {
          positive: [
            { starName: "Star Observed", pointClass: "staticPositive", ruleId: "health-pos-observed", polarity: "positive", allowedTemporalLayers: ["annual"] },
            { starName: "Star Never", pointClass: "staticPositive", ruleId: "health-pos-never", polarity: "positive", allowedTemporalLayers: ["annual"] },
            { starName: "Star Zero Contribution", pointClass: "staticPositive", ruleId: "health-pos-zero", polarity: "positive", allowedTemporalLayers: ["annual"] },
          ],
          negative: [],
        },
        family: emptyAxis(),
        wealth: emptyAxis(),
        career: emptyAxis(),
        social: emptyAxis(),
        romance: emptyAxis(),
      },
      sourceIds: [],
    },
    starCapabilities: {
      schemaVersion: "0.8.0",
      catalogId: "test",
      capabilities: [
        { exactStarName: "Star Observed", temporalLayer: "annual", supportStatus: "supported", producer: "engine.ts#emit", rationale: "test", sourceIds: [] },
        { exactStarName: "Star Never", temporalLayer: "annual", supportStatus: "supported", producer: "engine.ts#emit", rationale: "test", sourceIds: [] },
        { exactStarName: "Star Zero Contribution", temporalLayer: "annual", supportStatus: "supported", producer: "engine.ts#emit", rationale: "test", sourceIds: [] },
        { exactStarName: "Lưu Đại Hao", temporalLayer: "annual", supportStatus: "unsupported", rationale: "no producer", sourceIds: [] },
      ],
      sourceIds: [],
    },
  } as unknown as AnnualAxesKnowledgeV08NamPhai;
}

describe("annual axes v0.9 rule coverage", () => {
  it("counts an observed rule as observed with correct mass", () => {
    const knowledge = fixtureKnowledge();
    const facts: AnnualAxesEvidenceFactRecordV09[] = [
      { chartId: "c0", annualYear: 2020, domain: "health", ruleId: "health-pos-observed", starName: "Star Observed", palaceRole: "primary", polarity: "positive", pointValue: 1, weightedContribution: 0.6, temporalLayer: "annual" },
    ];
    // 1 match out of a 10-observation corpus → 10% ratio → "observed" (>=1%).
    const records = buildRuleCoverageV09(knowledge, facts, 10);
    const observed = records.find((r) => r.ruleId === "health-pos-observed")!;
    expect(observed.coverageStatus).toBe("observed");
    expect(observed.corpusMatchCount).toBe(1);
    expect(observed.chartMatchCount).toBe(1);
    expect(observed.totalWeightedContribution).toBeCloseTo(0.6, 5);
    expect(observed.primaryPalaceMatchCount).toBe(1);
    expect(observed.activeInProduction).toBe(true);
  });

  it("classifies a rule with zero corpus matches as never-observed, not unreachable, when its capability is supported", () => {
    const knowledge = fixtureKnowledge();
    const records = buildRuleCoverageV09(knowledge, [], 1200);
    const never = records.find((r) => r.ruleId === "health-pos-never")!;
    expect(never.coverageStatus).toBe("never-observed");
    expect(never.corpusMatchCount).toBe(0);
  });

  it("distinguishes a rule that matched but contributed zero weighted mass", () => {
    const knowledge = fixtureKnowledge();
    const facts: AnnualAxesEvidenceFactRecordV09[] = [
      { chartId: "c0", annualYear: 2020, domain: "health", ruleId: "health-pos-zero", starName: "Star Zero Contribution", palaceRole: "cooperating", polarity: "positive", pointValue: 1, weightedContribution: 0, temporalLayer: "annual" },
    ];
    const records = buildRuleCoverageV09(knowledge, facts, 1200);
    const zero = records.find((r) => r.ruleId === "health-pos-zero")!;
    expect(zero.corpusMatchCount).toBe(1);
    expect(zero.totalWeightedContribution).toBe(0);
    expect(zero.coverageStatus).toBe("rare"); // matched, but 1/1200 < 1% threshold
  });

  it("marks a rule as rare rather than observed when below the 1% ratio threshold", () => {
    const knowledge = fixtureKnowledge();
    const facts: AnnualAxesEvidenceFactRecordV09[] = [
      { chartId: "c0", annualYear: 2020, domain: "health", ruleId: "health-pos-observed", starName: "Star Observed", palaceRole: "primary", polarity: "positive", pointValue: 1, weightedContribution: 0.6, temporalLayer: "annual" },
    ];
    const records = buildRuleCoverageV09(knowledge, facts, 1200); // 1/1200 < 1%
    const rare = records.find((r) => r.ruleId === "health-pos-observed")!;
    expect(rare.coverageStatus).toBe("rare");
  });

  it("produces unique rule IDs", () => {
    const knowledge = fixtureKnowledge();
    const records = buildRuleCoverageV09(knowledge, [], 1200);
    const ids = records.map((r) => r.ruleId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
