import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAnnualAxes } from "../../../modules/annual-axes/analyze";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { intakeFoundationRound2, AUTHORIZED_STAR } from "../foundation-intake";
import { verifyControlV08, V08_PRODUCT_FIXTURE_BIRTH } from "../control-v08";
import {
  loadCandidatePackRound2,
  validateCandidatesRound2,
  hashCandidateRound2,
} from "../load-candidates";
import { buildCandidateKnowledge } from "../candidate-policy";
import { runCandidate } from "../run-candidate";
import { splitCorpusByBaseChart } from "../collect-corpus";
import { FULL_CORPUS_CONTRACT } from "../../../modules/annual-axes/audit/build-audit-corpus";
import { buildFreezeRecord, assertFreezeMatches, mutateCandidateForTest } from "../freeze-candidates";
import { sha256Of } from "../stable-hash";
import type { AnnualAxesCandidateRound2 } from "../schema";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

describe("annual-axes v0.9 round-2 — foundation intake", () => {
  it("requires READY and authorized shape/policy/claims/sources", () => {
    const result = intakeFoundationRound2();
    expect(result.ok).toBe(true);
    expect(result.readiness).toBe("READY_FOR_V0_9_CANDIDATE");
    expect(result.permitsCandidateEvaluation).toBe(true);
    expect(result.authorizedShapeIds).toContain("SHAPE-AAV09-THIEN-MA-MOVEMENT");
    expect(result.authorizedPolicyIds).toContain("POL-AAV09-STAR-LUU-THIEN-MA");
    expect(result.authorizedStarNames).toContain(AUTHORIZED_STAR);
  });
});

