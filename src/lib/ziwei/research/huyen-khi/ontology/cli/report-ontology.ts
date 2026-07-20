/**
 * CLI: generate the deterministic ontology reports.
 *   npm run research:huyen-khi:report-ontology
 */

import { ONTOLOGY_REPORTS_DIR } from "../paths";
import { writeReports } from "../reports/generate-reports";

function main(): void {
  const { written } = writeReports();
  process.stdout.write(`Wrote ${written.length} report(s) to ${ONTOLOGY_REPORTS_DIR}:\n`);
  for (const name of written) process.stdout.write(`  ${name}\n`);
}

main();
