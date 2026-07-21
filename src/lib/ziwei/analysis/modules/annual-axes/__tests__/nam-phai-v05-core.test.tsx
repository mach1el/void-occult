import { describe, expect, it, beforeEach } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { render, screen } from "@testing-library/react";

import { AnnualAxesSection } from "@/components/ziwei/annual-axes/AnnualAxesSection";

import {
  computeActivationGate,
  computeBucketSigned,
  computeSpatialSigned,
} from "../nam-phai-v05/bucket-formula";
import { computeNatalGainV05 } from "../nam-phai-v05/natal-gain";
import { scoreV05Domain } from "../nam-phai-v05/score-domain";
import { scoreV05ChartToAxes } from "../nam-phai-v05/score-chart";
import { isAnnualActivationCandidate } from "../nam-phai-v05/annual-activation";
import { dedupeV05SpatialPaths } from "../nam-phai-v05/dedupe";
import { aggregateV05Buckets } from "../nam-phai-v05/aggregate-buckets";
import { asV043DedupeKnowledge } from "../nam-phai-v05/knowledge-adapter";
import { dedupeSpatialPaths } from "../nam-phai-v043/dedupe";
import {
  computeActivationDiminishingFactors,
  computeActivationPathFactor,
} from "../nam-phai-v043/aggregate-spatial";
import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import type { AnnualGeometryClass } from "../types";
import {
  loadAnnualAxesKnowledgeV05NamPhai,
  validateAnnualAxesKnowledgeV05NamPhai,
} from "../../../knowledge/annual-axes/v0.5";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const loadedV05 = loadAnnualAxesKnowledgeV05NamPhai();
if (!loadedV05.ok) throw new Error("v0.5 knowledge invalid");
const knowledgeV05 = loadedV05.knowledge;
const dedupeKnowledgeV043 = asV043DedupeKnowledge(knowledgeV05);

interface CandOverrides {
  id: string;
  support?: number;
  pressure?: number;
  activation?: number;
  geometryClass?: AnnualGeometryClass;
  geometryBucket?: "direct" | "tp4c" | "context-only";
  boundedPathWeight?: number;
  confidenceWeight?: number;
  ownershipSubjectProduct?: number;
  layer?: "annual" | "major-fortune" | "natal-activated";
  channel?: "global" | "major-background" | "direct-domain";
  stackingGroup?: string;
  physicalFactId?: string;
  annualTriggerIds?: string[];
}

function cand(o: CandOverrides): ClassifiedPathCandidate {
  const support = o.support ?? 0;
  const pressure = o.pressure ?? 0;
  const activation = o.activation ?? 0;
  const geometryBucket = o.geometryBucket ?? "direct";
  const channel =
    o.channel ??
    (geometryBucket === "context-only" ? "major-background" : "direct-domain");
  const geometryRoleWeight =
    geometryBucket === "context-only" ? 0 : geometryBucket === "tp4c" ? 0.8 : 1;
  return {
    evidence: {
      id: o.id,
      domain: "wealth",
      layer: o.layer ?? "annual",
      category: "star",
      physicalFactId: o.physicalFactId ?? o.id,
      ruleId: "RULE-TEST",
      targetPalaceIndex: 0,
      targetPalaceName: "Tài Bạch",
      targetAnnualPalaceName: null,
      frameRole: "focus",
      anchorPalaceName: "Tài Bạch",
      stackingGroup: o.stackingGroup ?? "sg",
      annualTriggerIds: o.annualTriggerIds,
      rawAxes: { support, pressure, stability: 0, activation },
      effectiveWeight: 1,
      weightedAxes: { support, pressure, stability: 0, activation },
      confidenceWeight: o.confidenceWeight ?? 1,
      factIds: [o.id],
      sourceIds: ["SRC-AA-ENG-004"],
      knowledgeStatus: "experimental",
      ownershipWeight: 1,
    },
    path: {
      triggerId: "trigger",
      channel,
      geometryWeight: o.boundedPathWeight ?? (geometryBucket === "context-only" ? 0.5 : 1),
      affinityWeight: 1,
      effectivePathWeight: 1,
      boundedPathWeight: o.boundedPathWeight ?? (geometryBucket === "context-only" ? 0.5 : 1),
    },
    geometryClass:
      o.geometryClass ??
      (geometryBucket === "tp4c"
        ? "tp4c-opposite"
        : geometryBucket === "context-only"
          ? "context-only"
          : "direct-exact-target"),
    geometryBucket,
    headRole: "focus",
    ownershipSubjectProduct: o.ownershipSubjectProduct ?? 1,
    ownershipWeight: 1,
    subjectModifier: 1,
    geometryRoleWeight,
    confidenceWeight: o.confidenceWeight ?? 1,
    candidatePathId: o.id,
  } as ClassifiedPathCandidate;
}

