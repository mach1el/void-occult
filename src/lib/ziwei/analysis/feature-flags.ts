/**
 * Feature flag for palace-overview V1.
 * Default ON. Kill-switch via VITE_ZIWEI_PALACE_OVERVIEW_V1=false, or
 * ?ziweiPalaceOverviewV1=0 (persisted in sessionStorage) for a per-session
 * opt-out; ?ziweiPalaceOverviewV1=1 persists a per-session opt-in override.
 */
export const PALACE_OVERVIEW_FEATURE_FLAG = "ziweiPalaceOverviewV1";

export function isPalaceOverviewV1Enabled(): boolean {
  if (import.meta.env.VITE_ZIWEI_PALACE_OVERVIEW_V1 === "false") {
    return false;
  }
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(PALACE_OVERVIEW_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(PALACE_OVERVIEW_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(PALACE_OVERVIEW_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return true;
  } catch {
    return true;
  }
}
