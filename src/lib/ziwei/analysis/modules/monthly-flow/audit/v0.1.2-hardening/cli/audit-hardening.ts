import { writeMonthlyFlowV012HardeningPack } from "../write-pack";

function main(): void {
  const { decision, metrics } = writeMonthlyFlowV012HardeningPack();
  console.log(
    JSON.stringify(
      {
        readinessDecision: decision.readinessDecision,
        hardGateFailures: decision.hardGateFailures,
        chartMonthObservations: metrics.chartMonthObservations,
        domainObservations: metrics.domainObservations,
        monthStatus: metrics.monthStatus,
        anchorFidelityFailures: metrics.anchorFidelityFailures,
        productionFocusFallbackCount: metrics.productionFocusFallbackCount,
        healthUiExposureFailures: metrics.healthUiExposureFailures,
        currentMonthIdentityFailures: metrics.currentMonthIdentityFailures,
        domainMapFailures: metrics.domainMapFailures,
      },
      null,
      2,
    ),
  );
  if (decision.hardGateFailures.length > 0) process.exit(1);
}

main();
