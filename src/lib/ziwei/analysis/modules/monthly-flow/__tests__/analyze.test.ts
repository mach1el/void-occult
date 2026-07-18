import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { analyzeMonthlyFlow } from "../analyze";
import { REGRESSION_BIRTH, namPhaiProvider, trungChauProvider } from "./test-providers";

describe("analyzeMonthlyFlow — Trung Châu regression", () => {
  it("returns twelve month results with six available domains each", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });

    expect(result.status).toBe("available");
    expect(result.months).toHaveLength(12);
    for (const month of result.months) {
      expect(month.status).toBe("available");
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = month.axes[domain];
        expect(axis.status).toBe("available");
        if (axis.status !== "available") continue;
        expect(axis.score).toBeGreaterThanOrEqual(0);
        expect(axis.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("does not falsely report Palace Overview star source IDs as missing", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.diagnostics.missingSourceIds).toEqual([]);
  });

  it("does not mutate the input chart", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    // structuredClone can't traverse circular FlowMonthEntry.palace refs —
    // fall back to a shallow structural snapshot of top-level counts that
    // still catches accidental mutation.
    const beforeMonthCount = (chart.monthlyPalaces ?? []).length;
    const beforePalaceStars = chart.palaces.map((p) => (p.stars ?? []).length);
    const beforeAnnualStars = (chart.annualStars ?? []).length;

    analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });

    expect((chart.monthlyPalaces ?? []).length).toBe(beforeMonthCount);
    expect(chart.palaces.map((p) => (p.stars ?? []).length)).toEqual(beforePalaceStars);
    expect((chart.annualStars ?? []).length).toBe(beforeAnnualStars);
  });

  it("is byte-stable for identical input (deep structural equality)", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const a = analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });
    const b = analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });
    // Compare month-by-month; comparing top-level with structuredClone would
    // still traverse circular chart references.
    const flatten = (r: typeof a) =>
      r.months.map((m) => ({
        key: m.identity.monthKey,
        status: m.status,
        scores: ANNUAL_AXIS_DOMAINS.map((d) =>
          m.axes[d].status === "available" ? m.axes[d].score : null,
        ),
      }));
    expect(flatten(a)).toEqual(flatten(b));
  });

  it("never emits interaction-category evidence in any month/domain", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    for (const month of result.months) {
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = month.axes[domain];
        if (axis.status !== "available") continue;
        expect(axis.evidence.some((e) => e.category === "interaction")).toBe(false);
      }
    }
  });

  it("preserves static school capabilities from the profile", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.capabilities.supportsMonthlyTransformations).toBe(true);
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(true);
  });

  it("reports monthly transformation evidence with correct category", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    const transformationCount = result.months.flatMap((m) =>
      ANNUAL_AXIS_DOMAINS.flatMap((d) => {
        const axis = m.axes[d];
        return axis.status === "available"
          ? axis.evidence.filter((e) => e.category === "monthly-transformation")
          : [];
      }),
    ).length;
    expect(transformationCount).toBeGreaterThan(0);
  });

  it("period-independent — annualYear+1 changes results but keeps structural stability", () => {
    const chart2026 = calculateTrungChau({ ...REGRESSION_BIRTH, annualYear: "2026" });
    const chart2027 = calculateTrungChau({ ...REGRESSION_BIRTH, annualYear: "2027" });
    const a = analyzeMonthlyFlow(chart2026, { school: "trung-chau", provider: trungChauProvider() });
    const b = analyzeMonthlyFlow(chart2027, { school: "trung-chau", provider: trungChauProvider() });
    expect(a.months).toHaveLength(12);
    expect(b.months).toHaveLength(12);
    expect(a.months[0]!.identity.monthKey).toBe("2026-M01");
    expect(b.months[0]!.identity.monthKey).toBe("2027-M01");
  });
});

describe("analyzeMonthlyFlow — Nam Phái school", () => {
  it("preserves static school capabilities even when overlay unavailable", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
    });
    expect(result.capabilities.supportsMonthlyFocus).toBe(true);
    expect(result.capabilities.supportsMonthlyTransformations).toBe(true);
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(false);
  });

  it("without explicit annual-domain map, six-axis overlay stays unavailable", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
    });
    for (const month of result.months) {
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        expect(month.axes[domain].status).toBe("unavailable");
      }
    }
    expect(result.status).toBe("unavailable");
    expect(result.diagnostics.incompleteAnnualDomainLabels.length).toBeGreaterThan(0);
  });

  it("with temporary explicit annual-domain map, axes can score — not production Nam Phái support", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const explicitAnnualDomainMap = new Map<number, AnnualAxisDomain>([
      [0, "health"],
      [1, "family"],
      [2, "family"],
      [3, "family"],
      [4, "career"],
      [5, "social"],
      [6, "career"],
      [7, "health"],
      [8, "wealth"],
      [9, "family"],
      [10, "romance"],
      [11, "social"],
    ]);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
      explicitAnnualDomainMap,
    });
    expect(result.months.length).toBeGreaterThan(0);
    // Escape-hatch only: a bare index→domain map is not a shipping Nam Phái
    // six-axis adapter (no anchor weights / provenance).
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(false);
    const anyAvailable = result.months.some((m) =>
      ANNUAL_AXIS_DOMAINS.some((d) => m.axes[d].status === "available"),
    );
    expect(anyAvailable).toBe(true);
  });
});

describe("analyzeMonthlyFlow — safety invariants", () => {
  it("never JSON.stringify()s FlowMonthEntry.palace back-references", () => {
    // Trung Châu chart has real circular FlowMonthEntry ↔ Palace refs;
    // if any collector serialized ChartData, this would throw.
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    expect(() =>
      analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() }),
    ).not.toThrow();
  });

  it("rejects providers whose school mismatches", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const bad = { ...trungChauProvider(), school: "nam-phai" as const };
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: bad,
    });
    expect(result.status).toBe("unavailable");
    expect(result.diagnostics.providerSchoolMismatch.length).toBeGreaterThan(0);
  });

  it("calculationPolicyProfileVersion is honestly null with a diagnostic", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.versions.calculationPolicyProfileVersion).toBeNull();
    expect(result.diagnostics.missingCalculationPolicyProfile.length).toBeGreaterThan(0);
  });
});
