import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { loadAnnualAxesKnowledgeV0 } from "../../../knowledge/annual-axes";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { auditEvidenceSources } from "../audit-evidence-sources";
import {
  emptyMonthlyFlowMonthDiagnostics,
  type MonthlyFlowEvidence,
} from "../types";

function evidence(overrides: Partial<MonthlyFlowEvidence> = {}): MonthlyFlowEvidence {
  return {
    id: "mfs-monthly:2026-M01:health:monthly-focus-star:star:0:Test:focus:focus",
    domain: "health",
    monthKey: "2026-M01",
    category: "monthly-focus-star",
    physicalFactId: "star:0:Test",
    ruleId: "RULE-TEST",
    targetPalaceIndex: 0,
    targetNatalPalaceName: "Mệnh",
    targetAnnualPalaceName: "Mệnh",
    monthlyFrameRole: "focus",
    annualDomainRole: "focus",
    stackingGroup: "test",
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    factIds: ["star:0:Test"],
    sourceIds: ["src-heuristic-palace-overview-v1"],
    knowledgeStatus: "experimental",
    ...overrides,
  };
}

describe("auditEvidenceSources — Monthly Flow provenance", () => {
  const monthly = loadMonthlyFlowScoringKnowledgeV0();
  const palace = loadPalaceOverviewKnowledgeV1();
  const annual = loadAnnualAxesKnowledgeV0();
  const major = loadMajorFortuneScoringKnowledgeV0();
  if (!monthly.ok) throw new Error("monthly knowledge failed to load");
  if (!palace.ok) throw new Error("palace knowledge failed to load");
  if (!annual.ok) throw new Error("annual knowledge failed to load");
  if (!major.ok) throw new Error("major knowledge failed to load");

  const inputs = {
    monthlyKnowledge: monthly.knowledge,
    palaceKnowledge: palace.knowledge,
    annualKnowledge: annual.knowledge,
    majorFortuneKnowledge: major.knowledge,
  };

  it("accepts Palace Overview numeric source IDs without reporting missing", () => {
    const monthDiag = emptyMonthlyFlowMonthDiagnostics();
    auditEvidenceSources(
      [
        evidence({ sourceIds: ["src-heuristic-palace-overview-v1"] }),
        evidence({ id: "id-2", sourceIds: ["src-calculation-core"] }),
        evidence({ id: "id-3", sourceIds: ["src-minor-catalog-v1-1-heuristic"] }),
        evidence({ id: "id-4", sourceIds: ["src-palace-overview-v1-spec"] }),
      ],
      inputs,
      monthDiag,
    );
    expect(monthDiag.missingSourceIds).toEqual([]);
  });

  it("accepts the monthly registry's own source IDs", () => {
    const monthlySourceId = inputs.monthlyKnowledge.sourceRegistry.sources[0]?.sourceId;
    expect(monthlySourceId).toBeTruthy();
    const monthDiag = emptyMonthlyFlowMonthDiagnostics();
    auditEvidenceSources([evidence({ sourceIds: [monthlySourceId!] })], inputs, monthDiag);
    expect(monthDiag.missingSourceIds).toEqual([]);
  });

  it("reports unknown source IDs with the evidence id prefix", () => {
    const monthDiag = emptyMonthlyFlowMonthDiagnostics();
    auditEvidenceSources(
      [evidence({ id: "poison", sourceIds: ["src-does-not-exist"] })],
      inputs,
      monthDiag,
    );
    expect(monthDiag.missingSourceIds).toContain("poison:src-does-not-exist");
  });

  it("reports empty sourceIds as `${id}:empty`", () => {
    const monthDiag = emptyMonthlyFlowMonthDiagnostics();
    auditEvidenceSources([evidence({ id: "no-src", sourceIds: [] })], inputs, monthDiag);
    expect(monthDiag.missingSourceIds).toContain("no-src:empty");
  });
});
