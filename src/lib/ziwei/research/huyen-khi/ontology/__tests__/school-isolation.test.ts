import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import { rulesVisibleToSchool } from "../validate-ontology";
import { validateRule, type ValidateRuleContext } from "../validate-rule";
import type { HuyenKhiRule } from "../types";

function syntheticRule(
  ruleId: string,
  schoolProfile: HuyenKhiRule["schoolProfile"],
): HuyenKhiRule {
  return {
    ruleId,
    version: "0.1.0",
    status: "draft",
    schoolProfile,
    specificity: "exact-star",
    subject: { kind: "major-star", id: "test-star" },
    conditions: [],
    effects: [{ dimension: "capacity", operation: "strengthen", magnitude: "light" }],
    stackingGroup: "test",
    sourceIds: ["HK-SRC-SPEC-001"],
  };
}

function ruleCtx(): ValidateRuleContext {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) throw new Error("expected load");
  return {
    symbolicDimensions: loaded.ontology.symbolicDimensions,
    compatibility: loaded.ontology.dimensionOperationCompatibility,
  };
}

describe("Huyền Khí ontology — school isolation (§7, §14)", () => {
  it("nam-phai sees shared + nam-phai only; never trung-chau", () => {
    const rules = [
      syntheticRule("HK-RULE-SHARED", "shared"),
      syntheticRule("HK-RULE-NP", "nam-phai"),
      syntheticRule("HK-RULE-TC", "trung-chau"),
    ];
    const visible = rulesVisibleToSchool(rules, "nam-phai").map((r) => r.ruleId);
    expect(visible).toEqual(["HK-RULE-SHARED", "HK-RULE-NP"]);
    expect(visible).not.toContain("HK-RULE-TC");
  });

  it("trung-chau sees shared + trung-chau only; never nam-phai", () => {
    const rules = [
      syntheticRule("HK-RULE-SHARED", "shared"),
      syntheticRule("HK-RULE-NP", "nam-phai"),
      syntheticRule("HK-RULE-TC", "trung-chau"),
    ];
    const visible = rulesVisibleToSchool(rules, "trung-chau").map((r) => r.ruleId);
    expect(visible).toEqual(["HK-RULE-SHARED", "HK-RULE-TC"]);
    expect(visible).not.toContain("HK-RULE-NP");
  });

  it("a rule with an invalid/missing school profile fails schema validation", () => {
    const bad = { ...syntheticRule("HK-RULE-BAD", "shared") } as Record<string, unknown>;
    delete bad.schoolProfile;
    const issues = validateRule(bad, ruleCtx());
    expect(issues.some((i) => i.code === "schema-invalid")).toBe(true);
  });

  it("policy fails closed on missing profile and forbids fallback", () => {
    const loaded = loadHuyenKhiOntology();
    if (!loaded.ok) throw new Error("expected load");
    const policy = loaded.ontology.schoolPolicy;
    expect(policy.missingProfileBehavior).toBe("invalid-knowledge");
    expect(policy.profiles["nam-phai"]?.ruleFallbackToOtherSchool).toBe(false);
    expect(policy.profiles["trung-chau"]?.ruleFallbackToOtherSchool).toBe(false);
  });

  it("shared rules must be explicitly marked shared (never inferred)", () => {
    const rules = [syntheticRule("HK-RULE-SHARED", "shared")];
    expect(rulesVisibleToSchool(rules, "nam-phai").map((r) => r.ruleId)).toEqual(["HK-RULE-SHARED"]);
    expect(rulesVisibleToSchool(rules, "trung-chau").map((r) => r.ruleId)).toEqual(["HK-RULE-SHARED"]);
  });
});
