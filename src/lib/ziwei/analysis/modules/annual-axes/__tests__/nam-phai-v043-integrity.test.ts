import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { loadAnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { analyzeAnnualAxesNamPhaiV043 } from "../nam-phai-v043/analyze";
import { scoreSpatialVariantDomains } from "../nam-phai-v043/score-spatial-variant";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import {
  aggregateSpatialBudget,
  computeActivationDiminishingFactors,
  computeSignedDiminishingFactors,
} from "../nam-phai-v043/aggregate-spatial";
import { dedupeSpatialPaths } from "../nam-phai-v043/dedupe";
import {
  isValidActivationGate,
  normalizeSpatialBudgetV043,
} from "../nam-phai-v043/normalize-spatial";
import { ABLATION_SPATIAL_VARIANTS } from "../nam-phai-v043/score-spatial-variant";
import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import type { AnnualGeometryClass } from "../types";

const loaded043 = loadAnnualAxesKnowledgeV043NamPhai();
if (!loaded043.ok) throw new Error("v0.4.3 knowledge invalid");
const knowledge043 = loaded043.knowledge;
const loaded04 = loadAnnualAxesKnowledgeV04NamPhai();
if (!loaded04.ok) throw new Error("v0.4 knowledge invalid");
const knowledge04 = loaded04.knowledge;

const EPS = 1e-9;

interface CandOverrides {
  id: string;
  support?: number;
  pressure?: number;
  activation?: number;
  geometryClass?: AnnualGeometryClass;
  geometryBucket?: "direct" | "tp4c" | "context-only";
  geometryRoleWeight?: number;
  boundedPathWeight?: number;
  confidenceWeight?: number;
  ownershipSubjectProduct?: number;
  layer?: "annual" | "major-fortune" | "natal-activated";
  stackingGroup?: string;
  physicalFactId?: string;
  domain?: "health" | "family" | "wealth" | "career" | "social" | "romance";
}

function cand(o: CandOverrides): ClassifiedPathCandidate {
  const support = o.support ?? 0;
  const pressure = o.pressure ?? 0;
  const activation = o.activation ?? 0;
  const geometryBucket = o.geometryBucket ?? "direct";
  const geometryRoleWeight =
    o.geometryRoleWeight ?? (geometryBucket === "context-only" ? 0 : geometryBucket === "tp4c" ? 0.8 : 1);
  return {
    evidence: {
      id: o.id,
      domain: o.domain ?? "wealth",
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
      channel: geometryBucket === "context-only" ? "major-background" : "direct-domain",
      geometryWeight: o.boundedPathWeight ?? (geometryBucket === "context-only" ? 0.5 : 1),
      affinityWeight: 1,
      effectivePathWeight: 1,
      boundedPathWeight: o.boundedPathWeight ?? (geometryBucket === "context-only" ? 0.5 : 1),
    },
    geometryClass: o.geometryClass ?? (geometryBucket === "tp4c" ? "tp4c-opposite" : geometryBucket === "context-only" ? "context-only" : "direct-exact-target"),
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

function deduped(signed: ClassifiedPathCandidate[], activation: ClassifiedPathCandidate[]) {
  return {
    signedRetained: signed,
    activationRetained: activation,
    rejected: [],
    trace: {
      candidateEvidenceCount: new Set([...signed, ...activation].map((c) => c.evidence.id)).size,
      candidatePathCount: signed.length + activation.length,
      retainedSignedFactCount: signed.length,
      retainedActivationFactCount: activation.length,
      droppedDuplicatePathCount: 0,
      directWonCollisionCount: 0,
    },
  };
}

// ── §3 Ablation is strictly stepwise ────────────────────────────────────────

describe("V0.4.3 · ablation is stepwise (§3)", () => {
  const B = ABLATION_SPATIAL_VARIANTS["B-budget-only-no-dedupe"];
  const C = ABLATION_SPATIAL_VARIANTS["C-budget-plus-direct-wins"];
  const D = ABLATION_SPATIAL_VARIANTS["D-c-plus-activation-floor-0"];
  const E = ABLATION_SPATIAL_VARIANTS["E-d-plus-diminishing-geometryBucket"];

  it("B and C differ only by dedupe", () => {
    expect(B.dedupe).toBe(false);
    expect(C.dedupe).toBe(true);
    expect(C.activationGate).toEqual(B.activationGate);
    expect(C.diminishingGroupBy).toEqual(B.diminishingGroupBy);
  });

  it("C and D differ only by the activation gate", () => {
    expect(D.dedupe).toBe(C.dedupe);
    expect(D.diminishingGroupBy).toEqual(C.diminishingGroupBy);
    expect(C.activationGate).toEqual({ floor: 0.15, range: 0.85 });
    expect(D.activationGate).toEqual({ floor: 0, range: 1 });
  });

  it("D and E differ only by geometryBucket grouping", () => {
    expect(E.dedupe).toBe(D.dedupe);
    expect(E.activationGate).toEqual(D.activationGate);
    expect(D.diminishingGroupBy).toEqual(["domain", "layer", "stackingGroup"]);
    expect(E.diminishingGroupBy).toEqual(["domain", "geometryBucket", "layer", "stackingGroup"]);
  });

  it("every ablation gate is a valid, summing pair (B/C and D/E sum to 1)", () => {
    for (const v of Object.values(ABLATION_SPATIAL_VARIANTS)) {
      expect(isValidActivationGate(v.activationGate)).toBe(true);
      expect(v.activationGate.floor + v.activationGate.range).toBeCloseTo(1, 12);
    }
  });

  it("E equals the production knowledge (gate + groupBy)", () => {
    expect(E.activationGate).toEqual(knowledge043.aggregationProfile.activationGate);
    expect(E.diminishingGroupBy).toEqual(knowledge043.aggregationProfile.diminishingReturns.groupBy);
  });
});

// ── §3 Activation-gate invariants ───────────────────────────────────────────

describe("V0.4.3 · activation-gate invariants (§3)", () => {
  const natal = { sensitivity: 0.5, resilience: 0.5, amplitudeMultiplier: 0.775, provenance: [] };
  const rawAxes = { support: 0, pressure: 0, stability: 0, activation: 0 };
  const gateAt = (gate: { floor: number; range: number }, activationNorm: number) =>
    normalizeSpatialBudgetV043({
      spatialSigned: 0,
      activationNorm,
      natalResponse: natal,
      rawAxes,
      knowledge043,
      knowledge04,
      activationGateOverride: gate,
    }).activationGate;

  it("B/C {0.15,0.85}: norm 0 → 0.15, norm 1 → 1.0", () => {
    expect(gateAt({ floor: 0.15, range: 0.85 }, 0)).toBeCloseTo(0.15, 12);
    expect(gateAt({ floor: 0.15, range: 0.85 }, 1)).toBeCloseTo(1.0, 12);
  });

  it("D/E {0,1}: norm 0 → 0, norm 1 → 1.0", () => {
    expect(gateAt({ floor: 0, range: 1 }, 0)).toBeCloseTo(0, 12);
    expect(gateAt({ floor: 0, range: 1 }, 1)).toBeCloseTo(1.0, 12);
  });

  it("gate never exceeds 1 even at activationNorm 1", () => {
    for (const g of Object.values(ABLATION_SPATIAL_VARIANTS)) {
      expect(gateAt(g.activationGate, 1)).toBeLessThanOrEqual(1 + EPS);
    }
  });

  it("isValidActivationGate rejects an over-1 sum and out-of-range values", () => {
    expect(isValidActivationGate({ floor: 0.5, range: 0.85 })).toBe(false);
    expect(isValidActivationGate({ floor: -0.1, range: 1 })).toBe(false);
    expect(isValidActivationGate({ floor: 0, range: 1.5 })).toBe(false);
    expect(isValidActivationGate({ floor: 0, range: 1 })).toBe(true);
  });
});

// ── §4 Separate signed vs activation diminishing ────────────────────────────

describe("V0.4.3 · separate signed and activation diminishing (§4)", () => {
  it("ranks 3 context-only activation facts by activation magnitude (1, 1/√2, 1/√3)", () => {
    const a = cand({ id: "ctx-A", geometryBucket: "context-only", activation: 3, boundedPathWeight: 1, stackingGroup: "g" });
    const b = cand({ id: "ctx-B", geometryBucket: "context-only", activation: 2, boundedPathWeight: 1, stackingGroup: "g" });
    const c = cand({ id: "ctx-C", geometryBucket: "context-only", activation: 1, boundedPathWeight: 1, stackingGroup: "g" });

    const factors = computeActivationDiminishingFactors([a, b, c], knowledge043);
    expect(factors.get("ctx-A")).toBeCloseTo(1, 12);
    expect(factors.get("ctx-B")).toBeCloseTo(1 / Math.sqrt(2), 12);
    expect(factors.get("ctx-C")).toBeCloseTo(1 / Math.sqrt(3), 12);
  });

  it("is independent of input order", () => {
    const a = cand({ id: "ctx-A", geometryBucket: "context-only", activation: 3, boundedPathWeight: 1, stackingGroup: "g" });
    const b = cand({ id: "ctx-B", geometryBucket: "context-only", activation: 2, boundedPathWeight: 1, stackingGroup: "g" });
    const c = cand({ id: "ctx-C", geometryBucket: "context-only", activation: 1, boundedPathWeight: 1, stackingGroup: "g" });
    const forward = computeActivationDiminishingFactors([a, b, c], knowledge043);
    const reversed = computeActivationDiminishingFactors([c, b, a], knowledge043);
    for (const id of ["ctx-A", "ctx-B", "ctx-C"]) {
      expect(reversed.get(id)).toBeCloseTo(forward.get(id)!, 12);
    }
  });

  it("changing signed support/pressure does not change activation ranking", () => {
    const mk = (support: number) => [
      cand({ id: "ctx-A", geometryBucket: "context-only", activation: 3, support, boundedPathWeight: 1, stackingGroup: "g" }),
      cand({ id: "ctx-B", geometryBucket: "context-only", activation: 2, support: support * 5, boundedPathWeight: 1, stackingGroup: "g" }),
      cand({ id: "ctx-C", geometryBucket: "context-only", activation: 1, support: support * 9, boundedPathWeight: 1, stackingGroup: "g" }),
    ];
    const f1 = computeActivationDiminishingFactors(mk(1), knowledge043);
    const f2 = computeActivationDiminishingFactors(mk(100), knowledge043);
    for (const id of ["ctx-A", "ctx-B", "ctx-C"]) {
      expect(f2.get(id)).toBeCloseTo(f1.get(id)!, 12);
    }
  });

  it("signed diminishing ranks by signed magnitude, not activation", () => {
    // P-strong-signed has big support but tiny activation; P-weak-signed the reverse.
    const strong = cand({ id: "sig-strong", support: 10, activation: 0.1, stackingGroup: "g" });
    const weak = cand({ id: "sig-weak", support: 0.1, activation: 10, stackingGroup: "g" });
    const signed = computeSignedDiminishingFactors([strong, weak], knowledge043);
    const activation = computeActivationDiminishingFactors([strong, weak], knowledge043);
    // signed rank 1 is the big-support one; activation rank 1 is the big-activation one.
    expect(signed.get("sig-strong")).toBeCloseTo(1, 12);
    expect(signed.get("sig-weak")).toBeCloseTo(1 / Math.sqrt(2), 12);
    expect(activation.get("sig-weak")).toBeCloseTo(1, 12);
    expect(activation.get("sig-strong")).toBeCloseTo(1 / Math.sqrt(2), 12);
  });

  it("context-only activation uses bounded path weight, never geometryRoleWeight (0)", () => {
    const ctx = cand({ id: "ctx", geometryBucket: "context-only", activation: 4, boundedPathWeight: 0.6 });
    const agg = aggregateSpatialBudget(deduped([], [ctx]), knowledge043);
    // factor = confidence(1) * ownership(1) * boundedPathWeight(0.6) * diminishing(1)
    expect(agg.activationRaw).toBeCloseTo(4 * 0.6, 12);
  });
});

// ── §5 Exact trace reconstructability ───────────────────────────────────────

describe("V0.4.3 · evidence trace reconstructs the aggregates (§5)", () => {
  it("Σ signed-retained weighted support/pressure == bucket raw; Σ activation == activationRaw", () => {
    const direct1 = cand({ id: "d1", support: 3, pressure: 1, activation: 2, geometryBucket: "direct", physicalFactId: "f1", stackingGroup: "s1" });
    const direct2 = cand({ id: "d2", support: 2, pressure: 4, activation: 1, geometryBucket: "direct", physicalFactId: "f2", stackingGroup: "s2" });
    const tp4c1 = cand({ id: "t1", support: 5, pressure: 0, activation: 3, geometryBucket: "tp4c", physicalFactId: "f3", stackingGroup: "s3" });
    const ctx1 = cand({ id: "c1", activation: 4, geometryBucket: "context-only", boundedPathWeight: 0.5, physicalFactId: "f4", stackingGroup: "s4" });

    const signed = [direct1, direct2, tp4c1];
    const activation = [direct1, direct2, tp4c1, ctx1];
    const agg = aggregateSpatialBudget(deduped(signed, activation), knowledge043);

    const rows = agg.evidence;
    const sum = (pred: (r: (typeof rows)[number]) => boolean, sel: (r: (typeof rows)[number]) => number) =>
      rows.filter(pred).reduce((acc, r) => acc + sel(r), 0);

    const directSupport = sum(
      (r) => r.retainedForSignedScore === true && r.geometryBucket === "direct",
      (r) => r.weightedAxes.support,
    );
    const directPressure = sum(
      (r) => r.retainedForSignedScore === true && r.geometryBucket === "direct",
      (r) => r.weightedAxes.pressure,
    );
    const tp4cSupport = sum(
      (r) => r.retainedForSignedScore === true && r.geometryBucket === "tp4c",
      (r) => r.weightedAxes.support,
    );
    const activationSum = sum(
      (r) => r.retainedForActivation === true,
      (r) => r.weightedAxes.activation,
    );

    expect(directSupport).toBeCloseTo(agg.spatialBudgetTrace.directSupportRaw, 9);
    expect(directPressure).toBeCloseTo(agg.spatialBudgetTrace.directPressureRaw, 9);
    expect(tp4cSupport).toBeCloseTo(agg.spatialBudgetTrace.tp4cSupportRaw, 9);
    expect(activationSum).toBeCloseTo(agg.activationRaw, 9);
  });

  it("activation-only context reports zero signed support/pressure but real activation", () => {
    const ctx = cand({ id: "ctx", geometryBucket: "context-only", support: 9, pressure: 9, activation: 4, boundedPathWeight: 0.5 });
    const agg = aggregateSpatialBudget(deduped([], [ctx]), knowledge043);
    const row = agg.evidence.find((e) => e.id === "ctx")!;
    expect(row.retainedForSignedScore).toBe(false);
    expect(row.retainedForActivation).toBe(true);
    expect(row.weightedAxes.support).toBe(0);
    expect(row.weightedAxes.pressure).toBe(0);
    expect(row.weightedAxes.activation).toBeCloseTo(4 * 0.5, 9);
    expect(agg.spatialBudgetTrace.directSupportRaw).toBe(0);
    expect(agg.spatialBudgetTrace.tp4cSupportRaw).toBe(0);
  });

  it("a row that is both signed winner and activation winner exposes BOTH factors", () => {
    const both = cand({ id: "both", support: 3, activation: 2, geometryBucket: "direct" });
    const agg = aggregateSpatialBudget(deduped([both], [both]), knowledge043);
    const row = agg.evidence.find((e) => e.id === "both")!;
    expect(row.signedAppliedFactor).toBeGreaterThan(0);
    expect(row.activationAppliedFactor).toBeGreaterThan(0);
    expect(row.weightedAxes.support).toBeCloseTo(3 * row.signedAppliedFactor!, 9);
    expect(row.weightedAxes.activation).toBeCloseTo(2 * row.activationAppliedFactor!, 9);
  });

  it("rejected paths contribute zero weighted axes", () => {
    const winner = cand({ id: "w", support: 3, activation: 2, geometryBucket: "direct", physicalFactId: "f", stackingGroup: "s" });
    const loser = cand({ id: "l", support: 3, activation: 2, geometryBucket: "tp4c", geometryClass: "tp4c-opposite", physicalFactId: "f", stackingGroup: "s" });
    const dd = dedupeSpatialPaths([winner, loser], knowledge043);
    const agg = aggregateSpatialBudget(dd, knowledge043);
    const rejectedRow = agg.evidence.find((e) => e.rejectedPathReason);
    expect(rejectedRow).toBeDefined();
    expect(rejectedRow!.weightedAxes.support).toBe(0);
    expect(rejectedRow!.weightedAxes.pressure).toBe(0);
    expect(rejectedRow!.weightedAxes.activation).toBe(0);
  });
});

// ── §6 Dedupe: signed vs activation winners may differ ──────────────────────

describe("V0.4.3 · dedupe activation winner uses activation strength (§6)", () => {
  it("selects different signed and activation winners for one physical fact", () => {
    // Same domain + physicalFactId + geometryClass + layer, so geometry/layer
    // precedence ties. The SIGNED winner is chosen by configured path strength
    // (geometry × ownership × confidence) — here the higher-ownership path; the
    // ACTIVATION winner is chosen by activation magnitude — here the higher raw
    // activation path. So the two winners differ.
    const signedStrong = cand({
      id: "p-signed",
      support: 10,
      activation: 0.5,
      ownershipSubjectProduct: 2, // dominates the signed path strength
      geometryBucket: "direct",
      geometryClass: "direct-exact-target",
      physicalFactId: "same-fact",
      stackingGroup: "s",
    });
    const activationStrong = cand({
      id: "p-activation",
      support: 0.5,
      activation: 10, // dominates the activation magnitude
      ownershipSubjectProduct: 1,
      geometryBucket: "direct",
      geometryClass: "direct-exact-target",
      physicalFactId: "same-fact",
      stackingGroup: "s",
    });

    const dd = dedupeSpatialPaths([signedStrong, activationStrong], knowledge043);
    expect(dd.signedRetained).toHaveLength(1);
    expect(dd.activationRetained).toHaveLength(1);
    expect(dd.signedRetained[0]!.candidatePathId).toBe("p-signed");
    expect(dd.activationRetained[0]!.candidatePathId).toBe("p-activation");

    const agg = aggregateSpatialBudget(dd, knowledge043);
    // Activation counted exactly once, at the activation winner (raw 10 × 1).
    expect(agg.activationRaw).toBeCloseTo(10, 9);

    // The signed winner row is not mislabeled as the activation contributor.
    const signedRow = agg.evidence.find((e) => e.id === "p-signed")!;
    expect(signedRow.retainedForSignedScore).toBe(true);
    expect(signedRow.retainedForActivation).toBe(false);
    expect(signedRow.weightedAxes.activation).toBe(0);
    const activationRow = agg.evidence.find((e) => e.id === "p-activation")!;
    expect(activationRow.retainedForActivation).toBe(true);
    expect(activationRow.weightedAxes.activation).toBeCloseTo(10, 9);
  });

  it("counts activation exactly once per physical fact", () => {
    const a = cand({ id: "a", activation: 3, geometryBucket: "direct", physicalFactId: "fact", stackingGroup: "s" });
    const b = cand({ id: "b", activation: 2, geometryBucket: "tp4c", geometryClass: "tp4c-opposite", physicalFactId: "fact", stackingGroup: "s" });
    const dd = dedupeSpatialPaths([a, b], knowledge043);
    expect(dd.activationRetained).toHaveLength(1);
  });
});

// ── §12 · budget is shared, variants are independent, E == production ───────

describe("V0.4.3 · one shared TP4C budget (§12)", () => {
  it("opposite + trine TP4C palaces share the single 0.10 budget (not 0.10 each)", () => {
    const opposite = cand({
      id: "tp4c-opp",
      support: 100,
      geometryBucket: "tp4c",
      geometryClass: "tp4c-opposite",
      geometryRoleWeight: 0.8,
      physicalFactId: "f-opp",
      stackingGroup: "s-opp",
    });
    const trine = cand({
      id: "tp4c-tri",
      support: 100,
      geometryBucket: "tp4c",
      geometryClass: "tp4c-trine",
      geometryRoleWeight: 0.7,
      physicalFactId: "f-tri",
      stackingGroup: "s-tri",
    });
    const agg = aggregateSpatialBudget(deduped([opposite, trine], [opposite, trine]), knowledge043);
    // Both saturate the shared tp4c bucket → tp4cSigned ≈ 1 → contribution ≈ 0.10.
    expect(Math.abs(agg.spatialBudgetTrace.tp4cContribution)).toBeLessThanOrEqual(0.1 + EPS);
    expect(agg.spatialBudgetTrace.tp4cSigned).toBeGreaterThan(0.99);
  });
});

describe("V0.4.3 · variants are computed independently (§3/§10)", () => {
  const chart = calculateNamPhai({
    solarDate: "1991-09-21",
    birthHour: "Dậu",
    gender: "female",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  });

  it("B (no dedupe) retains ≥ signed facts than C (dedupe) and they differ somewhere", () => {
    const b = scoreSpatialVariantDomains(chart, ABLATION_SPATIAL_VARIANTS["B-budget-only-no-dedupe"]);
    const c = scoreSpatialVariantDomains(chart, ABLATION_SPATIAL_VARIANTS["C-budget-plus-direct-wins"]);
    let anyDiff = false;
    for (let i = 0; i < b.length; i++) {
      expect(b[i]!.retainedSignedFactCount).toBeGreaterThanOrEqual(c[i]!.retainedSignedFactCount);
      if (b[i]!.retainedSignedFactCount !== c[i]!.retainedSignedFactCount) anyDiff = true;
    }
    expect(anyDiff).toBe(true);
  });

  it("the production analyzer (default) equals variant E's score per domain", () => {
    const analyzer = analyzeAnnualAxesNamPhaiV043(chart);
    const e = scoreSpatialVariantDomains(chart, ABLATION_SPATIAL_VARIANTS["E-d-plus-diminishing-geometryBucket"]);
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = analyzer.axes[domain];
      const variant = e.find((d) => d.domain === domain)!;
      if (axis.status !== "available") {
        expect(variant.score).toBeNull();
        continue;
      }
      expect(variant.score).toBeCloseTo(axis.score, 9);
    }
  });
});
