/**
 * Validate Major Fortune V0.3 adapter-ui research pack.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../../contracts/common";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-adapter-ui");

function main(): void {
  const issues: string[] = [];
  mkdirSync(join(PACK, "reports"), { recursive: true });

  const required = [
    "README.md",
    "V0.3-ADAPTER-UI-DECISION.md",
    "policy/adapter-policy.v0.3.json",
    "policy/engineering-provenance.v0.3.json",
    "policy/family-matrix.v0.3.json",
    "fixtures/product-smoke-manifest.json",
    "reports/summary-report.json",
    "reports/validation-report.json",
    "reports/decision.json",
    "reports/ui-proof-report.json",
    "prompts/next-step-handoff-prompt.md",
  ];
  for (const rel of required) {
    if (!existsSync(join(PACK, rel))) issues.push(`missing:${rel}`);
  }

  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) issues.push("v03-knowledge-invalid");

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.3.1") {
    issues.push("production-routing-unexpected");
  }

  if (existsSync(join(PACK, "reports/decision.json"))) {
    const decision = JSON.parse(
      readFileSync(join(PACK, "reports/decision.json"), "utf8"),
    ) as { readinessDecision?: string };
    const md = readFileSync(join(PACK, "V0.3-ADAPTER-UI-DECISION.md"), "utf8");
    if (decision.readinessDecision && !md.includes(decision.readinessDecision)) {
      issues.push("decision-md-mismatch");
    }
  }

  const report = { ok: issues.length === 0, issues, productionRouting: routing };
  writeFileSync(join(PACK, "reports/pack-validate.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
