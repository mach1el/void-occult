import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { getAnalysisStatus } from "@/lib/ziwei/analysis/contracts/common";
import {
  isMonthlyFlowV01Enabled,
  MONTHLY_FLOW_V01_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";

describe("Monthly Flow V0.1 production status + flag", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("feature defaults enabled", () => {
    expect(isMonthlyFlowV01Enabled()).toBe(true);
  });

  it("valid knowledge returns available@0.1.2", () => {
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.1.2",
    });
  });

  it("env false disables → rebuilding", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V01", "false");
    expect(isMonthlyFlowV01Enabled()).toBe(false);
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "unavailable",
      module: "monthly-flow",
      reason: "rebuilding",
    });
  });

  it("session query override disables", () => {
    window.history.replaceState({}, "", `/?${MONTHLY_FLOW_V01_FEATURE_FLAG}=0`);
    expect(isMonthlyFlowV01Enabled()).toBe(false);
  });

  it("session query override enables when env missing", () => {
    window.history.replaceState({}, "", `/?${MONTHLY_FLOW_V01_FEATURE_FLAG}=1`);
    expect(isMonthlyFlowV01Enabled()).toBe(true);
  });

  it("does not change other module statuses", () => {
    expect(getAnalysisStatus("palace-overview").status).toBe("available");
    expect(getAnalysisStatus("annual-axes", { school: "nam-phai" }).status).toBe(
      "available",
    );
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.2",
    });
  });
});
