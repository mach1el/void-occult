import { describe, expect, it } from "vitest";
import {
  loadMajorFortuneOrdinalKnowledge,
  MAJOR_FORTUNE_ORDINAL_PILLAR_IDS,
  type MajorFortuneOrdinalKnowledge,
  type MajorFortuneOrdinalPillarId,
} from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { evaluateMajorFortuneOrdinal } from "../evaluate";
import { clampOrdinalLevel } from "../classify";
import type {
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalEvaluationInput,
  MajorFortuneOrdinalPillarContext,
} from "../types";
import { getAnalysisStatus } from "../../../../contracts/common";

function allAvailable(): Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarContext> {
  return {
    "thien-thoi": { availability: "available" },
    "dia-loi": { availability: "available" },
    "nhan-hoa": { availability: "available" },
    "tu-hoa-sat-tinh": { availability: "available" },
  };
}

function evidence(partial: Partial<MajorFortuneOrdinalEvidence> & Pick<
  MajorFortuneOrdinalEvidence,
  "evidenceId" | "physicalFactId" | "evidenceClusterId" | "pillarId" | "signalFamilyId" | "direction"
>): MajorFortuneOrdinalEvidence {
  return {
    strength: "normal",
    temporalScope: "major-fortune",
    factIds: [partial.physicalFactId],
    sourceIds: ["SRC-MF-V03-ENG-001"],
    claimIds: ["CLM-MF-V03-ENG-001"],
    policyStatus: "research-admitted",
    schoolScope: ["nam-phai", "trung-chau"],
    reasonCode: "fixture",
    ...partial,
  };
}

function run(
  evidenceList: MajorFortuneOrdinalEvidence[],
  overrides: Partial<MajorFortuneOrdinalEvaluationInput> = {},
) {
  return evaluateMajorFortuneOrdinal({
    school: "nam-phai",
    evidence: evidenceList,
    pillarContexts: allAvailable(),
    ...overrides,
  });
}

