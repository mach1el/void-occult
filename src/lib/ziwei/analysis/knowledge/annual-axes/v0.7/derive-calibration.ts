import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxisDomainId } from "../schema";
import type {
  AnnualAxesKnowledgeV07NamPhai,
  AnnualAxisCalibrationV07,
  AnnualSignedLayerFactorsV07,
} from "./schema";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "../../../modules/annual-axes/audit/build-audit-corpus";
import { scoreV07ChartDomains } from "../../../modules/annual-axes/nam-phai-v07/score-chart";

export const V07_CALIBRATION_GENERATED_AT = "2026-07-21T00:00:00.000Z";
export const V07_FORMULA_VERSION = "v0.7-robust-centered-annual-score";
export const V07_ENGINE_VERSION = "0.7.0";
export const V07_ACTIVATION_TARGET_GATE = 0.7;

/** Fixed production signed layer factors — also mirrored in knowledge JSON. */
export const V07_SIGNED_LAYER_FACTORS: AnnualSignedLayerFactorsV07 = {
  annual: 1,
  natalActivated: 0.25,
  majorFortune: 0,
  global: 0,
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

export function stableChartId(contract: AuditCorpusContract, chartIndex: number): string {
  return `${contract.contractId}:nam-phai:c${chartIndex}`;
}

export function splitChartIndices(
  chartCount: number,
  trainingFraction = 0.8,
): {
  training: number[];
  holdout: number[];
} {
  const trainingCount = Math.floor(chartCount * trainingFraction);
  const training = Array.from({ length: trainingCount }, (_, i) => i);
  const holdout = Array.from(
    { length: chartCount - trainingCount },
    (_, i) => i + trainingCount,
  );
  return { training, holdout };
}

interface RawTrainingSample {
  domain: AnnualAxisDomain;
  annualActivationRaw: number;
  activationGate: number;
  spatialSignedRaw: number;
  natalGain: number;
}

function collectRawSamples(
  contract: AuditCorpusContract,
  chartIndices: number[],
  knowledge: AnnualAxesKnowledgeV07NamPhai,
  activationScale: number,
  factors: AnnualSignedLayerFactorsV07,
): RawTrainingSample[] {
  const bases = buildAuditBirthInputs(contract);
  const samples: RawTrainingSample[] = [];
  // Zero centers so score path returns spatialSignedRaw untouched for center derivation.
  const zeroCenters = Object.fromEntries(ANNUAL_AXIS_DOMAINS.map((d) => [d, 0])) as Record<
    AnnualAxisDomain,
    number
  >;

  for (const chartIndex of chartIndices) {
    const base = bases[chartIndex];
    if (!base) continue;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV07ChartDomains(chart, knowledge, {
        activationScaleOverride: activationScale,
        domainCenterOverride: zeroCenters,
        signedLayerFactorsOverride: factors,
      });
      if (!domains) continue;
      for (const d of domains) {
        samples.push({
          domain: d.domain,
          annualActivationRaw: d.annualActivationRaw,
          activationGate: d.activationGate,
          spatialSignedRaw: d.spatialSignedRaw,
          natalGain: d.natalGain,
        });
      }
    }
  }
  return samples;
}

function deriveActivationScale(positiveRaw: number[]): number {
  const positives = positiveRaw.filter((v) => v > 0);
  const medianPositive = median(positives);
  const target = Math.atanh(V07_ACTIVATION_TARGET_GATE);
  return medianPositive > 0 ? medianPositive / target : 1;
}

function clampDomainScale(
  q75AbsStrictLatent: number,
  knowledge: AnnualAxesKnowledgeV07NamPhai,
): number {
  const target = knowledge.scoreProfile.latentTargetForDomainScale;
  const raw = q75AbsStrictLatent / target;
  return Math.min(
    knowledge.scoreProfile.maximumDomainScale,
    Math.max(knowledge.scoreProfile.minimumDomainScale, raw),
  );
}

/**
 * Derive V0.7 calibration from training charts only:
 * activationScale → domainCenters → domainScales / q75AbsStrictLatent.
 */
export function deriveV07Calibration(
  knowledge: AnnualAxesKnowledgeV07NamPhai,
  contract: AuditCorpusContract = FULL_CORPUS_CONTRACT,
  factors: AnnualSignedLayerFactorsV07 = V07_SIGNED_LAYER_FACTORS,
): AnnualAxisCalibrationV07 {
  const { training } = splitChartIndices(contract.chartCount);
  const provisional = collectRawSamples(contract, training, knowledge, 1, factors);
  const positiveRaw = provisional.map((s) => s.annualActivationRaw);
  const medianPositiveAnnualActivationRaw = median(positiveRaw.filter((v) => v > 0));
  const activationScale = deriveActivationScale(positiveRaw);

  const trainingSamples = collectRawSamples(
    contract,
    training,
    knowledge,
    activationScale,
    factors,
  );
  const activationGates = trainingSamples.map((s) => s.activationGate);

  const domainCenters = {} as Record<AnnualAxisDomainId, number>;
  const q75AbsStrictLatent = {} as Record<AnnualAxisDomainId, number>;
  const domainScales = {} as Record<AnnualAxisDomainId, number>;

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const domainSamples = trainingSamples.filter((s) => s.domain === domain);
    const centerPool = domainSamples
      .filter((s) => s.activationGate > 0)
      .map((s) => s.spatialSignedRaw);
    const domainCenter = median(centerPool);
    domainCenters[domain] = domainCenter;

    const strictLatents = domainSamples.map((s) => {
      const centered = s.spatialSignedRaw - domainCenter;
      return centered * s.activationGate * s.natalGain;
    });
    const q75 = percentile(
      [...strictLatents.map(Math.abs)].sort((a, b) => a - b),
      0.75,
    );
    q75AbsStrictLatent[domain] = q75;
    domainScales[domain] = clampDomainScale(q75, knowledge);
  }

  return {
    schemaVersion: "0.7.0",
    profileId: "annual-axis-calibration-nam-phai-v0-7",
    engineVersion: V07_ENGINE_VERSION,
    formulaVersion: V07_FORMULA_VERSION,
    trainingCorpusId: contract.contractId,
    splitPolicy: {
      trainingFraction: 0.8,
      holdoutFraction: 0.2,
      splitBy: "stable-chart-id",
    },
    activationTargetMedianGate: V07_ACTIVATION_TARGET_GATE,
    activationScale,
    medianPositiveAnnualActivationRaw,
    domainCenters,
    domainScales,
    q75AbsStrictLatent,
    trainingDiagnostics: {
      medianActivationGate: median(activationGates),
      p90ActivationGate: percentile([...activationGates].sort((a, b) => a - b), 0.9),
      maxActivationGate: activationGates.reduce((m, v) => Math.max(m, v), 0),
    },
    generatedAt: V07_CALIBRATION_GENERATED_AT,
    sourceIds: ["SRC-AA-ENG-004"],
    signedLayerFactors: { ...factors },
    selectionStatus: "pending",
  };
}
