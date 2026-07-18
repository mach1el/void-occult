/**
 * Zi Wei Analysis — Phase 0 skeleton.
 * Calculation Core (engines) is separate; no scores here yet.
 */

export type {
  ZiweiAnalysisModule,
  ZiweiAnalysisStatus,
} from "./contracts/common";
export {
  getAnalysisStatus,
  ANALYSIS_MODULES,
} from "./contracts/common";

export type { PalaceOverviewContract } from "./contracts/palace-overview";
export { PALACE_OVERVIEW_MODULE } from "./contracts/palace-overview";

export type {
  AnnualAxesContract,
  AnnualAxisDomain,
} from "./contracts/annual-axes";
export {
  ANNUAL_AXES_MODULE,
  ANNUAL_AXIS_DOMAINS,
} from "./contracts/annual-axes";

export type { MajorFortuneContract } from "./contracts/major-fortune";
export { MAJOR_FORTUNE_MODULE } from "./contracts/major-fortune";

export type { MonthlyFlowContract } from "./contracts/monthly-flow";
export { MONTHLY_FLOW_MODULE } from "./contracts/monthly-flow";
