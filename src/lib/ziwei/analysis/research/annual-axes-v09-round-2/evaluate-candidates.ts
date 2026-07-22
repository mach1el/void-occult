/**
 * Evaluate metrics/gates/product/sensitivity and select a Round-2 candidate.
 */

import { loadAnnualAxesKnowledgeV08NamPhai } from "../../knowledge/annual-axes/v0.8";
import { computeFullMetricsV09 } from "../../modules/annual-axes/audit/v0.9/metrics";
import { evaluateGatesV09, type AnnualAxesGateEvaluationResult } from "../../modules/annual-axes/audit/v0.9/gate-evaluator";
import { buildContributionMassV09 } from "../../modules/annual-axes/audit/v0.9/contribution-mass";
import { buildNoSignalAnalysisV09 } from "../../modules/annual-axes/audit/v0.9/no-signal-analysis";
import { buildRuleCoverageV09 } from "../../modules/annual-axes/audit/v0.9/rule-coverage";
import { ANNUAL_AXIS_DOMAINS } from "../../contracts/annual-axes";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { AnnualAxesCandidateRound2, CandidateSelectionRound2 } from "./schema";
import {
  collectCorpusForCandidate,
  thienMaActivationStats,
  type ChartCorpusEntry,
} from "./collect-corpus";
import { CONTROL_CANDIDATE_ID, V08_PRODUCT_FIXTURE_BIRTH } from "./control-v08";
import { runCandidate } from "./run-candidate";
import { AUTHORIZED_STAR } from "./foundation-intake";

export interface CandidateEvalBundle {
  candidateId: string;
  gateEvaluation: AnnualAxesGateEvaluationResult;
  metrics: ReturnType<typeof computeFullMetricsV09>;
  contributionMass: ReturnType<typeof buildContributionMassV09>;
  noSignal: ReturnType<typeof buildNoSignalAnalysisV09>;
  ruleCoverage: ReturnType<typeof buildRuleCoverageV09>;
  thienMa: ReturnType<typeof thienMaActivationStats>;
  passedGateIds: string[];
  failedGateIds: string[];
  passedMandatoryAbsolute: boolean;
  degradedVsControl: string[];
  improvedVsControl: string[];
}

function gateKey(e: { metricId: string; scope: string }): string {
  return `${e.scope}:${e.metricId}`;
}

export function evaluateCandidateOnCorpus(
  candidate: AnnualAxesCandidateRound2,
  entries: ChartCorpusEntry[],
  controlEval?: CandidateEvalBundle,
): CandidateEvalBundle {
  const knowledge = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge.ok) throw new Error("V0.8 knowledge load failed");

  const corpus = collectCorpusForCandidate(entries, candidate);
  const metrics = computeFullMetricsV09(corpus.observations, {
    minimum: knowledge.knowledge.pointClasses.score.minimum,
    maximum: knowledge.knowledge.pointClasses.score.maximum,
  });
  const gateEvaluation = evaluateGatesV09(knowledge.knowledge.distributionGates, metrics);
  const contributionMass = buildContributionMassV09(
    knowledge.knowledge,
    corpus.evidenceFacts,
    corpus.observations,
  );
  const noSignal = buildNoSignalAnalysisV09(corpus.observations);
  const ruleCoverage = buildRuleCoverageV09(
    knowledge.knowledge,
    corpus.evidenceFacts,
    corpus.observations.length,
  );
  const thienMa = thienMaActivationStats(corpus.evidenceFacts, corpus.observations.length);

  const passedGateIds = gateEvaluation.evaluations.filter((e) => e.status === "passed").map(gateKey);
  const failedGateIds = gateEvaluation.evaluations
    .filter((e) => e.status !== "passed")
    .map(gateKey);

  const degradedVsControl: string[] = [];
  const improvedVsControl: string[] = [];
  if (controlEval) {
    const controlPass = new Set(controlEval.passedGateIds);
    const controlFail = new Set(controlEval.failedGateIds);
    for (const id of failedGateIds) {
      if (controlPass.has(id)) degradedVsControl.push(id);
    }
    for (const id of passedGateIds) {
      if (controlFail.has(id)) improvedVsControl.push(id);
    }
  }

  return {
    candidateId: candidate.candidateId,
    gateEvaluation,
    metrics,
    contributionMass,
    noSignal,
    ruleCoverage,
    thienMa,
    passedGateIds: passedGateIds.sort(),
    failedGateIds: failedGateIds.sort(),
    passedMandatoryAbsolute: failedGateIds.length === 0 && gateEvaluation.allConfiguredGatesEvaluated,
    degradedVsControl: degradedVsControl.sort(),
    improvedVsControl: improvedVsControl.sort(),
  };
}

