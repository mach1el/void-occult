import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isHuyenKhiPreviewV01Enabled,
  HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
  isAnnualAxesV043Enabled,
  isAnnualAxesV05Enabled,
  isAnnualAxesV07Enabled,
  isAnnualAxesV08Enabled,
} from "../feature-flags";

describe("annual-axes feature flag defaults", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("V0.4.3 stays off", () => {
    expect(isAnnualAxesV043Enabled()).toBe(false);
  });

  it("V0.5 / V0.7 / V0.8 default ON", () => {
    expect(isAnnualAxesV05Enabled()).toBe(true);
    expect(isAnnualAxesV07Enabled()).toBe(true);
    expect(isAnnualAxesV08Enabled()).toBe(true);
  });
});

describe("isHuyenKhiPreviewV01Enabled", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.resetModules();
    globalThis.window = {
      location: { search: "" },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
    } as any;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("SSR + env true => false", () => {
    globalThis.window = undefined as any;
    vi.stubEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01", "true");
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });

  it("env false + no query => false", () => {
    vi.stubEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01", "false");
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });

  it("env false + query 1 => false", () => {
    vi.stubEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01", "false");
    globalThis.window.location.search = `?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=1`;
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });

  it("env true + no override => true", () => {
    vi.stubEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01", "true");
    (globalThis.window.sessionStorage.getItem as any).mockReturnValue(null);
    expect(isHuyenKhiPreviewV01Enabled()).toBe(true);
  });

  it("env true + query 0 => false", () => {
    vi.stubEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01", "true");
    globalThis.window.location.search = `?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=0`;
    (globalThis.window.sessionStorage.getItem as any).mockReturnValue("0");
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
    expect(globalThis.window.sessionStorage.setItem).toHaveBeenCalledWith(
      HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
      "0",
    );
  });
});
