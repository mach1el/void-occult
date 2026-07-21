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

/**
 * Feature flag for Annual Axes V0.4 (annual-delta model).
 * Default ON. Kill-switch via VITE_ZIWEI_ANNUAL_AXES_V04=false, or
 * `?ziweiAnnualAxesV04=0` (persisted in sessionStorage).
 */
export const ANNUAL_AXES_V04_FEATURE_FLAG = "ziweiAnnualAxesV04";

export function isAnnualAxesV04Enabled(): boolean {
  if (import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V04 === "true") {
    return true;
  }
  if (import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V04 === "false") {
    return false;
  }
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(ANNUAL_AXES_V04_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(ANNUAL_AXES_V04_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(ANNUAL_AXES_V04_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return true;
  } catch {
    return true;
  }
}

/**
 * Feature flag for Annual Axes V0.4.3 (90/10 spatial budget, experimental).
 * Default OFF. Opt-in via VITE_ZIWEI_ANNUAL_AXES_V043=true, or
 * `?ziweiAnnualAxesV043=1` (persisted in sessionStorage).
 */
export const ANNUAL_AXES_V043_FEATURE_FLAG = "ziweiAnnualAxesV043";

export function isAnnualAxesV043Enabled(): boolean {
  if (import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V043 === "true") {
    return true;
  }
  if (import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V043 === "false") {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(ANNUAL_AXES_V043_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(ANNUAL_AXES_V043_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(ANNUAL_AXES_V043_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Feature flag for Annual Axes V0.3 (head-centric Nam Phái + preserved
 * V0.2 Trung Châu). Default ON while PR #90 remains experimental.
 * Kill-switch via VITE_ZIWEI_ANNUAL_AXES_V03=false, or `?ziweiAnnualAxesV03=0`.
 *
 * Release decision for V0.4: prefer `isAnnualAxesV04Enabled()` (default off).
 */
export const ANNUAL_AXES_V03_FEATURE_FLAG = "ziweiAnnualAxesV03";

export function isAnnualAxesV03Enabled(): boolean {
  if (import.meta.env.VITE_ZIWEI_ANNUAL_AXES_V03 === "false") {
    return false;
  }
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(ANNUAL_AXES_V03_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(ANNUAL_AXES_V03_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(ANNUAL_AXES_V03_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return true;
  } catch {
    return true;
  }
}

/** @deprecated Use `ANNUAL_AXES_V03_FEATURE_FLAG` instead. */
export const ANNUAL_AXES_V02_FEATURE_FLAG = ANNUAL_AXES_V03_FEATURE_FLAG;

/** @deprecated Use `isAnnualAxesV03Enabled` instead. */
export const isAnnualAxesV02Enabled = isAnnualAxesV03Enabled;

/**
 * Feature flag for Huyền Khí Research Preview V0.1 (natal factual UI only).
 * Default OFF — opt-in via VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01=true, or
 * `?ziweiHuyenKhiPreviewV01=1` (persisted in sessionStorage).
 */
export const HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG = "ziweiHuyenKhiPreviewV01";

export function isHuyenKhiPreviewV01Enabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01 === "false") {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG);

    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(
        HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
        queryValue,
      );
    }

    const stored = window.sessionStorage.getItem(
      HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
    );

    if (stored === "0") return false;
    if (stored === "1") return true;

    return (
      import.meta.env.VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01 === "true"
    );
  } catch {
    return false;
  }
}
