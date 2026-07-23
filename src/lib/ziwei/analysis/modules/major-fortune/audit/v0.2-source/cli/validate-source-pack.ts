/**
 * CLI: validate Major Fortune V0.2 source-locator pack.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadSourceLocatorPackFromDisk, MF_V02_SOURCE_PACK_DIR } from "../load-source-locator-pack";
import { validateSourceLocatorPack } from "../validate-source-locator-pack";

function main(): void {
  const input = loadSourceLocatorPackFromDisk();
  const result = validateSourceLocatorPack(input);
  const decision = input.artifacts["reports/decision.json"] as {
    readinessDecision: string;
  };

  const report = {
    ok: result.ok,
    issueCount: result.issues.length,
    issues: result.issues,
    readinessDecision: decision.readinessDecision,
    sourceCount: result.derived?.sourceCount ?? 0,
    claimCount: result.derived?.claimCount ?? 0,
    eligibleScoringFamilyCount: result.derived?.eligibleScoringFamilyCount ?? 0,
    eligibleShapeFragmentCount: result.derived?.eligibleShapeFragmentCount ?? 0,
  };

  writeFileSync(
    join(MF_V02_SOURCE_PACK_DIR, "reports/validation-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (!result.ok) process.exit(1);
}

main();
