import { describe, expect, it } from "vitest";
import {
  loadAnnualAxesKnowledgeV043NamPhai,
  resetAnnualAxesKnowledgeV043NamPhaiCache,
  validateAnnualAxesKnowledgeV043NamPhai,
} from "../index";
import type { AnnualAxesKnowledgeV043NamPhai } from "../schema";

describe("Annual Axes V0.4.3 knowledge validation", () => {
  it("loads, validates, and deep-freezes the experimental bundle", () => {
    resetAnnualAxesKnowledgeV043NamPhaiCache();
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(Object.isFrozen(loaded.knowledge)).toBe(true);
    expect(Object.isFrozen(loaded.knowledge.spatialBudget)).toBe(true);
  });

  it("enforces the 90/10 signed budget and zero signed context channels", () => {
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const sb = loaded.knowledge.spatialBudget.signedBudget;
    const tol = loaded.knowledge.spatialBudget.weightTolerance;
    expect(Math.abs(sb.direct - 0.9)).toBeLessThanOrEqual(tol);
    expect(Math.abs(sb.tp4c - 0.1)).toBeLessThanOrEqual(tol);
    expect(Math.abs(sb.direct + sb.tp4c - 1)).toBeLessThanOrEqual(tol);
    expect(Math.abs(sb.globalAnnualClimate)).toBeLessThanOrEqual(tol);
    expect(Math.abs(sb.majorFortuneBackground)).toBeLessThanOrEqual(tol);
  });

  it("lists known geometry/layer precedence and six unique fixture domains", () => {
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const geo = loaded.knowledge.dedupePolicy.geometryPrecedence;
    expect(geo).toEqual([
      "direct-exact-target",
      "direct-head-focus",
      "tp4c-opposite",
      "tp4c-trine",
      "context-only",
    ]);
    const domains = loaded.knowledge.fixtureMatrix.directAnchors.map((a) => a.domain);
    expect(new Set(domains).size).toBe(6);
    expect(domains.sort()).toEqual(
      ["career", "family", "health", "romance", "social", "wealth"].sort(),
    );
  });

  it("fails closed when signed budgets no longer sum to 1", () => {
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const broken: AnnualAxesKnowledgeV043NamPhai = structuredClone(loaded.knowledge);
    broken.spatialBudget.signedBudget.direct = 0.5;
    broken.spatialBudget.signedBudget.tp4c = 0.5;
    // Still sum to 1 but direct != 0.9 — must fail.
    const result = validateAnnualAxesKnowledgeV043NamPhai(
      broken,
      new Set(["SRC-AA-ENG-004"]),
    );
    expect(result.ok).toBe(false);
  });
});
