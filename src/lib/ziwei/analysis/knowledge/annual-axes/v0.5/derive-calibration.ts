import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxisDomainId } from "../schema";
import type { AnnualAxesKnowledgeV05NamPhai, AnnualAxisCalibrationV05 } from "./schema";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "../../../modules/annual-axes/audit/build-audit-corpus";
import { scoreV05ChartDomains } from "../../../modules/annual-axes/nam-phai-v05/score-chart";

export const V05_CALIBRATION_GENERATED_AT = "2026-07-21T00:00:00.000Z";
export const V05_FORMULA_VERSION = "v0.5-calibrated-core";
export const V05_ACTIVATION_TARGET_GATE = 0.7;

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

export function splitChartIndices(chartCount: number, trainingFraction = 0.8): {
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

export interface V05CalibrationSample {
  chartId: string;
  chartIndex: number;
  annualYear: number;
  domain: AnnualAxisDomain;
  annualActivationRaw: number;
  activationGate: number;
  latent: number;
}

function collectSamples(
  contract: AuditCorpusContract,
  chartIndices: number[],
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  activationScale: number,
): V05CalibrationSample[] {
  const bases = buildAuditBirthInputs(contract);
  const samples: V05CalibrationSample[] = [];

  for (const chartIndex of chartIndices) {
    const base = bases[chartIndex];
    if (!base) continue;
    const chartId = stableChartId(contract, chartIndex);
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV05ChartDomains(chart, knowledge, {
        activationScaleOverride: activationScale,
      });
      if (!domains) continue;
      for (const d of domains) {
        samples.push({
          chartId,
          chartIndex,
          annualYear: chart.annualYear,
          domain: d.domain,
          annualActivationRaw: d.annualActivationRaw,
          activationGate: d.activationGate,
          latent: d.latent,
        });
      }
    }
  }

  return samples;
}

function deriveActivationScale(positiveRaw: number[]): number {
  const positives = positiveRaw.filter((v) => v > 0);
  const medianPositive = median(positives);
  const target = Math.atanh(V05_ACTIVATION_TARGET_GATE);
  return medianPositive > 0 ? medianPositive / target : 1;
}

function clampDomainScale(
  q75AbsLatent: number,
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): number {
  const target = knowledge.scoreProfile.latentTargetForDomainScale;
  const raw = q75AbsLatent / target;
  return Math.min(
    knowledge.scoreProfile.maximumDomainScale,
    Math.max(knowledge.scoreProfile.minimumDomainScale, raw),
  );
}

export function deriveV05Calibration(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  contract: AuditCorpusContract = FULL_CORPUS_CONTRACT,
): AnnualAxisCalibrationV05 {
  const { training } = splitChartIndices(contract.chartCount);
  const provisional = collectSamples(contract, training, knowledge, 1);
  const positiveRaw = provisional.map((s) => s.annualActivationRaw);
  const medianPositiveAnnualActivationRaw = median(positiveRaw.filter((v) => v > 0));
  const activationScale = deriveActivationScale(positiveRaw);

  const trainingSamples = collectSamples(contract, training, knowledge, activationScale);
  const activationGates = trainingSamples.map((s) => s.activationGate);

  const q75AbsLatent = {} as Record<AnnualAxisDomainId, number>;
  const domainScales = {} as Record<AnnualAxisDomainId, number>;

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const latents = trainingSamples
      .filter((s) => s.domain === domain)
      .map((s) => Math.abs(s.latent));
    const q75 = percentile([...latents].sort((a, b) => a - b), 0.75);
    q75AbsLatent[domain] = q75;
    domainScales[domain] = clampDomainScale(q75, knowledge);
  }

  return {
    schemaVersion: "0.5.0",
    profileId: "annual-axis-calibration-nam-phai-v0-5",
    formulaVersion: V05_FORMULA_VERSION,
    trainingCorpusId: contract.contractId,
    splitPolicy: {
      trainingFraction: 0.8,
      holdoutFraction: 0.2,
      splitBy: "stable-chart-id",
    },
    activationTargetMedianGate: V05_ACTIVATION_TARGET_GATE,
    activationScale,
    medianPositiveAnnualActivationRaw,
    domainScales,
    q75AbsLatent,
    trainingDiagnostics: {
      medianActivationGate: median(activationGates),
      p90ActivationGate: percentile([...activationGates].sort((a, b) => a - b), 0.9),
      maxActivationGate: activationGates.reduce((m, v) => Math.max(m, v), 0),
    },
    generatedAt: V05_CALIBRATION_GENERATED_AT,
    sourceIds: ["SRC-AA-ENG-004"],
  };
}

