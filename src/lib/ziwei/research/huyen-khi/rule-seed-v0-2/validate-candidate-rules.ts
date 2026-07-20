import { loadHuyenKhiOntology } from "../ontology/load-ontology";
import { validateRule } from "../ontology/validate-rule";
import type { ValidationIssue, ValidationResult } from "./types";

function issue(
  code: string,
  path: string,
  message: string,
): ValidationIssue {
  return { code, path, message, severity: "error" };
}

export function validateCandidateRules(data: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const rules = data?.rules?.rules;

  if (!Array.isArray(rules)) {
    return {
      valid: false,
      issues: [issue("RULE_ARRAY", "rules.rules", "rules must be an array")],
    };
  }

  if (data?.rules?.effective !== false) {
    issues.push(
      issue(
        "RULE_CATALOG_MUST_BE_NON_EFFECTIVE",
        "rules.effective",
        "candidate catalog must explicitly remain non-effective",
      ),
    );
  }

  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    issues.push(
      issue(
        "ONTOLOGY_INVALID",
        "ontology",
        "canonical ontology V0.1 failed to load; candidate validation fails closed",
      ),
    );
    return { valid: false, issues };
  }

  const knownRuleIds = new Set<string>();
  for (const [index, rule] of rules.entries()) {
    const ruleId = typeof rule?.ruleId === "string" ? rule.ruleId : "";
    if (!ruleId) {
      issues.push(issue("RULE_MISSING_ID", `rules[${index}]`, "missing ruleId"));
    } else if (knownRuleIds.has(ruleId)) {
      issues.push(
        issue("RULE_DUPLICATE_ID", `rules[${index}].ruleId`, `duplicate ruleId ${ruleId}`),
      );
    } else {
      knownRuleIds.add(ruleId);
    }
    if (rule?.effective !== undefined) {
      issues.push(
        issue(
          "RULE_STORED_EFFECTIVE_FLAG",
          `rules[${index}].effective`,
          "effective is a catalog boundary, not a candidate-rule field",
        ),
      );
    }
  }

  const knownSourceIds = new Set(
    loaded.ontology.sourceRegistry.sources.map((source) => source.sourceId),
  );
  const extractionSourceIds = new Set(
    (data?.extractions?.extractions ?? []).map((entry: any) => entry.sourceId),
  );

  rules.forEach((rule: unknown, index: number) => {
    for (const canonicalIssue of validateRule(rule, {
      symbolicDimensions: loaded.ontology.symbolicDimensions,
      compatibility: loaded.ontology.dimensionOperationCompatibility,
      knownRuleIds,
      file: "candidate-rules.NON-EFFECTIVE.v0.2.json",
    })) {
      issues.push({
        code: canonicalIssue.code,
        path: `rules[${index}]${canonicalIssue.path === "$" ? "" : canonicalIssue.path.slice(1)}`,
        message: canonicalIssue.message,
        severity: canonicalIssue.severity,
      });
    }

    const record = rule as Record<string, unknown>;
    for (const [sourceIndex, sourceId] of (
      Array.isArray(record.sourceIds) ? record.sourceIds : []
    ).entries()) {
      if (typeof sourceId !== "string" || !knownSourceIds.has(sourceId)) {
        issues.push(
          issue(
            "RULE_UNRESOLVED_SOURCE",
            `rules[${index}].sourceIds[${sourceIndex}]`,
            `source '${String(sourceId)}' is not registered in ontology V0.1`,
          ),
        );
      } else if (!extractionSourceIds.has(sourceId)) {
        issues.push(
          issue(
            "RULE_SOURCE_WITHOUT_EXTRACTION",
            `rules[${index}].sourceIds[${sourceIndex}]`,
            `source '${sourceId}' has no V0.2 extraction record`,
          ),
        );
      }
    }
  });

  return { valid: !issues.some((entry) => entry.severity === "error"), issues };
}
