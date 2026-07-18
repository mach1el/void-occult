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

  it("Different stars, same trait: aggregates contributors into one annotation", () => {
    const minorA = baseEvidence({
      id: "ev:minorA",
      category: "minor-star-family",
      starName: "Sao A",
      traitTags: ["mentorship"],
      factIds: ["fact:A"],
    });
    const minorB = baseEvidence({
      id: "ev:minorB",
      category: "minor-star-family",
      starName: "Sao B",
      traitTags: ["mentorship"],
      factIds: ["fact:B"],
    });
    const minorC = baseEvidence({
      id: "ev:minorC",
      category: "minor-star-family",
      starName: "Sao C",
      traitTags: ["mentorship"],
      factIds: ["fact:C"],
    });

    const { out } = project([minorA, minorB, minorC]);
    const mentorshipHits = out.filter((a) => a.metadata?.trait === "mentorship");
    
    expect(mentorshipHits).toHaveLength(1);
    const ann = mentorshipHits[0]!;
    
    expect(ann.factIds).toContain("fact:A");
    expect(ann.factIds).toContain("fact:B");
    expect(ann.factIds).toContain("fact:C");
    expect(ann.metadata!.contributorStarNames!).toContain("Sao A");
    expect(ann.metadata!.contributorStarNames!).toContain("Sao B");
    expect(ann.metadata!.contributorStarNames!).toContain("Sao C");
    expect(ann.metadata!.contributorEvidenceIds!).toContain("ev:minorA");
    expect(ann.metadata!.contributorEvidenceIds!).toContain("ev:minorB");
    expect(ann.metadata!.contributorEvidenceIds!).toContain("ev:minorC");
    expect(ann.metadata!.contributorCount).toBe(3);
  });

  it("Same evidence repeated: preserves single contributor", () => {
    const evidence = baseEvidence({
      id: "ev:tu-vi",
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const { out } = project([evidence, evidence]);
    const authorityHits = out.filter((a) => a.metadata?.trait === "authority");
    expect(authorityHits).toHaveLength(1);
    const ann = authorityHits[0]!;
    
    expect(ann.factIds).toHaveLength(1);
    expect(ann.factIds[0]).toBe("fact:tu-vi");
    expect(ann.metadata!.contributorEvidenceIds!).toHaveLength(1);
    expect(ann.metadata!.contributorEvidenceIds![0]).toBe("ev:tu-vi");
    expect(ann.metadata!.contributorStarNames!).toHaveLength(1);
    expect(ann.metadata!.contributorStarNames![0]).toBe("Tử Vi");
    expect(ann.metadata!.contributorCount).toBe(1);
  });

  it("Multiple traits from one star: produces multiple annotations", () => {
    // Tử Vi has two traits: "authority" and "protection"
    const evidence = baseEvidence({
      category: "major-star",
      starName: "Tử Vi",
      factIds: ["fact:tu-vi"],
    });
    const { out } = project([evidence]);
    
    expect(out.some((a) => a.metadata?.trait === "authority")).toBe(true);
    expect(out.some((a) => a.metadata?.trait === "protection")).toBe(true);
  });

  it("V1.2.1: a major star targeted by 2 Tứ Hóa records no longer triple-projects the same trait", () => {
    // Before the fix, transformation evidence targeting a focus major star
    // was itself a projection subject — so Thiên Cơ (traits
    // planning/adaptability) receiving both Hóa Lộc and Hóa Kỵ would
    // project "planning"/"adaptability" 3x (once for the star, once per
    // transform). Transformation evidence must no longer be a subject.
    const majorEvidence = baseEvidence({
      category: "major-star",
      starName: "Thiên Cơ",
      factIds: ["fact:thien-co"],
    });
    const transformLoc = baseEvidence({
      category: "transformation",
      starName: "Thiên Cơ",
      factIds: ["fact:transform-loc"],
      explanationKey: "transform.Lộc",
    });
    const transformKy = baseEvidence({
      category: "transformation",
      starName: "Thiên Cơ",
      factIds: ["fact:transform-ky"],
      explanationKey: "transform.Kỵ",
    });
    const { out } = project([majorEvidence, transformLoc, transformKy]);
    const planningHits = out.filter((a) => a.metadata?.trait === "planning");
    expect(planningHits).toHaveLength(1);
    // The transformation facts themselves must never appear as a subject's factId.
    expect(out.every((a) => !a.factIds.includes("fact:transform-loc"))).toBe(true);
    expect(out.every((a) => !a.factIds.includes("fact:transform-ky"))).toBe(true);
  });
});
