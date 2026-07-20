/**
 * CLI: validate the Huyền Khí ontology. Exit 1 on any error. No network.
 *   npm run research:huyen-khi:validate-ontology
 */

import { validateOntology } from "../validate-ontology";

function main(): void {
  const result = validateOntology();
  const errors = result.issues.filter((i) => i.severity === "error");

  process.stdout.write(`Huyền Khí ontology validation\n`);
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);

  if (errors.length > 0) {
    process.stdout.write(`\n${errors.length} error(s):\n`);
    for (const issue of errors) {
      process.stdout.write(`  [${issue.code}] ${issue.file} ${issue.path}: ${issue.message}\n`);
    }
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`\nOK — schema-valid, references resolve, zero numeric keys, zero cross-school fallback.\n`);
}

main();
