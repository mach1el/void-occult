import { describe, expect, it } from "vitest";
import {
  loadMajorFortuneKnowledgeV02,
  resetMajorFortuneKnowledgeV02Cache,
  validateBandContinuity,
  validateMajorFortuneKnowledgeV02,
  validateNatalPalaceGroupCoverage,
} from "../index";

describe("Major Fortune V0.2 knowledge", () => {
  it("loads, validates, and deep-freezes", () => {
    resetMajorFortuneKnowledgeV02Cache();
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(validateMajorFortuneKnowledgeV02(loaded.knowledge as never).ok).toBe(true);
    expect(Object.isFrozen(loaded.knowledge)).toBe(true);
    expect(() => {
      (loaded.knowledge as { manifest: { status: string } }).manifest.status = "hacked";
    }).toThrow();
  });

  it("enforces band continuity and pillar caps", () => {
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(validateBandContinuity(loaded.knowledge.bands.bands as never)).toEqual([]);
    const caps = Object.fromEntries(
      loaded.knowledge.formula.pillars.map((p) => [p.pillarId, p.cap]),
    );
    expect(caps).toEqual({
      "thien-thoi": 30,
      "dia-loi": 25,
      "nhan-hoa": 20,
      "tu-hoa-sat-tinh": 25,
    });
  });

  it("covers twelve natal palaces uniquely", () => {
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(validateNatalPalaceGroupCoverage(loaded.knowledge.natalPalaceGroups.groups as never)).toEqual(
      [],
    );
  });

  it("keeps executable rules free of unsourced approved doctrine", () => {
    const loaded = loadMajorFortuneKnowledgeV02();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    for (const rule of loaded.knowledge.rules.rules) {
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      expect(rule.claimIds.length).toBeGreaterThan(0);
      if (rule.status === "executable") {
        expect(rule.rawDelta).not.toBeNull();
      }
      expect(rule.knowledgeStatus).not.toBe("approved");
    }
  });
});
