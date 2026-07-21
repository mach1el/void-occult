import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { splitChartIndices } from "../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "./build-audit-corpus";
import { deriveV051Calibration, rescoreSamplesWithCalibration } from "./v051-calibration";
import { evaluateV051Gates, selectV051Candidate } from "./v051-gates";
import { runV051BiasAudit, verifyV05BaselineReproduction } from "./run-v051-bias-audit";
import { V051_CANDIDATES, type V051VariantEvaluationReport } from "./v051-types";
import { V05_CALIBRATION_GENERATED_AT } from "../../../knowledge/annual-axes/v0.5/derive-calibration";

export function runV051VariantEvaluation(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): V051VariantEvaluationReport {
  const baselineCheck = verifyV05BaselineReproduction(knowledge);
  const biasAudit = runV051BiasAudit(knowledge);
  const { holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
  const { training } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);

  const candidates = V051_CANDIDATES.map((spec) => {
    const calibration = deriveV051Calibration(spec, knowledge);
    const trainingSamples = rescoreSamplesWithCalibration(knowledge, calibration, training);
    const holdoutSamples = rescoreSamplesWithCalibration(knowledge, calibration, holdout);
    const trainingEval = evaluateV051Gates(trainingSamples, knowledge);
    const holdoutEval = evaluateV051Gates(holdoutSamples, knowledge);

    const blockers = [...holdoutEval.blockers];
    if (biasAudit.evidenceBiasFlags.scaleOnlyTighteningBlocked && spec.id !== "BASELINE-V05") {
      blockers.push("evidence-bias: scale-only tightening blocked");
    }
    if (!baselineCheck.reproduced && spec.id === "BASELINE-V05") {
      blockers.push("baseline-reproduction-failed");
    }

    const passedAllGates =
      holdoutEval.gateResults.every((g) => g.passed) && blockers.length === 0;

    return {
      candidateId: spec.id,
      calibration,
      trainingMetrics: trainingEval.metrics,
      holdoutMetrics: holdoutEval.metrics,
      gateResults: holdoutEval.gateResults,
      passedAllGates,
      blockers,
    };
  });

  const selection = selectV051Candidate(
    candidates.map((c) => ({
      candidateId: c.candidateId,
      passedAllGates: c.passedAllGates,
      metrics: c.holdoutMetrics,
      gateResults: c.gateResults,
    })),
  );

  return {
    profileId: "annual-axes-v0.5.1-variant-evaluation",
    corpusId: FULL_CORPUS_CONTRACT.contractId,
    generatedAt: V05_CALIBRATION_GENERATED_AT,
    baselineReproduced: baselineCheck.reproduced,
    evidenceBiasDetected: biasAudit.evidenceBiasFlags.scaleOnlyTighteningBlocked,
    evidenceBiasBlockers: biasAudit.evidenceBiasFlags.scaleOnlyTighteningBlocked
      ? ["Positive latent evidence bias detected — scale-only tightening blocked"]
      : [],
    candidates,
    selectedVariant: selection.selectedVariant as V051VariantEvaluationReport["selectedVariant"],
    selectionStatus: selection.selectionStatus,
    selectionRationale: selection.rationale,
  };
}
