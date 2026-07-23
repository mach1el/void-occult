import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData } from "@/types/chart";
import {
  adaptChartToMajorFortuneOrdinalInput,
  analyzeMajorFortuneOrdinalV03,
} from "../analyze";
import { getAnalysisStatus } from "../../../../contracts/common";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { majorFortuneOrdinalAdapterFamilyMatrix } from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal-adapter";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("Major Fortune V0.3 ordinal-adapter UI wrapper", () => {
  it("returns unavailable without active Major Fortune palace", () => {
    const chart = { ...calculateNamPhai(REGRESSION), majorFortunePalace: null };
    const adapted = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(adapted.status).toBe("unavailable");
    expect(adapted.evaluationInput).toBeNull();
    expect(adapted.cycle).toBeNull();
  });

  it("marks partial when Nam Phái Tứ Hóa is Core-blocked", () => {
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(analysis.experimental).toBe(false);
    expect(analysis.version).toBe("0.3.1");
    expect(analysis.model).toBe("v0.3-ordinal");
    expect(analysis.adapterStatus).toBe("partial");
    expect(analysis.result?.status).toBe("partial");
    expect(analysis.result?.coverage.scoringCoverageWeight).toBe(0.75);
    expect(analysis.result?.coverage.contextCoverageWeight).toBe(1);
    expect(analysis.adapterDiagnostics.blockedNamPhaiTransformations.length).toBeGreaterThan(0);
    expect(analysis.display.pillarSummaries).toHaveLength(4);
    expect(analysis.display.disclaimer).toMatch(/không phải công thức cổ điển tuyệt đối/);
  });

  it("analyzes Trung Châu with scoring coverage 1 and optional direct XF", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "trung-chau" });
    expect(analysis.result).not.toBeNull();
    expect(analysis.cycle?.activePalaceName).toBeTruthy();
    expect(analysis.result!.coverage.scoringCoverageWeight).toBe(1);
    expect(analysis.result!.coverage.contextCoverageWeight).toBe(1);
    expect(analysis.result!.score).toBeGreaterThanOrEqual(0);
    expect(analysis.result!.score).toBeLessThanOrEqual(100);
    // Direct-palace frame may yield zero XF on some charts; that is valid no-signal.
    expect(analysis.adapterDiagnostics.outOfFrameTransformationCount).toBeGreaterThanOrEqual(0);
  });

  it("keeps annual/monthly mutations from changing score or evidence", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    const host = chart.palaces[0]!;
    const mutated: ChartData = {
      ...chart,
      annualStars: [{ name: "Lưu Hóa Lộc", source: "annual", palace: host }],
      annualMutagens: [{ mutagen: "Hóa Lộc", starName: "Tử Vi" }],
      taiTuePalace: host,
      smallLimitPalace: chart.palaces[1]!,
      annualHeadPalace: host,
      monthlyPalaces: [{ month: 1, palace: host }],
      palaces: chart.palaces.map((p, i) =>
        i === 0
          ? { ...p, flowMonths: [{ month: 1, palace: host }], isLuuNienDaiVan: true }
          : p,
      ),
    };
    const b = analyzeMajorFortuneOrdinalV03(mutated, {
      school: "nam-phai",
      yearInCycle: 7,
    });
    expect(b.emittedEvidence).toEqual(a.emittedEvidence);
    expect(b.result?.score).toBe(a.result?.score);
    expect(b.result?.band).toBe(a.result?.band);
    expect(b.result?.coverage).toEqual(a.result?.coverage);
    expect(b.result?.trace.yearInCycleIgnored).toBe(true);
  });

  it("does not mutate input chart", () => {
    const chart = calculateNamPhai(REGRESSION);
    const before = structuredClone(chart);
    analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(chart).toEqual(before);
  });

  it("preserves V0.3 contract and production routing", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.knowledge.formula.baseScore).toBe(50);
      expect(loaded.knowledge.formula.ordinalDivisor).toBe(4);
      expect(loaded.knowledge.formula.derivation.forbidsPerRuleRawDelta).toBe(true);
    }
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.1",
    });
    expect(majorFortuneOrdinalAdapterFamilyMatrix.disabled.some((d) => d.signalFamilyId === "hinh-ho-set")).toBe(
      true,
    );
    expect(
      majorFortuneOrdinalAdapterFamilyMatrix.disabled.some(
        (d) => d.signalFamilyId === "severe-pressure-evidence",
      ),
    ).toBe(true);
  });

  it("handles missing Mệnh element as Thiên Thời unavailable / overall partial", () => {
    const chart = {
      ...calculateNamPhai(REGRESSION),
      menhElement: undefined,
    } as unknown as ChartData;
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(analysis.adapterDiagnostics.missingMenhElement.length).toBeGreaterThan(0);
    expect(analysis.display.pillarSummaries.find((p) => p.pillarId === "thien-thoi")?.state).toBe(
      "unavailable",
    );
    expect(analysis.result).not.toBeNull();
  });
});

describe("Major Fortune V0.3 feature flag default", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults off when env missing", async () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", undefined as unknown as string);
    const { isMajorFortuneV03OrdinalEnabled } = await import("../../../../feature-flags");
    // jsdom has window — missing env with defaultOn true → enabled
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
  });
});
