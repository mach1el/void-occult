import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PACK_REL } from "../write-pack";

function main(): void {
  const pack = join(process.cwd(), PACK_REL);
  const decisionPath = join(pack, "reports/decision.json");
  if (!existsSync(decisionPath)) {
    console.error("missing decision.json — run audit first");
    process.exit(1);
  }
  const decision = JSON.parse(readFileSync(decisionPath, "utf8")) as {
    readinessDecision: string;
    hardGateFailures: string[];
  };
  const md = readFileSync(join(pack, "V0.1.2-PRODUCTION-HARDENING-DECISION.md"), "utf8");
  if (!md.includes(decision.readinessDecision)) {
    console.error("decision md mismatch");
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        readinessDecision: decision.readinessDecision,
        hardGateFailures: decision.hardGateFailures,
      },
      null,
      2,
    ),
  );
  if (decision.hardGateFailures.length > 0) process.exit(1);
}

main();