export interface ProductSanityResult {
  ok: boolean;
  issues: string[];
  controlScores: Record<string, number | null>;
  candidateScores: Record<string, number | null>;
  l1Distance: number;
  rangeDelta: number;
  uniformUplift: boolean;
  thienMaContribution: number;
  scoreStateChanges: number;
}

export function evaluateProductSanity(
  control: AnnualAxesCandidateRound2,
  candidate: AnnualAxesCandidateRound2,
): ProductSanityResult {
  const chart = calculateNamPhai(V08_PRODUCT_FIXTURE_BIRTH);
  const controlResult = runCandidate(chart, control);
  const candidateResult = runCandidate(chart, candidate);
  const issues: string[] = [];

  const controlScores: Record<string, number | null> = {};
  const candidateScores: Record<string, number | null> = {};
  let l1 = 0;
  let controlRange = 0;
  let candidateRange = 0;
  const controlVals: number[] = [];
  const candidateVals: number[] = [];
  let upliftCount = 0;
  let scoreStateChanges = 0;
  let thienMaContribution = 0;

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const cAxis = controlResult.axes[domain];
    const xAxis = candidateResult.axes[domain];
    const cScore = cAxis.status === "available" ? cAxis.score : null;
    const xScore = xAxis.status === "available" ? xAxis.score : null;
    controlScores[domain] = cScore;
    candidateScores[domain] = xScore;
    if (cScore != null && xScore != null) {
      l1 += Math.abs(xScore - cScore);
      controlVals.push(cScore);
      candidateVals.push(xScore);
      if (xScore > cScore + 0.05) upliftCount += 1;
    }
    if (cAxis.engine === "v0.8" && xAxis.engine === "v0.8") {
      const cState = cAxis.scoreTrace?.scoreState;
      const xState = xAxis.scoreTrace?.scoreState;
      if (cState && xState && cState !== xState) scoreStateChanges += 1;
    }
    for (const fact of xAxis.engine === "v0.8" ? xAxis.v08Evidence ?? [] : []) {
      if (fact.exactMatchedStarName === AUTHORIZED_STAR) {
        thienMaContribution += fact.weightedContribution;
      }
    }
  }

  if (controlVals.length) {
    controlRange = Math.max(...controlVals) - Math.min(...controlVals);
    candidateRange = Math.max(...candidateVals) - Math.min(...candidateVals);
  }

  const uniformUplift = upliftCount >= 5;
  if (uniformUplift) issues.push("uniform-uplift-across-axes");
  if (candidateVals.some((v) => v <= 10.05 || v >= 89.95)) issues.push("boundary-saturation");
  if (candidateRange + 1e-9 < controlRange * 0.5 && l1 > 0.5) {
    issues.push("range-collapse");
  }
  const career = candidateScores.career;
  const social = candidateScores.social;
  if (
    career != null &&
    social != null &&
    Math.abs(career - social) < 0.15 &&
    Math.abs((controlScores.career ?? 0) - (controlScores.social ?? 0)) > 1
  ) {
    issues.push("career-social-collapse");
  }

  return {
    ok: issues.length === 0,
    issues,
    controlScores,
    candidateScores,
    l1Distance: Number(l1.toFixed(4)),
    rangeDelta: Number((candidateRange - controlRange).toFixed(4)),
    uniformUplift,
    thienMaContribution: Number(thienMaContribution.toFixed(4)),
    scoreStateChanges,
  };
}

