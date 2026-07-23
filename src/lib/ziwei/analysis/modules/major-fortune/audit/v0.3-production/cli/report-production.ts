/**
 * Re-write Major Fortune V0.3 production research pack reports.
 */
import { writeMajorFortuneV03ProductionPack } from "../write-pack";

function main(): void {
  const { decision } = writeMajorFortuneV03ProductionPack();
  console.log(JSON.stringify({ readinessDecision: decision.readinessDecision }, null, 2));
  if (decision.hardGateFailures.length > 0) process.exit(1);
}

main();
