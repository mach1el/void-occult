/**
 * Validate Major Fortune V0.3 production-finalization research pack.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../../contracts/common";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import adapterPolicy from "../../../v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-production-finalization");

function main(): void {
  const issues: string[] = [];
  mkdirSync(join(PACK, "reports"), { recursive: true });

  const required = [
    "README.md",
    "V0.3-PRODUCTION-DECISION.md",
    "policy/adapter-policy.v0.3.json",
    "policy/adapter-policy-delta.v0.3.1.json",
    "corpus/corpus-identity.json",
    "reports/summary-report.json",
    "reports/validation-report.json",
    "reports/decision.json",
    "reports/coverage-report.json",
    "reports/transformation-activation-report.json",
    "reports/before-after-transformation-report.json",
    "reports/ui-production-proof-report.json",
  ];
  for (const rel of required) {
    if (!existsSync(join(PACK, rel))) issues.push(`missing:${rel}`);
  }

  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) issues.push("v03-knowledge-invalid");

  if (adapterPolicy.adapterVersion !== "0.3.1") {
    issues.push("adapter-version-not-0.3.1");
  }
  if (adapterPolicy.transformationFrame !== "direct-active-major-fortune-palace-only") {
    issues.push("transformation-frame-unexpected");
  }

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.3.2") {
    issues.push("production-routing-unexpected");
  }
  const monthly = getAnalysisStatus("monthly-flow");
  if (monthly.status !== "available" || monthly.version !== "0.1.2") {
    issues.push("monthly-flow-routing-changed");
  }

  if (existsSync(join(PACK, "reports/decision.json"))) {
    const decision = JSON.parse(
      readFileSync(join(PACK, "reports/decision.json"), "utf8"),
    ) as { readinessDecision?: string; hardGateFailures?: string[] };
    const md = readFileSync(join(PACK, "V0.3-PRODUCTION-DECISION.md"), "utf8");
    if (decision.readinessDecision && !md.includes(decision.readinessDecision)) {
      issues.push("decision-md-mismatch");
    }
    if ((decision.hardGateFailures ?? []).length > 0) {
      issues.push("decision-has-hard-gate-failures");
    }
    if (decision.readinessDecision !== "PROMOTE_MAJOR_FORTUNE_V03_TO_PRODUCTION") {
      issues.push("decision-not-promote");
    }
  }

  const report = { ok: issues.length === 0, issues, productionRouting: routing };
  writeFileSync(join(PACK, "reports/pack-validate.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
