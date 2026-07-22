/**
 * CLI: print a consolidated summary of the Annual Axes V0.9 research
 * foundation — gate pass/fail, contribution mass, and the final readiness
 * state from V0.9-FOUNDATION-DECISION.md. Read-only over already-generated
 * artifacts; run `npm run research:annual-axes-v09:audit-full` first if
 * missing/stale.
 *   npm run research:annual-axes-v09:report
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PACK_ROOT = join(process.cwd(), "research/annual-axes/v0.9-foundation");
const AUDIT_DIR = join(PACK_ROOT, "audit");

function readJson(name: string): any {
  const p = join(AUDIT_DIR, name);
  if (!existsSync(p)) {
    process.stderr.write(`Missing ${p}. Run \`npm run research:annual-axes-v09:audit-full\` first.\n`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

function main(): void {
  const gateEvaluation = readJson("gate-evaluation.v0.8.json");
  const contributionMass = readJson("contribution-mass.v0.8.json");
  const noSignalAnalysis = readJson("no-signal-analysis.v0.8.json");

  const passed = gateEvaluation.evaluations.filter((e: any) => e.status === "passed").length;
  const failed = gateEvaluation.evaluations.filter((e: any) => e.status !== "passed");

  process.stdout.write("Annual Axes V0.9 foundation — summary report\n\n");
  process.stdout.write(`Gates: ${passed}/${gateEvaluation.evaluations.length} passed\n`);
  for (const e of failed) {
    process.stdout.write(`  FAILED  ${e.metricId} (${e.scope}) = ${e.actual} ${e.operator} ${e.threshold}\n`);
  }
  process.stdout.write("\n");
  process.stdout.write(
    `Contribution mass ratio (positive/negative, weighted): ${contributionMass.overall.massRatioPositiveToNegative.toFixed(3)}\n`,
  );
  process.stdout.write(`No-signal rate: ${(noSignalAnalysis.noSignalRate * 100).toFixed(2)}%\n`);
  process.stdout.write(`Balanced-signal rate: ${(noSignalAnalysis.balancedSignalRate * 100).toFixed(2)}%\n`);

  const decisionPath = join(PACK_ROOT, "V0.9-FOUNDATION-DECISION.md");
  if (existsSync(decisionPath)) {
    const decisionDoc = readFileSync(decisionPath, "utf8");
    const match = decisionDoc.match(
      /READY_FOR_V0_9_CANDIDATE|RESEARCH_INCOMPLETE|V0_8_SHOULD_REMAIN_UNCHANGED|CALCULATION_CORE_BLOCKED/,
    );
    process.stdout.write(`\nFinal readiness state: ${match ? match[0] : "not found in decision doc"}\n`);
  }
}

main();
