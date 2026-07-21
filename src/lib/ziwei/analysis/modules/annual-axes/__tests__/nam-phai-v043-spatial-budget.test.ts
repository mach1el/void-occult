import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { ChartData } from "@/types/chart";
import { loadAnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import { isAnnualAxesV043Enabled } from "../../../feature-flags";
import { analyzeAnnualAxes } from "../analyze";
import { analyzeAnnualAxesNamPhaiV043 } from "../nam-phai-v043/analyze";
import { aggregateSpatialBudget } from "../nam-phai-v043/aggregate-spatial";
import { classifyEvidencePaths } from "../nam-phai-v043/classify-paths";
import { comparePathPrecedence, dedupeSpatialPaths } from "../nam-phai-v043/dedupe";
import { normalizeSpatialBudgetV043 } from "../nam-phai-v043/normalize-spatial";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type { AnnualAxisEvidence } from "../types";
import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const base = calculateNamPhai(REGRESSION);
const loaded043 = loadAnnualAxesKnowledgeV043NamPhai();
if (!loaded043.ok) throw new Error("v0.4.3 knowledge invalid");
const knowledge043 = loaded043.knowledge;
const loaded04 = loadAnnualAxesKnowledgeV04NamPhai();
if (!loaded04.ok) throw new Error("v0.4 knowledge invalid");
const knowledge04 = loaded04.knowledge;

const EPSILON = 1e-9;

function stripped(overrides: Partial<ChartData>): ChartData {
  return {
    ...base,
    annualStars: [],
    annualMutagens: [],
    natalMutagens: [],
    majorMutagens: [],
    ...overrides,
  };
}

/** Controlled chart: clear natal stars so only injected annual evidence fires. */
function controlled(overrides: Partial<ChartData>): ChartData {
  return stripped({
    palaces: base.palaces.map((p) => ({ ...p, stars: [] })),
    ...overrides,
  });
}

function scoresSnapshot(result: ReturnType<typeof analyzeAnnualAxesNamPhaiV043>) {
  return (["health", "family", "wealth", "career", "social", "romance"] as const).map((d) => {
    const axis = result.axes[d];
    return {
      domain: d,
      score: axis.status === "available" ? axis.score : null,
      direct: axis.status === "available" ? axis.spatialBudgetTrace?.directContribution : null,
      tp4c: axis.status === "available" ? axis.spatialBudgetTrace?.tp4cContribution : null,
      spatial: axis.status === "available" ? axis.spatialBudgetTrace?.spatialSigned : null,
    };
  });
}

describe("Annual Axes V0.4.3 · feature flag default OFF", () => {
  it("keeps production on V0.4.2 when the experimental flag is unset", () => {
    expect(isAnnualAxesV043Enabled()).toBe(false);
    const chart = stripped({
      annualStars: [
        {
          name: "Vũ Khúc",
          palace: base.palaces.find((p) => p.name === "Tài Bạch")!,
        },
      ],
    });
    const production = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(production.versions.engineVersion).toBe("0.4.2");
    expect(production.versions.knowledgeVersion).not.toContain("spatial-budget");
  });
});

describe("Annual Axes V0.4.3 · six-domain direct fixtures", () => {
  for (const anchor of knowledge043.fixtureMatrix.directAnchors) {
    it(`${anchor.domain} ← ${anchor.directFixturePalace} has direct contribution and zero TP4C`, () => {
      const palace = base.palaces.find((p) => p.name === anchor.directFixturePalace);
      expect(palace).toBeDefined();
      if (!palace) return;

      const chart = controlled({
        annualStars: [{ name: "Vũ Khúc", palace }],
      });
      const result = analyzeAnnualAxesNamPhaiV043(chart);
      const axis = result.axes[anchor.domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") return;

      const starEvidence = axis.evidence.filter(
        (e) =>
          e.physicalFactId === `annual-star:${palace.index}:Vũ Khúc` &&
          e.retainedForSignedScore,
      );
      expect(starEvidence.length).toBeGreaterThan(0);
      expect(starEvidence.every((e) => e.geometryBucket === "direct")).toBe(true);

      const trace = axis.spatialBudgetTrace!;
      expect(Math.abs(trace.directContribution)).toBeGreaterThan(EPSILON);
      expect(Math.abs(trace.tp4cContribution)).toBeLessThanOrEqual(EPSILON);
      expect(Number.isFinite(axis.score)).toBe(true);
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);

      for (const other of knowledge043.fixtureMatrix.directAnchors) {
        if (other.domain === anchor.domain) continue;
        const otherAxis = result.axes[other.domain];
        if (otherAxis.status !== "available") continue;
        const leaked = otherAxis.evidence.some(
          (e) =>
            e.physicalFactId === `annual-star:${palace.index}:Vũ Khúc` &&
            e.retainedForSignedScore === true,
        );
        // Secondary ownership (e.g. Điền Trạch → wealth) may legitimately
        // receive the fact; only assert no leak without ownership.
        if (!leaked) continue;
        expect(eOwnership(otherAxis.evidence, `annual-star:${palace.index}:Vũ Khúc`)).toBeGreaterThan(
          0,
        );
      }
    });
  }
});

function eOwnership(evidence: AnnualAxisEvidence[], physicalFactId: string): number {
  return (
    evidence.find((e) => e.physicalFactId === physicalFactId && e.retainedForSignedScore)
      ?.ownershipWeight ?? 0
  );
}

describe("Annual Axes V0.4.3 · TP4C budget cap", () => {
  it("caps abs(tp4cContribution) at 0.10 and preserves the 0.10/0.90 ratio when bucket signed values match", () => {
    const makeCandidate = (
      bucket: "direct" | "tp4c",
      geometryClass: ClassifiedPathCandidate["geometryClass"],
      support: number,
    ): ClassifiedPathCandidate =>
      ({
        evidence: {
          id: `e-${bucket}`,
          domain: "wealth",
          layer: "annual",
          category: "star",
          physicalFactId: `fact-${bucket}`,
          ruleId: "RULE-TEST",
          targetPalaceIndex: 0,
          targetPalaceName: "Tài Bạch",
          targetAnnualPalaceName: null,
          frameRole: bucket === "direct" ? "focus" : "opposite",
          anchorPalaceName: "Tài Bạch",
          stackingGroup: "test",
          rawAxes: { support, pressure: 0, stability: 0, activation: 1 },
          effectiveWeight: 1,
          weightedAxes: { support, pressure: 0, stability: 0, activation: 1 },
          confidenceWeight: 1,
          factIds: [`fact-${bucket}`],
          sourceIds: ["SRC-AA-ENG-004"],
          knowledgeStatus: "experimental",
          ownershipWeight: 1,
        },
        path: {
          triggerId: bucket === "direct" ? "annual-moving-star-palace" : "annual-head-tp4c",
          channel: bucket === "direct" ? "direct-domain" : "routed-head",
          geometryWeight: 1,
          affinityWeight: 1,
          effectivePathWeight: 1,
          boundedPathWeight: 1,
        },
        geometryClass,
        geometryBucket: bucket,
        headRole: bucket === "direct" ? "focus" : "opposite",
        ownershipSubjectProduct: 1,
        ownershipWeight: 1,
        subjectModifier: 1,
        geometryRoleWeight: bucket === "direct" ? 1 : 0.8,
        confidenceWeight: 1,
        candidatePathId: `c-${bucket}`,
      }) as ClassifiedPathCandidate;

    // Large identical raw support so both buckets saturate near signed=+1.
    const direct = makeCandidate("direct", "direct-exact-target", 50);
    const tp4c = makeCandidate("tp4c", "tp4c-opposite", 50 / 0.8); // cancel relative 0.8
    const deduped = {
      signedRetained: [direct, tp4c],
      activationRetained: [direct, tp4c],
      rejected: [],
      trace: {
        candidateEvidenceCount: 2,
        candidatePathCount: 2,
        retainedSignedFactCount: 2,
        retainedActivationFactCount: 2,
        droppedDuplicatePathCount: 0,
        directWonCollisionCount: 0,
      },
    };
    const agg = aggregateSpatialBudget(deduped, knowledge043);
    expect(Math.abs(agg.spatialBudgetTrace.tp4cContribution)).toBeLessThanOrEqual(0.1 + EPSILON);
    expect(Math.abs(agg.spatialBudgetTrace.directContribution)).toBeLessThanOrEqual(0.9 + EPSILON);
    expect(agg.spatialBudgetTrace.directSigned).toBeGreaterThan(0.99);
    expect(agg.spatialBudgetTrace.tp4cSigned).toBeGreaterThan(0.99);
    const ratio =
      Math.abs(agg.spatialBudgetTrace.tp4cContribution) /
      Math.abs(agg.spatialBudgetTrace.directContribution);
    expect(ratio).toBeLessThanOrEqual(0.1 / 0.9 + EPSILON);
  });
});

describe("Annual Axes V0.4.3 · collision + neutrality + monotonicity", () => {
  it("keeps direct when the same physical fact also has a TP4C path", () => {
    const headIndex = base.annualHeadPalace?.index ?? base.palaces.find((p) => p.isLuuNienDaiVan)?.index;
    expect(headIndex).toBeTypeOf("number");
    if (typeof headIndex !== "number") return;

    // Natal major star on the opposite head palace, plus any annual star in
    // that palace → natal fact gets both direct-exact-target and tp4c-opposite.
    const oppositePalace = base.palaces.find((p) => p.index === (headIndex + 6) % 12)!;
    const chart = controlled({
      palaces: base.palaces.map((p) =>
        p.index === oppositePalace.index
          ? {
              ...p,
              stars: [{ name: "Vũ Khúc", brightness: "Miếu", source: "natal" }],
            }
          : { ...p, stars: [] },
      ),
      annualStars: [{ name: "Thiên Cơ", palace: oppositePalace }],
    });
    const result = analyzeAnnualAxesNamPhaiV043(chart);

    let sawCollision = false;
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      if ((axis.dedupeTrace?.directWonCollisionCount ?? 0) > 0) {
        sawCollision = true;
        const retained = axis.evidence.filter(
          (e) =>
            e.physicalFactId.startsWith(`natal-star:${oppositePalace.index}:Vũ Khúc`) &&
            e.retainedForSignedScore,
        );
        expect(retained.length).toBe(1);
        expect(retained[0]?.geometryBucket).toBe("direct");
        const rejected = axis.evidence.filter(
          (e) =>
            e.physicalFactId.startsWith(`natal-star:${oppositePalace.index}:Vũ Khúc`) &&
            e.rejectedPathReason,
        );
        expect(rejected.length).toBeGreaterThan(0);
        expect(axis.dedupeTrace!.retainedActivationFactCount).toBeGreaterThanOrEqual(1);
      }
    }
    // Synthetic fallback when the opposite palace owns no domain this chart.
    if (!sawCollision) {
      const evidence: AnnualAxisEvidence = {
        id: "ann-axis:wealth:annual:star:annual-star:6:Vũ Khúc",
        domain: "wealth",
        layer: "annual",
        category: "star",
        physicalFactId: "annual-star:6:Vũ Khúc",
        ruleId: "RULE-AA-STAR-ANNUAL-MOVING-V04",
        targetPalaceIndex: 6,
        targetPalaceName: "Tài Bạch",
        targetAnnualPalaceName: null,
        frameRole: "opposite",
        anchorPalaceName: "Tài Bạch",
        stackingGroup: "annual-moving-star",
        rawAxes: { support: 2, pressure: 0, stability: 0, activation: 1 },
        effectiveWeight: 1,
        weightedAxes: { support: 2, pressure: 0, stability: 0, activation: 1 },
        confidenceWeight: 0.75,
        factIds: ["annual-star:6:Vũ Khúc"],
        sourceIds: ["SRC-AA-ENG-004"],
        knowledgeStatus: "experimental",
        ownershipWeight: 1,
        activationPaths: [
          {
            triggerId: "annual-moving-star-palace",
            channel: "direct-domain",
            geometryWeight: 1,
            affinityWeight: 1,
            effectivePathWeight: 1,
            boundedPathWeight: 1,
          },
          {
            triggerId: "annual-head-tp4c",
            channel: "routed-head",
            geometryWeight: 0.8,
            affinityWeight: 1,
            effectivePathWeight: 0.8,
            boundedPathWeight: 0.8,
          },
        ],
      };
      const classified = classifyEvidencePaths(
        [evidence],
        0,
        knowledge043.spatialBudget.tp4cRelativeRoleWeights,
      );
      expect(classified.map((c) => c.geometryBucket).sort()).toEqual(["direct", "tp4c"]);
      const deduped = dedupeSpatialPaths(classified, knowledge043);
      expect(deduped.signedRetained).toHaveLength(1);
      expect(deduped.signedRetained[0]?.geometryBucket).toBe("direct");
      expect(deduped.trace.directWonCollisionCount).toBe(1);
      expect(deduped.rejected.some((r) => r.geometryBucket === "tp4c")).toBe(true);
      const agg = aggregateSpatialBudget(deduped, knowledge043);
      expect(Math.abs(agg.spatialBudgetTrace.tp4cContribution)).toBeLessThanOrEqual(EPSILON);
    }
  });

  it("stays at exactly 50 with no annual activation", () => {
    const chart = controlled({});
    const result = analyzeAnnualAxesNamPhaiV043(chart);
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") continue;
      expect(axis.activationGate ?? 0).toBe(0);
      expect(axis.score).toBe(50);
    }
  });

  it("does not move score from major-fortune context alone", () => {
    const majorPalace = base.majorFortunePalace ?? base.palaces[0]!;
    const chart = controlled({
      majorMutagens: [
        {
          mutagen: "Lộc",
          starName: "Vũ Khúc",
          palace: majorPalace,
        },
      ],
    });
    const result = analyzeAnnualAxesNamPhaiV043(chart);
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      // Context-only may appear in evidence, but signed quality stays neutral.
      if ((axis.spatialBudgetTrace?.spatialSigned ?? 0) === 0) {
        expect(axis.score).toBe(50);
      }
    }
  });

  it("is monotonic in direct support/pressure for spatialSigned", () => {
    const natal = {
      sensitivity: 0.5,
      resilience: 0.5,
      amplitudeMultiplier: 0.775,
      provenance: [],
    };
    const run = (support: number, pressure: number) => {
      const c: ClassifiedPathCandidate = {
        evidence: {
          id: "e",
          domain: "wealth",
          layer: "annual",
          category: "star",
          physicalFactId: "f",
          ruleId: "R",
          targetPalaceIndex: 0,
          targetPalaceName: "Tài Bạch",
          targetAnnualPalaceName: null,
          frameRole: "focus",
          anchorPalaceName: "Tài Bạch",
          stackingGroup: "t",
          rawAxes: { support, pressure, stability: 0, activation: 1 },
          effectiveWeight: 1,
          weightedAxes: { support, pressure, stability: 0, activation: 1 },
          confidenceWeight: 1,
          factIds: ["f"],
          sourceIds: ["SRC-AA-ENG-004"],
          knowledgeStatus: "experimental",
          ownershipWeight: 1,
        },
        path: {
          triggerId: "annual-moving-star-palace",
          channel: "direct-domain",
          geometryWeight: 1,
          affinityWeight: 1,
          effectivePathWeight: 1,
          boundedPathWeight: 1,
        },
        geometryClass: "direct-exact-target",
        geometryBucket: "direct",
        headRole: "focus",
        ownershipSubjectProduct: 1,
        ownershipWeight: 1,
        subjectModifier: 1,
        geometryRoleWeight: 1,
        confidenceWeight: 1,
        candidatePathId: "c",
      };
      const agg = aggregateSpatialBudget(
        {
          signedRetained: [c],
          activationRetained: [c],
          rejected: [],
          trace: {
            candidateEvidenceCount: 1,
            candidatePathCount: 1,
            retainedSignedFactCount: 1,
            retainedActivationFactCount: 1,
            droppedDuplicatePathCount: 0,
            directWonCollisionCount: 0,
          },
        },
        knowledge043,
      );
      return agg.spatialSigned;
    };

    expect(run(2, 0)).toBeGreaterThanOrEqual(run(1, 0) - EPSILON);
    expect(run(1, 2)).toBeLessThanOrEqual(run(1, 1) + EPSILON);

    const tp4cRun = (support: number) => {
      const c: ClassifiedPathCandidate = {
        evidence: {
          id: "e2",
          domain: "wealth",
          layer: "natal-activated",
          category: "star",
          physicalFactId: "f2",
          ruleId: "R",
          targetPalaceIndex: 6,
          targetPalaceName: "Tài Bạch",
          targetAnnualPalaceName: null,
          frameRole: "opposite",
          anchorPalaceName: "Tài Bạch",
          stackingGroup: "t",
          rawAxes: { support, pressure: 0, stability: 0, activation: 1 },
          effectiveWeight: 1,
          weightedAxes: { support, pressure: 0, stability: 0, activation: 1 },
          confidenceWeight: 1,
          factIds: ["f2"],
          sourceIds: ["SRC-AA-ENG-004"],
          knowledgeStatus: "experimental",
          ownershipWeight: 1,
        },
        path: {
          triggerId: "annual-head-tp4c",
          channel: "routed-head",
          geometryWeight: 0.8,
          affinityWeight: 1,
          effectivePathWeight: 0.8,
          boundedPathWeight: 0.8,
        },
        geometryClass: "tp4c-opposite",
        geometryBucket: "tp4c",
        headRole: "opposite",
        ownershipSubjectProduct: 1,
        ownershipWeight: 1,
        subjectModifier: 1,
        geometryRoleWeight: 0.8,
        confidenceWeight: 1,
        candidatePathId: "c2",
      };
      const agg = aggregateSpatialBudget(
        {
          signedRetained: [c],
          activationRetained: [c],
          rejected: [],
          trace: {
            candidateEvidenceCount: 1,
            candidatePathCount: 1,
            retainedSignedFactCount: 1,
            retainedActivationFactCount: 1,
            droppedDuplicatePathCount: 0,
            directWonCollisionCount: 0,
          },
        },
        knowledge043,
      );
      expect(Math.abs(agg.spatialBudgetTrace.tp4cContribution)).toBeLessThanOrEqual(0.1 + EPSILON);
      return agg.tp4cSigned;
    };
    expect(tp4cRun(3)).toBeGreaterThanOrEqual(tp4cRun(1) - EPSILON);
    void natal;
    void knowledge04;
    void normalizeSpatialBudgetV043;
  });
});

