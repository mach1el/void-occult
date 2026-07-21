import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { splitChartIndices } from "../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "./build-audit-corpus";
import {
  aggregateEvidenceDimensions,
  collectV051Samples,
  samplesToVectors,
} from "./collect-v051-samples";
import type { V051BiasAuditReport } from "./v051-types";
import {
  closeEnough,
  mean,
  median,
  percentile,
  rate,
  scoreDistribution,
  vectorDistribution,
} from "./v051-stats";
import { V05_CALIBRATION_GENERATED_AT } from "../../../knowledge/annual-axes/v0.5/derive-calibration";

const HOLDOUT_REPORT_PATH = join(
  process.cwd(),
  "research/annual-axes/distribution/v0.5/annual-axes-v0.5-holdout-report.json",
);

export function verifyV05BaselineReproduction(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): { reproduced: boolean; mismatches: string[] } {
  const committed = JSON.parse(readFileSync(HOLDOUT_REPORT_PATH, "utf8"));
  const { holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const holdoutSamples = collectV051Samples(knowledge, { chartIndices: holdout });
  const vectors = samplesToVectors(holdoutSamples);

  const mismatches: string[] = [];
  const cal = knowledge.calibration;

  if (!closeEnough(cal.activationScale, committed.activationScale, 1e-9, 1e-9)) {
    mismatches.push(
      `activationScale ${cal.activationScale} != ${committed.activationScale}`,
    );
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!closeEnough(cal.domainScales[domain], committed.domainScales[domain], 1e-9, 1e-9)) {
      mismatches.push(
        `domainScales.${domain} ${cal.domainScales[domain]} != ${committed.domainScales[domain]}`,
      );
    }
  }
  if (
    !closeEnough(
      cal.trainingDiagnostics.medianActivationGate,
      committed.trainingDiagnostics.medianActivationGate,
      1e-6,
      1e-6,
    )
  ) {
    mismatches.push("training medianActivationGate mismatch");
  }

  const vecDist = vectorDistribution(vectors);
  const holdoutMetrics = committed.holdoutMetrics;
  if (!closeEnough(vecDist.meanIntraYearSixAxisSd, holdoutMetrics.meanIntraYearAxisStandardDeviation, 1e-6, 1e-4)) {
    mismatches.push("holdout meanIntraYearAxisStandardDeviation mismatch");
  }
  if (!closeEnough(vecDist.medianIntraYearRange, holdoutMetrics.medianIntraYearAxisRange, 1e-6, 1e-4)) {
    mismatches.push("holdout medianIntraYearAxisRange mismatch");
  }

  return { reproduced: mismatches.length === 0, mismatches };
}

function detectEvidenceBias(
  trainingSamples: ReturnType<typeof collectV051Samples>,
  holdoutSamples: ReturnType<typeof collectV051Samples>,
): {
  globalPositiveLatentBias: boolean;
  perDomainPositiveLatentBiasDomains: typeof ANNUAL_AXIS_DOMAINS[number][];
  scaleOnlyTighteningBlocked: boolean;
} {
  const checkSplit = (samples: ReturnType<typeof collectV051Samples>) => {
    const latents = samples.map((s) => s.latent);
    const posRate = rate(latents.filter((v) => v > 0).length, latents.length);
    const med = median(latents);
    return { posRate, med };
  };

  const trainGlobal = checkSplit(trainingSamples);
  const holdGlobal = checkSplit(holdoutSamples);
  const globalPositiveLatentBias =
    (trainGlobal.posRate > 0.65 && trainGlobal.med > 0) ||
    (holdGlobal.posRate > 0.65 && holdGlobal.med > 0);

  const perDomainPositiveLatentBiasDomains: typeof ANNUAL_AXIS_DOMAINS[number][] = [];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const train = checkSplit(trainingSamples.filter((s) => s.domain === domain));
    const hold = checkSplit(holdoutSamples.filter((s) => s.domain === domain));
    if (
      (train.posRate > 0.7 && train.med > 0) ||
      (hold.posRate > 0.7 && hold.med > 0)
    ) {
      perDomainPositiveLatentBiasDomains.push(domain);
    }
  }

  const scaleOnlyTighteningBlocked =
    globalPositiveLatentBias || perDomainPositiveLatentBiasDomains.length >= 4;

  return {
    globalPositiveLatentBias,
    perDomainPositiveLatentBiasDomains,
    scaleOnlyTighteningBlocked,
  };
}

