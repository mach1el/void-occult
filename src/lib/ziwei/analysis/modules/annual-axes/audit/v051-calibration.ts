import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import {
  splitChartIndices,
  stableChartId,
} from "../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "./build-audit-corpus";
import { collectV051Samples } from "./collect-v051-samples";
import { median, percentile } from "./v051-stats";
import type { V051CalibrationParams, V051CandidateSpec } from "./v051-types";

const AMPLITUDE = 38;

function atanh01(x: number): number {
  return Math.atanh(Math.min(0.999999, Math.max(-0.999999, x)));
}

function clampScale(
  raw: number,
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): number {
  return Math.min(
    knowledge.scoreProfile.maximumDomainScale,
    Math.max(knowledge.scoreProfile.minimumDomainScale, raw),
  );
}

export function deriveV051Calibration(
  spec: V051CandidateSpec,
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): V051CalibrationParams {
  if (spec.id === "BASELINE-V05") {
    const cal = knowledge.calibration;
    return {
      candidateId: spec.id,
      activationScale: cal.activationScale,
      domainScales: { ...cal.domainScales },
      medianPositiveAnnualActivationRaw: cal.medianPositiveAnnualActivationRaw,
      q75AbsLatent: { ...cal.q75AbsLatent },
      trainingMedianActivationGate: cal.trainingDiagnostics.medianActivationGate,
    };
  }

  const { training } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const provisional = collectV051Samples(knowledge, {
    chartIndices: training,
    activationScaleOverride: 1,
  });
  const positiveRaw = provisional.map((s) => s.annualActivationRaw).filter((v) => v > 0);
  const medianPositiveAnnualActivationRaw = median(positiveRaw);

  const activationTarget = atanh01(spec.targetMedianActivationGate);
  const activationScale =
    medianPositiveAnnualActivationRaw > 0
      ? medianPositiveAnnualActivationRaw / activationTarget
      : 1;

  const trainingSamples = collectV051Samples(knowledge, {
    chartIndices: training,
    activationScaleOverride: activationScale,
  });

  const q75AbsLatent = {} as Record<AnnualAxisDomain, number>;
  const domainScales = {} as Record<AnnualAxisDomain, number>;
  const latentTarget = atanh01(spec.targetQ75ScoreDelta / AMPLITUDE);

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const latents = trainingSamples
      .filter((s) => s.domain === domain)
      .map((s) => Math.abs(s.latent));
    const q75 = percentile([...latents].sort((a, b) => a - b), 0.75);
    q75AbsLatent[domain] = q75;
    const raw = q75 / latentTarget;
    domainScales[domain] = spec.clampDomainScale
      ? clampScale(raw, knowledge)
      : raw;
  }

  const gates = trainingSamples.map((s) => s.activationGate);

  return {
    candidateId: spec.id,
    activationScale,
    domainScales,
    medianPositiveAnnualActivationRaw,
    q75AbsLatent,
    trainingMedianActivationGate: median(gates),
  };
}

export function rescoreSamplesWithCalibration(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  calibration: V051CalibrationParams,
  chartIndices: number[],
) {
  return collectV051Samples(knowledge, {
    chartIndices,
    activationScaleOverride: calibration.activationScale,
    domainScaleOverride: calibration.domainScales,
  });
}
