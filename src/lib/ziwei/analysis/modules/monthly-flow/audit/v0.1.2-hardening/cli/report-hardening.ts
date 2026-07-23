import { writeMonthlyFlowV012HardeningPack } from "../write-pack";

function main(): void {
  const { decision, metrics } = writeMonthlyFlowV012HardeningPack();
  console.log(
    JSON.stringify(
      {
        readinessDecision: decision.readinessDecision,
        chartMonthObservations: metrics.chartMonthObservations,
        domainObservations: metrics.domainObservations,
        monthStatus: metrics.monthStatus,
        hardGateFailures: decision.hardGateFailures,
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
}

main();