describe("annual-axes v0.9 round-2 — control", () => {
  it("CONTROL-V08 reproduces production", () => {
    const control = verifyControlV08();
    expect(control.ok).toBe(true);
    expect(control.scoreEquality).toBe(true);
    expect(control.routingEquality).toBe(true);
    expect(control.fixtureEquality).toBe(true);
  });

  it("default production remains V0.8 / Trung Châu 0.2", () => {
    const nam = analyzeAnnualAxes(calculateNamPhai(REGRESSION), { school: "nam-phai" });
    const tc = analyzeAnnualAxes(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    expect(nam.versions.engineVersion).toBe("0.8.0");
    expect(tc.versions.engineVersion).toBe("0.2.0");
  });
});

describe("annual-axes v0.9 round-2 — candidate validation", () => {
  it("loads authorized pack cleanly", () => {
    const pack = loadCandidatePackRound2();
    expect(pack.issues).toEqual([]);
    expect(pack.candidates.some((c) => c.candidateId === "CONTROL-V08")).toBe(true);
    expect(pack.candidates.some((c) => c.candidateId === "V09-TM-CAREER")).toBe(true);
  });

  it("rejects unauthorized stars and Core-blocked identities", () => {
    const base = loadCandidatePackRound2().candidates.find((c) => c.candidateId === "V09-TM-CAREER")!;
    const badDao: AnnualAxesCandidateRound2 = {
      ...base,
      candidateId: "BAD-DAO",
      includedStarNames: ["Lưu Đào Hoa"],
    };
    const badCore: AnnualAxesCandidateRound2 = {
      ...base,
      candidateId: "BAD-CORE",
      includedStarNames: ["Lưu Tuần"],
    };
    const badDomain: AnnualAxesCandidateRound2 = {
      ...base,
      candidateId: "BAD-DOMAIN",
      domainBindings: ["health" as "career"],
    };
    const issues = validateCandidatesRound2([
      loadCandidatePackRound2().candidates.find((c) => c.candidateId === "CONTROL-V08")!,
      badDao,
      badCore,
      badDomain,
    ]);
    expect(issues.some((i) => i.code === "unauthorized-star" || i.code === "forbidden-star")).toBe(true);
    expect(issues.some((i) => i.code === "unknown-domain")).toBe(true);
  });

  it("rejects control mutations and duplicate ids", () => {
    const control = loadCandidatePackRound2().candidates.find((c) => c.candidateId === "CONTROL-V08")!;
    const mutated = { ...control, changeCategories: ["star-registry" as const] };
    const issues = validateCandidatesRound2([control, mutated]);
    expect(issues.some((i) => i.code === "duplicate-candidate-id")).toBe(true);
    expect(issues.some((i) => i.code === "control-with-modifications")).toBe(true);
  });
});

describe("annual-axes v0.9 round-2 — runtime identity", () => {
  it("matches Lưu Thiên Mã annually and does not match natal Thiên Mã", () => {
    const career = loadCandidatePackRound2().candidates.find((c) => c.candidateId === "V09-TM-CAREER")!;
    const chart = calculateNamPhai(V08_PRODUCT_FIXTURE_BIRTH);
    const result = runCandidate(chart, career);
    const evidence = Object.values(result.axes).flatMap((axis) =>
      axis.engine === "v0.8" ? axis.v08Evidence ?? [] : [],
    );
    for (const fact of evidence) {
      if (fact.exactMatchedStarName === "Thiên Mã") {
        expect(fact.temporalLayer).not.toBe("annual");
      }
      if (fact.ruleId.includes("r2-thien-ma")) {
        expect(fact.exactMatchedStarName).toBe(AUTHORIZED_STAR);
        expect(fact.temporalLayer).toBe("annual");
      }
    }
  });

  it("knowledge injection does not alter production knowledge loader", () => {
    const career = loadCandidatePackRound2().candidates.find((c) => c.candidateId === "V09-TM-CAREER")!;
    buildCandidateKnowledge(career);
    const production = analyzeAnnualAxes(calculateNamPhai(V08_PRODUCT_FIXTURE_BIRTH), {
      school: "nam-phai",
    });
    expect(production.versions.engineVersion).toBe("0.8.0");
    expect(production.versions.knowledgeVersion).toBe("0.8.0");
  });
});

describe("annual-axes v0.9 round-2 — split and freeze", () => {
  it("training/holdout have no overlap and keep years with base chart", () => {
    const split = splitCorpusByBaseChart(FULL_CORPUS_CONTRACT);
    expect(split.overlapCount).toBe(0);
    expect(split.trainingChartIndexes.length + split.holdoutChartIndexes.length).toBe(100);
    expect(split.yearsPerChart).toBe(12);
  });

  it("freeze rejects mutation", () => {
    const pack = loadCandidatePackRound2();
    const freeze = buildFreezeRecord(pack);
    expect(assertFreezeMatches(freeze, pack)).toEqual([]);
    const mutated = {
      ...pack,
      candidates: pack.candidates.map((c) =>
        c.candidateId === "V09-TM-CAREER" ? mutateCandidateForTest(c) : c,
      ),
    };
    expect(assertFreezeMatches(freeze, mutated).length).toBeGreaterThan(0);
  });

  it("hash is stable across runs", () => {
    const career = loadCandidatePackRound2().candidates.find((c) => c.candidateId === "V09-TM-CAREER")!;
    expect(hashCandidateRound2(career)).toBe(sha256Of(career));
    expect(hashCandidateRound2(career)).toBe(hashCandidateRound2(career));
  });
});

describe("annual-axes v0.9 round-2 — isolation", () => {
  it("production analysis barrel does not export round-2", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/ziwei/analysis/index.ts"), "utf8");
    expect(src).not.toMatch(/annual-axes-v09-round-2/);
  });

  it("production UI does not import round-2", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/ziwei/annual-axes/AnnualAxesSection.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/annual-axes-v09-round-2/);
    expect(src).not.toMatch(/v0\.9-candidates-round-2/);
  });

  it("historical round-1 snapshot remains RESEARCH_REVISION_REQUIRED", () => {
    const path = join(
      process.cwd(),
      "research/annual-axes/v0.9-candidates/reports/production-decision.json",
    );
    expect(existsSync(path)).toBe(true);
    const decision = JSON.parse(readFileSync(path, "utf8"));
    expect(decision.decision).toBe("RESEARCH_REVISION_REQUIRED");
    expect(decision.selectedCandidateId).toBeNull();
  });
});
