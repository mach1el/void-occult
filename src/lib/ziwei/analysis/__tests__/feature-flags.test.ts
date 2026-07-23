import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isHuyenKhiPreviewV01Enabled,
  HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
  isAnnualAxesEnabled,
  isMajorFortuneV03OrdinalEnabled,
  MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
} from "../feature-flags";

describe("annual-axes feature flag defaults", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("module visibility defaults ON", () => {
    expect(isAnnualAxesEnabled()).toBe(true);
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

describe("isMajorFortuneV03OrdinalEnabled", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults on", () => {
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
  });

  it("env true enables", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "true");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
  });

  it("env false disables", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "false");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });

  it("env false + query 1 stays off", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "false");
    window.history.replaceState({}, "", `/?${MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG}=1`);
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });
});
