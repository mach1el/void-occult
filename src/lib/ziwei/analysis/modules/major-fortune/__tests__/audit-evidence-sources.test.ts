import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { auditEvidenceSources } from "../audit-evidence-sources";
import { emptyMajorFortuneDiagnostics, type MajorFortuneEvidence } from "../types";

function makeEvidence(overrides: Partial<MajorFortuneEvidence> = {}): MajorFortuneEvidence {
  return {
    id: "mfs:overall:star:test",
    scope: "overall",
    domainId: null,
    category: "star",
    physicalFactId: "star:0:Test",
    ruleId: "RULE-TEST",
    targetPalaceIndex: 0,
    targetNatalPalaceName: "Mệnh",
    targetMajorPalaceName: "Mệnh",
    frameRole: "focus",
    stackingGroup: "test-group",
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    factIds: ["star:0:Test"],
    sourceIds: ["src-heuristic-palace-overview-v1"],
    knowledgeStatus: "experimental",
    ...overrides,
  };
}

describe("auditEvidenceSources", () => {
  const mfLoaded = loadMajorFortuneScoringKnowledgeV0();
  const palaceLoaded = loadPalaceOverviewKnowledgeV1();
  if (!mfLoaded.ok) throw new Error("major fortune knowledge failed to load");
  if (!palaceLoaded.ok) throw new Error("palace overview knowledge failed to load");

  it("accepts Palace Overview numeric source IDs without reporting missingSourceIds", () => {
    const diagnostics = emptyMajorFortuneDiagnostics();
    auditEvidenceSources(
      [
        makeEvidence({ sourceIds: ["src-heuristic-palace-overview-v1"] }),
        makeEvidence({
          id: "mfs:overall:star:calc",
          sourceIds: ["src-calculation-core"],
        }),
        makeEvidence({
          id: "mfs:overall:star:minor",
          sourceIds: ["src-minor-catalog-v1-1-heuristic"],
        }),
        makeEvidence({
          id: "mfs:overall:star:spec",
          sourceIds: ["src-palace-overview-v1-spec"],
        }),
      ],
      mfLoaded.knowledge,
      palaceLoaded.knowledge,
      diagnostics,
    );
    expect(diagnostics.missingSourceIds).toEqual([]);
  });

  it("accepts Major Fortune scoring registry source IDs", () => {
    const mfSourceId = mfLoaded.knowledge.sourceRegistry.sources[0]?.sourceId;
    expect(mfSourceId).toBeTruthy();
    const diagnostics = emptyMajorFortuneDiagnostics();
    auditEvidenceSources(
      [makeEvidence({ sourceIds: [mfSourceId!] })],
      mfLoaded.knowledge,
      palaceLoaded.knowledge,
      diagnostics,
    );
    expect(diagnostics.missingSourceIds).toEqual([]);
  });

  it("reports a genuinely unknown source ID with evidence id and source id", () => {
    const diagnostics = emptyMajorFortuneDiagnostics();
    const evidence = makeEvidence({
      id: "mfs:overall:star:poison",
      sourceIds: ["src-does-not-exist"],
    });
    auditEvidenceSources(
      [evidence],
      mfLoaded.knowledge,
      palaceLoaded.knowledge,
      diagnostics,
    );
    expect(diagnostics.missingSourceIds).toContain("mfs:overall:star:poison:src-does-not-exist");
  });

  it("does not accept arbitrary prefixes as known sources", () => {
    const diagnostics = emptyMajorFortuneDiagnostics();
    auditEvidenceSources(
      [makeEvidence({ id: "e1", sourceIds: ["src-heuristic"] })],
      mfLoaded.knowledge,
      palaceLoaded.knowledge,
      diagnostics,
    );
    expect(diagnostics.missingSourceIds).toContain("e1:src-heuristic");
  });
});
