/**
 * V0.4.3 spatial aggregation: normalize each of {direct, tp4c} independently,
 * then apply the configured signed budget (default 90/10).
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
 * Ranking uses pre-diminishing magnitude so insertion order never decides ties.
 */
export function computeDiminishingFactors(
  retained: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV043NamPhai,
): Map<string, number> {
  const groupBy = knowledge.aggregationProfile.diminishingReturns.groupBy;
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
      const magA =
        (Math.abs(a.evidence.rawAxes.support) + Math.abs(a.evidence.rawAxes.pressure)) *
        a.confidenceWeight *
        a.ownershipSubjectProduct *
        a.geometryRoleWeight;
      const magB =
        (Math.abs(b.evidence.rawAxes.support) + Math.abs(b.evidence.rawAxes.pressure)) *
        b.confidenceWeight *
        b.ownershipSubjectProduct *
        b.geometryRoleWeight;
      if (magB !== magA) return magB > magA ? 1 : -1;
      return comparePathPrecedence(a, b, knowledge);
    });
    ranked.forEach((c, index) => {
      factors.set(c.candidatePathId, 1 / Math.sqrt(index + 1));
    });
  }
  return factors;
}

function toEvidenceRow(
  c: ClassifiedPathCandidate,
  opts: {
    retainedForSignedScore: boolean;
    retainedForActivation: boolean;
    rejectedPathReason?: string;
    diminishingFactor: number;
    finalAppliedFactor: number;
  },
): AnnualAxisEvidence {
  const factor = opts.finalAppliedFactor;
  return {
    ...c.evidence,
    geometryClass: c.geometryClass,
    geometryBucket: c.geometryBucket,
    retainedForSignedScore: opts.retainedForSignedScore,
    retainedForActivation: opts.retainedForActivation,
    rejectedPathReason: opts.rejectedPathReason,
    ownershipWeight: c.ownershipWeight,
    confidenceWeight: c.confidenceWeight,
    diminishingFactor: opts.diminishingFactor,
    finalAppliedFactor: factor,
    effectiveWeight: factor,
    weightedAxes: {
      support: c.evidence.rawAxes.support * factor,
      pressure: c.evidence.rawAxes.pressure * factor,
      stability: 0,
      activation: c.evidence.rawAxes.activation * factor,
    },
    activationPaths: [c.path],
  };
}

export function aggregateSpatialBudget(
  deduped: DedupedSpatialPaths,
  knowledge: AnnualAxesKnowledgeV043NamPhai,
): SpatialAggregateResult {
  const { spatialBudget, aggregationProfile } = knowledge;
  const scales = aggregationProfile.normalization;

  const diminishing = computeDiminishingFactors(deduped.signedRetained, knowledge);

  const buckets = {
    direct: { supportRaw: 0, pressureRaw: 0 },
    tp4c: { supportRaw: 0, pressureRaw: 0 },
  };

  const signedIds = new Set(deduped.signedRetained.map((c) => c.candidatePathId));
  const activationIds = new Set(deduped.activationRetained.map((c) => c.candidatePathId));

  const evidenceOut: AnnualAxisEvidence[] = [];

  for (const c of deduped.signedRetained) {
    const diminishingFactor = diminishing.get(c.candidatePathId) ?? 1;
    // factor = confidence * ownership * subjectModifier * geometryRoleWeight * diminishing
    // ownershipSubjectProduct already = ownership * subjectModifier
    const finalAppliedFactor =
      c.confidenceWeight *
      c.ownershipSubjectProduct *
      c.geometryRoleWeight *
      diminishingFactor;

    if (c.geometryBucket === "direct" || c.geometryBucket === "tp4c") {
      const bucket = buckets[c.geometryBucket];
      bucket.supportRaw += c.evidence.rawAxes.support * finalAppliedFactor;
      bucket.pressureRaw += c.evidence.rawAxes.pressure * finalAppliedFactor;
    }

    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: true,
        retainedForActivation: activationIds.has(c.candidatePathId),
        diminishingFactor,
        finalAppliedFactor,
      }),
    );
  }

  // Activation-only retained paths that were not also signed winners.
  for (const c of deduped.activationRetained) {
    if (signedIds.has(c.candidatePathId)) continue;
    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: false,
        retainedForActivation: true,
        diminishingFactor: 1,
        finalAppliedFactor: 0,
      }),
    );
  }

  for (const c of deduped.rejected) {
    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: false,
        retainedForActivation: false,
        rejectedPathReason: c.rejectedPathReason,
        diminishingFactor: 1,
        finalAppliedFactor: 0,
      }),
    );
  }

  evidenceOut.sort((a, b) => a.id.localeCompare(b.id) || (a.geometryClass ?? "").localeCompare(b.geometryClass ?? ""));

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

  // Activation once per physical fact at strongest eligible path.
  let activationRaw = 0;
  for (const c of deduped.activationRetained) {
    const diminishingFactor =
      diminishing.get(c.candidatePathId) ??
      // activation-only path: still apply confidence × ownershipSubject × geometry (or 1 for context)
      1;
    const geoWeight = c.geometryBucket === "context-only" ? 1 : c.geometryRoleWeight;
    const factor =
      c.confidenceWeight * c.ownershipSubjectProduct * geoWeight * diminishingFactor;
    activationRaw += c.evidence.rawAxes.activation * factor;
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
