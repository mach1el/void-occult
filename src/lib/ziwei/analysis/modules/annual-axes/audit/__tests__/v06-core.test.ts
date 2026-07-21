import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV06NamPhai } from "../../../../knowledge/annual-axes/v0.6";
import { layerFactorForEvidenceLayer } from "../../../../knowledge/annual-axes/v0.6/schema";
import { V06_CANDIDATES } from "../v06-types";

describe("annual-axes v0.6 core", () => {
  it("loads V0.6 knowledge with signedLayerFactors constraints", () => {
    const loaded = loadAnnualAxesKnowledgeV06NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const f = loaded.knowledge.bucketFormula.signedLayerFactors;
    expect(f.annual).toBe(1);
    expect(f.majorFortune).toBe(0);
    expect(f.global).toBe(0);
    expect(f.natalActivated).toBeGreaterThanOrEqual(0);
    expect(f.natalActivated).toBeLessThanOrEqual(1);
  });

  it("applies layer factors symmetrically and zeros major/global", () => {
    const factors = V06_CANDIDATES.find((c) => c.id === "ANNUAL-DOMINANT-35")!.signedLayerFactors;
    expect(layerFactorForEvidenceLayer("annual", factors)).toBe(1);
    expect(layerFactorForEvidenceLayer("natal-activated", factors)).toBe(0.35);
    expect(layerFactorForEvidenceLayer("major-fortune", factors)).toBe(0);
    expect(layerFactorForEvidenceLayer("global", factors)).toBe(0);
    const support = 10 * layerFactorForEvidenceLayer("natal-activated", factors);
    const pressure = 10 * layerFactorForEvidenceLayer("natal-activated", factors);
    expect(support).toBe(pressure);
  });

  it("control candidate is not selectable", () => {
    expect(V06_CANDIDATES.find((c) => c.id === "V05-CONTROL")?.selectable).toBe(false);
  });
});
