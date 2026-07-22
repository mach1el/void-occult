import { describe, expect, it, beforeEach } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import { analyzeAnnualAxes } from "../../analyze";
import { analyzeAnnualAxesNamPhaiV08 } from "../../nam-phai-v08/analyze";
import {
  resolveAnnualPalace,
  resolveSmallLimitPalace,
  annualIdentityOf,
} from "../../nam-phai-v08/resolve-annual-palace";
import { matchPalaceStars, clampPalaceRaw } from "../../nam-phai-v08/match-stars";
import { scoreV08Domain } from "../../nam-phai-v08/score-domain";
import {
  loadAnnualAxesKnowledgeV08NamPhai,
  type AnnualAxesKnowledgeV08NamPhai,
} from "../../../../knowledge/annual-axes/v0.8";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const loaded = loadAnnualAxesKnowledgeV08NamPhai();
if (!loaded.ok) throw new Error("v0.8 knowledge invalid");
const knowledge: AnnualAxesKnowledgeV08NamPhai = loaded.knowledge;

function withStars(chart: ChartData, palaceIndex: number, stars: ChartStar[]): ChartData {
  return {
    ...chart,
    palaces: chart.palaces.map((p) =>
      p.index === palaceIndex ? { ...p, stars: [...(p.stars ?? []), ...stars] } : p,
    ),
  };
}

