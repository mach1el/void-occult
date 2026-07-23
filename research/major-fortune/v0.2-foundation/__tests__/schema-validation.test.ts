import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const FOUNDATION = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Major Fortune V0.2 research pack", () => {
  it("has required artifacts", () => {
    for (const rel of [
      "README.md",
      "V0.2-FOUNDATION-DECISION.md",
      "sources/source-registry.json",
      "claims/claim-registry.json",
      "contradictions/contradiction-log.json",
      "prompts/implementation-handoff-prompt.md",
      "policies/element-relation-policy.json",
      "policies/thai-tue-group-policy.json",
      "policies/natal-palace-group-policy.json",
      "policies/principal-star-dignity-policy.json",
      "policies/star-pattern-compatibility-policy.json",
      "policies/major-transformation-policy.json",
      "policies/benefic-malefic-policy.json",
      "policies/void-treatment-policy.json",
      "policies/natal-resilience-policy.json",
    ]) {
      expect(fs.existsSync(path.join(FOUNDATION, rel)), rel).toBe(true);
    }
  });

  it("registers intake as unverified internal_research_intake", () => {
    const sources = JSON.parse(
      fs.readFileSync(path.join(FOUNDATION, "sources/source-registry.json"), "utf8"),
    ) as {
      sources: Array<{
        sourceId: string;
        sourceType: string;
        qualityTier: string;
        allowedUsage: string[];
        prohibitedUsage: string[];
      }>;
    };
    const intake = sources.sources.find((s) => s.sourceId === "SRC-MF-V02-INTAKE-001");
    expect(intake?.sourceType).toBe("internal_research_intake");
    expect(intake?.qualityTier).toBe("unverified");
    expect(intake?.allowedUsage).toContain("candidate_formula_design");
    expect(intake?.prohibitedUsage).toEqual(
      expect.arrayContaining(["production_claim", "school_policy_override", "classical_attribution"]),
    );
  });

  it("decision document ends with RESEARCH_INCOMPLETE", () => {
    const md = fs.readFileSync(path.join(FOUNDATION, "V0.2-FOUNDATION-DECISION.md"), "utf8");
    expect(md).toContain("RESEARCH_INCOMPLETE");
    expect(md).not.toMatch(/PRODUCTION_READY/);
  });
});
