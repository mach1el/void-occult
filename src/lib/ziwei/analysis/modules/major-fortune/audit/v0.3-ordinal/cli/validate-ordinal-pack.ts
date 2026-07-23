/**
 * Validate Major Fortune V0.3 ordinal research pack + knowledge contract.
 * Exit non-zero on failure.
 */
import Ajv from "ajv";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadMajorFortuneOrdinalKnowledge,
  validateMajorFortuneOrdinalKnowledge,
} from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { getAnalysisStatus } from "../../../../../contracts/common";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-ordinal-contract");
const REPORTS = join(PACK, "reports");

interface Issue {
  code: string;
  message: string;
}

function readJson(abs: string): unknown {
  return JSON.parse(readFileSync(abs, "utf8"));
}

function main(): void {
  const issues: Issue[] = [];
  const ajv = new Ajv({ allErrors: true, strict: false });

  const pairs: Array<[string, string]> = [
    ["governance/governance-decision.json", "schema/governance.schema.json"],
    ["contract/formula-contract.json", "schema/formula-contract.schema.json"],
    ["reports/decision.json", "schema/decision.schema.json"],
  ];

  for (const [dataRel, schemaRel] of pairs) {
    const dataPath = join(PACK, dataRel);
    const schemaPath = join(PACK, schemaRel);
    if (!existsSync(dataPath) || !existsSync(schemaPath)) {
      issues.push({ code: "missing-artifact", message: `${dataRel} or ${schemaRel}` });
      continue;
    }
    const validate = ajv.compile(readJson(schemaPath) as object);
    const ok = validate(readJson(dataPath));
    if (!ok) {
      issues.push({
        code: "schema-invalid",
        message: `${dataRel}: ${JSON.stringify(validate.errors)}`,
      });
    }
  }

  const required = [
    "README.md",
    "V0.3-ORDINAL-CONTRACT-DECISION.md",
    "contract/pillar-registry.json",
    "contract/bands.json",
    "policy/signal-family-policy.json",
    "policy/exclusion-registry.json",
    "policy/school-capability-matrix.json",
    "policy/cross-pillar-ownership.json",
    "prompts/next-step-handoff-prompt.md",
  ];
  for (const rel of required) {
    if (!existsSync(join(PACK, rel))) {
      issues.push({ code: "missing-artifact", message: rel });
    }
  }

  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) {
    for (const i of loaded.issues) {
      issues.push({ code: "knowledge-invalid", message: `${i.path}: ${i.message}` });
    }
  } else {
    const v = validateMajorFortuneOrdinalKnowledge(loaded.knowledge as never);
    if (!v.ok) {
      for (const i of v.issues) {
        issues.push({ code: "knowledge-invalid", message: `${i.path}: ${i.message}` });
      }
    }
    const budgetSum = loaded.knowledge.formula.pillars.reduce((s, p) => s + p.budget, 0);
    if (budgetSum !== 100) {
      issues.push({ code: "budget-sum", message: `expected 100 got ${budgetSum}` });
    }
    if (!loaded.knowledge.formula.derivation.forbidsPerRuleRawDelta) {
      issues.push({ code: "rawDelta-forbidden", message: "forbidsPerRuleRawDelta must be true" });
    }
  }

  const status = getAnalysisStatus("major-fortune");
  if (status.status !== "available" || status.version !== "0.3.1") {
    issues.push({
      code: "production-routing",
      message: `expected available/0.3.1, got ${JSON.stringify(status)}`,
    });
  }

  const decision = readJson(join(PACK, "reports/decision.json")) as {
    readinessDecision: string;
  };
  const md = readFileSync(join(PACK, "V0.3-ORDINAL-CONTRACT-DECISION.md"), "utf8");
  if (!md.includes(decision.readinessDecision)) {
    issues.push({
      code: "decision-mismatch",
      message: "decision markdown missing readinessDecision token",
    });
  }

  const report = {
    schemaVersion: "0.3.0",
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    readinessDecision: decision.readinessDecision,
    productionStatus: status,
  };
  writeFileSync(join(REPORTS, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
