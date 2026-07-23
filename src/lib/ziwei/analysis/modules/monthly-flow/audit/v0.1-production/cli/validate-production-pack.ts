/**
 * Validate Monthly Flow V0.1 production research pack presence + routing.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../../contracts/common";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../../../knowledge/monthly-flow";
import { PACK_REL } from "../write-pack";

function main(): void {
  const issues: string[] = [];
  const pack = join(process.cwd(), PACK_REL);
  mkdirSync(join(pack, "reports"), { recursive: true });

  const required = [
    "README.md",
    "V0.1-PRODUCTION-DECISION.md",
    "policy/domain-adapter-policy.md",
    "policy/provider-policy.md",
    "corpus/corpus-manifest.json",
    "reports/summary-report.json",
    "reports/validation-report.json",
    "reports/decision.json",
    "reports/coverage-report.json",
    "reports/ui-proof-report.json",
    "reports/decision-check.json",
  ];
  for (const rel of required) {
    if (!existsSync(join(pack, rel))) issues.push(`missing:${rel}`);
  }

  const loaded = loadMonthlyFlowScoringKnowledgeV0();
  if (!loaded.ok) issues.push("monthly-flow-knowledge-invalid");

  const routing = getAnalysisStatus("monthly-flow");
  if (routing.status !== "available" || routing.version !== "0.1.2") {
    issues.push("production-routing-unexpected");
  }

  if (existsSync(join(pack, "reports/decision.json"))) {
    const decision = JSON.parse(
      readFileSync(join(pack, "reports/decision.json"), "utf8"),
    ) as { readinessDecision?: string; hardGateFailures?: string[] };
    const md = readFileSync(join(pack, "V0.1-PRODUCTION-DECISION.md"), "utf8");
    if (decision.readinessDecision && !md.includes(decision.readinessDecision)) {
      issues.push("decision-md-mismatch");
    }
  }

  writeFileSync(
    join(pack, "reports/validate-cli-report.json"),
    `${JSON.stringify({ ok: issues.length === 0, issues }, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
