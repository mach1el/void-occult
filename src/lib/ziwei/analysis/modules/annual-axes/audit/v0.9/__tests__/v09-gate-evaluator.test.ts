import { describe, expect, it } from "vitest";
import { evaluateGatesV09, type GateCatalogV08 } from "../gate-evaluator";
import { computeV09ResearchArtifacts, FAST_CORPUS_CONTRACT } from "../write-research-artifacts";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../../../knowledge/annual-axes/v0.8";

function baseCatalog(hardGates: Record<string, number>): GateCatalogV08 {
  return { schemaVersion: "0.8.0", catalogId: "test-catalog", hardGates, sourceIds: [] };
}

describe("annual axes v0.9 gate evaluator", () => {
  it("passes a minimum gate when the actual meets the threshold", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const catalog = baseCatalog({ meanIntraYearAxisStandardDeviationMin: -1000 });
    const result = evaluateGatesV09(catalog, artifacts.metrics);
    expect(result.evaluations).toHaveLength(1);
    expect(result.evaluations[0]!.status).toBe("passed");
    expect(result.evaluations[0]!.operator).toBe("minimum");
  });

  it("fails a minimum gate when the actual is below the threshold", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const catalog = baseCatalog({ meanIntraYearAxisStandardDeviationMin: 100000 });
    const result = evaluateGatesV09(catalog, artifacts.metrics);
    expect(result.evaluations[0]!.status).toBe("failed");
    expect(result.evaluations[0]!.passed).toBe(false);
  });

  it("passes a maximum gate when the actual is at or below the threshold", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const catalog = baseCatalog({ unavailableRateMax: 1 });
    const result = evaluateGatesV09(catalog, artifacts.metrics);
    expect(result.evaluations[0]!.status).toBe("passed");
    expect(result.evaluations[0]!.operator).toBe("maximum");
  });

  it("fails a maximum gate when the actual exceeds the threshold", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const catalog = baseCatalog({ unavailableRateMax: -1 });
    const result = evaluateGatesV09(catalog, artifacts.metrics);
    expect(result.evaluations[0]!.status).toBe("failed");
  });

  it("flags an unknown configured metric instead of silently ignoring it", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const catalog = baseCatalog({ thisMetricDoesNotExistMax: 1 });
    const result = evaluateGatesV09(catalog, artifacts.metrics);
    expect(result.unknownConfiguredGateKeys).toEqual(["thisMetricDoesNotExistMax"]);
    expect(result.evaluations[0]!.status).toBe("not-computable");
    expect(result.evaluations[0]!.passed).toBe(false);
  });

  it("fails a gate whose metric value is NaN", () => {
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const brokenMetrics = { ...artifacts.metrics, unavailableRate: Number.NaN };
    const catalog = baseCatalog({ unavailableRateMax: 1 });
    const result = evaluateGatesV09(catalog, brokenMetrics);
    expect(result.evaluations[0]!.status).toBe("not-computable");
  });

  it("evaluates every configured gate in the real V0.8 catalog exactly once (or once per domain)", () => {
    const knowledgeResult = loadAnnualAxesKnowledgeV08NamPhai();
    expect(knowledgeResult.ok).toBe(true);
    if (!knowledgeResult.ok) return;
    const artifacts = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const result = evaluateGatesV09(knowledgeResult.knowledge.distributionGates, artifacts.metrics);
    expect(result.unknownConfiguredGateKeys).toEqual([]);
    expect(result.allConfiguredGatesEvaluated).toBe(true);
    // 16 global gates + 2 per-domain gates × 6 domains = 28.
    expect(result.evaluations).toHaveLength(28);
  });
});
