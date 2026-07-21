/**
 * V0.5 spatial bucket aggregation — intensity×polarity buckets + annual-only activation raw.
 */

import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import type {
  AnnualAxisEvidence,
  AnnualAxisRawAxes,
  AnnualSpatialBudgetTrace,
} from "../types";
import { emptyAnnualAxes } from "../types";
import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import type { DedupedSpatialPaths } from "../nam-phai-v043/dedupe";
import {
  computeActivationPathFactor,
  computeSignedPathFactor,
  computeActivationDiminishingFactors,
  computeSignedDiminishingFactors,
} from "../nam-phai-v043/aggregate-spatial";
import { asV043DedupeKnowledge } from "./knowledge-adapter";
import {
  computeBucketSigned,
  computeSpatialSigned,
  type BucketSignedResult,
} from "./bucket-formula";

export interface V05BucketAggregateResult {
  evidence: AnnualAxisEvidence[];
  rawAxes: AnnualAxisRawAxes;
  spatialBudgetTrace: AnnualSpatialBudgetTrace;
  directBucket: BucketSignedResult;
  tp4cBucket: BucketSignedResult;
  spatialSigned: number;
  annualActivationRaw: number;
}

function signedLayerWeightOf(
  c: ClassifiedPathCandidate,
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): number {
  return knowledge.bucketFormula.signedLayerWeights[c.evidence.layer];
}

function toEvidenceRow(
  c: ClassifiedPathCandidate,
  opts: {
    retainedForSignedScore: boolean;
    retainedForActivation: boolean;
    rejectedPathReason?: string;
    signedDiminishingFactor: number;
    activationDiminishingFactor: number;
    signedAppliedFactor: number;
    activationAppliedFactor: number;
  },
): AnnualAxisEvidence {
  const support = opts.retainedForSignedScore
    ? c.evidence.rawAxes.support * opts.signedAppliedFactor
    : 0;
  const pressure = opts.retainedForSignedScore
    ? c.evidence.rawAxes.pressure * opts.signedAppliedFactor
    : 0;
  const activation = opts.retainedForActivation
    ? Math.max(0, c.evidence.rawAxes.activation) * opts.activationAppliedFactor
    : 0;

  const primaryFactor = opts.retainedForSignedScore
    ? opts.signedAppliedFactor
    : opts.retainedForActivation
      ? opts.activationAppliedFactor
      : 0;

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
    activationDiminishingFactor: opts.retainedForActivation
      ? opts.activationDiminishingFactor
      : undefined,
    signedAppliedFactor: opts.retainedForSignedScore ? opts.signedAppliedFactor : 0,
    activationAppliedFactor: opts.retainedForActivation ? opts.activationAppliedFactor : 0,
    diminishingFactor: opts.retainedForSignedScore
      ? opts.signedDiminishingFactor
      : opts.activationDiminishingFactor,
    finalAppliedFactor: primaryFactor,
    effectiveWeight: primaryFactor,
    weightedAxes: { support, pressure, stability: 0, activation },
    activationPaths: [c.path],
  };
}

export function aggregateV05Buckets(
  deduped: DedupedSpatialPaths,
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): V05BucketAggregateResult {
  const dedupeKnowledge = asV043DedupeKnowledge(knowledge);
  const { spatialBudget, bucketFormula } = knowledge;
  const { evidenceScale, epsilon } = bucketFormula;

  const signedDiminishing = computeSignedDiminishingFactors(
    deduped.signedRetained,
    dedupeKnowledge,
  );
  const activationDiminishing = computeActivationDiminishingFactors(
    deduped.activationRetained,
    dedupeKnowledge,
  );

  const signedIds = new Set(deduped.signedRetained.map((c) => c.candidatePathId));
  const activationIds = new Set(deduped.activationRetained.map((c) => c.candidatePathId));

  const buckets = {
    direct: { supportRaw: 0, pressureRaw: 0 },
    tp4c: { supportRaw: 0, pressureRaw: 0 },
  };

  const evidenceOut: AnnualAxisEvidence[] = [];

  for (const c of deduped.signedRetained) {
    const signedDim = signedDiminishing.get(c.candidatePathId) ?? 1;
    const signedApplied =
      computeSignedPathFactor(c, signedDim) * signedLayerWeightOf(c, knowledge);
    const alsoActivation = activationIds.has(c.candidatePathId);
    const activationDim = alsoActivation ? (activationDiminishing.get(c.candidatePathId) ?? 1) : 1;
    const activationApplied = alsoActivation
      ? computeActivationPathFactor(c, activationDim)
      : 0;

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

  for (const c of deduped.activationRetained) {
    if (signedIds.has(c.candidatePathId)) continue;
    const activationDim = activationDiminishing.get(c.candidatePathId) ?? 1;
    const activationApplied = computeActivationPathFactor(c, activationDim);
    evidenceOut.push(
      toEvidenceRow(c, {
        retainedForSignedScore: false,
        retainedForActivation: true,
        signedDiminishingFactor: 1,
        activationDiminishingFactor: activationDim,
        signedAppliedFactor: 0,
        activationAppliedFactor: activationApplied,
      }),
    );
  }

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

  const directBucket = computeBucketSigned({
    supportRaw: buckets.direct.supportRaw,
    pressureRaw: buckets.direct.pressureRaw,
    evidenceScale,
    epsilon,
  });
  const tp4cBucket = computeBucketSigned({
    supportRaw: buckets.tp4c.supportRaw,
    pressureRaw: buckets.tp4c.pressureRaw,
    evidenceScale,
    epsilon,
  });

  const { spatialSigned, directContribution, tp4cContribution } = computeSpatialSigned(
    directBucket.signed,
    tp4cBucket.signed,
    spatialBudget.signedBudget.direct,
    spatialBudget.signedBudget.tp4c,
  );

  let annualActivationRaw = 0;
  for (const c of deduped.activationRetained) {
    const activationDim = activationDiminishing.get(c.candidatePathId) ?? 1;
    const activationApplied = computeActivationPathFactor(c, activationDim);
    annualActivationRaw += Math.max(0, c.evidence.rawAxes.activation) * activationApplied;
  }

  const spatialBudgetTrace: AnnualSpatialBudgetTrace = {
    directBudget: spatialBudget.signedBudget.direct,
    tp4cBudget: spatialBudget.signedBudget.tp4c,
    directSupportRaw: buckets.direct.supportRaw,
    directPressureRaw: buckets.direct.pressureRaw,
    directSigned: directBucket.signed,
    directContribution,
    tp4cSupportRaw: buckets.tp4c.supportRaw,
    tp4cPressureRaw: buckets.tp4c.pressureRaw,
    tp4cSigned: tp4cBucket.signed,
    tp4cContribution,
    spatialSigned,
  };

  const rawAxes: AnnualAxisRawAxes = {
    ...emptyAnnualAxes(),
    support: buckets.direct.supportRaw + buckets.tp4c.supportRaw,
    pressure: buckets.direct.pressureRaw + buckets.tp4c.pressureRaw,
    activation: annualActivationRaw,
  };

  return {
    evidence: evidenceOut,
    rawAxes,
    spatialBudgetTrace,
    directBucket,
    tp4cBucket,
    spatialSigned,
    annualActivationRaw,
  };
}
