import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV06NamPhai,
  AnnualSignedLayerFactorsV06,
} from "../../../knowledge/annual-axes/v0.6";
import { splitChartIndices } from "../../../knowledge/annual-axes/v0.6/derive-calibration";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  FULL_CORPUS_CONTRACT,
  buildAuditBirthInputs,
  expandAnnualYears,
} from "./build-audit-corpus";
import { scoreV06ChartDomains } from "../nam-phai-v06/score-chart";
import { median, percentile } from "./v051-stats";
import type { V06CalibrationParams, V06CandidateId } from "./v06-types";

function atanh01(x: number): number {
  return Math.atanh(Math.min(0.999999, Math.max(-0.999999, x)));
}

function clampScale(raw: number, knowledge: AnnualAxesKnowledgeV06NamPhai): number {
  return Math.min(
    knowledge.scoreProfile.maximumDomainScale,
    Math.max(knowledge.scoreProfile.minimumDomainScale, raw),
  );
}

function collect(
  knowledge: AnnualAxesKnowledgeV06NamPhai,
  chartIndices: number[],
  factors: AnnualSignedLayerFactorsV06,
  activationScale: number,
  candidateId: V06CandidateId,
  domainScaleOverride?: Partial<Record<AnnualAxisDomain, number>>,
) {
  const bases = buildAuditBirthInputs(FULL_CORPUS_CONTRACT);
  const samples: Array<{
    domain: AnnualAxisDomain;
    annualActivationRaw: number;
    activationGate: number;
    latent: number;
    score: number;
    tp4cContributionAbs: number;
  }> = [];

  for (const chartIndex of chartIndices) {
    const base = bases[chartIndex];
    if (!base) continue;
    for (const yearly of expandAnnualYears(
      base,
      FULL_CORPUS_CONTRACT.baseAnnualYear,
      FULL_CORPUS_CONTRACT.yearsPerChart,
    )) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV06ChartDomains(chart, knowledge, {
        activationScaleOverride: activationScale,
        domainScaleOverride,
        signedLayerFactorsOverride: factors,
        candidateId,
      });
      if (!domains) continue;
      for (const d of domains) {
        samples.push({
          domain: d.domain,
          annualActivationRaw: d.annualActivationRaw,
          activationGate: d.activationGate,
          latent: d.latent,
          score: d.score,
          tp4cContributionAbs: Math.abs(
            d.aggregate.spatialBudgetTrace.tp4cContribution ?? 0,
          ),
        });
      }
    }
  }
  return samples;
}

export function deriveV06Calibration(
  knowledge: AnnualAxesKnowledgeV06NamPhai,
  factors: AnnualSignedLayerFactorsV06,
  candidateId: V06CandidateId,
): V06CalibrationParams {
  const { training } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const provisional = collect(knowledge, training, factors, 1, candidateId);
  const positiveRaw = provisional.map((s) => s.annualActivationRaw).filter((v) => v > 0);
  const medianPositiveAnnualActivationRaw = median(positiveRaw);
  const activationScale =
    medianPositiveAnnualActivationRaw > 0
      ? medianPositiveAnnualActivationRaw / atanh01(0.7)
      : 1;

  const trainingSamples = collect(knowledge, training, factors, activationScale, candidateId);
  const q75AbsLatent = {} as Record<AnnualAxisDomain, number>;
  const domainScales = {} as Record<AnnualAxisDomain, number>;
  const latentTarget = knowledge.scoreProfile.latentTargetForDomainScale;

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const latents = trainingSamples
      .filter((s) => s.domain === domain)
      .map((s) => Math.abs(s.latent));
    const q75 = percentile([...latents].sort((a, b) => a - b), 0.75);
    q75AbsLatent[domain] = q75;
    domainScales[domain] = clampScale(q75 / latentTarget, knowledge);
  }

  return {
    candidateId,
    signedLayerFactors: { ...factors },
    activationScale,
    domainScales,
    medianPositiveAnnualActivationRaw,
    q75AbsLatent,
    trainingMedianActivationGate: median(trainingSamples.map((s) => s.activationGate)),
  };
}

export function scoreV06HoldoutSamples(
  knowledge: AnnualAxesKnowledgeV06NamPhai,
  calibration: V06CalibrationParams,
) {
  const { holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const bases = buildAuditBirthInputs(FULL_CORPUS_CONTRACT);
  const samples: Array<{
    chartId: string;
    chartIndex: number;
    annualYear: number;
    domain: AnnualAxisDomain;
    score: number;
    latent: number;
    activationGate: number;
    spatialSigned: number;
    tp4cContributionAbs: number;
  }> = [];

  for (const chartIndex of holdout) {
    const base = bases[chartIndex];
    if (!base) continue;
    const chartId = `${FULL_CORPUS_CONTRACT.contractId}:nam-phai:c${chartIndex}`;
    for (const yearly of expandAnnualYears(
      base,
      FULL_CORPUS_CONTRACT.baseAnnualYear,
      FULL_CORPUS_CONTRACT.yearsPerChart,
    )) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV06ChartDomains(chart, knowledge, {
        activationScaleOverride: calibration.activationScale,
        domainScaleOverride: calibration.domainScales,
        signedLayerFactorsOverride: calibration.signedLayerFactors,
        candidateId: calibration.candidateId,
      });
      if (!domains) continue;
      for (const d of domains) {
        samples.push({
          chartId,
          chartIndex,
          annualYear: chart.annualYear,
          domain: d.domain,
          score: d.score,
          latent: d.latent,
          activationGate: d.activationGate,
          spatialSigned: d.spatialSigned,
          tp4cContributionAbs: Math.abs(
            d.aggregate.spatialBudgetTrace.tp4cContribution ?? 0,
          ),
        });
      }
    }
  }
  return samples;
}
