/**
 * Verify SOURCE-COMPLETION-DECISION.md matches reports/decision.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join(process.cwd(), "research/major-fortune/v0.2-source-locator-completion");

function main(): void {
  const decision = JSON.parse(readFileSync(join(PACK, "reports/decision.json"), "utf8")) as {
    readinessDecision: string;
  };
  const md = readFileSync(join(PACK, "SOURCE-COMPLETION-DECISION.md"), "utf8");
  const expected = decision.readinessDecision;
  const ok = md.includes(`**\`${expected}\`**`) || md.includes(`**${expected}**`);
  const report = { readinessDecision: expected, markdownMatchesDecisionJson: ok, ok };
  writeFileSync(join(PACK, "reports/decision-check.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
}

main();