export function selectCandidateRound2(input: {
  foundationOk: boolean;
  foundationReadiness: string;
  controlOk: boolean;
  evaluations: CandidateEvalBundle[];
  productSanity: Record<string, ProductSanityResult>;
}): CandidateSelectionRound2 {
  const rationale: string[] = [];
  if (!input.foundationOk || input.foundationReadiness !== "READY_FOR_V0_9_CANDIDATE") {
    return {
      selectionStatus: "foundation-invalid",
      selectedCandidateId: null,
      controlCandidateId: "CONTROL-V08",
      candidateResults: [],
      rationale: ["Foundation not READY_FOR_V0_9_CANDIDATE."],
    };
  }
  if (!input.controlOk) {
    return {
      selectionStatus: "evaluation-inconclusive",
      selectedCandidateId: null,
      controlCandidateId: "CONTROL-V08",
      candidateResults: [],
      rationale: ["CONTROL-V08 failed production reproduction; experimental evaluation aborted."],
    };
  }

  const control = input.evaluations.find((e) => e.candidateId === CONTROL_CANDIDATE_ID);
  const experimental = input.evaluations.filter((e) => e.candidateId !== CONTROL_CANDIDATE_ID);

  const candidateResults = input.evaluations.map((e) => {
    const product = input.productSanity[e.candidateId];
    const isControl = e.candidateId === CONTROL_CANDIDATE_ID;
    const failedGateIds = [...e.failedGateIds];
    const blockingReasons: string[] = [];
    if (!isControl) {
      if (!e.passedMandatoryAbsolute) {
        blockingReasons.push("Failed absolute hard-gate pass (28/28 required for selection).");
      }
      if (e.degradedVsControl.length > 0) {
        blockingReasons.push(`Degraded control-passing gates: ${e.degradedVsControl.join(", ")}`);
        failedGateIds.push(...e.degradedVsControl.map((g) => `degraded:${g}`));
      }
      if (product && !product.ok) {
        blockingReasons.push(`Product sanity failed: ${product.issues.join(", ")}`);
        failedGateIds.push(...product.issues.map((i) => `product:${i}`));
      }
      if (e.thienMa.matchCount === 0) {
        blockingReasons.push("Lưu Thiên Mã never matched in corpus (zero activation).");
      }
    }
    const selectable =
      !isControl &&
      e.passedMandatoryAbsolute &&
      e.degradedVsControl.length === 0 &&
      (product?.ok ?? false) &&
      e.thienMa.matchCount > 0;

    return {
      candidateId: e.candidateId,
      selectable,
      passedMandatoryGates: isControl ? control?.passedMandatoryAbsolute === true : selectable,
      failedGateIds: [...new Set(failedGateIds)].sort(),
      improvements: e.improvedVsControl,
      regressions: e.degradedVsControl,
      blockingReasons,
    };
  });

  const selectable = candidateResults.filter((c) => c.selectable);
  rationale.push(
    `Control failed gates: ${control?.failedGateIds.length ?? "?"}; absolute 28/28 required for experimental selection.`,
  );
  rationale.push(`Selectable experimental candidates: ${selectable.length}.`);

  if (selectable.length === 0) {
    rationale.push("No experimental candidate passed all mandatory gates; selectedCandidateId remains null.");
    return {
      selectionStatus: "no-candidate-approved",
      selectedCandidateId: null,
      controlCandidateId: "CONTROL-V08",
      candidateResults,
      rationale,
    };
  }

  // Prefer simplest among selectable: fewer domain bindings, then smaller magnitude proxy via id order.
  selectable.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  const selected = selectable[0]!;
  rationale.push(`Selected ${selected.candidateId} by lexicographic simplicity among selectable.`);
  return {
    selectionStatus: "candidate-selected",
    selectedCandidateId: selected.candidateId,
    controlCandidateId: "CONTROL-V08",
    candidateResults,
    rationale,
  };
}
