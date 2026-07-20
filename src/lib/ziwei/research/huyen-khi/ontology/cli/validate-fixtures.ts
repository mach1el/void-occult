/**
 * CLI: validate every expert fixture (schema, no numeric keys, no personal
 * data) and print status counts. Exit 1 on error.
 *   npm run research:huyen-khi:validate-fixtures
 */

import { loadHuyenKhiOntology } from "../load-ontology";
import { countFixtureStatuses, promotionContext, validateFixture } from "../validate-fixture";

function main(): void {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    for (const issue of loaded.issues) {
      process.stdout.write(`  [${issue.code}] ${issue.file} ${issue.path}: ${issue.message}\n`);
    }
    process.exitCode = 1;
    return;
  }

  const plan = loaded.ontology.fixturePlan;
  const errors = plan.fixtures.flatMap((fixture, index) =>
    validateFixture(fixture, "expert-fixture-plan.v0.1.json", index).filter((i) => i.severity === "error"),
  );

  const counts = countFixtureStatuses(plan, promotionContext(loaded.ontology));
  process.stdout.write(`Huyền Khí fixtures\n${JSON.stringify(counts, null, 2)}\n`);

  if (errors.length > 0) {
    process.stdout.write(`\n${errors.length} error(s):\n`);
    for (const issue of errors) {
      process.stdout.write(`  [${issue.code}] ${issue.path}: ${issue.message}\n`);
    }
    process.exitCode = 1;
    return;
  }
  if (counts.total < 30) {
    process.stdout.write(`\nBlocked: ${counts.total} scenarios (< 30 minimum).\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`\nOK — ${counts.total} scenarios; ${counts.approvedForPromotion} approved (need 30 approved to unlock the symbolic evaluator phase).\n`);
}

main();