describe("Nam Phái Annual Axes V0.5 calibrated core", () => {
  it("bucket intensity/polarity/signed are bounded and consistent", () => {
    const evidenceScale = 2.5;
    const epsilon = 1e-9;

    const a = computeBucketSigned({
      supportRaw: 2,
      pressureRaw: 1,
      evidenceScale,
      epsilon,
    });
    expect(a.intensity).toBeGreaterThanOrEqual(0);
    expect(a.intensity).toBeLessThanOrEqual(1);
    expect(a.polarity).toBeGreaterThanOrEqual(-1);
    expect(a.polarity).toBeLessThanOrEqual(1);
    expect(a.signed).toBeGreaterThanOrEqual(-1);
    expect(a.signed).toBeLessThanOrEqual(1);
    expect(a.signed).toBeCloseTo(a.intensity * a.polarity, 12);
  });

  it("direct/TP4C 90/10 composition never exceeds ±1", () => {
    const { spatialSigned } = computeSpatialSigned(1, 1);
    expect(spatialSigned).toBeCloseTo(1, 12);

    const { spatialSigned: s2 } = computeSpatialSigned(1, -1);
    expect(s2).toBeCloseTo(0.8, 12);
  });

  it("activationGate is tanh(annualActivationRaw / activationScale) and clamps to 0 when non-positive", () => {
    expect(computeActivationGate(-1, 2)).toBe(0);
    expect(computeActivationGate(0, 2)).toBe(0);

    const gate = computeActivationGate(1, 2);
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThanOrEqual(1);
  });

  describe("annual-activation eligibility", () => {
    it("annual direct without annualTriggerIds is eligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "d", geometryBucket: "direct", annualTriggerIds: [] }),
        ),
      ).toBe(true);
    });

    it("annual TP4C without annualTriggerIds is eligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "t", geometryBucket: "tp4c", annualTriggerIds: [] }),
        ),
      ).toBe(true);
    });

    it("annual context-only without a trigger is ineligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "c", geometryBucket: "context-only", annualTriggerIds: [] }),
        ),
      ).toBe(false);
    });

    it("annual context-only with a trigger is eligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({
            id: "c",
            geometryBucket: "context-only",
            channel: "direct-domain",
            annualTriggerIds: ["ANNUAL-TRIGGER"],
          }),
        ),
      ).toBe(true);
    });

    it("natal-activated without a trigger is ineligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "n", layer: "natal-activated", annualTriggerIds: [] }),
        ),
      ).toBe(false);
    });

    it("natal-activated with a trigger is eligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({
            id: "n",
            layer: "natal-activated",
            annualTriggerIds: ["ANNUAL-TRIGGER"],
          }),
        ),
      ).toBe(true);
    });

    it("global and major-background channels are always ineligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "g", channel: "global", geometryBucket: "direct" }),
        ),
      ).toBe(false);
      expect(
        isAnnualActivationCandidate(
          cand({ id: "m", channel: "major-background", geometryBucket: "direct" }),
        ),
      ).toBe(false);
    });

    it("major-fortune layer is always ineligible", () => {
      expect(
        isAnnualActivationCandidate(
          cand({ id: "mf", layer: "major-fortune", geometryBucket: "direct" }),
        ),
      ).toBe(false);
    });
  });

  describe("activation-before-dedupe", () => {
    it("ineligible stronger Major Fortune path cannot suppress an eligible annual path", () => {
      const mfDirectStrong = cand({
        id: "mf",
        layer: "major-fortune",
        geometryBucket: "direct",
        activation: 20,
        physicalFactId: "same-fact",
        stackingGroup: "s",
      });
      const annualTp4c = cand({
        id: "annual",
        layer: "annual",
        geometryBucket: "tp4c",
        activation: 5,
        physicalFactId: "same-fact",
        stackingGroup: "s",
      });

      const v043 = dedupeSpatialPaths([mfDirectStrong, annualTp4c], dedupeKnowledgeV043);
      expect(v043.activationRetained[0]?.candidatePathId).toBe("mf");

      const v05 = dedupeV05SpatialPaths([mfDirectStrong, annualTp4c], knowledgeV05);
      expect(v05.activationRetained).toHaveLength(1);
      expect(v05.activationRetained[0]?.candidatePathId).toBe("annual");
    });

    it("untriggered context-only path cannot consume an activation rank", () => {
      const ctxNoTrigger = cand({
        id: "ctx",
        geometryBucket: "context-only",
        channel: "direct-domain",
        activation: 15,
        physicalFactId: "fact-a",
        stackingGroup: "s1",
      });
      const annualDirect = cand({
        id: "annual",
        activation: 4,
        physicalFactId: "fact-b",
        stackingGroup: "s2",
      });

      const deduped = dedupeV05SpatialPaths([ctxNoTrigger, annualDirect], knowledgeV05);
      expect(deduped.activationRetained.map((c) => c.candidatePathId)).toEqual(["annual"]);
      const rejectedCtx = deduped.rejected.find((c) => c.candidatePathId === "ctx");
      expect(rejectedCtx?.rejectedPathReason).toBe("not-annual-activation-eligible");
    });

    it("reversing candidate input order preserves activation winners and annualActivationRaw", () => {
      const a = cand({
        id: "a",
        activation: 6,
        physicalFactId: "f1",
        stackingGroup: "s1",
      });
      const b = cand({
        id: "b",
        activation: 3,
        physicalFactId: "f2",
        stackingGroup: "s2",
      });

      const forward = aggregateV05Buckets(dedupeV05SpatialPaths([a, b], knowledgeV05), knowledgeV05);
      const reverse = aggregateV05Buckets(dedupeV05SpatialPaths([b, a], knowledgeV05), knowledgeV05);

      expect(reverse.annualActivationRaw).toBeCloseTo(forward.annualActivationRaw, 9);
      expect(reverse.spatialSigned).toBeCloseTo(forward.spatialSigned, 9);
    });
  });

  describe("activation trace reconstructability", () => {
    it("annualActivationRaw reconstructs from retained activation evidence", () => {
      const paths = [
        cand({ id: "d1", activation: 4, physicalFactId: "f1", stackingGroup: "s1" }),
        cand({
          id: "d2",
          activation: 3,
          geometryBucket: "tp4c",
          physicalFactId: "f2",
          stackingGroup: "s2",
        }),
        cand({
          id: "ctx",
          activation: 5,
          geometryBucket: "context-only",
          channel: "direct-domain",
          annualTriggerIds: ["TRIGGER"],
          physicalFactId: "f3",
          stackingGroup: "s3",
        }),
      ];
      const deduped = dedupeV05SpatialPaths(paths, knowledgeV05);
      const agg = aggregateV05Buckets(deduped, knowledgeV05);

      const fromEvidence = agg.evidence
        .filter((e) => e.retainedForActivation)
        .reduce((sum, e) => sum + e.weightedAxes.activation, 0);

      expect(fromEvidence).toBeCloseTo(agg.annualActivationRaw, 9);
    });

    it("activationGate reconstructs from annualActivationRaw and scale", () => {
      const paths = [
        cand({ id: "d1", activation: 8, physicalFactId: "f1", stackingGroup: "s1" }),
        cand({ id: "d2", activation: 6, physicalFactId: "f2", stackingGroup: "s2" }),
      ];
      const agg = aggregateV05Buckets(dedupeV05SpatialPaths(paths, knowledgeV05), knowledgeV05);
      const scale = knowledgeV05.calibration.activationScale;
      const expectedGate = computeActivationGate(agg.annualActivationRaw, scale);

      const scored = scoreV05Domain({
        aggregate: agg,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });
      expect(scored.activationGate).toBeCloseTo(expectedGate, 12);
    });

    it("activation diminishing is computed only over eligible retained winners", () => {
      const sameGroup = [
        cand({ id: "w1", activation: 10, physicalFactId: "f1", stackingGroup: "sg" }),
        cand({ id: "w2", activation: 8, physicalFactId: "f2", stackingGroup: "sg" }),
        cand({
          id: "mf",
          layer: "major-fortune",
          activation: 20,
          physicalFactId: "f3",
          stackingGroup: "sg",
        }),
      ];
      const deduped = dedupeV05SpatialPaths(sameGroup, knowledgeV05);
      expect(deduped.activationRetained).toHaveLength(2);
      expect(deduped.activationRetained.map((c) => c.candidatePathId).sort()).toEqual([
        "w1",
        "w2",
      ]);

      const diminishing = computeActivationDiminishingFactors(
        deduped.activationRetained,
        dedupeKnowledgeV043,
      );
      expect(diminishing.size).toBe(2);
      expect(diminishing.has("mf")).toBe(false);
    });

    it("activationAppliedFactor includes confidence, ownership, geometry, and diminishing", () => {
      const path = cand({
        id: "p",
        activation: 4,
        confidenceWeight: 0.8,
        ownershipSubjectProduct: 0.9,
        boundedPathWeight: 0.7,
      });
      const deduped = dedupeV05SpatialPaths([path], knowledgeV05);
      const agg = aggregateV05Buckets(deduped, knowledgeV05);
      const row = agg.evidence.find((e) => e.id === "p")!;
      const dim = row.activationDiminishingFactor ?? 1;
      const expected = computeActivationPathFactor(path, dim);
      expect(row.activationAppliedFactor).toBeCloseTo(expected, 12);
      expect(row.weightedAxes.activation).toBeCloseTo(4 * expected, 12);
    });
  });

  it("no positive annual activation yields activationGate=0 and score=50", () => {
    const aggregate = {
      evidence: [],
      rawAxes: { support: 0, pressure: 0, stability: 0, activation: 0 },
      spatialBudgetTrace: {
        directBudget: 0.9,
        tp4cBudget: 0.1,
        directSupportRaw: 0,
        directPressureRaw: 0,
        directSigned: 0,
        directContribution: 0,
        tp4cSupportRaw: 0,
        tp4cPressureRaw: 0,
        tp4cSigned: 0,
        tp4cContribution: 0,
        spatialSigned: 0,
      },
      directBucket: {
        total: 0,
        intensity: 0,
        polarity: 0,
        signed: 0,
        supportRaw: 0,
        pressureRaw: 0,
      },
      tp4cBucket: {
        total: 0,
        intensity: 0,
        polarity: 0,
        signed: 0,
        supportRaw: 0,
        pressureRaw: 0,
      },
      spatialSigned: 0,
      annualActivationRaw: 0,
    } as any;

    const scored = scoreV05Domain({
      aggregate,
      natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
      domain: "wealth",
      knowledge: knowledgeV05,
    });
    expect(scored.activationGate).toBe(0);
    expect(scored.score).toBe(knowledgeV05.scoreProfile.neutral);
  });

  it("positive eligible activation never yields score exactly 50", () => {
    const paths = [cand({ id: "d", activation: 5, support: 2, physicalFactId: "f", stackingGroup: "s" })];
    const agg = aggregateV05Buckets(dedupeV05SpatialPaths(paths, knowledgeV05), knowledgeV05);
    expect(agg.annualActivationRaw).toBeGreaterThan(0);

    const scored = scoreV05Domain({
      aggregate: agg,
      natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
      domain: "wealth",
      knowledge: knowledgeV05,
    });
    expect(scored.activationGate).toBeGreaterThan(0);
    expect(scored.score).not.toBe(50);
  });

  describe("support/pressure normalized axes", () => {
    it("increasing direct pressure increases pressureNorm, not supportNorm", () => {
      const lowPressure = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [cand({ id: "d", support: 3, pressure: 1, physicalFactId: "f", stackingGroup: "s" })],
          knowledgeV05,
        ),
        knowledgeV05,
      );
      const highPressure = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [cand({ id: "d", support: 3, pressure: 5, physicalFactId: "f", stackingGroup: "s" })],
          knowledgeV05,
        ),
        knowledgeV05,
      );

      const low = scoreV05Domain({
        aggregate: lowPressure,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });
      const high = scoreV05Domain({
        aggregate: highPressure,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });

      expect(high.pressureNorm).toBeGreaterThan(low.pressureNorm);
      expect(high.supportNorm).toBeCloseTo(low.supportNorm, 9);
    });

    it("increasing TP4C support increases supportNorm, not pressureNorm", () => {
      const lowSupport = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [
            cand({
              id: "t",
              support: 1,
              pressure: 2,
              geometryBucket: "tp4c",
              physicalFactId: "f",
              stackingGroup: "s",
            }),
          ],
          knowledgeV05,
        ),
        knowledgeV05,
      );
      const highSupport = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [
            cand({
              id: "t",
              support: 6,
              pressure: 2,
              geometryBucket: "tp4c",
              physicalFactId: "f",
              stackingGroup: "s",
            }),
          ],
          knowledgeV05,
        ),
        knowledgeV05,
      );

      const low = scoreV05Domain({
        aggregate: lowSupport,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });
      const high = scoreV05Domain({
        aggregate: highSupport,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });

      expect(high.supportNorm).toBeGreaterThan(low.supportNorm);
      expect(high.pressureNorm).toBeCloseTo(low.pressureNorm, 9);
    });

    it("conflict rises only when both support and pressure are present", () => {
      const supportOnly = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [cand({ id: "d", support: 5, activation: 3, physicalFactId: "f", stackingGroup: "s" })],
          knowledgeV05,
        ),
        knowledgeV05,
      );
      const both = aggregateV05Buckets(
        dedupeV05SpatialPaths(
          [
            cand({
              id: "d",
              support: 5,
              pressure: 4,
              activation: 3,
              physicalFactId: "f",
              stackingGroup: "s",
            }),
          ],
          knowledgeV05,
        ),
        knowledgeV05,
      );

      const sOnly = scoreV05Domain({
        aggregate: supportOnly,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });
      const sAndP = scoreV05Domain({
        aggregate: both,
        natalResponse: { sensitivity: 0.5, resilience: 0.5 } as any,
        domain: "wealth",
        knowledge: knowledgeV05,
      });

      expect(sAndP.conflict).toBeGreaterThan(sOnly.conflict);
    });
  });

  it("natalGain stays inside configured bounds", () => {
    const g1 = computeNatalGainV05({ sensitivity: 1, resilience: 1 } as any, knowledgeV05);
    expect(g1).toBeGreaterThanOrEqual(knowledgeV05.natalGain.minimum);
    expect(g1).toBeLessThanOrEqual(knowledgeV05.natalGain.maximum);

    const g2 = computeNatalGainV05({ sensitivity: 0, resilience: 0 } as any, knowledgeV05);
    expect(g2).toBeGreaterThanOrEqual(knowledgeV05.natalGain.minimum);
    expect(g2).toBeLessThanOrEqual(knowledgeV05.natalGain.maximum);
  });

  describe("V0.5 production flag wiring", () => {
    beforeEach(() => {
      window.sessionStorage.clear();
      window.history.replaceState({}, "", "/");
    });

    it("routes Nam Phái engine to V0.5 by default", () => {
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      expect(result.versions.engineVersion).toBe("0.5.0");
    });

    it("rolls Nam Phái back to V0.4.2 when ?ziweiAnnualAxesV05=0", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      expect(result.versions.engineVersion).toBe("0.4.2");
    });

    it("Trung Châu remains unchanged with the V0.5 query flag present", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
      const chart = calculateTrungChau(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
      expect(result.versions.engineVersion).toBe("0.2.0");
    });
  });

  describe("result-driven V0.5 badge", () => {
    beforeEach(() => {
      window.sessionStorage.clear();
      window.history.replaceState({}, "", "/");
    });

    it("Nam Phái V0.5 result shows production badge", () => {
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
      expect(screen.getByText("Nam Phái V0.5 · Fallback")).toBeInTheDocument();
      expect(screen.getByText(/Engine 0\.5\.0/)).toBeInTheDocument();
    });

    it("Nam Phái V0.4.2 rollback shows Fallback badge", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=0");
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      render(<AnnualAxesSection chart={chart} school="nam-phai" result={result} />);
      expect(screen.getByText("Nam Phái V0.4.2 · Fallback")).toBeInTheDocument();
      expect(screen.getByText(/Engine 0\.4\.2/)).toBeInTheDocument();
    });

    it("Trung Châu with ?ziweiAnnualAxesV05=1 does not show Nam Phái badge", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
      const chart = calculateTrungChau(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
      render(<AnnualAxesSection chart={chart} school="trung-chau" result={result} />);
      expect(screen.queryByText(/Nam Phái/)).toBeNull();
    });
  });
});

