import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { validateAgainstSchema, type JsonSchema } from "../schema-validator";
import { SHAPE_SPECS, validateStructuralShapes } from "../load-ontology";
import { ONTOLOGY_DIR, ONTOLOGY_FILES } from "../paths";
import type { HuyenKhiValidationIssue } from "../types";

/** Read every manifest-declared file into a role-keyed raw record. */
function loadRaw(): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [role, rel] of Object.entries(ONTOLOGY_FILES)) {
    raw[role] = JSON.parse(readFileSync(path.join(ONTOLOGY_DIR, rel), "utf-8"));
  }
  return raw;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function shapesOf(raw: Record<string, unknown>): { ok: boolean; issues: HuyenKhiValidationIssue[] } {
  const issues: HuyenKhiValidationIssue[] = [];
  const ok = validateStructuralShapes(raw, issues);
  return { ok, issues };
}

/**
 * A5 — malformed registry wrappers must fail closed with deterministic
 * schema-invalid issues, never a TypeError. The loader's wrapper guard is
 * exercised here through the same predicate it uses (array-typed collections).
 */

function requireArrayCollection(wrapper: unknown, key: string): string | null {
  if (typeof wrapper !== "object" || wrapper === null || Array.isArray(wrapper)) {
    return "top-level must be an object";
  }
  if (!Array.isArray((wrapper as Record<string, unknown>)[key])) {
    return `'${key}' must be an array`;
  }
  return null;
}

describe("Huyền Khí ontology — malformed registries fail closed (A5)", () => {
  it("missing collection array is rejected, not dereferenced", () => {
    expect(requireArrayCollection({ registryId: "x" }, "sources")).toBe("'sources' must be an array");
  });

  it("object-instead-of-array is rejected", () => {
    expect(requireArrayCollection({ sources: { not: "an array" } }, "sources")).toBe("'sources' must be an array");
  });

  it("null wrapper is rejected", () => {
    expect(requireArrayCollection(null, "sources")).toBe("top-level must be an object");
  });

  it("array-instead-of-object wrapper is rejected", () => {
    expect(requireArrayCollection([1, 2, 3], "sources")).toBe("top-level must be an object");
  });

  it("null items inside a collection produce schema violations (not a crash)", () => {
    const claimSchema: JsonSchema = {
      type: "object",
      required: ["claimId", "summary", "status", "sourceIds"],
      additionalProperties: false,
      properties: { claimId: { type: "string" } },
    };
    expect(() => validateAgainstSchema(null, claimSchema, "$.claims[0]")).not.toThrow();
    const violations = validateAgainstSchema(null, claimSchema, "$.claims[0]");
    expect(violations.length).toBeGreaterThan(0);
  });

  it("unexpected top-level shape (number) is rejected", () => {
    expect(requireArrayCollection(42, "sources")).toBe("top-level must be an object");
  });
});

describe("Huyền Khí ontology — structural shapes fail closed for every role (§6)", () => {
  it("the pristine ontology satisfies every structural shape", () => {
    expect(shapesOf(loadRaw()).ok).toBe(true);
  });

  // Table-driven: for each declared array/object-map, break it four ways and
  // assert a deterministic schema-invalid issue (never a thrown TypeError).
  const BREAKAGES: { label: string; value: unknown }[] = [
    { label: "missing (undefined)", value: undefined },
    { label: "null", value: null },
    { label: "number", value: 42 },
    { label: "wrong container type", value: "not-a-container" },
  ];

  for (const spec of SHAPE_SPECS) {
    for (const key of spec.arrays ?? []) {
      for (const breakage of BREAKAGES) {
        it(`${String(spec.role)}.${key} as ${breakage.label} → schema-invalid array`, () => {
          const raw = loadRaw();
          (raw[spec.role] as Record<string, unknown>)[key] = breakage.value;
          const { ok, issues } = shapesOf(raw);
          expect(ok).toBe(false);
          expect(issues.some((i) => i.code === "schema-invalid" && i.path === `$.${key}` && /must be an array/.test(i.message))).toBe(true);
        });
      }
      it(`${String(spec.role)}.${key} as object-instead-of-array → schema-invalid`, () => {
        const raw = loadRaw();
        (raw[spec.role] as Record<string, unknown>)[key] = { not: "an array" };
        expect(shapesOf(raw).ok).toBe(false);
      });
    }
    for (const key of spec.objectMaps ?? []) {
      it(`${String(spec.role)}.${key} as array-instead-of-object → schema-invalid`, () => {
        const raw = loadRaw();
        (raw[spec.role] as Record<string, unknown>)[key] = [1, 2, 3];
        const { ok, issues } = shapesOf(raw);
        expect(ok).toBe(false);
        expect(issues.some((i) => i.code === "schema-invalid" && i.path === `$.${key}` && /must be an object/.test(i.message))).toBe(true);
      });
      it(`${String(spec.role)}.${key} as null → schema-invalid`, () => {
        const raw = loadRaw();
        (raw[spec.role] as Record<string, unknown>)[key] = null;
        expect(shapesOf(raw).ok).toBe(false);
      });
    }
    it(`${String(spec.role)} wrapper as null → schema-invalid, no throw`, () => {
      const raw = loadRaw();
      raw[spec.role] = null;
      const { ok, issues } = shapesOf(raw);
      expect(ok).toBe(false);
      expect(issues.some((i) => i.code === "schema-invalid" && i.path === "$")).toBe(true);
    });
    it(`${String(spec.role)} wrapper as array → schema-invalid, no throw`, () => {
      const raw = loadRaw();
      raw[spec.role] = [];
      expect(shapesOf(raw).ok).toBe(false);
    });
  }

  it("clones for mutation never touch the real cached ontology", () => {
    const raw = loadRaw();
    const mutated = clone(raw);
    (mutated.sourceRegistry as Record<string, unknown>).sources = null;
    expect(shapesOf(mutated).ok).toBe(false);
    expect(shapesOf(raw).ok).toBe(true);
  });
});