describe("Major Fortune V0.3 ordinal evaluator — synthetic fixtures", () => {
  it("1. no-signal score 50", () => {
    const result = run([]);
    expect(result.score).toBe(50);
    expect(result.scoreState).toBe("no-signal");
    expect(result.band).toBe("mixed");
    expect(result.coverage.coverageWeight).toBe(1);
  });

  it("2. one support pillar", () => {
    const result = run([
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-el-1",
        evidenceClusterId: "cl-el-1",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        physicalFactKind: "element-relation",
      }),
    ]);
    expect(result.pillars["thien-thoi"].level).toBe(1);
    expect(result.pillars["thien-thoi"].delta).toBe(7.5);
    expect(result.score).toBe(57.5);
    expect(result.scoreState).toBe("scored");
  });

  it("3. one pressure pillar", () => {
    const result = run([
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-dig-1",
        evidenceClusterId: "cl-dig-1",
        pillarId: "dia-loi",
        signalFamilyId: "principal-star-dignity",
        direction: "pressure",
        strength: "strong",
        physicalFactKind: "principal-star-dignity",
      }),
    ]);
    expect(result.pillars["dia-loi"].level).toBe(-2);
    expect(result.pillars["dia-loi"].delta).toBe(-12.5);
    expect(result.score).toBe(37.5);
  });

  it("4. all pillars +2 → score 100", () => {
    const list: MajorFortuneOrdinalEvidence[] = [];
    const specs: Array<[MajorFortuneOrdinalPillarId, string, string]> = [
      ["thien-thoi", "element-relation", "element-relation"],
      ["dia-loi", "principal-star-dignity", "principal-star-dignity"],
      ["nhan-hoa", "support-pressure-auxiliary-sets", "auxiliary-set-member"],
      ["tu-hoa-sat-tinh", "severe-pressure-evidence", "severe-pressure"],
    ];
    for (const [pillarId, family, kind] of specs) {
      list.push(
        evidence({
          evidenceId: `${pillarId}-s1`,
          physicalFactId: `${pillarId}-pf1`,
          evidenceClusterId: `${pillarId}-cl1`,
          pillarId,
          signalFamilyId: family,
          direction: "support",
          strength: "strong",
          physicalFactKind: kind,
        }),
      );
    }
    // tu-hoa severe-pressure is pressure-leaning family but we use support direction for +2 test
    const result = run(list);
    expect(result.score).toBe(100);
    for (const id of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
      expect(result.pillars[id].level).toBe(2);
    }
  });

  it("5. all pillars -2 → score 0", () => {
    const list: MajorFortuneOrdinalEvidence[] = [];
    const specs: Array<[MajorFortuneOrdinalPillarId, string, string]> = [
      ["thien-thoi", "element-relation", "element-relation"],
      ["dia-loi", "principal-star-dignity", "principal-star-dignity"],
      ["nhan-hoa", "support-pressure-auxiliary-sets", "auxiliary-set-member"],
      ["tu-hoa-sat-tinh", "severe-pressure-evidence", "severe-pressure"],
    ];
    for (const [pillarId, family, kind] of specs) {
      list.push(
        evidence({
          evidenceId: `${pillarId}-p1`,
          physicalFactId: `${pillarId}-pf-neg`,
          evidenceClusterId: `${pillarId}-cl-neg`,
          pillarId,
          signalFamilyId: family,
          direction: "pressure",
          strength: "strong",
          physicalFactKind: kind,
        }),
      );
    }
    const result = run(list);
    expect(result.score).toBe(0);
  });

  it("6. balanced evidence → level 0 with signal mass", () => {
    const result = run([
      evidence({
        evidenceId: "sup",
        physicalFactId: "pf-a",
        evidenceClusterId: "cl-a",
        pillarId: "nhan-hoa",
        signalFamilyId: "support-pressure-auxiliary-sets",
        direction: "support",
        physicalFactKind: "auxiliary-set-member",
      }),
      evidence({
        evidenceId: "prs",
        physicalFactId: "pf-b",
        evidenceClusterId: "cl-b",
        pillarId: "nhan-hoa",
        signalFamilyId: "support-pressure-auxiliary-sets",
        direction: "pressure",
        physicalFactKind: "auxiliary-set-member",
      }),
    ]);
    expect(result.pillars["nhan-hoa"].level).toBe(0);
    expect(result.pillars["nhan-hoa"].supportMass).toBe(1);
    expect(result.pillars["nhan-hoa"].pressureMass).toBe(1);
    expect(result.pillars["nhan-hoa"].state).toBe("balanced-signal");
    expect(result.score).toBe(50);
  });

  it("7. duplicate physical fact counted once", () => {
    const result = run([
      evidence({
        evidenceId: "e1",
        physicalFactId: "same-pf",
        evidenceClusterId: "cl-1",
        pillarId: "dia-loi",
        signalFamilyId: "principal-star-dignity",
        direction: "support",
        strength: "strong",
        physicalFactKind: "principal-star-dignity",
      }),
      evidence({
        evidenceId: "e2",
        physicalFactId: "same-pf",
        evidenceClusterId: "cl-2",
        pillarId: "dia-loi",
        signalFamilyId: "principal-star-dignity",
        direction: "support",
        strength: "strong",
        physicalFactKind: "principal-star-dignity",
      }),
    ]);
    expect(result.pillars["dia-loi"].acceptedEvidenceIds).toEqual(["e1"]);
    expect(result.diagnostics.duplicatePhysicalFactRejects).toBe(1);
    expect(result.pillars["dia-loi"].level).toBe(2);
  });

  it("8. duplicate evidence cluster counted once", () => {
    const result = run([
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-1",
        evidenceClusterId: "same-cluster",
        pillarId: "nhan-hoa",
        signalFamilyId: "support-pressure-auxiliary-sets",
        direction: "support",
        physicalFactKind: "auxiliary-set-member",
      }),
      evidence({
        evidenceId: "e2",
        physicalFactId: "pf-2",
        evidenceClusterId: "same-cluster",
        pillarId: "nhan-hoa",
        signalFamilyId: "support-pressure-auxiliary-sets",
        direction: "support",
        physicalFactKind: "auxiliary-set-member",
      }),
    ]);
    expect(result.pillars["nhan-hoa"].acceptedEvidenceIds).toEqual(["e1"]);
    expect(result.diagnostics.duplicateClusterRejects).toBe(1);
  });

  it("9. blocked evidence ignored", () => {
    const result = run([
      evidence({
        evidenceId: "blocked",
        physicalFactId: "pf-b",
        evidenceClusterId: "cl-b",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        strength: "strong",
        policyStatus: "blocked",
        physicalFactKind: "element-relation",
      }),
    ]);
    expect(result.score).toBe(50);
    expect(result.pillars["thien-thoi"].acceptedEvidenceIds).toEqual([]);
  });

  it("10. excluded evidence rejected", () => {
    const result = run([
      evidence({
        evidenceId: "ex",
        physicalFactId: "pf-x",
        evidenceClusterId: "cl-x",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        policyStatus: "excluded",
        physicalFactKind: "element-relation",
      }),
    ]);
    expect(result.pillars["thien-thoi"].rejectedEvidence[0]?.reason).toBe("excluded-policy");
  });

  it("11. Nam Phái transformation rejected", () => {
    const result = run(
      [
        evidence({
          evidenceId: "xf",
          physicalFactId: "pf-xf",
          evidenceClusterId: "cl-xf",
          pillarId: "tu-hoa-sat-tinh",
          signalFamilyId: "major-fortune-transformations",
          direction: "support",
          schoolScope: ["nam-phai", "trung-chau"],
          physicalFactKind: "major-fortune-transformation",
          transformationTuple: {
            fortuneStem: "Giáp",
            transformationType: "Hóa Lộc",
            transformedStar: "Tử Vi",
            targetPalace: "Mệnh",
            targetPalaceIndex: 0,
          },
        }),
      ],
      { school: "nam-phai" },
    );
    expect(result.pillars["tu-hoa-sat-tinh"].rejectedEvidence[0]?.reason).toBe(
      "nam-phai-transformation-unavailable",
    );
    expect(result.score).toBe(50);
  });

  it("12. Trung Châu incomplete tuple rejected", () => {
    const result = run(
      [
        evidence({
          evidenceId: "xf-incomplete",
          physicalFactId: "pf-xf-i",
          evidenceClusterId: "cl-xf-i",
          pillarId: "tu-hoa-sat-tinh",
          signalFamilyId: "major-fortune-transformations",
          direction: "support",
          schoolScope: ["trung-chau"],
          physicalFactKind: "major-fortune-transformation",
          transformationTuple: {
            fortuneStem: "Giáp",
            transformationType: "Hóa Lộc",
            transformedStar: "",
            targetPalace: "Mệnh",
          },
        }),
      ],
      { school: "trung-chau" },
    );
    expect(result.pillars["tu-hoa-sat-tinh"].rejectedEvidence[0]?.reason).toBe(
      "incomplete-transformation-tuple",
    );
  });

  it("13. partial coverage", () => {
    const contexts = allAvailable();
    contexts["tu-hoa-sat-tinh"] = { availability: "unavailable", reasonCodes: ["core-gap"] };
    const result = run([], { pillarContexts: contexts });
    expect(result.status).toBe("partial");
    expect(result.coverage.coverageWeight).toBe(0.75);
    expect(result.coverage.contextCoverageWeight).toBe(0.75);
    expect(result.coverage.scoringCoverageWeight).toBe(0.75);
    expect(result.coverage.missingPillarIds).toEqual(["tu-hoa-sat-tinh"]);
    expect(result.score).toBe(50);
    expect(result.scoreState).toBe("partial-data");
  });

  it("13b. partial-data null level reduces scoring coverage only", () => {
    const contexts = allAvailable();
    contexts["tu-hoa-sat-tinh"] = {
      availability: "partial-data",
      reasonCodes: ["nam-phai-transformations-unavailable-calculation-core"],
    };
    const result = run([], { pillarContexts: contexts });
    expect(result.status).toBe("partial");
    expect(result.coverage.contextCoverageWeight).toBe(1);
    expect(result.coverage.scoringCoverageWeight).toBe(0.75);
    expect(result.coverage.coverageWeight).toBe(1);
    expect(result.coverage.partialPillarIds).toEqual(["tu-hoa-sat-tinh"]);
    expect(result.pillars["tu-hoa-sat-tinh"].level).toBeNull();
    expect(result.coverage.scoredPillarIds).not.toContain("tu-hoa-sat-tinh");
  });

  it("14. unavailable required context", () => {
    const contexts = {
      "thien-thoi": { availability: "unavailable" as const },
      "dia-loi": { availability: "unavailable" as const },
      "nhan-hoa": { availability: "unavailable" as const },
      "tu-hoa-sat-tinh": { availability: "unavailable" as const },
    };
    const result = run([], { pillarContexts: contexts });
    expect(result.status).toBe("unavailable");
    expect(result.score).toBeNull();
    expect(result.scoreState).toBe("unavailable");
    expect(result.coverage.coverageWeight).toBe(0);
    expect(result.coverage.contextCoverageWeight).toBe(0);
    expect(result.coverage.scoringCoverageWeight).toBe(0);
  });

  it("15. annual fact rejected", () => {
    const result = run([
      evidence({
        evidenceId: "ann",
        physicalFactId: "pf-ann",
        evidenceClusterId: "cl-ann",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        temporalScope: "annual",
        physicalFactKind: "element-relation",
      }),
    ]);
    expect(result.diagnostics.excludedTemporalRejects).toBe(1);
    expect(result.score).toBe(50);
  });

  it("16. monthly fact rejected", () => {
    const result = run([
      evidence({
        evidenceId: "mon",
        physicalFactId: "pf-mon",
        evidenceClusterId: "cl-mon",
        pillarId: "dia-loi",
        signalFamilyId: "principal-star-dignity",
        direction: "support",
        temporalScope: "monthly",
        physicalFactKind: "principal-star-dignity",
      }),
    ]);
    expect(result.diagnostics.excludedTemporalRejects).toBe(1);
  });

  it("17. deterministic repeated execution", () => {
    const list = [
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-1",
        evidenceClusterId: "cl-1",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        physicalFactKind: "element-relation",
      }),
    ];
    const a = run(list);
    const b = run(list);
    expect(a).toEqual(b);
  });

  it("18. input immutability", () => {
    const list = [
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-1",
        evidenceClusterId: "cl-1",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        physicalFactKind: "element-relation",
      }),
    ];
    const before = structuredClone(list);
    run(list);
    expect(list).toEqual(before);
  });

  it("19. invalid budget total rejected", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) throw new Error("load failed");
    const bad = structuredClone(loaded.knowledge) as MajorFortuneOrdinalKnowledge;
    bad.formula.pillars[0]!.budget = 99;
    const result = evaluateMajorFortuneOrdinal({
      school: "nam-phai",
      evidence: [],
      pillarContexts: allAvailable(),
      contract: bad,
    });
    expect(result.status).toBe("unavailable");
    expect(result.diagnostics.invalidContract.length).toBeGreaterThan(0);
  });

  it("20. invalid ordinal level impossible through public evaluator", () => {
    expect(clampOrdinalLevel(99)).toBe(2);
    expect(clampOrdinalLevel(-99)).toBe(-2);
    expect(clampOrdinalLevel(1.9)).toBe(1);
    const result = run([
      evidence({
        evidenceId: "many",
        physicalFactId: "pf-many",
        evidenceClusterId: "cl-many",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        strength: "strong",
        physicalFactKind: "element-relation",
      }),
      evidence({
        evidenceId: "many2",
        physicalFactId: "pf-many2",
        evidenceClusterId: "cl-many2",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        strength: "strong",
        physicalFactKind: "element-relation",
      }),
      evidence({
        evidenceId: "many3",
        physicalFactId: "pf-many3",
        evidenceClusterId: "cl-many3",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        strength: "strong",
        physicalFactKind: "element-relation",
      }),
    ]);
    expect([-2, -1, 0, 1, 2]).toContain(result.pillars["thien-thoi"].level);
    expect(result.pillars["thien-thoi"].level).toBe(2);
  });

  it("yearInCycle is metadata only", () => {
    const base = run([]);
    const withMeta = run([], { yearInCycle: 7 });
    expect(withMeta.score).toBe(base.score);
    expect(withMeta.trace.yearInCycleIgnored).toBe(true);
  });

  it("production routing is available at 0.3.1 by default", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.1",
    });
  });

  it("does not expose per-rule rawDelta arrays", () => {
    const result = run([
      evidence({
        evidenceId: "e1",
        physicalFactId: "pf-1",
        evidenceClusterId: "cl-1",
        pillarId: "thien-thoi",
        signalFamilyId: "element-relation",
        direction: "support",
        physicalFactKind: "element-relation",
      }),
    ]);
    const json = JSON.stringify(result);
    expect(json).not.toMatch(/"rawDelta"/);
    expect(result.trace.forbidsPerRuleRawDelta).toBe(true);
  });
});
