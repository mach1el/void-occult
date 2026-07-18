import { describe, expect, it } from "vitest";
import {
  loadPalaceOverviewKnowledgeV1,
  loadPalaceOverviewSemanticKnowledgeV1,
} from "@/lib/ziwei/analysis/knowledge";
import {
  buildTraitProjectionAnnotations,
  emptySemanticDiagnostics,
  type PalaceEvidence,
} from "@/lib/ziwei/analysis/modules/palace-overview";

const numericKnowledge = (() => {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("expected valid numeric knowledge fixture");
  return loaded.knowledge;
})();

const semanticKnowledge = (() => {
  const loaded = loadPalaceOverviewSemanticKnowledgeV1();
  if (!loaded.ok) throw new Error("expected valid semantic knowledge fixture");
  return loaded.knowledge;
})();

function baseEvidence(overrides: Partial<PalaceEvidence>): PalaceEvidence {
  return {
    id: "ev:test",
    category: "major-star",
    factIds: ["fact:test"],
    palaceRole: "focus",
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    axes: { support: 1, pressure: 0, stability: 0, activation: 0 },
    label: "test",
    explanationKey: "major.test",
    sourceIds: [],
    knowledgeStatus: "experimental",
    ...overrides,
  };
}

function project(allEvidence: PalaceEvidence[], focusPalaceName = "Mệnh") {
  const diagnostics = emptySemanticDiagnostics();
  const out = buildTraitProjectionAnnotations({
    allEvidence,
    knowledge: numericKnowledge,
    semanticKnowledge,
    diagnostics,
    focusPalaceIndex: 0,
    focusPalaceName,
  });
  return { out, diagnostics };
}

describe("trait-projection-annotations", () => {
  it("explicit (trait, palace) override wins over the fallback template", () => {
    // Tử Vi has traits ["authority","protection"]; Mệnh has an explicit
    // override for "authority" in trait-palace-projection.json.
    const evidence = baseEvidence({
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const { out } = project([evidence]);
    const authorityAnn = out.find((a) => a.metadata?.trait === "authority");
    const overrideRecord = semanticKnowledge.traitPalaceProjection.overrides.find(
      (o) => o.trait === "authority" && o.palace === "Mệnh",
    )!;
    expect(authorityAnn?.label).toBe(overrideRecord.label);
    expect(authorityAnn?.explanationKey).toBe(`projection.${overrideRecord.id}`);
  });

  it("falls back to the deterministic template when no override exists", () => {
    // "protection" (Tử Vi's second trait) has no Mệnh override in the pack.
    const evidence = baseEvidence({
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const { out } = project([evidence]);
    const protectionAnn = out.find((a) => a.metadata?.trait === "protection");
    const traitLabel = semanticKnowledge.traitPalaceProjection.traits.find(
      (t) => t.trait === "protection",
    )!.label;
    const palaceLabel = semanticKnowledge.traitPalaceProjection.palaces["Mệnh"]!.label;
    expect(protectionAnn?.label).toBe(`${traitLabel} trong phạm vi ${palaceLabel}`);
  });

  it("only focus (natal or VCD-borrowed) subjects project — opposite/trine minors are excluded", () => {
    const focusMinor = baseEvidence({
      category: "minor-star-family",
      palaceRole: "focus",
      starName: "Tả Phụ",
      traitTags: ["coordination"],
      factIds: ["fact:ta-phu-focus"],
    });
    const oppositeMinor = baseEvidence({
      category: "minor-star-family",
      palaceRole: "opposite",
      starName: "Hữu Bật",
      traitTags: ["coordination"],
      factIds: ["fact:huu-bat-opposite"],
    });
    const trineMinor = baseEvidence({
      category: "minor-star-family",
      palaceRole: "trine",
      starName: "Thiên Khôi",
      traitTags: ["mentorship"],
      factIds: ["fact:thien-khoi-trine"],
    });
    const { out } = project([focusMinor, oppositeMinor, trineMinor]);
    expect(out.some((a) => a.factIds.includes("fact:ta-phu-focus"))).toBe(true);
    expect(out.some((a) => a.factIds.includes("fact:huu-bat-opposite"))).toBe(false);
    expect(out.some((a) => a.factIds.includes("fact:thien-khoi-trine"))).toBe(false);
  });

  it("unknown trait skips annotation and lands in unknownProjectionTraits diagnostic", () => {
    // "readiness" is a real minor-star traitTag with no palace-projection label.
    const evidence = baseEvidence({
      category: "minor-star-family",
      palaceRole: "focus",
      starName: "some-minor",
      traitTags: ["readiness"],
      factIds: ["fact:unknown-trait"],
    });
    const { out, diagnostics } = project([evidence]);
    expect(out.some((a) => a.metadata?.trait === "readiness")).toBe(false);
    expect(diagnostics.unknownProjectionTraits).toContain("readiness");
  });

  it("never touches evidence axes (annotation-only)", () => {
    const evidence = baseEvidence({
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const before = JSON.stringify(evidence.axes);
    project([evidence]);
    expect(JSON.stringify(evidence.axes)).toBe(before);
  });

  it("deduplicates by trait+palace+subject fact", () => {
    const evidence = baseEvidence({
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const { out } = project([evidence, evidence]);
    const authorityHits = out.filter((a) => a.metadata?.trait === "authority");
    expect(authorityHits).toHaveLength(1);
  });
});
