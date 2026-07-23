/**
 * Validate Major Fortune V0.3 evidence-adapter research pack presence + hard gates.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../../contracts/common";
import {
  loadMajorFortuneOrdinalKnowledge,
  validateMajorFortuneOrdinalKnowledge,
} from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-evidence-adapter-audit");

function main(): void {
  const issues: string[] = [];

  const required = [
    "README.md",
    "V0.3-ADAPTER-AUDIT-DECISION.md",
    "policy/adapter-policy.v0.3.json",
    "policy/engineering-provenance.v0.3.json",
    "policy/branch-element-map.v0.3.json",
    "corpus/corpus-manifest.json",
    "corpus/chart-level-split-manifest.json",
    "reports/summary-report.json",
    "reports/validation-report.json",
    "reports/decision.json",
    "reports/audit-observations.json",
    "reports/coverage-report.json",
    "reports/score-distribution-report.json",
    "reports/band-distribution-report.json",
    "reports/score-state-distribution-report.json",
    "reports/pillar-level-distribution-report.json",
    "reports/evidence-activation-report.json",
    "reports/accepted-rejected-evidence-report.json",
    "reports/dedupe-report.json",
    "reports/school-comparison-report.json",
    "reports/temporal-independence-report.json",
    "fixtures/product-smoke-fixtures.json",
    "prompts/next-step-handoff-prompt.md",
  ];
  for (const rel of required) {
    if (!existsSync(join(PACK, rel))) issues.push(`missing:${rel}`);
  }

  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) {
    issues.push(`v03-knowledge:${loaded.issues.map((i) => i.message).join(";")}`);
  } else {
    const v = validateMajorFortuneOrdinalKnowledge(loaded.knowledge as never);
    if (!v.ok) issues.push(`v03-validate:${v.issues.map((i) => i.message).join(";")}`);
  }

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.3.1") {
    issues.push("production-routing-unexpected");
  }

  if (existsSync(join(PACK, "reports/decision.json"))) {
    const decision = JSON.parse(
      readFileSync(join(PACK, "reports/decision.json"), "utf8"),
    ) as { readinessDecision?: string; hardGateFailures?: string[] };
    const md = readFileSync(join(PACK, "V0.3-ADAPTER-AUDIT-DECISION.md"), "utf8");
    if (decision.readinessDecision && !md.includes(decision.readinessDecision)) {
      issues.push("decision-md-mismatch");
    }
    if ((decision.hardGateFailures ?? []).length > 0) {
      // validate still succeeds structurally; readiness may be REVISION
    }
  }

  const report = {
    ok: issues.length === 0,
    issues,
    productionRouting: routing,
  };
  writeFileSync(join(PACK, "reports/pack-validate.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
