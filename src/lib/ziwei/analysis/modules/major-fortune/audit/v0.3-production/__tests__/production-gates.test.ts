import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { getAnalysisStatus } from "@/lib/ziwei/analysis/contracts/common";
import {
  isMajorFortuneV03OrdinalEnabled,
  MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";
import { analyzeMajorFortuneOrdinalV03 } from "@/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("Major Fortune V0.3 production status + flag", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults enabled and returns available 0.3.1", () => {
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.1",
    });
  });

  it("keeps monthly-flow rebuilding", () => {
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "unavailable",
      module: "monthly-flow",
      reason: "rebuilding",
    });
  });

  it("env false disables major-fortune status", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "false");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "unavailable",
      module: "major-fortune",
      reason: "rebuilding",
    });
  });

  it("query session override disables", () => {
    window.history.replaceState({}, "", `/?${MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG}=0`);
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });
});

describe("Major Fortune V0.3 production coverage semantics on live charts", () => {
  it("Nam Phái shows scoring 0.75 and context 1", () => {
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(analysis.evaluation).not.toBeNull();
    expect(analysis.evaluation!.coverage.contextCoverageWeight).toBe(1);
    expect(analysis.evaluation!.coverage.scoringCoverageWeight).toBe(0.75);
    expect(analysis.evaluation!.pillars["tu-hoa-sat-tinh"].level).toBeNull();
    expect(analysis.evaluation!.scoreState).toBe("partial-data");
  });

  it("Trung Châu reaches full scoring coverage when all pillar levels resolve", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "trung-chau" });
    expect(analysis.evaluation).not.toBeNull();
    const levels = Object.values(analysis.evaluation!.pillars).map((p) => p.level);
    if (levels.every((l) => l != null)) {
      expect(analysis.evaluation!.coverage.scoringCoverageWeight).toBe(1);
      expect(analysis.evaluation!.coverage.contextCoverageWeight).toBe(1);
    }
  });
});
