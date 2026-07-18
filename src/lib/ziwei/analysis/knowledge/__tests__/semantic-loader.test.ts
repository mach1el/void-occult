import { describe, expect, it } from "vitest";
import {
  loadPalaceOverviewSemanticKnowledgeV1,
  resetPalaceOverviewSemanticKnowledgeCache,
  validatePalaceOverviewSemanticKnowledge,
} from "../index";
import type { PalaceOverviewSemanticKnowledgeV1 } from "../schema";

describe("palace-overview semantic knowledge v1.2", () => {
  it("loads and validates all 7 catalogs", () => {
    resetPalaceOverviewSemanticKnowledgeCache();
    const result = loadPalaceOverviewSemanticKnowledgeV1();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.versionManifest.knowledgeVersion).toBe(
      "1.2.0-experimental",
    );
    expect(result.knowledge.menhThanContext.rules).toHaveLength(4);
    expect(result.knowledge.minorStructuralPairs.rules).toHaveLength(16);
    expect(result.knowledge.transformationTargetSemantics.rules).toHaveLength(14);
    expect(Object.keys(result.knowledge.traitPalaceProjection.palaces)).toHaveLength(12);
  });

  it("is independent from numeric knowledge validity — never affects it", () => {
    resetPalaceOverviewSemanticKnowledgeCache();
    const result = loadPalaceOverviewSemanticKnowledgeV1();
    // Presence of this module alone must not throw or require numeric
    // knowledge; both loaders are called independently in production code.
    expect(result.ok).toBe(true);
  });
});

function loadValid(): PalaceOverviewSemanticKnowledgeV1 {
  resetPalaceOverviewSemanticKnowledgeCache();
  const loaded = loadPalaceOverviewSemanticKnowledgeV1();
  if (!loaded.ok) throw new Error("expected valid semantic knowledge fixture");
  return loaded.knowledge;
}

describe("validatePalaceOverviewSemanticKnowledge — rejects invalid data", () => {
  it("duplicate rule id (menh-than context)", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      menhThanContext: {
        ...k.menhThanContext,
        rules: k.menhThanContext.rules.map((r, i) =>
          i === 1 ? { ...r, id: k.menhThanContext.rules[0]!.id } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("duplicate rule id"))).toBe(true);
  });

  it("pair/group rule with fewer than 2 participants", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      minorStructuralPairs: {
        ...k.minorStructuralPairs,
        rules: k.minorStructuralPairs.rules.map((r, i) =>
          i === 0 ? { ...r, participants: [r.participants[0]!] } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes(">= 2 participants"))).toBe(true);
  });

  it("duplicate participant in a pair rule", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      minorStructuralPairs: {
        ...k.minorStructuralPairs,
        rules: k.minorStructuralPairs.rules.map((r, i) =>
          i === 0 ? { ...r, participants: [r.participants[0]!, r.participants[0]!] } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("duplicate participant"))).toBe(true);
  });

  it("unsupported scope in a pair rule's allowedScopes", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      minorStructuralPairs: {
        ...k.minorStructuralPairs,
        rules: k.minorStructuralPairs.rules.map((r, i) =>
          i === 0
            ? {
                ...r,
                match: {
                  ...r.match,
                  allowedScopes: [...r.match.allowedScopes, "galaxy-wide" as never],
                },
              }
            : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("unsupported scope"))).toBe(true);
  });

  it("scoreMode other than annotation-only", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      menhThanContext: {
        ...k.menhThanContext,
        rules: k.menhThanContext.rules.map((r, i) =>
          i === 0 ? { ...r, scoreMode: "scored" as never } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes('scoreMode must be "annotation-only"'))).toBe(
      true,
    );
  });

  it("semantic rule containing axes/multiplier is rejected", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      minorStructuralPairs: {
        ...k.minorStructuralPairs,
        rules: k.minorStructuralPairs.rules.map((r, i) =>
          i === 0 ? { ...r, axes: { support: 1, pressure: 0, stability: 0, activation: 0 } } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated as never);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes('must not define "axes"'))).toBe(true);
  });

  it("invalid Tứ Hóa transformation name", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      transformationTargetSemantics: {
        ...k.transformationTargetSemantics,
        rules: k.transformationTargetSemantics.rules.map((r, i) =>
          i === 0 ? { ...r, transformation: "Vượng" as never } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("invalid transformation"))).toBe(true);
  });

  it("target rule without traits", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      transformationTargetSemantics: {
        ...k.transformationTargetSemantics,
        rules: k.transformationTargetSemantics.rules.map((r, i) =>
          i === 0 ? { ...r, targetTraitsAny: [] } : r,
        ),
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("target rule missing traits"))).toBe(true);
  });

  it("duplicate trait in trait-palace-projection", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      traitPalaceProjection: {
        ...k.traitPalaceProjection,
        traits: [...k.traitPalaceProjection.traits, k.traitPalaceProjection.traits[0]!],
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("duplicate trait"))).toBe(true);
  });

  it("override referencing unknown trait/palace", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      traitPalaceProjection: {
        ...k.traitPalaceProjection,
        overrides: [
          ...k.traitPalaceProjection.overrides,
          { id: "bad-override", trait: "no-such-trait", palace: "No Such Palace", label: "x" },
        ],
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("unknown trait"))).toBe(true);
    expect(v.issues.some((i) => i.message.includes("unknown palace"))).toBe(true);
  });

  it("version-manifest mismatch against a catalog's own version", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      menhThanContext: { ...k.menhThanContext, version: "9.9.9-experimental" },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("version mismatch"))).toBe(true);
  });

  it("missing/unresolved source reference in sourceMapping", () => {
    const k = loadValid();
    const mutated = {
      ...k,
      sourceMapping: {
        ...k.sourceMapping,
        mappings: [
          ...k.sourceMapping.mappings,
          {
            dataFile: "made-up.json",
            semanticSourceIds: ["src-does-not-exist"],
            numericSourceIds: [],
          },
        ],
      },
    };
    const v = validatePalaceOverviewSemanticKnowledge(mutated);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.message.includes("unresolved semanticSourceId"))).toBe(true);
  });
});
