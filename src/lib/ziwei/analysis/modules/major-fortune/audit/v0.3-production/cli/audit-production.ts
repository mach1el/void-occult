/**
 * Run Major Fortune V0.3 production corpus audit and write research pack.
 */
import { writeMajorFortuneV03ProductionPack } from "../write-pack";

function main(): void {
  const { decision, metrics } = writeMajorFortuneV03ProductionPack();
  console.log(
    JSON.stringify(
      {
        readinessDecision: decision.readinessDecision,
        hardGateFailures: decision.hardGateFailures,
        chartCount: metrics.chartCount,
        cycleObservationCount: metrics.cycleObservationCount,
        bySchool: Object.fromEntries(
          Object.entries(metrics.schools).map(([k, s]) => [
            k,
            {
              observations: s.cycleObservationCount,
              score: s.score,
              meanContextCoverageWeight: s.meanContextCoverageWeight,
              meanScoringCoverageWeight: s.meanScoringCoverageWeight,
              directTransformationActivationCount: s.directTransformationActivationCount,
              outOfFrameTransformationCount: s.outOfFrameTransformationCount,
            },
          ]),
        ),
      },
      null,
      2,
    ),
  );
  if (decision.hardGateFailures.length > 0) process.exit(1);
}

main();