export function runV051BiasAudit(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): V051BiasAuditReport {
  const baseline = verifyV05BaselineReproduction(knowledge);
  const { training, holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const allSamples = collectV051Samples(knowledge);
  const trainingSamples = allSamples.filter((s) => s.split === "training");
  const holdoutSamples = allSamples.filter((s) => s.split === "holdout");
  const evidenceDims = aggregateEvidenceDimensions(knowledge, [
    ...training,
    ...holdout,
  ]);

  const scores = allSamples.map((s) => s.score);
  const spatialSigned = allSamples.map((s) => s.spatialSigned);
  const latents = allSamples.map((s) => s.latent);
  const vectors = samplesToVectors(allSamples);

  const globalScore = scoreDistribution(scores);
  const globalVector = vectorDistribution(vectors);
  const sortedLatents = [...latents].sort((a, b) => a - b);
  const absLatents = latents.map(Math.abs).sort((a, b) => a - b);
  const posLatent = latents.filter((v) => v > 0);
  const negLatent = latents.filter((v) => v < 0);
  const posAbs = posLatent.reduce((s, v) => s + Math.abs(v), 0);
  const negAbs = negLatent.reduce((s, v) => s + Math.abs(v), 0);

  const gates = allSamples.map((s) => s.activationGate);
  const sortedGates = [...gates].sort((a, b) => a - b);

  const totalSupport =
    evidenceDims.directSupportRaw + evidenceDims.tp4cSupportRaw;
  const totalPressure =
    evidenceDims.directPressureRaw + evidenceDims.tp4cPressureRaw;

  const biasFlags = detectEvidenceBias(trainingSamples, holdoutSamples);

  const perDomain = {} as V051BiasAuditReport["perDomain"];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const ds = allSamples.filter((s) => s.domain === domain);
    const dl = ds.map((s) => s.latent);
    perDomain[domain] = {
      score: scoreDistribution(ds.map((s) => s.score)),
      signed: {
        latentMean: mean(dl),
        latentMedian: median(dl),
        positiveLatentRate: rate(dl.filter((v) => v > 0).length, dl.length),
        negativeLatentRate: rate(dl.filter((v) => v < 0).length, dl.length),
      },
      evidence: {
        directSupportRawMass: ds.reduce((s, x) => s + x.directSupportRaw, 0),
        directPressureRawMass: ds.reduce((s, x) => s + x.directPressureRaw, 0),
        tp4cSupportRawMass: ds.reduce((s, x) => s + x.tp4cSupportRaw, 0),
        tp4cPressureRawMass: ds.reduce((s, x) => s + x.tp4cPressureRaw, 0),
        supportPressureRawMassRatio:
          totalPressure > 0
            ? ds.reduce((s, x) => s + x.directSupportRaw + x.tp4cSupportRaw, 0) /
              Math.max(
                1e-9,
                ds.reduce((s, x) => s + x.directPressureRaw + x.tp4cPressureRaw, 0),
              )
            : Infinity,
      },
    };
  }

  const spatialSignedMedian = median(spatialSigned);
  const latentPositivelyBiased =
    biasFlags.globalPositiveLatentBias || biasFlags.perDomainPositiveLatentBiasDomains.length >= 4;
  const supportLargerThanPressure = totalSupport > totalPressure;
  const pressureTp4cShare =
    totalPressure > 0 ? evidenceDims.tp4cPressureRaw / totalPressure : 0;
  const supportTp4cShare =
    totalSupport > 0 ? evidenceDims.tp4cSupportRaw / totalSupport : 0;

  return {
    profileId: "annual-axes-v0.5.1-baseline-bias-audit",
    corpusId: FULL_CORPUS_CONTRACT.contractId,
    engineVersion: "0.5.0",
    generatedAt: V05_CALIBRATION_GENERATED_AT,
    baselineReproduced: baseline.reproduced,
    baselineMismatchDetails: baseline.mismatches,
    global: {
      score: globalScore,
      vector: globalVector,
      signed: {
        spatialSignedMean: mean(spatialSigned),
        spatialSignedMedian,
        latentMean: mean(latents),
        latentMedian: percentile(sortedLatents, 0.5),
        positiveLatentRate: rate(posLatent.length, latents.length),
        negativeLatentRate: rate(negLatent.length, latents.length),
        zeroLatentRate: rate(latents.filter((v) => v === 0).length, latents.length),
        medianAbsLatent: percentile(absLatents, 0.5),
        q75AbsLatent: percentile(absLatents, 0.75),
        positiveNegativeAbsoluteMassRatio: negAbs > 0 ? posAbs / negAbs : posAbs > 0 ? Infinity : 1,
      },
      activation: {
        annualActivationRawMean: mean(allSamples.map((s) => s.annualActivationRaw)),
        annualActivationRawMedian: median(allSamples.map((s) => s.annualActivationRaw)),
        activationGateMean: mean(gates),
        activationGateMedian: percentile(sortedGates, 0.5),
        activationGateP10: percentile(sortedGates, 0.1),
        activationGateP90: percentile(sortedGates, 0.9),
        activationGateMaximum: sortedGates[sortedGates.length - 1] ?? 0,
        gateBelow040Rate: rate(gates.filter((g) => g < 0.4).length, gates.length),
        gateAbove085Rate: rate(gates.filter((g) => g > 0.85).length, gates.length),
      },
      evidence: {
        directSupportRawMass: evidenceDims.directSupportRaw,
        directPressureRawMass: evidenceDims.directPressureRaw,
        tp4cSupportRawMass: evidenceDims.tp4cSupportRaw,
        tp4cPressureRawMass: evidenceDims.tp4cPressureRaw,
        supportPressureRawMassRatio: totalPressure > 0 ? totalSupport / totalPressure : Infinity,
        retainedSignedFactCount: evidenceDims.retainedSignedCount,
        retainedActivationFactCount: evidenceDims.retainedActivationCount,
      },
    },
    perDomain,
    evidenceByDimension: {
      byLayer: evidenceDims.byLayer,
      byCategory: evidenceDims.byCategory,
      byGeometryBucket: evidenceDims.byGeometryBucket,
      bySourceId: evidenceDims.bySourceId,
      byRuleId: evidenceDims.byRuleId,
      byStackingGroup: evidenceDims.byStackingGroup,
      byOwnershipRole: evidenceDims.byOwnershipRole,
    },
    evidenceBiasFlags: biasFlags,
    diagnosis: {
      softnessInSpatialSigned: Math.abs(spatialSignedMedian) < 0.05,
      latentPositivelyBiased,
      supportLargerThanPressure,
      pressureDisproportionatelyTp4c: pressureTp4cShare > supportTp4cShare + 0.15,
      pressureDroppedByEligibilityOrDedupe: evidenceDims.retainedSignedCount < evidenceDims.retainedActivationCount * 0.5,
      activationTooWeak: percentile(sortedGates, 0.5) < 0.55,
      calibrationWouldAmplifyPositiveBias: latentPositivelyBiased && globalScore.median > 50,
    },
  };
}
