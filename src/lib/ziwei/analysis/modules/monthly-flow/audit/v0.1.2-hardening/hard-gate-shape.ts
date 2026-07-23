/** Shared hard-gate zero targets for Monthly Flow V0.1.2 production hardening. */
export const hardGateShape = {
  determinismFailures: 0,
  scoreBoundFailures: 0,
  duplicatePhysicalFactFailures: 0,
  missingSourceIds: 0,
  providerSchoolMismatch: 0,
  fabricatedLeapMonthCount: 0,
  anchorFidelityFailures: 0,
  productionFocusFallbackCount: 0,
  healthUiExposureFailures: 0,
  currentMonthIdentityFailures: 0,
  domainMapFailures: 0,
} as const;

export type MonthlyFlowV012HardGateKey = keyof typeof hardGateShape;
