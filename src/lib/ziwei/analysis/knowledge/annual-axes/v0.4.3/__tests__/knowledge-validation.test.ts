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

  it("fails closed when layerPrecedence is empty or incomplete", () => {
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const emptyLayers: AnnualAxesKnowledgeV043NamPhai = structuredClone(loaded.knowledge);
    emptyLayers.dedupePolicy.layerPrecedence = [];
    expect(
      validateAnnualAxesKnowledgeV043NamPhai(emptyLayers, new Set(["SRC-AA-ENG-004"])).ok,
    ).toBe(false);

    const missingLayer: AnnualAxesKnowledgeV043NamPhai = structuredClone(loaded.knowledge);
    missingLayer.dedupePolicy.layerPrecedence = ["annual", "major-fortune"];
    expect(
      validateAnnualAxesKnowledgeV043NamPhai(missingLayer, new Set(["SRC-AA-ENG-004"])).ok,
    ).toBe(false);
  });
});

describe("Annual Axes V0.4.3 knowledge validation · malformed packs fail closed (§8)", () => {
  const SRC = new Set(["SRC-AA-ENG-004"]);
  function base(): AnnualAxesKnowledgeV043NamPhai {
    const loaded = loadAnnualAxesKnowledgeV043NamPhai();
    if (!loaded.ok) throw new Error("expected production pack to load");
    return structuredClone(loaded.knowledge);
  }
  function rejects(mutate: (k: AnnualAxesKnowledgeV043NamPhai) => void): boolean {
    const k = base();
    mutate(k);
    return validateAnnualAxesKnowledgeV043NamPhai(k, SRC).ok === false;
  }

  it("the pristine production pack validates", () => {
    expect(validateAnnualAxesKnowledgeV043NamPhai(base(), SRC).ok).toBe(true);
  });

  it("reordered layerPrecedence", () => {
    expect(rejects((k) => (k.dedupePolicy.layerPrecedence = ["major-fortune", "annual", "natal-activated"]))).toBe(true);
  });

  it("duplicated layer", () => {
    expect(rejects((k) => (k.dedupePolicy.layerPrecedence = ["annual", "annual", "natal-activated"]))).toBe(true);
  });

  it("missing geometry class", () => {
    expect(
      rejects(
        (k) =>
          (k.dedupePolicy.geometryPrecedence = [
            "direct-exact-target",
            "direct-head-focus",
            "tp4c-opposite",
            "tp4c-trine",
          ]),
      ),
    ).toBe(true);
  });

  it("duplicated geometry class", () => {
    expect(
      rejects(
        (k) =>
          (k.dedupePolicy.geometryPrecedence = [
            "direct-exact-target",
            "direct-exact-target",
            "tp4c-opposite",
            "tp4c-trine",
            "context-only",
          ]),
      ),
    ).toBe(true);
  });

  it("incomplete / reordered signed dedupe key", () => {
    expect(rejects((k) => (k.dedupePolicy.signedDedupeKey = ["domain"]))).toBe(true);
    expect(rejects((k) => (k.dedupePolicy.signedDedupeKey = ["physicalFactId", "domain"]))).toBe(true);
  });

  it("wrong stableTieBreak order or content", () => {
    expect(rejects((k) => (k.dedupePolicy.stableTieBreak = ["evidenceId", "ruleId"]))).toBe(true);
    expect(rejects((k) => (k.dedupePolicy.stableTieBreak = ["ruleId"]))).toBe(true);
  });

  it("duplicate groupBy key", () => {
    expect(
      rejects(
        (k) =>
          (k.aggregationProfile.diminishingReturns.groupBy = [
            "domain",
            "domain",
            "layer",
            "stackingGroup",
          ]),
      ),
    ).toBe(true);
  });

  it("non-production groupBy (missing geometryBucket)", () => {
    expect(
      rejects(
        (k) => (k.aggregationProfile.diminishingReturns.groupBy = ["domain", "layer", "stackingGroup"]),
      ),
    ).toBe(true);
  });

  it("invalid activation gate floor/range (sum > 1)", () => {
    expect(rejects((k) => ((k.aggregationProfile.activationGate.floor = 0.5), (k.aggregationProfile.activationGate.range = 0.85)))).toBe(true);
    expect(rejects((k) => (k.aggregationProfile.activationGate.range = 1.5))).toBe(true);
    expect(rejects((k) => (k.aggregationProfile.activationGate.floor = -0.1))).toBe(true);
  });

  it("non-integer / negative score precision", () => {
    expect(rejects((k) => (k.aggregationProfile.score.precision = 1.5))).toBe(true);
    expect(rejects((k) => (k.aggregationProfile.score.precision = -1))).toBe(true);
  });

  it("negative amplitude", () => {
    expect(rejects((k) => (k.aggregationProfile.score.amplitude = -1))).toBe(true);
  });

  it("neutral not strictly between minimum and maximum", () => {
    expect(rejects((k) => (k.aggregationProfile.score.neutral = 0))).toBe(true);
    expect(rejects((k) => (k.aggregationProfile.score.neutral = 100))).toBe(true);
  });

  it("non-positive normalization scale", () => {
    expect(rejects((k) => (k.aggregationProfile.normalization.supportScale = 0))).toBe(true);
  });

  it("unresolved source id", () => {
    expect(
      validateAnnualAxesKnowledgeV043NamPhai(base(), new Set(["OTHER-SRC"])).ok,
    ).toBe(false);
  });

  it("duplicate fixture domain", () => {
    expect(
      rejects((k) => {
        k.fixtureMatrix.directAnchors[1] = {
          ...k.fixtureMatrix.directAnchors[1]!,
          domain: k.fixtureMatrix.directAnchors[0]!.domain,
        };
      }),
    ).toBe(true);
  });
});