describe("Annual Axes V0.8 palace-weighted core", () => {
  it("loads knowledge with exact 60/40 domain weights", () => {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const m = knowledge.domainMapping.domains[domain];
      expect(m.primary.weight).toBeCloseTo(0.6, 9);
      const coop = m.cooperating.reduce((s, c) => s + c.weight, 0);
      expect(coop).toBeCloseTo(0.4, 9);
    }
  });

  it("resolves annual palace identity, not natal name", () => {
    const chart = calculateNamPhai(REGRESSION);
    const head = chart.annualHeadPalace!;
    expect(annualIdentityOf(head, chart)).toBe("Mệnh");

    const tatAchNatal = chart.palaces.find((p) => p.name === "Tật Ách")!;
    expect(annualIdentityOf(tatAchNatal, chart)).not.toBe("Tật Ách");

    const luuTatAch = resolveAnnualPalace(chart, "Tật Ách");
    expect(luuTatAch.ok).toBe(true);
    if (!luuTatAch.ok) return;
    expect(luuTatAch.palace.annualPalaceName).toBe("Tật Ách");
    expect(luuTatAch.palace.natalPalaceName).not.toBe("Tật Ách");
  });

  it("maps the six domains to the configured Lưu Niên palaces", () => {
    const chart = calculateNamPhai(REGRESSION);
    const expectPalace = (name: string) => {
      const r = resolveAnnualPalace(chart, name);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.palace.annualPalaceName).toBe(name);
    };
    expectPalace("Tật Ách");
    expectPalace("Mệnh");
    expectPalace("Điền Trạch");
    expectPalace("Phúc Đức");
    expectPalace("Phụ Mẫu");
    expectPalace("Tài Bạch");
    expectPalace("Quan Lộc");
    expectPalace("Thiên Di");
    expectPalace("Nô Bộc");
    expectPalace("Phu Thê");
    expectPalace("Tử Tức");
    expect(resolveSmallLimitPalace(chart).ok).toBe(true);
  });

  it("applies exact star point classes", () => {
    expect(knowledge.pointClasses.classes.annualTransformStrongPositive).toBe(3);
    expect(knowledge.pointClasses.classes.annualTransformPositive).toBe(2);
    expect(knowledge.pointClasses.classes.annualTransformNegative).toBe(-3);
    expect(knowledge.pointClasses.classes.otherAnnualPositive).toBe(2);
    expect(knowledge.pointClasses.classes.otherAnnualNegative).toBe(-2);
    expect(knowledge.pointClasses.classes.staticPositive).toBe(1);
    expect(knowledge.pointClasses.classes.staticNegative).toBe(-1);
    expect(knowledge.pointClasses.classes.dignifiedStaticPositive).toBe(2);
  });

  it("scores Lưu Hóa Lộc +3 and Lưu Hóa Kỵ -3 on wealth", () => {
    const chart = calculateNamPhai(REGRESSION);
    const wealth = resolveAnnualPalace(chart, "Tài Bạch");
    expect(wealth.ok).toBe(true);
    if (!wealth.ok) return;

    const cleared: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === wealth.palace.palaceIndex ? { ...p, stars: [] } : p,
      ),
    };
    const withLoc = withStars(cleared, wealth.palace.palaceIndex, [
      { name: "Lưu Hóa Lộc", source: "annual-mutagen" },
    ]);
    const pos = matchPalaceStars({
      chart: withLoc,
      palaceIndex: wealth.palace.palaceIndex,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(pos.positivePoints).toBe(3);

    const withKy = withStars(cleared, wealth.palace.palaceIndex, [
      { name: "Lưu Hóa Kỵ", source: "annual-mutagen" },
    ]);
    const neg = matchPalaceStars({
      chart: withKy,
      palaceIndex: wealth.palace.palaceIndex,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(neg.negativePoints).toBe(3);
  });

  it("requires miếu/vượng for Vũ Khúc and Thái Âm", () => {
    const chart = calculateNamPhai(REGRESSION);
    const wealth = resolveAnnualPalace(chart, "Tài Bạch");
    if (!wealth.ok) throw new Error("missing");
    const cleared: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === wealth.palace.palaceIndex ? { ...p, stars: [] } : p,
      ),
    };
    const weak = matchPalaceStars({
      chart: withStars(cleared, wealth.palace.palaceIndex, [
        { name: "Vũ Khúc", brightness: "Hãm" },
      ]),
      palaceIndex: wealth.palace.palaceIndex,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(weak.positivePoints).toBe(0);

    const strong = matchPalaceStars({
      chart: withStars(cleared, wealth.palace.palaceIndex, [
        { name: "Vũ Khúc", brightness: "Miếu" },
      ]),
      palaceIndex: wealth.palace.palaceIndex,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(strong.positivePoints).toBe(2);
  });

  it("unknown stars have zero effect", () => {
    const chart = calculateNamPhai(REGRESSION);
    const wealth = resolveAnnualPalace(chart, "Tài Bạch");
    if (!wealth.ok) throw new Error("missing");
    const cleared: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === wealth.palace.palaceIndex ? { ...p, stars: [] } : p,
      ),
    };
    const matched = matchPalaceStars({
      chart: withStars(cleared, wealth.palace.palaceIndex, [
        { name: "Sao Không Tồn Tại", source: "annual" },
      ]),
      palaceIndex: wealth.palace.palaceIndex,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.matchedFacts).toHaveLength(0);
  });

  it("palace raw clamps to [-8,8]", () => {
    expect(clampPalaceRaw(20, 0, knowledge)).toBe(8);
    expect(clampPalaceRaw(0, 20, knowledge)).toBe(-8);
  });

  it("score reconstructs as 50 + 5 * adjusted raw and clamps to [10,90]", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxesNamPhaiV08(chart);
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") continue;
      const trace = axis.scoreTrace;
      expect(trace?.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
      if (trace?.formulaVersion !== "v0.8-annual-palace-weighted-score") continue;

      const rebuiltAxis =
        trace.primary.configuredWeight * trace.primary.palaceRaw +
        trace.cooperating.reduce((s, c) => s + c.configuredWeight * c.palaceRaw, 0);
      expect(rebuiltAxis).toBeCloseTo(trace.axisRawBeforeThaiTue, 9);

      const adj = Math.min(
        8,
        Math.max(-8, trace.axisRawBeforeThaiTue * trace.thaiTueMultiplier),
      );
      expect(adj).toBeCloseTo(trace.prominenceAdjustedRaw, 9);

      const raw = 50 + 5 * trace.prominenceAdjustedRaw;
      expect(raw).toBeCloseTo(trace.rawScore, 9);
      expect(trace.absoluteScore).toBe(axis.score);
      expect(axis.score).toBeGreaterThanOrEqual(10);
      expect(axis.score).toBeLessThanOrEqual(90);
    }
  });

  it("Thái Tuế multiplies magnitude by 1.25 and cannot create direction from zero", () => {
    expect(knowledge.pointClasses.thaiTueMultiplier).toBe(1.25);
    const chart = calculateNamPhai(REGRESSION);
    // Force empty star chart on mapped palaces for romance — score state no-signal.
    const empty = {
      ...chart,
      palaces: chart.palaces.map((p) => ({ ...p, stars: [] })),
      annualMutagens: [],
      natalMutagens: [],
      annualStars: [],
    };
    const scored = scoreV08Domain({ chart: empty, domain: "romance", knowledge });
    if (scored.trace.isThaiTueHighlighted) {
      expect(scored.trace.prominenceAdjustedRaw).toBe(0);
      expect(scored.score).toBe(50);
    }
  });

  it("no matched star gives score 50 + no-signal", () => {
    const chart = calculateNamPhai(REGRESSION);
    const empty = {
      ...chart,
      palaces: chart.palaces.map((p) => ({ ...p, stars: [] })),
      annualMutagens: [],
      natalMutagens: [],
      annualStars: [],
      taiTuePalace: null,
    };
    const scored = scoreV08Domain({ chart: empty, domain: "social", knowledge });
    expect(scored.score).toBe(50);
    expect(scored.scoreState).toBe("no-signal");
  });

  it("missing cooperating palace produces partial-data without killing the module", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken = { ...chart, smallLimitPalace: null, palaces: chart.palaces.map((p) => ({ ...p, isSmallLimitPalace: false })) };
    const scored = scoreV08Domain({ chart: broken, domain: "health", knowledge });
    expect(scored.trace.missingInputs.some((m) => m.includes("small-limit"))).toBe(true);
    expect(scored.scoreState).toBe("partial-data");
    const result = analyzeAnnualAxesNamPhaiV08(broken);
    expect(result.status).toBe("available");
  });

  it("generic TP4C palace not listed has no score effect", () => {
    const chart = calculateNamPhai(REGRESSION);
    const social = scoreV08Domain({ chart, domain: "social", knowledge });
    const listed = new Set([
      social.trace.primary.palaceIndex,
      ...social.trace.cooperating.map((c) => c.palaceIndex),
    ]);
    // Add a strong star on an unlisted palace — must not change social score.
    const unlisted = chart.palaces.find((p) => !listed.has(p.index))!;
    const boosted = withStars(chart, unlisted.index, [
      { name: "Lưu Hóa Lộc", source: "annual-mutagen" },
      { name: "Lưu Hóa Khoa", source: "annual-mutagen" },
    ]);
    const again = scoreV08Domain({ chart: boosted, domain: "social", knowledge });
    expect(again.score).toBe(social.score);
  });

  it("reversing star order preserves scores", () => {
    const chart = calculateNamPhai(REGRESSION);
    const forward = analyzeAnnualAxesNamPhaiV08(chart);
    const reversed = analyzeAnnualAxesNamPhaiV08({
      ...chart,
      palaces: chart.palaces.map((p) => ({
        ...p,
        stars: [...(p.stars ?? [])].reverse(),
      })),
    });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const a = forward.axes[domain];
      const b = reversed.axes[domain];
      expect(a.status).toBe("available");
      expect(b.status).toBe("available");
      if (a.status !== "available" || b.status !== "available") continue;
      expect(b.score).toBe(a.score);
    }
  });

  describe("routing", () => {
    beforeEach(() => {
      window.sessionStorage.clear();
      window.history.replaceState({}, "", "/");
    });

    it("default Nam Phái runs V0.8", () => {
      const chart = calculateNamPhai(REGRESSION);
      expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).versions.engineVersion).toBe(
        "0.8.0",
      );
    });

    it("V08=0 runs V0.7", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV08=0");
      const chart = calculateNamPhai(REGRESSION);
      expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).versions.engineVersion).toBe(
        "0.7.0",
      );
    });

    it("V07=0 runs V0.5", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV08=0&ziweiAnnualAxesV07=0");
      const chart = calculateNamPhai(REGRESSION);
      expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).versions.engineVersion).toBe(
        "0.5.0",
      );
    });

    it("V05=0 runs V0.4.2", () => {
      window.history.replaceState(
        {},
        "",
        "/?ziweiAnnualAxesV08=0&ziweiAnnualAxesV07=0&ziweiAnnualAxesV05=0",
      );
      const chart = calculateNamPhai(REGRESSION);
      expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).versions.engineVersion).toBe(
        "0.4.2",
      );
    });

    it("Trung Châu remains V0.2", () => {
      const chart = calculateTrungChau(REGRESSION);
      expect(analyzeAnnualAxes(chart, { school: "trung-chau" }).versions.engineVersion).toBe(
        "0.2.0",
      );
    });
  });

  it("contains no robust calibration fields in V0.8 knowledge", () => {
    const k = knowledge as unknown as Record<string, unknown>;
    expect(k.calibration).toBeUndefined();
    expect(k.bucketFormula).toBeUndefined();
    expect((knowledge.pointClasses as unknown as { robustCalibration?: unknown }).robustCalibration).toBeUndefined();
  });
});
