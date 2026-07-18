import { describe, expect, it } from "vitest";
import type { NatalZiweiFact } from "@/lib/ziwei/analysis/facts";
import type { StaticFrame } from "@/lib/ziwei/analysis/frame";
import {
  loadPalaceOverviewKnowledgeV1,
  loadPalaceOverviewSemanticKnowledgeV1,
} from "@/lib/ziwei/analysis/knowledge";
import {
  buildTransformationTargetAnnotations,
  emptySemanticDiagnostics,
} from "@/lib/ziwei/analysis/modules/palace-overview";

const FRAME: StaticFrame = {
  focusIndex: 0,
  nodes: [
    { palaceIndex: 0, palaceName: "Mệnh", palaceBranch: "Tý", role: "focus", geometryWeight: 1 },
  ],
};

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

function transformFact(
  id: string,
  transformation: NatalZiweiFact["transformation"],
  targetStar: string,
): NatalZiweiFact {
  return {
    id,
    layer: "natal",
    kind: "transformation",
    school: "nam-phai",
    palaceIndex: 0,
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    source: "natal-mutagen",
    transformation,
    targetStar,
  };
}

function otherStarFact(id: string, name: string): NatalZiweiFact {
  return {
    id,
    layer: "natal",
    kind: "star",
    school: "nam-phai",
    palaceIndex: 0,
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    source: "test",
    canonicalStarName: name,
    starClass: "major",
  };
}

function annotate(facts: NatalZiweiFact[]) {
  return buildTransformationTargetAnnotations({
    frame: FRAME,
    factsByPalace: new Map([[0, facts]]),
    knowledge: numericKnowledge,
    semanticKnowledge,
    diagnostics: emptySemanticDiagnostics(),
    focusPalaceIndex: 0,
  });
}

describe("transformation-target-annotations", () => {
  it("Kỵ → Cự Môn (communication trait) fires communication-friction", () => {
    const out = annotate([transformFact("t1", "Kỵ", "Cự Môn")]);
    expect(out.some((a) => a.explanationKey === "transform-target.ky.communication")).toBe(true);
  });

  it("Kỵ targeting an unrelated star in the same palace does not match on that star's traits", () => {
    // The transformation targets Cự Môn (communication); Tử Vi merely happens
    // to sit in the same palace but must not be treated as the match target.
    const out = annotate([
      transformFact("t1", "Kỵ", "Cự Môn"),
      otherStarFact("s1", "Tử Vi"),
    ]);
    const authorityHit = out.find((a) => a.explanationKey === "transform-target.ky.visibility");
    expect(authorityHit).toBeUndefined();
    expect(out.every((a) => a.metadata?.targetStar === "Cự Môn")).toBe(true);
  });

  it("Quyền → Tử Vi (authority trait) fires authority/control", () => {
    const out = annotate([transformFact("t2", "Quyền", "Tử Vi")]);
    expect(out.some((a) => a.explanationKey === "transform-target.quyen.authority")).toBe(true);
  });

  it("deduplicates by transformation-fact-id + rule-id", () => {
    const out = annotate([transformFact("t1", "Kỵ", "Cự Môn")]);
    const hits = out.filter((a) => a.explanationKey === "transform-target.ky.communication");
    expect(hits).toHaveLength(1);
  });

  it("carries no axes (annotation-only, never scored)", () => {
    const out = annotate([transformFact("t1", "Kỵ", "Cự Môn")]);
    for (const a of out) {
      expect((a as unknown as Record<string, unknown>).axes).toBeUndefined();
    }
  });

  it("unresolvable target stays diagnostic-only, no fabricated annotation", () => {
    const diagnostics = emptySemanticDiagnostics();
    const out = buildTransformationTargetAnnotations({
      frame: FRAME,
      factsByPalace: new Map([[0, [transformFact("t1", "Kỵ", "Sao Không Tồn Tại")]]]),
      knowledge: numericKnowledge,
      semanticKnowledge,
      diagnostics,
      focusPalaceIndex: 0,
    });
    expect(out).toHaveLength(0);
    expect(diagnostics.unmappedTargetTraits.length).toBeGreaterThan(0);
  });
});
