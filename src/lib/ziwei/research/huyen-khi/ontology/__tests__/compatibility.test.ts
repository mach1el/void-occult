import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import { isCompatible } from "../validate-compatibility";
import { validateRule, type ValidateRuleContext } from "../validate-rule";
import type {
  HuyenKhiDimension,
  HuyenKhiOperation,
  HuyenKhiRule,
} from "../types";

function ctx(): ValidateRuleContext {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) throw new Error("expected load");
  return {
    symbolicDimensions: loaded.ontology.symbolicDimensions,
    compatibility: loaded.ontology.dimensionOperationCompatibility,
  };
}

const ALLOWED: Record<HuyenKhiDimension, HuyenKhiOperation[]> = {
  capacity: ["strengthen", "weaken", "nourish", "deplete", "transform"],
  coherence: ["stabilize", "destabilize", "transform"],
  expression: ["block", "restrict", "release", "transform"],
  regulation: ["regulate", "overwhelm", "transform"],
  tendency: ["classify", "orient"],
};

const ALL_OPERATIONS: HuyenKhiOperation[] = [
  "strengthen", "weaken", "stabilize", "destabilize", "block", "restrict",
  "release", "nourish", "deplete", "regulate", "overwhelm", "transform",
  "classify", "orient",
];

function ruleWith(dimension: HuyenKhiDimension, operation: HuyenKhiOperation): HuyenKhiRule {
  return {
    ruleId: "HK-RULE-COMPAT",
    version: "0.1.0",
    status: "draft",
    schoolProfile: "shared",
    specificity: "exact-star",
    subject: { kind: "major-star", id: "s" },
    conditions: [],
    effects: [{ dimension, operation, magnitude: "light" }],
    stackingGroup: "g",
    sourceIds: ["HK-SRC-SPEC-001"],
  };
}

describe("Huyền Khí ontology — operation/dimension compatibility (D)", () => {
  it("declared compatibility matches the spec minimum", () => {
    const c = ctx().compatibility;
    for (const dim of Object.keys(ALLOWED) as HuyenKhiDimension[]) {
      expect([...c.compatibility[dim]].sort()).toEqual([...ALLOWED[dim]].sort());
    }
  });

  it("EXHAUSTIVE: every (dimension, operation) pair is allowed iff declared", () => {
    const c = ctx().compatibility;
    for (const dim of Object.keys(ALLOWED) as HuyenKhiDimension[]) {
      for (const op of ALL_OPERATIONS) {
        const expected = ALLOWED[dim].includes(op);
        expect(isCompatible(c, dim, op)).toBe(expected);
      }
    }
  });

  it("runtime rule validation rejects an incompatible pair (never coerces)", () => {
    // tendency accepts only classify/orient — strengthen is invalid.
    const issues = validateRule(ruleWith("tendency", "strengthen"), ctx());
    expect(issues.some((i) => i.code === "incompatible-operation-dimension")).toBe(true);
  });

  it("runtime rule validation accepts a compatible pair", () => {
    const issues = validateRule(ruleWith("expression", "restrict"), ctx());
    expect(issues.filter((i) => i.code === "incompatible-operation-dimension")).toEqual([]);
  });
});