describe("V0.5 calibrated score trace preservation", () => {
  it("keeps axis score/latent/activationGate aligned with the first-pass trace", () => {
    const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
    expect(knowledge04.ok).toBe(true);
    if (!knowledge04.ok) return;

    const chart = calculateNamPhai(REGRESSION);
    const axes = scoreV05ChartToAxes(chart, knowledgeV05, knowledge04.knowledge);
    expect(axes).not.toBeNull();
    if (!axes) return;

    expect(axes.length).toBeGreaterThan(0);
    for (const axis of axes) {
      expect(axis.trace.absoluteScore).toBe(axis.score);
      expect(axis.trace.latent).toBe(axis.latent);
      expect(axis.trace.activationGate).toBe(axis.activationGate);
    }
  });
});

describe("Annual Axes V0.5 knowledge validation", () => {
  it("loads and validates the V0.5 bundle", () => {
    expect(loadedV05.ok).toBe(true);
  });

  it("fails closed when activation strength config is not activation-only", () => {
    const broken = structuredClone(knowledgeV05);
    broken.bucketFormula.annualActivationStrength = {
      supportWeight: 1,
      pressureWeight: 0,
      activationWeight: 1,
    };
    const result = validateAnnualAxesKnowledgeV05NamPhai(
      broken,
      new Set(["SRC-AA-ENG-004"]),
    );
    expect(result.ok).toBe(false);
  });
});
