/**
 * V0.4.3 spatial aggregation: normalize each of {direct, tp4c} independently,
 * then apply the configured signed budget (default 90/10).
 *
 * Signed score and activation are ranked and weighted along SEPARATE paths
 * (§4/§5): each has its own diminishing map (ranked by its own magnitude) and
 * its own applied factor. Every aggregate is exactly reconstructable from the
 * emitted evidence rows:
 *   - directSupportRaw   = Σ weightedAxes.support   over signed-retained direct
 *   - tp4cSupportRaw     = Σ weightedAxes.support   over signed-retained tp4c
 *   - activationRaw      = Σ weightedAxes.activation over activation-retained
 */

import type { AnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import type {
  AnnualAxisEvidence,
  AnnualAxisRawAxes,
  AnnualSpatialBudgetTrace,
} from "../types";
import { emptyAnnualAxes } from "../types";
import type { ClassifiedPathCandidate } from "./classify-paths";
import type { DedupedSpatialPaths } from "./dedupe";
import { comparePathPrecedence } from "./dedupe";
import {
  activationMagnitude,
  activationPathGeometryWeight,
  signedGeometryWeight,
  signedMagnitude,
} from "./magnitudes";

export {
  activationMagnitude,
  activationPathGeometryWeight,
  signedGeometryWeight,
  signedMagnitude,
};

export interface SpatialAggregateResult {
  evidence: AnnualAxisEvidence[];
  rawAxes: AnnualAxisRawAxes;
  spatialBudgetTrace: AnnualSpatialBudgetTrace;
  directSigned: number;
  tp4cSigned: number;
  spatialSigned: number;
  activationRaw: number;
  activationNorm: number;
}

export type DiminishingGroupBy = AnnualAxesKnowledgeV043NamPhai["aggregationProfile"]["diminishingReturns"]["groupBy"];

export interface SpatialAggregateOptions {
  /** Override diminishing group keys (ablation C/D vs E). */
  diminishingGroupBy?: DiminishingGroupBy;
}

/** Full signed factor applied to support/pressure. */
export function computeSignedPathFactor(
  c: ClassifiedPathCandidate,
  diminishingFactor: number,
): number {
  return (
    c.confidenceWeight * c.ownershipSubjectProduct * signedGeometryWeight(c) * diminishingFactor
  );
}

/** Full activation factor applied to raw activation. */
export function computeActivationPathFactor(
  c: ClassifiedPathCandidate,
  diminishingFactor: number,
): number {
  return (
    c.confidenceWeight *
    c.ownershipSubjectProduct *
    activationPathGeometryWeight(c) *
    diminishingFactor
  );
}

function oneMinusExp(x: number, scale: number): number {
  return 1 - Math.exp(-Math.max(0, x) / scale);
}

function diminishingGroupKey(
  c: ClassifiedPathCandidate,
  groupBy: readonly string[],
): string {
  const parts: string[] = [];
  for (const key of groupBy) {
    if (key === "domain") parts.push(c.evidence.domain);
    else if (key === "geometryBucket") parts.push(c.geometryBucket);
    else if (key === "layer") parts.push(c.evidence.layer);
    else if (key === "stackingGroup") parts.push(c.evidence.stackingGroup);
  }
  return parts.join("|");
}

/**
 * Rank within configured groups; return 1/sqrt(rank) per candidatePathId.
 * `magnitudeOf` supplies the ranking metric — SIGNED and ACTIVATION callers
 * pass their own magnitude so the two rankings are fully independent. Ranking
 * uses pre-diminishing magnitude and a deterministic precedence tie-break, so
 * array insertion order never decides ties.
 */
function computeDiminishingFactors(
  retained: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV043NamPhai,
  magnitudeOf: (c: ClassifiedPathCandidate) => number,
  groupByOverride?: DiminishingGroupBy,
): Map<string, number> {
  const groupBy = groupByOverride ?? knowledge.aggregationProfile.diminishingReturns.groupBy;
  const groups = new Map<string, ClassifiedPathCandidate[]>();
  for (const c of retained) {
    const key = diminishingGroupKey(c, groupBy);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const factors = new Map<string, number>();
  const groupKeys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  for (const key of groupKeys) {
    const list = groups.get(key)!;
    const ranked = [...list].sort((a, b) => {
      const magA = magnitudeOf(a);
      const magB = magnitudeOf(b);
      if (magB !== magA) return magB > magA ? 1 : -1;
      return comparePathPrecedence(a, b, knowledge);
    });
    ranked.forEach((c, index) => {
      factors.set(c.candidatePathId, 1 / Math.sqrt(index + 1));
    });
  }
  return factors;
}

/** Signed diminishing factors — ranked by signed magnitude. */
export function computeSignedDiminishingFactors(
  retained: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV043NamPhai,
  groupByOverride?: DiminishingGroupBy,
): Map<string, number> {
  return computeDiminishingFactors(retained, knowledge, signedMagnitude, groupByOverride);
}

/** Activation diminishing factors — ranked by activation magnitude. */
export function computeActivationDiminishingFactors(
  retained: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV043NamPhai,
  groupByOverride?: DiminishingGroupBy,
): Map<string, number> {
  return computeDiminishingFactors(retained, knowledge, activationMagnitude, groupByOverride);
}

interface EvidenceRowInput {
  retainedForSignedScore: boolean;
  retainedForActivation: boolean;
  rejectedPathReason?: string;
  signedDiminishingFactor: number;
  activationDiminishingFactor: number;
  signedAppliedFactor: number;
  activationAppliedFactor: number;
}

function toEvidenceRow(
  c: ClassifiedPathCandidate,
  opts: EvidenceRowInput,
): AnnualAxisEvidence {
  const support = opts.retainedForSignedScore
    ? c.evidence.rawAxes.support * opts.signedAppliedFactor
    : 0;
  const pressure = opts.retainedForSignedScore
    ? c.evidence.rawAxes.pressure * opts.signedAppliedFactor
    : 0;
  const activation = opts.retainedForActivation
    ? c.evidence.rawAxes.activation * opts.activationAppliedFactor
    : 0;

  // Compatibility: primary-role applied factor (signed if signed-retained,
  // else activation). Never the activation source of truth (§5).
  const primaryFactor = opts.retainedForSignedScore
    ? opts.signedAppliedFactor
    : opts.retainedForActivation
      ? opts.activationAppliedFactor
      : 0;
  const primaryDiminishing = opts.retainedForSignedScore
    ? opts.signedDiminishingFactor
    : opts.retainedForActivation
      ? opts.activationDiminishingFactor
      : 1;

  return {
    ...c.evidence,
    geometryClass: c.geometryClass,
    geometryBucket: c.geometryBucket,
    retainedForSignedScore: opts.retainedForSignedScore,
    retainedForActivation: opts.retainedForActivation,
    rejectedPathReason: opts.rejectedPathReason,
    ownershipWeight: c.ownershipWeight,
    confidenceWeight: c.confidenceWeight,
    signedDiminishingFactor: opts.retainedForSignedScore ? opts.signedDiminishingFactor : undefined,
    activationDiminishingFactor: opts.retainedForActivation ? opts.activationDiminishingFactor : undefined,
    signedAppliedFactor: opts.retainedForSignedScore ? opts.signedAppliedFactor : 0,
    activationAppliedFactor: opts.retainedForActivation ? opts.activationAppliedFactor : 0,
    diminishingFactor: primaryDiminishing,
    finalAppliedFactor: primaryFactor,
    effectiveWeight: primaryFactor,
    weightedAxes: { support, pressure, stability: 0, activation },
    activationPaths: [c.path],
  };
}

export function aggregateSpatialBudget(
  deduped: DedupedSpatialPaths,
  knowledge: AnnualAxesKnowledgeV043NamPhai,
  options?: SpatialAggregateOptions,
): SpatialAggregateResult {
  const { spatialBudget, aggregationProfile } = knowledge;
  const scales = aggregationProfile.normalization;
  const diminishingGroupBy = options?.diminishingGroupBy;

  const signedDiminishing = computeSignedDiminishingFactors(
    deduped.signedRetained,
    knowledge,
    diminishingGroupBy,
  );
  const activationDiminishing = computeActivationDiminishingFactors(
    deduped.activationRetained,
    knowledge,
    diminishingGroupBy,
  );

  const signedFactorOf = (c: ClassifiedPathCandidate) =>
    computeSignedPathFactor(c, signedDiminishing.get(c.candidatePathId) ?? 1);
  const activationFactorOf = (c: ClassifiedPathCandidate) =>
    computeActivationPathFactor(c, activationDiminishing.get(c.candidatePathId) ?? 1);

  const buckets = {
    direct: { supportRaw: 0, pressureRaw: 0 },
    tp4c: { supportRaw: 0, pressureRaw: 0 },
  };

  const signedIds = new Set(deduped.signedRetained.map((c) => c.candidatePathId));
  const activationIds = new Set(deduped.activationRetained.map((c) => c.candidatePathId));

  const evidenceOut: AnnualAxisEvidence[] = [];

  // 1. Signed-retained rows (may also be activation winners for the same path).
  for (const c of deduped.signedRetained) {
    const signedDim = signedDiminishing.get(c.candidatePathId) ?? 1;
    const signedApplied = computeSignedPathFactor(c, signedDim);
    const alsoActivation = activationIds.has(c.candidatePathId);
    const activationDim = alsoActivation ? (activationDiminishing.get(c.candidatePathId) ?? 1) : 1;
    const activationApplied = alsoActivation ? activationFactorOf(c) : 0;

    if (c.geometryBucket === "direct" || c.geometryBucket === "tp4c") {
      const bucket = buckets[c.geometryBucket];
      bucket.supportRaw += c.evidence.rawAxes.support * signedApplied;
      bucket.pressureRaw += c.evidence.rawAxes.pressure * signedApplied;
    }

    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: true,
        retainedForActivation: alsoActivation,
        signedDiminishingFactor: signedDim,
        activationDiminishingFactor: activationDim,
        signedAppliedFactor: signedApplied,
        activationAppliedFactor: activationApplied,
      }),
    );
  }

  // 2. Activation-only rows (winners not also retained for the signed score).
  for (const c of deduped.activationRetained) {
    if (signedIds.has(c.candidatePathId)) continue;
    const activationDim = activationDiminishing.get(c.candidatePathId) ?? 1;
    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: false,
        retainedForActivation: true,
        signedDiminishingFactor: 1,
        activationDiminishingFactor: activationDim,
        signedAppliedFactor: 0,
        activationAppliedFactor: computeActivationPathFactor(c, activationDim),
      }),
    );
  }

  // 3. Rejected rows contribute nothing but are retained for audit.
  for (const c of deduped.rejected) {
    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: false,
        retainedForActivation: false,
        rejectedPathReason: c.rejectedPathReason,
        signedDiminishingFactor: 1,
        activationDiminishingFactor: 1,
        signedAppliedFactor: 0,
        activationAppliedFactor: 0,
      }),
    );
  }

  evidenceOut.sort(
    (a, b) => a.id.localeCompare(b.id) || (a.geometryClass ?? "").localeCompare(b.geometryClass ?? ""),
  );

  const directSupportNorm = oneMinusExp(buckets.direct.supportRaw, scales.supportScale);
  const directPressureNorm = oneMinusExp(buckets.direct.pressureRaw, scales.pressureScale);
  const tp4cSupportNorm = oneMinusExp(buckets.tp4c.supportRaw, scales.supportScale);
  const tp4cPressureNorm = oneMinusExp(buckets.tp4c.pressureRaw, scales.pressureScale);

  const directSigned = directSupportNorm - directPressureNorm;
  const tp4cSigned = tp4cSupportNorm - tp4cPressureNorm;

  const directBudget = spatialBudget.signedBudget.direct;
  const tp4cBudget = spatialBudget.signedBudget.tp4c;
  const directContribution = directBudget * directSigned;
  const tp4cContribution = tp4cBudget * tp4cSigned;
  const spatialSigned = directContribution + tp4cContribution;

  // Activation once per physical fact at strongest eligible path — identical
  // to Σ weightedAxes.activation over activation-retained rows (reconstructable).
  let activationRaw = 0;
  for (const c of deduped.activationRetained) {
    activationRaw += c.evidence.rawAxes.activation * activationFactorOf(c);
  }
  const activationNorm = oneMinusExp(activationRaw, scales.activationScale);

  const rawAxes: AnnualAxisRawAxes = {
    ...emptyAnnualAxes(),
    support: buckets.direct.supportRaw + buckets.tp4c.supportRaw,
    pressure: buckets.direct.pressureRaw + buckets.tp4c.pressureRaw,
    activation: activationRaw,
  };

  const spatialBudgetTrace: AnnualSpatialBudgetTrace = {
    directBudget,
    tp4cBudget,
    directSupportRaw: buckets.direct.supportRaw,
    directPressureRaw: buckets.direct.pressureRaw,
    directSigned,
    directContribution,
    tp4cSupportRaw: buckets.tp4c.supportRaw,
    tp4cPressureRaw: buckets.tp4c.pressureRaw,
    tp4cSigned,
    tp4cContribution,
    spatialSigned,
  };

  return {
    evidence: evidenceOut,
    rawAxes,
    spatialBudgetTrace,
    directSigned,
    tp4cSigned,
    spatialSigned,
    activationRaw,
    activationNorm,
  };
}
