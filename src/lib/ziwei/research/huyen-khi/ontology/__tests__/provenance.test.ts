import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import { validateOntology } from "../validate-ontology";
import { resolveClaimProvenance, resolveRuleProvenance } from "../resolve-claim";
import type { HuyenKhiOntology, HuyenKhiRule } from "../types";

function ontology(): HuyenKhiOntology {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) throw new Error("expected load");
  return loaded.ontology;
}

function ruleCiting(claimIds: string[]): HuyenKhiRule {
  return {
    ruleId: "HK-RULE-TRACE",
    version: "0.1.0",
    status: "draft",
    schoolProfile: "shared",
    specificity: "exact-star",
    subject: { kind: "major-star", id: "s" },
    conditions: [],
    effects: [{ dimension: "capacity", operation: "strengthen", magnitude: "light" }],
    stackingGroup: "g",
    sourceIds: ["HK-SRC-SPEC-001"],
    claimIds,
  };
}

describe("Huyền Khí ontology — claim locator traceability (A4, E)", () => {
  it("shipped claims satisfy the provenance policy (zero locator violations)", () => {
    const result = validateOntology();
    expect(result.summary.claimLocatorViolationCount).toBe(0);
    expect(result.issues.filter((i) => i.code === "claim-locator-violation")).toEqual([]);
  });

  it("A4: fullyTraceable is FALSE for a rule whose claim has no locator", () => {
    const o = ontology();
    // HK-CLM-UNRESOLVED-001 has no locator.
    const prov = resolveRuleProvenance(o, ruleCiting(["HK-CLM-UNRESOLVED-001"]));
    expect(prov.claims[0]?.hasLocator).toBe(false);
    expect(prov.fullyTraceable).toBe(false);
  });

  it("A4: fullyTraceable is TRUE only when every cited claim has a resolving locator", () => {
    const o = ontology();
    // HK-CLM-BOUNDARY-001 has an internal-specification locator with a resolving source.
    const prov = resolveRuleProvenance(o, ruleCiting(["HK-CLM-BOUNDARY-001"]));
    expect(prov.claims[0]?.hasLocator).toBe(true);
    expect(prov.fullyTraceable).toBe(true);
  });

  it("A4: a rule citing no claims is not fully traceable", () => {
    expect(resolveRuleProvenance(ontology(), ruleCiting([])).fullyTraceable).toBe(false);
  });

  it("§5: a claim locator's source must resolve AND be one of the claim's cited sources", () => {
    const prov = resolveClaimProvenance(ontology(), "HK-CLM-BOUNDARY-001");
    expect(prov?.locatorSourceResolved).toBe(true);
    expect(prov?.locatorSourceInClaimSources).toBe(true);
    expect(prov?.locatorFullyResolved).toBe(true);
  });

  it("§5: a source alone (no locator) is not fully traceable", () => {
    const prov = resolveClaimProvenance(ontology(), "HK-CLM-UNRESOLVED-001");
    expect(prov?.sources.length ?? 0).toBeGreaterThan(0); // a source exists…
    expect(prov?.hasLocator).toBe(false); // …but no locator
    expect(prov?.locatorFullyResolved).toBe(false);
  });

  it("§5: every shipped claim with a locator lists that locator source among its sources", () => {
    const o = ontology();
    for (const claim of o.claimRegistry.claims) {
      if (!claim.locator) continue;
      expect(claim.sourceIds).toContain(claim.locator.sourceId);
    }
    expect(validateOntology().summary.claimLocatorViolationCount).toBe(0);
  });

  it("claim provenance policy never auto-resolves contradictions", () => {
    expect(ontology().claimProvenancePolicy.autoResolveContradictions).toBe(false);
  });

  it("E: source witnesses and transcriptions are separate identities", () => {
    const result = validateOntology();
    expect(result.summary.witnessSeparationViolationCount).toBe(0);
    const o = ontology();
    const transcription = o.sourceRegistry.sources.find((s) => s.kind === "classical-transcription");
    expect(transcription).toBeDefined();
    // A transcription is a DISTINCT source id that derives from the scan witness.
    expect(transcription!.sourceId).not.toBe(transcription!.derivedFromSourceId);
    const witness = o.sourceRegistry.sources.find((s) => s.sourceId === transcription!.derivedFromSourceId);
    expect(witness?.witnessKind).toBe("physical-scan");
  });

  it("F: a Trung Châu bibliography record exists, marked unavailable/manual-review", () => {
    const tc = ontology().sourceRegistry.sources.find((s) => s.sourceId === "HK-SRC-TC-001");
    expect(tc).toBeDefined();
    expect(tc!.status).toContain("manual-review-required");
  });
});
