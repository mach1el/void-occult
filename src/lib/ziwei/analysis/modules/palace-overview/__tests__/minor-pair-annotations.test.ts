import { describe, expect, it } from "vitest";
import type { NatalZiweiFact } from "@/lib/ziwei/analysis/facts";
import type { StaticFrame } from "@/lib/ziwei/analysis/frame";
import { loadPalaceOverviewSemanticKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import {
  buildMinorPairAnnotations,
  emptySemanticDiagnostics,
} from "@/lib/ziwei/analysis/modules/palace-overview";

function fact(id: string, palaceIndex: number, name: string): NatalZiweiFact {
  return {
    id,
    layer: "natal",
    kind: "star",
    school: "nam-phai",
    palaceIndex,
    palaceName: `P${palaceIndex}`,
    palaceBranch: "Tý",
    source: "test",
    canonicalStarName: name,
    starClass: "auxiliary",
  };
}

const FRAME: StaticFrame = {
  focusIndex: 0,
  nodes: [
    { palaceIndex: 0, palaceName: "Mệnh", palaceBranch: "Tý", role: "focus", geometryWeight: 1 },
    {
      palaceIndex: 6,
      palaceName: "Thiên Di",
      palaceBranch: "Ngọ",
      role: "opposite",
      geometryWeight: 0.65,
    },
    {
      palaceIndex: 4,
      palaceName: "Quan Lộc",
      palaceBranch: "Thìn",
      role: "trine",
      geometryWeight: 0.4,
    },
    {
      palaceIndex: 8,
      palaceName: "Tài Bạch",
      palaceBranch: "Thân",
      role: "trine",
      geometryWeight: 0.4,
    },
  ],
};

function factsByPalaceOf(facts: NatalZiweiFact[]): Map<number, NatalZiweiFact[]> {
  const map = new Map<number, NatalZiweiFact[]>();
  for (const f of facts) {
    const list = map.get(f.palaceIndex) ?? [];
    list.push(f);
    map.set(f.palaceIndex, list);
  }
  return map;
}

const knowledge = (() => {
  const loaded = loadPalaceOverviewSemanticKnowledgeV1();
  if (!loaded.ok) throw new Error("expected valid semantic knowledge fixture");
  return loaded.knowledge;
})();

function pairAnnotationsFor(facts: NatalZiweiFact[]) {
  return buildMinorPairAnnotations({
    frame: FRAME,
    factsByPalace: factsByPalaceOf(facts),
    knowledge,
    diagnostics: emptySemanticDiagnostics(),
    focusPalaceIndex: 0,
  });
}

describe("minor-pair-annotations — scope priority", () => {
  it("same-palace outranks tp4c when both participants share one palace", () => {
    const out = pairAnnotationsFor([
      fact("f1", 0, "Tả Phụ"),
      fact("f2", 0, "Hữu Bật"),
    ]);
    const hit = out.find((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hit?.metadata?.scope).toBe("same-palace");
  });

  it("opposite-link requires both sides (focus + opposite)", () => {
    const out = pairAnnotationsFor([
      fact("f1", 0, "Tả Phụ"),
      fact("f2", 6, "Hữu Bật"),
    ]);
    const hit = out.find((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hit?.metadata?.scope).toBe("opposite-link");
  });

  it("trine-link requires a trine participant", () => {
    const out = pairAnnotationsFor([
      fact("f1", 0, "Tả Phụ"),
      fact("f2", 4, "Hữu Bật"),
    ]);
    const hit = out.find((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hit?.metadata?.scope).toBe("trine-link");
  });

  it("falls back to tp4c when the spread mixes opposite and trine (no stronger scope applies)", () => {
    const out = pairAnnotationsFor([
      fact("f1", 6, "Tả Phụ"),
      fact("f2", 4, "Hữu Bật"),
    ]);
    const hit = out.find((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hit?.metadata?.scope).toBe("tp4c");
  });

  it("missing participant means no hit", () => {
    const out = pairAnnotationsFor([fact("f1", 0, "Tả Phụ")]);
    expect(out.some((a) => a.explanationKey === "pair.pair-ta-huu")).toBe(false);
  });

  it("V1.2.1: two trine palaces without a focus participant fall to tp4c, not trine-link", () => {
    const out = pairAnnotationsFor([
      fact("f1", 4, "Tả Phụ"),
      fact("f2", 8, "Hữu Bật"),
    ]);
    const hit = out.find((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hit?.metadata?.scope).toBe("tp4c");
  });

  it("V1.2.1: a normal missing-participant miss writes no diagnostic (it's expected non-match behavior, not an integrity issue)", () => {
    const diagnostics = emptySemanticDiagnostics();
    buildMinorPairAnnotations({
      frame: FRAME,
      factsByPalace: factsByPalaceOf([fact("f1", 0, "Tả Phụ")]),
      knowledge,
      diagnostics,
      focusPalaceIndex: 0,
    });
    expect(diagnostics.unresolvedPairParticipants).toEqual([]);
  });

  it("one hit per rule per focus palace", () => {
    const out = pairAnnotationsFor([
      fact("f1", 0, "Tả Phụ"),
      fact("f2", 0, "Hữu Bật"),
    ]);
    const hits = out.filter((a) => a.explanationKey === "pair.pair-ta-huu");
    expect(hits).toHaveLength(1);
  });

  it("annotations never enter allEvidence-style structures (no axes field)", () => {
    const out = pairAnnotationsFor([
      fact("f1", 0, "Tả Phụ"),
      fact("f2", 0, "Hữu Bật"),
    ]);
    for (const a of out) {
      expect((a as unknown as Record<string, unknown>).axes).toBeUndefined();
    }
  });
});

describe("minor-pair-annotations — one fact cannot fill two participant slots", () => {
  it("aliases/duplicated participants never double-count a single physical star", () => {
    const syntheticKnowledge = {
      ...knowledge,
      minorStructuralPairs: {
        ...knowledge.minorStructuralPairs,
        rules: [
          {
            id: "synthetic-self-pair",
            label: "Synthetic self-pair",
            participants: ["Tả Phụ", "Tả Phụ"],
            match: { mode: "all" as const, allowedScopes: knowledge.minorStructuralPairs.scopePriority },
            tags: [],
            explanationKey: "pair.synthetic-self-pair",
            scoreMode: "annotation-only" as const,
          },
        ],
      },
    };
    const out = buildMinorPairAnnotations({
      frame: FRAME,
      factsByPalace: factsByPalaceOf([fact("f1", 0, "Tả Phụ")]),
      knowledge: syntheticKnowledge,
      diagnostics: emptySemanticDiagnostics(),
      focusPalaceIndex: 0,
    });
    expect(out.some((a) => a.explanationKey === "pair.synthetic-self-pair")).toBe(false);
  });
});
