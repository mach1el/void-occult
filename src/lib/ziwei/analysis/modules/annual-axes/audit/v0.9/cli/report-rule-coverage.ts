/**
 * CLI: summarize the generated rule-coverage.v0.8.json / capability-coverage.v0.8.json
 * artifacts. Read-only over already-generated JSON — run
 * `npm run research:annual-axes-v09:audit-full` first if these files are stale/missing.
 *   npm run research:annual-axes-v09:rule-coverage
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const AUDIT_DIR = join(process.cwd(), "research/annual-axes/v0.9-foundation/audit");

function readJson(name: string): any {
  const p = join(AUDIT_DIR, name);
  if (!existsSync(p)) {
    process.stderr.write(
      `Missing ${p}. Run \`npm run research:annual-axes-v09:audit-full\` first.\n`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function main(): void {
  const ruleCoverage: any[] = readJson("rule-coverage.v0.8.json");
  const capabilityCoverage: any[] = readJson("capability-coverage.v0.8.json");

  process.stdout.write("Annual Axes V0.9 rule coverage report\n\n");
  process.stdout.write(`Total production rules: ${ruleCoverage.length}\n`);
  process.stdout.write(`${JSON.stringify(countBy(ruleCoverage, (r) => r.coverageStatus), null, 2)}\n\n`);

  process.stdout.write(`Total capability catalog entries: ${capabilityCoverage.length}\n`);
  process.stdout.write(`${JSON.stringify(countBy(capabilityCoverage, (c) => c.coverageStatus), null, 2)}\n\n`);

  const unreachableSupported = capabilityCoverage.filter(
    (c) => c.supportStatus === "supported" && c.coverageStatus === "unreachable",
  );
  if (unreachableSupported.length > 0) {
    process.stdout.write(
      `${unreachableSupported.length} Calculation-Core-supported star(s) with zero referencing rules:\n`,
    );
    for (const c of unreachableSupported) {
      process.stdout.write(`  - ${c.exactStarName} (emitted ${c.emissionCount}x in corpus)\n`);
    }
  }
}

main();
