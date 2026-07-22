/**
 * V0.7 spatial bucket aggregation — layer factors applied before intensity×polarity.
 */

import type {
  AnnualAxesKnowledgeV07NamPhai,
  AnnualSignedLayerFactorsV07,
} from "../../../knowledge/annual-axes/v0.7";
import { layerFactorForEvidenceLayer } from "../../../knowledge/annual-axes/v0.7/schema";
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

export interface V07LayerMassBreakdown {
  directSupportRawBeforeLayerFactor: number;
  directPressureRawBeforeLayerFactor: number;
  tp4cSupportRawBeforeLayerFactor: number;
  tp4cPressureRawBeforeLayerFactor: number;
  directSupportRawAfterLayerFactor: number;
  directPressureRawAfterLayerFactor: number;
  tp4cSupportRawAfterLayerFactor: number;
  tp4cPressureRawAfterLayerFactor: number;
}

export interface V07BucketAggregateResult {
  evidence: AnnualAxisEvidence[];
  rawAxes: AnnualAxisRawAxes;
  spatialBudgetTrace: AnnualSpatialBudgetTrace;
  directBucket: BucketSignedResult;
  tp4cBucket: BucketSignedResult;
  spatialSigned: number;
  annualActivationRaw: number;
  signedLayerFactors: AnnualSignedLayerFactorsV07;
  layerMass: V07LayerMassBreakdown;
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

export function aggregateV07Buckets(
  deduped: DedupedSpatialPaths,
  knowledge: AnnualAxesKnowledgeV07NamPhai,
  options?: { signedLayerFactorsOverride?: AnnualSignedLayerFactorsV07 },
): V07BucketAggregateResult {
  const dedupeKnowledge = asV043DedupeKnowledge(knowledge);
  const { spatialBudget, bucketFormula } = knowledge;
  const { evidenceScale, epsilon } = bucketFormula;
  const signedLayerFactors =
    options?.signedLayerFactorsOverride ?? bucketFormula.signedLayerFactors;

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

  const before = {
    direct: { supportRaw: 0, pressureRaw: 0 },
    tp4c: { supportRaw: 0, pressureRaw: 0 },
  };
  const after = {
    direct: { supportRaw: 0, pressureRaw: 0 },
    tp4c: { supportRaw: 0, pressureRaw: 0 },
  };

  const evidenceOut: AnnualAxisEvidence[] = [];

  for (const c of deduped.signedRetained) {
    const signedDim = signedDiminishing.get(c.candidatePathId) ?? 1;
    const pathFactor = computeSignedPathFactor(c, signedDim);
    const layerFactor = layerFactorForEvidenceLayer(c.evidence.layer, signedLayerFactors);
    const signedApplied = pathFactor * layerFactor;
    const alsoActivation = activationIds.has(c.candidatePathId);
    const activationDim = alsoActivation ? (activationDiminishing.get(c.candidatePathId) ?? 1) : 1;
    const activationApplied = alsoActivation
      ? computeActivationPathFactor(c, activationDim)
      : 0;

    if (c.geometryBucket === "direct" || c.geometryBucket === "tp4c") {
      const supportWeighted = Math.max(0, c.evidence.rawAxes.support) * pathFactor;
      const pressureWeighted = Math.max(0, c.evidence.rawAxes.pressure) * pathFactor;
      before[c.geometryBucket].supportRaw += supportWeighted;
      before[c.geometryBucket].pressureRaw += pressureWeighted;
      after[c.geometryBucket].supportRaw += supportWeighted * layerFactor;
      after[c.geometryBucket].pressureRaw += pressureWeighted * layerFactor;
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
    supportRaw: after.direct.supportRaw,
    pressureRaw: after.direct.pressureRaw,
    evidenceScale,
    epsilon,
  });
  const tp4cBucket = computeBucketSigned({
    supportRaw: after.tp4c.supportRaw,
    pressureRaw: after.tp4c.pressureRaw,
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
    directSupportRaw: after.direct.supportRaw,
    directPressureRaw: after.direct.pressureRaw,
    directSigned: directBucket.signed,
    directContribution,
    tp4cSupportRaw: after.tp4c.supportRaw,
    tp4cPressureRaw: after.tp4c.pressureRaw,
    tp4cSigned: tp4cBucket.signed,
    tp4cContribution,
    spatialSigned,
  };

  const rawAxes: AnnualAxisRawAxes = {
    ...emptyAnnualAxes(),
    support: after.direct.supportRaw + after.tp4c.supportRaw,
    pressure: after.direct.pressureRaw + after.tp4c.pressureRaw,
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
    signedLayerFactors,
    layerMass: {
      directSupportRawBeforeLayerFactor: before.direct.supportRaw,
      directPressureRawBeforeLayerFactor: before.direct.pressureRaw,
      tp4cSupportRawBeforeLayerFactor: before.tp4c.supportRaw,
      tp4cPressureRawBeforeLayerFactor: before.tp4c.pressureRaw,
      directSupportRawAfterLayerFactor: after.direct.supportRaw,
      directPressureRawAfterLayerFactor: after.direct.pressureRaw,
      tp4cSupportRawAfterLayerFactor: after.tp4c.supportRaw,
      tp4cPressureRawAfterLayerFactor: after.tp4c.pressureRaw,
    },
  };
}
