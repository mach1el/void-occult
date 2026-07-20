import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  loadHuyenKhiOntology,
  resetHuyenKhiOntologyCache,
} from "../load-ontology";
import { validateOntology } from "../validate-ontology";
import { validateAgainstSchema, type JsonSchema } from "../schema-validator";
import {
  ONTOLOGY_DIR,
  ONTOLOGY_SCHEMAS_DIR,
} from "../paths";
import { resolveClaimProvenance } from "../resolve-claim";

describe("Huyền Khí ontology — load & schema (§12, §14)", () => {
  it("loads deterministically and fails closed on nothing", () => {
    resetHuyenKhiOntologyCache();
    const result = loadHuyenKhiOntology();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ontology.sourceRegistry.sources.length).toBe(8);
    expect(result.ontology.claimRegistry.claims.length).toBe(5);
    expect(result.ontology.fixturePlan.fixtures.length).toBe(36);
    // V0.1 loads no effective rules.
    expect(result.ontology.rules.length).toBe(0);
  });

  it("every supplied source/claim/fixture validates against its schema", () => {
    const result = validateOntology();
    const schemaIssues = result.issues.filter((i) => i.code === "schema-invalid");
    expect(schemaIssues).toEqual([]);
  });

  it("passes the full ontology validation with zero errors", () => {
    const result = validateOntology();
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.summary.manifestComplete).toBe(true);
    expect(result.summary.versionConsistent).toBe(true);
    expect(result.summary.duplicateIdCount).toBe(0);
    expect(result.summary.unresolvedReferenceCount).toBe(0);
  });

  it("all claim source references resolve to registered sources", () => {
    const result = validateOntology();
    if (!result.ontology) throw new Error("expected ontology");
    for (const claim of result.ontology.claimRegistry.claims) {
      const provenance = resolveClaimProvenance(result.ontology, claim.claimId);
      expect(provenance).toBeDefined();
      expect(provenance!.missingSourceIds).toEqual([]);
    }
  });

  it("loaded ontology is deeply frozen (no mutation)", () => {
    const result = loadHuyenKhiOntology();
    if (!result.ok) throw new Error("expected load");
    expect(Object.isFrozen(result.ontology)).toBe(true);
    expect(Object.isFrozen(result.ontology.sourceRegistry.sources)).toBe(true);
    expect(Object.isFrozen(result.ontology.sourceRegistry.sources[0])).toBe(true);
    expect(() => {
      // @ts-expect-error — testing runtime immutability
      result.ontology.sourceRegistry.sources[0].sourceId = "mutated";
    }).toThrow();
  });

  it("the schema example catalogs themselves conform to their schema", () => {
    // The non-effective example rules validate against the rule schema — but
    // are NEVER loaded as knowledge (asserted in numeric-key-scan.test.ts).
    const ruleSchema = JSON.parse(
      readFileSync(path.join(ONTOLOGY_SCHEMAS_DIR, "rule.schema.v0.1.json"), "utf-8"),
    ) as JsonSchema;
    const example = JSON.parse(
      readFileSync(path.join(ONTOLOGY_DIR, "example-rules.NON-EFFECTIVE.v0.1.json"), "utf-8"),
    ) as { rules: unknown[] };
    for (const rule of example.rules) {
      expect(validateAgainstSchema(rule, ruleSchema, "$")).toEqual([]);
    }
  });

  it("every JSON file in the pack parses", () => {
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(abs));
        else if (entry.name.endsWith(".json")) out.push(abs);
      }
      return out;
    };
    for (const file of walk(ONTOLOGY_DIR)) {
      expect(() => JSON.parse(readFileSync(file, "utf-8"))).not.toThrow();
    }
  });
});
