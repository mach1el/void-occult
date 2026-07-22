import { describe, expect, it } from "vitest";
import { computeV09ResearchArtifacts, FAST_CORPUS_CONTRACT } from "../write-research-artifacts";

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v instanceof Set) return [...v].sort();
    if (v instanceof Map) return Object.fromEntries(v);
    return v;
  });
}

describe("annual axes v0.9 determinism", () => {
  it("produces byte-identical research artifacts across repeated runs", () => {
    const first = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    const second = computeV09ResearchArtifacts(FAST_CORPUS_CONTRACT);
    expect(stableStringify(second.metrics)).toBe(stableStringify(first.metrics));
    expect(stableStringify(second.gateEvaluation)).toBe(stableStringify(first.gateEvaluation));
    expect(stableStringify(second.ruleCoverage)).toBe(stableStringify(first.ruleCoverage));
    expect(stableStringify(second.capabilityCoverage)).toBe(stableStringify(first.capabilityCoverage));
    expect(stableStringify(second.contributionMass)).toBe(stableStringify(first.contributionMass));
    expect(stableStringify(second.noSignalAnalysis)).toBe(stableStringify(first.noSignalAnalysis));
  });
});
