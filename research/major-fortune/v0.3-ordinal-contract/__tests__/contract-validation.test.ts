/**
 * Research-pack smoke validation for Major Fortune V0.3 ordinal contract.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.3-ordinal";
import { getAnalysisStatus } from "../../../../src/lib/ziwei/analysis/contracts/common";

const PACK = join(__dirname, "..");

describe("major-fortune v0.3 ordinal research pack", () => {
  it("has required decision artifacts", () => {
    expect(existsSync(join(PACK, "README.md"))).toBe(true);
    expect(existsSync(join(PACK, "V0.3-ORDINAL-CONTRACT-DECISION.md"))).toBe(true);
    expect(existsSync(join(PACK, "reports/decision.json"))).toBe(true);
    const decision = JSON.parse(readFileSync(join(PACK, "reports/decision.json"), "utf8"));
    expect(decision.readinessDecision).toBe("ORDINAL_CONTRACT_READY_FOR_ADAPTER");
    expect(decision.modelNature).toBe("engineering-heuristic");
  });

  it("keeps V0.2 historical posture untouched in decision notes", () => {
    const decision = JSON.parse(readFileSync(join(PACK, "reports/decision.json"), "utf8"));
    expect(decision.v02HistoricalDecisionsUnchanged.readiness).toBe("RESEARCH_INCOMPLETE");
    expect(decision.v02HistoricalDecisionsUnchanged.candidateEligibleFamilies).toBe(0);
    expect(decision.v02HistoricalDecisionsUnchanged.eligibleShapeFragments).toBe(0);
  });

  it("loads knowledge and exposes production major-fortune available 0.3.1", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    expect(loaded.ok).toBe(true);
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.1",
    });
  });
});