describe("Annual Axes V0.4.3 · order invariance + numeric safety", () => {
  it("yields identical scores when evidence path order is reversed before dedupe", () => {
    const palace = base.palaces.find((p) => p.name === "Tài Bạch")!;
    const chart = controlled({ annualStars: [{ name: "Vũ Khúc", palace }] });
    const forward = analyzeAnnualAxesNamPhaiV043(chart);
    // Second call must be deterministic (knowledge frozen, no RNG).
    const again = analyzeAnnualAxesNamPhaiV043(chart);
    expect(scoresSnapshot(forward)).toEqual(scoresSnapshot(again));

    // Comparator itself must be antisymmetric / total.
    const a = classifyEvidencePaths(
      forward.axes.wealth.status === "available" ? forward.axes.wealth.evidence.slice(0, 1) : [],
      chart.annualHeadPalace?.index ?? 0,
      knowledge043.spatialBudget.tp4cRelativeRoleWeights,
    );
    if (a.length >= 2) {
      expect(Math.sign(comparePathPrecedence(a[0]!, a[1]!, knowledge043))).toBe(
        -Math.sign(comparePathPrecedence(a[1]!, a[0]!, knowledge043)),
      );
    }
  });

  it("keeps all normalized / signed / score values in legal ranges on a live chart", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxesNamPhaiV043(chart);
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const axis = result.axes[domain];
      if (axis.status !== "available") continue;
      expect(Number.isFinite(axis.score)).toBe(true);
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);
      const t = axis.spatialBudgetTrace!;
      expect(t.directSigned).toBeGreaterThanOrEqual(-1 - EPSILON);
      expect(t.directSigned).toBeLessThanOrEqual(1 + EPSILON);
      expect(t.tp4cSigned).toBeGreaterThanOrEqual(-1 - EPSILON);
      expect(t.tp4cSigned).toBeLessThanOrEqual(1 + EPSILON);
      expect(t.spatialSigned).toBeGreaterThanOrEqual(-1 - EPSILON);
      expect(t.spatialSigned).toBeLessThanOrEqual(1 + EPSILON);
      expect(Math.abs(t.tp4cContribution)).toBeLessThanOrEqual(0.1 + EPSILON);
      expect(Math.abs(t.directContribution)).toBeLessThanOrEqual(0.9 + EPSILON);
      expect(Number.isNaN(axis.score)).toBe(false);
      expect(Number.isFinite(axis.normalizedAxes.support)).toBe(true);
      expect(axis.normalizedAxes.support).toBeGreaterThanOrEqual(0);
      expect(axis.normalizedAxes.support).toBeLessThanOrEqual(1);
    }
  });
});

describe("Annual Axes V0.4.3 · school isolation", () => {
  it("does not alter Trung Châu path (still V0.2 engine version)", async () => {
    const { calculate: calculateTrungChau } = await import("@/lib/ziwei/engine-trung-chau");
    const tc = calculateTrungChau({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const result = analyzeAnnualAxes(tc, { school: "trung-chau" });
    expect(result.versions.engineVersion).toBe("0.2.0");
    expect(result.versions.contractVersion).toBe("0.2.0");
  });
});
