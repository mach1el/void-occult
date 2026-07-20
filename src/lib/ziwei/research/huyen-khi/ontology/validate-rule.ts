/**
 * Single-rule contract validation (§4).
 *
 * A schema-valid rule is NOT automatically approved or effective. This checks
 * structural schema conformance, symbolic-vocabulary consistency against the
 * dimensions catalog, school explicitness, and the numeric-key ban. It does
 * NOT evaluate the rule (no evaluator in V0.1).
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { ONTOLOGY_SCHEMAS_DIR } from "./paths";
import { validateAgainstSchema, type JsonSchema } from "./schema-validator";
import { scanForbiddenScoringKeys } from "./numeric-key-scan";
import { isCompatible } from "./validate-compatibility";
import type {
  HuyenKhiDimensionOperationCompatibility,
  HuyenKhiRule,
  HuyenKhiSymbolicDimensions,
  HuyenKhiValidationIssue,
} from "./types";

let ruleSchema: JsonSchema | null = null;
function getRuleSchema(): JsonSchema {
  if (!ruleSchema) {
    ruleSchema = JSON.parse(
      readFileSync(path.join(ONTOLOGY_SCHEMAS_DIR, "rule.schema.v0.1.json"), "utf-8"),
    ) as JsonSchema;
  }
  return ruleSchema;
}

export interface ValidateRuleContext {
  readonly symbolicDimensions: HuyenKhiSymbolicDimensions;
  readonly compatibility: HuyenKhiDimensionOperationCompatibility;
  /** Rule IDs known in the catalog — for suppression-target resolution. */
  readonly knownRuleIds?: ReadonlySet<string>;
  readonly file?: string;
}

export function validateRule(
  rule: unknown,
  ctx: ValidateRuleContext,
): HuyenKhiValidationIssue[] {
  const file = ctx.file ?? "rule";
  const issues: HuyenKhiValidationIssue[] = [];

  for (const v of validateAgainstSchema(rule, getRuleSchema(), "$")) {
    issues.push({ severity: "error", code: "schema-invalid", file, path: v.path, message: v.message });
  }
  // Numeric-key ban applies to every rule object.
  for (const hit of scanForbiddenScoringKeys(rule, "$")) {
    issues.push({ severity: "error", code: "numeric-scoring-key", file, path: hit.path, message: `forbidden scoring key '${hit.key}'` });
  }

  // Beyond schema: cross-check symbolic vocab against the dimensions catalog,
  // and require explicit provenance. Only if the object already looks rule-ish.
  if (issues.some((i) => i.code === "schema-invalid")) return issues;

  const r = rule as HuyenKhiRule;
  const dims = ctx.symbolicDimensions;
  const validOps = new Set(dims.effectOperations);
  const validMags = new Set(dims.magnitudeVocabulary);
  const validDims = new Set(Object.keys(dims.dimensions));

  r.effects.forEach((effect, index) => {
    if (!validDims.has(effect.dimension)) {
      issues.push({ severity: "error", code: "unknown-dimension", file, path: `$.effects[${index}].dimension`, message: `dimension '${effect.dimension}' not in catalog` });
    }
    if (!validOps.has(effect.operation)) {
      issues.push({ severity: "error", code: "unknown-operation", file, path: `$.effects[${index}].operation`, message: `operation '${effect.operation}' not in catalog` });
    }
    if (!validMags.has(effect.magnitude)) {
      issues.push({ severity: "error", code: "unknown-magnitude", file, path: `$.effects[${index}].magnitude`, message: `magnitude '${effect.magnitude}' not in catalog` });
    }
    // Phase D: reject incompatible (dimension, operation) — never coerce.
    if (
      validDims.has(effect.dimension) &&
      validOps.has(effect.operation) &&
      !isCompatible(ctx.compatibility, effect.dimension, effect.operation)
    ) {
      issues.push({ severity: "error", code: "incompatible-operation-dimension", file, path: `$.effects[${index}]`, message: `operation '${effect.operation}' is not compatible with dimension '${effect.dimension}'` });
    }
  });

  // Provenance: every effective rule needs at least one source (schema already
  // enforces minItems:1) — flag empty explicitly for clearer reports.
  if (r.sourceIds.length === 0) {
    issues.push({ severity: "error", code: "missing-source", file, path: "$.sourceIds", message: "rule has no source" });
  }

  // Suppression targets, when declared, must reference a known rule id.
  if (ctx.knownRuleIds) {
    for (const [index, id] of (r.suppressesRuleIds ?? []).entries()) {
      if (!ctx.knownRuleIds.has(id)) {
        issues.push({ severity: "error", code: "unresolved-suppression-target", file, path: `$.suppressesRuleIds[${index}]`, message: `suppressed rule '${id}' not found` });
      }
    }
  }

  return issues;
}
