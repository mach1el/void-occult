/**
 * Feature flag for palace-overview V1.
 * Default ON. Kill-switch via VITE_ZIWEI_PALACE_OVERVIEW_V1=false, or
 * ?ziweiPalaceOverviewV1=0 (persisted in sessionStorage) for a per-session
 * opt-out; ?ziweiPalaceOverviewV1=1 persists a per-session opt-in override.
 */
export const PALACE_OVERVIEW_FEATURE_FLAG = "ziweiPalaceOverviewV1";

function readSessionFlag(
  flag: string,
  envValue: string | undefined,
  defaultOn: boolean,
): boolean {
  if (envValue === "false") return false;
  if (envValue === "true" && typeof window === "undefined") return true;
  if (typeof window === "undefined") return defaultOn;
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(flag);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(flag, queryValue);
    }
    const stored = window.sessionStorage.getItem(flag);
    if (stored === "0") return false;
    if (stored === "1") return true;
    if (envValue === "true") return true;
    if (envValue === "false") return false;
    return defaultOn;
  } catch {
    return defaultOn;
  }
}

export function isPalaceOverviewV1Enabled(): boolean {
  return readSessionFlag(
    PALACE_OVERVIEW_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_PALACE_OVERVIEW_V1,
    true,
  );
}

/** @deprecated Kept for compatibility; Nam Phái V0.4 path used when V05=0. */
export const ANNUAL_AXES_V04_FEATURE_FLAG = "ziweiAnnualAxesV04";
export function isAnnualAxesV04Enabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_V04_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V04,
    true,
  );
}

/** @deprecated Removed from public routing. */
export const ANNUAL_AXES_V043_FEATURE_FLAG = "ziweiAnnualAxesV043";
export function isAnnualAxesV043Enabled(): boolean {
  return false;
}

/**
 * Annual Axes V0.5 — default ON.
 * Rollback: ?ziweiAnnualAxesV05=0 → V0.4.2
 */
export const ANNUAL_AXES_V05_FEATURE_FLAG = "ziweiAnnualAxesV05";
export function isAnnualAxesV05Enabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_V05_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V05,
    true,
  );
}

/** @deprecated V0.6 is not publicly selectable. */
export const ANNUAL_AXES_V06_FEATURE_FLAG = "ziweiAnnualAxesV06";
export function isAnnualAxesV06Enabled(): boolean {
  return false;
}

/**
 * Annual Axes V0.7 — default ON (rollback target when V08=0).
 * Rollback: ?ziweiAnnualAxesV07=0 → V0.5
 */
export const ANNUAL_AXES_V07_FEATURE_FLAG = "ziweiAnnualAxesV07";
export function isAnnualAxesV07Enabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_V07_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V07,
    true,
  );
}

/**
 * Annual Axes V0.8 — default ON (production Nam Phái engine).
 * Rollback: ?ziweiAnnualAxesV08=0 → V0.7
 */
export const ANNUAL_AXES_V08_FEATURE_FLAG = "ziweiAnnualAxesV08";
export function isAnnualAxesV08Enabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_V08_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V08,
    true,
  );
}

export const ANNUAL_AXES_V03_FEATURE_FLAG = "ziweiAnnualAxesV03";
export function isAnnualAxesV03Enabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_V03_FEATURE_FLAG,
    import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V03,
    true,
  );
}

/** @deprecated Use `ANNUAL_AXES_V03_FEATURE_FLAG` instead. */
export const ANNUAL_AXES_V02_FEATURE_FLAG = ANNUAL_AXES_V03_FEATURE_FLAG;
/** @deprecated Use `isAnnualAxesV03Enabled` instead. */
export const isAnnualAxesV02Enabled = isAnnualAxesV03Enabled;

export const HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG = "ziweiHuyenKhiPreviewV01";

export function isHuyenKhiPreviewV01Enabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01 === "false") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return import.meta.env.VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01 === "true";
  } catch {
    return false;
  }
}
