import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { intakeFoundation } from "../foundation-intake";
import { verifyControlV08 } from "../control-v08";
import { loadCandidatePack } from "../load-candidates";
import { validateCandidates } from "../validate";
import { runV09CandidateDecision } from "../run-decision";
import { analyzeAnnualAxes } from "../../../modules/annual-axes/analyze";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { AnnualAxesCandidateV09 } from "../schema";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

describe("annual-axes v0.9 candidate evaluation — foundation intake", () => {
  it("requires foundation files and reports readiness", () => {
    const result = intakeFoundation();
    expect(result.missingFiles).toEqual([]);
    expect(result.ok).toBe(true);
    expect([
      "READY_FOR_V0_9_CANDIDATE",
      "RESEARCH_INCOMPLETE",
      "V0_8_SHOULD_REMAIN_UNCHANGED",
      "CALCULATION_CORE_BLOCKED",
    ]).toContain(result.readiness);
  });

  it("does not permit experimental evaluation under RESEARCH_INCOMPLETE", () => {
    const result = intakeFoundation();
    if (result.readiness === "RESEARCH_INCOMPLETE") {
      expect(result.permitsCandidateEvaluation).toBe(false);
    }
  });
});

describe("annual-axes v0.9 candidate evaluation — control", () => {
  it("CONTROL-V08 equals production V0.8 and fixtures", () => {
    const control = verifyControlV08();
    expect(control.ok).toBe(true);
    expect(control.scoreEquality).toBe(true);
    expect(control.routingEquality).toBe(true);
    expect(control.fixtureEquality).toBe(true);
    expect(control.engineVersion).toBe("0.8.0");
    expect(control.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
  });

  it("default analyzer remains V0.8; Trung Châu remains 0.2.0", () => {
    const nam = analyzeAnnualAxes(calculateNamPhai(REGRESSION), { school: "nam-phai" });
    const tc = analyzeAnnualAxes(calculateTrungChau(REGRESSION), { school: "trung-chau" });
    expect(nam.versions.engineVersion).toBe("0.8.0");
    expect(tc.versions.engineVersion).toBe("0.2.0");
  });
});

describe("annual-axes v0.9 candidate evaluation — registry validation", () => {
  it("loads CONTROL-V08 only and validates cleanly", () => {
    const pack = loadCandidatePack();
    expect(pack.issues).toEqual([]);
    expect(pack.candidates).toHaveLength(1);
    expect(pack.candidates[0]?.candidateId).toBe("CONTROL-V08");
    expect(pack.candidates[0]?.candidateType).toBe("control");
  });

  it("rejects duplicate candidate IDs and control modifications", () => {
    const base = loadCandidatePack().candidates[0]!;
    const dup: AnnualAxesCandidateV09 = { ...base };
    const modifiedControl: AnnualAxesCandidateV09 = {
      ...base,
      changeCategories: ["star-registry"],
    };
    const issues = validateCandidates([base, dup, modifiedControl]);
    expect(issues.some((i) => i.code === "duplicate-candidate-id")).toBe(true);
    expect(issues.some((i) => i.code === "control-with-modifications")).toBe(true);
  });

  it("rejects missing claim / source references", () => {
    const base = loadCandidatePack().candidates[0]!;
    const bad: AnnualAxesCandidateV09 = {
      ...base,
      candidateId: "EXP-BAD",
      candidateType: "experimental",
      claimIds: ["CLM-DOES-NOT-EXIST"],
      sourceIds: ["SRC-DOES-NOT-EXIST"],
      changeCategories: ["star-registry"],
    };
    const issues = validateCandidates([base, bad]);
    expect(issues.some((i) => i.code === "missing-claim")).toBe(true);
    expect(issues.some((i) => i.code === "missing-source")).toBe(true);
  });
});

describe("annual-axes v0.9 candidate evaluation — isolation", () => {
  it("production analysis index does not export research candidates", () => {
    const indexPath = join(
      process.cwd(),
      "src/lib/ziwei/analysis/index.ts",
    );
    const src = readFileSync(indexPath, "utf8");
    expect(src).not.toMatch(/annual-axes-v09/);
    expect(src).not.toMatch(/runV09CandidateDecision/);
  });

  it("production UI does not import research candidates", () => {
    const uiPath = join(
      process.cwd(),
      "src/components/ziwei/annual-axes/AnnualAxesSection.tsx",
    );
    const src = readFileSync(uiPath, "utf8");
    expect(src).not.toMatch(/annual-axes-v09/);
    expect(src).not.toMatch(/v0\.9-candidate/);
  });
});

describe("annual-axes v0.9 candidate evaluation — decision", () => {
  it("emits exactly one blocked decision with null selection", () => {
    const result = runV09CandidateDecision({ writeArtifacts: true });
    expect(result.foundation.readiness).toBe("RESEARCH_INCOMPLETE");
    expect(result.control.ok).toBe(true);
    expect(result.selection.selectedCandidateId).toBeNull();
    expect(result.productionDecision.selectedCandidateId).toBeNull();
    expect(result.productionDecision.decision).toBe("RESEARCH_REVISION_REQUIRED");
    expect(result.productionDecision.controlVersion.engineVersion).toBe("0.8.0");

    const decisionPath = join(
      process.cwd(),
      "research/annual-axes/v0.9-candidates/reports/production-decision.json",
    );
    expect(existsSync(decisionPath)).toBe(true);
    const decision = JSON.parse(readFileSync(decisionPath, "utf8"));
    expect(decision.decision).toBe("RESEARCH_REVISION_REQUIRED");
    expect(decision.selectedCandidateId).toBeNull();

    const handoff = join(
      process.cwd(),
      "research/annual-axes/v0.9-candidates/prompts/blocked-next-step-handoff.md",
    );
    expect(existsSync(handoff)).toBe(true);
    expect(readFileSync(handoff, "utf8")).toMatch(/RESEARCH_REVISION_REQUIRED/);
  });

  it("decision run is deterministic", () => {
    const a = runV09CandidateDecision({ writeArtifacts: true });
    const b = runV09CandidateDecision({ writeArtifacts: true });
    expect(a.productionDecision).toEqual(b.productionDecision);
    expect(a.selection).toEqual(b.selection);
    expect(a.freezeHashes).toEqual(b.freezeHashes);
  });
});
