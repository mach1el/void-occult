/**
 * Round-2 orchestrator: validate → control → train → freeze → holdout → full →
 * product → sensitivity → decision. Research-only; never changes production routing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FULL_CORPUS_CONTRACT } from "../../modules/annual-axes/audit/build-audit-corpus";
import { intakeFoundationRound2 } from "./foundation-intake";
import { verifyControlV08, CONTROL_CANDIDATE_ID } from "./control-v08";
import { loadCandidatePackRound2, ROUND2_ROOT } from "./load-candidates";
import {
  buildChartCorpusRound2,
  filterCorpusByIndexes,
  splitCorpusByBaseChart,
} from "./collect-corpus";
import {
  evaluateCandidateOnCorpus,
  evaluateProductSanity,
  selectCandidateRound2,
  type CandidateEvalBundle,
  type ProductSanityResult,
} from "./evaluate-candidates";
import { assertFreezeMatches, buildFreezeRecord } from "./freeze-candidates";
import { runSensitivityAnalysis } from "./sensitivity";
import { stableStringify } from "./stable-hash";
import type {
  AnnualAxesProductionDecisionRound2,
  CandidateSelectionRound2,
} from "./schema";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, stableStringify(value));
}

function ensureDirs(root: string): void {
  for (const rel of ["reports", "fixtures", "prompts"]) {
    mkdirSync(join(root, rel), { recursive: true });
  }
}

function buildProductionDecision(
  selection: CandidateSelectionRound2,
  evaluations: CandidateEvalBundle[],
): AnnualAxesProductionDecisionRound2 {
  let decision: AnnualAxesProductionDecisionRound2["decision"] = "KEEP_V0_8_PRODUCTION";
  if (selection.selectionStatus === "foundation-invalid") {
    decision = "RESEARCH_REVISION_REQUIRED";
  } else if (selection.selectionStatus === "calculation-core-blocked") {
    decision = "CALCULATION_CORE_BLOCKED";
  } else if (selection.selectionStatus === "candidate-selected") {
    decision = "APPROVED_FOR_PRODUCTION_ROLLOUT";
  } else if (selection.selectionStatus === "evaluation-inconclusive") {
    decision = "RESEARCH_REVISION_REQUIRED";
  } else {
    decision = "KEEP_V0_8_PRODUCTION";
  }

  const selected = evaluations.find((e) => e.candidateId === selection.selectedCandidateId);
  const control = evaluations.find((e) => e.candidateId === CONTROL_CANDIDATE_ID);

  const nextTask =
    decision === "APPROVED_FOR_PRODUCTION_ROLLOUT"
      ? "Controlled V0.9 production rollout (separate PR; do not change routing here)"
      : decision === "CALCULATION_CORE_BLOCKED"
        ? "Calculation Core producer investigation for Lưu Thiên Mã"
        : decision === "RESEARCH_REVISION_REQUIRED"
          ? "Focused Thiên Mã domain/policy revision"
          : "Close Round-2 candidate evaluation and retain V0.8 production";

  return {
    decision,
    selectedCandidateId: selection.selectedCandidateId,
    controlVersion: {
      engineVersion: "0.8.0",
      formulaVersion: "v0.8-annual-palace-weighted-score",
    },
    foundation: {
      readiness: "READY_FOR_V0_9_CANDIDATE",
      shapeIds: ["SHAPE-AAV09-THIEN-MA-MOVEMENT"],
    },
    evidence: {
      candidateIds: evaluations.map((e) => e.candidateId).sort(),
      passedGateIds: selected?.passedGateIds ?? control?.passedGateIds ?? [],
      failedGateIds: selected?.failedGateIds ?? control?.failedGateIds ?? [],
      claimIds: ["CLM-AAV09-019", "CLM-AAV09-007", "CLM-AAV09-015"],
      sourceIds: ["SRC-AA-V09-TAN-BIEN-1956", "SRC-AA-CORE-001"],
      policyRecordIds: ["POL-AAV09-STAR-LUU-THIEN-MA"],
    },
    improvements: selected?.improvedVsControl ?? [],
    regressions: selected?.degradedVsControl ?? [],
    residualRisks: [
      "doctrinal: Thiên Mã numeric magnitude remains engineering-hypothesis",
      "doctrinal: other 11 emitted annual stars remain interpretive-only",
      "engineering: absolute 28/28 hard-gate bar is stringent relative to V0.8 baseline failures",
      "distribution: V0.8 control itself fails multiple spread gates",
      "holdout: experimental absolute-pass requirement not met by Thiên Mã-only increment",
      "product: no production routing change in this PR",
      "technical: Finding 6 scoreState epsilon remains a separate engineering follow-up",
    ],
    nextTask,
  };
}

function writeHandoffs(root: string, decision: AnnualAxesProductionDecisionRound2): void {
  const prompts = join(root, "prompts");
  writeFileSync(
    join(prompts, "production-rollout-handoff.md"),
    `# Production rollout handoff\n\nUse only if decision is APPROVED_FOR_PRODUCTION_ROLLOUT.\n\nSelected: \`${decision.selectedCandidateId}\`\n`,
  );
  writeFileSync(
    join(prompts, "keep-v08-handoff.md"),
    `# Keep V0.8 handoff\n\nRetain Nam Phái Engine 0.8.0 / \`v0.8-annual-palace-weighted-score\`.\n\nRound-2 decision: \`${decision.decision}\`.\n`,
  );
  writeFileSync(
    join(prompts, "research-revision-handoff.md"),
    `# Research revision handoff\n\nRevisit Thiên Mã domain binding / magnitude policy if Round-2 is inconclusive.\n`,
  );
  writeFileSync(
    join(prompts, "core-blocked-handoff.md"),
    `# Calculation Core blocked handoff\n\nOnly if Lưu Thiên Mã producer/identity is missing — not expected in Round-2.\n`,
  );
}

export interface Round2DecisionResult {
  foundation: ReturnType<typeof intakeFoundationRound2>;
  control: ReturnType<typeof verifyControlV08>;
  selection: CandidateSelectionRound2;
  productionDecision: AnnualAxesProductionDecisionRound2;
  freeze: ReturnType<typeof buildFreezeRecord>;
  split: ReturnType<typeof splitCorpusByBaseChart>;
  reportsWritten: string[];
}

export function runRound2Decision(options?: {
  root?: string;
  writeArtifacts?: boolean;
}): Round2DecisionResult {
  const root = options?.root ?? ROUND2_ROOT;
  const writeArtifacts = options?.writeArtifacts !== false;
  ensureDirs(root);

  const foundation = intakeFoundationRound2();
  const control = verifyControlV08();
  const pack = loadCandidatePackRound2(root);

  if (!foundation.permitsCandidateEvaluation) {
    const selection: CandidateSelectionRound2 = {
      selectionStatus: "foundation-invalid",
      selectedCandidateId: null,
      controlCandidateId: "CONTROL-V08",
      candidateResults: [],
      rationale: foundation.issues,
    };
    const productionDecision = buildProductionDecision(selection, []);
    if (writeArtifacts) {
      writeJson(join(root, "reports/production-decision.json"), productionDecision);
    }
    return {
      foundation,
      control,
      selection,
      productionDecision,
      freeze: {
        schemaVersion: "0.9.0-r2",
        freezeId: "annual-axes-v0.9-round-2-freeze",
        candidateHashes: {},
        registryHash: "",
        candidateOrder: [],
      },
      split: splitCorpusByBaseChart(FULL_CORPUS_CONTRACT),
      reportsWritten: writeArtifacts ? [join(root, "reports/production-decision.json")] : [],
    };
  }

  if (pack.issues.length > 0) {
    throw new Error(`Round-2 candidate pack invalid: ${JSON.stringify(pack.issues)}`);
  }
  if (!control.ok) {
    throw new Error(`CONTROL-V08 verification failed: ${control.issues.join("; ")}`);
  }

  const corpus = buildChartCorpusRound2(FULL_CORPUS_CONTRACT);
  const split = splitCorpusByBaseChart(FULL_CORPUS_CONTRACT);
  if (split.overlapCount !== 0) {
    throw new Error("Training/holdout overlap detected");
  }
  const training = filterCorpusByIndexes(corpus, split.trainingChartIndexes);
  const holdout = filterCorpusByIndexes(corpus, split.holdoutChartIndexes);

  // Training pass.
  const controlTraining = evaluateCandidateOnCorpus(
    pack.candidates.find((c) => c.candidateId === CONTROL_CANDIDATE_ID)!,
    training,
  );
  const trainingFinal = pack.candidates.map((c) =>
    c.candidateId === CONTROL_CANDIDATE_ID
      ? controlTraining
      : evaluateCandidateOnCorpus(c, training, controlTraining),
  );

  const freeze = buildFreezeRecord(pack);
  const freezeIssues = assertFreezeMatches(freeze, pack);
  if (freezeIssues.length > 0) throw new Error(`Freeze self-check failed: ${freezeIssues.join("; ")}`);

  // Holdout after freeze.
  const controlHoldout = evaluateCandidateOnCorpus(
    pack.candidates.find((c) => c.candidateId === CONTROL_CANDIDATE_ID)!,
    holdout,
  );
  const holdoutEvals = pack.candidates.map((c) =>
    c.candidateId === CONTROL_CANDIDATE_ID
      ? controlHoldout
      : evaluateCandidateOnCorpus(c, holdout, controlHoldout),
  );

  // Full corpus.
  const controlFull = evaluateCandidateOnCorpus(
    pack.candidates.find((c) => c.candidateId === CONTROL_CANDIDATE_ID)!,
    corpus,
  );
  const fullEvals = pack.candidates.map((c) =>
    c.candidateId === CONTROL_CANDIDATE_ID
      ? controlFull
      : evaluateCandidateOnCorpus(c, corpus, controlFull),
  );

  const controlCandidate = pack.candidates.find((c) => c.candidateId === CONTROL_CANDIDATE_ID)!;
  const productSanity: Record<string, ProductSanityResult> = {};
  for (const candidate of pack.candidates) {
    productSanity[candidate.candidateId] = evaluateProductSanity(controlCandidate, candidate);
  }

  const sensitivity = runSensitivityAnalysis({
    baseCandidates: pack.candidates,
    holdoutEntries: holdout,
    controlEval: controlHoldout,
    holdoutEvalsById: Object.fromEntries(holdoutEvals.map((e) => [e.candidateId, e])),
  });

  const selection = selectCandidateRound2({
    foundationOk: foundation.ok,
    foundationReadiness: foundation.readiness,
    controlOk: control.ok,
    evaluations: holdoutEvals,
    productSanity,
  });
  const productionDecision = buildProductionDecision(selection, holdoutEvals);

  const reportsWritten: string[] = [];
  if (writeArtifacts) {
    const reports = join(root, "reports");
    writeJson(join(reports, "candidate-freeze.json"), freeze);
    writeJson(join(reports, "training-evaluation.json"), {
      split,
      evaluations: trainingFinal.map(summarizeEval),
    });
    writeJson(join(reports, "holdout-evaluation.json"), {
      freeze,
      split,
      evaluations: holdoutEvals.map(summarizeEval),
    });
    writeJson(join(reports, "full-corpus-evaluation.json"), {
      evaluations: fullEvals.map(summarizeEval),
    });
    writeJson(join(reports, "gate-evaluation.json"), {
      control: controlFull.gateEvaluation,
      candidates: Object.fromEntries(fullEvals.map((e) => [e.candidateId, e.gateEvaluation])),
    });
    writeJson(join(reports, "product-sanity-evaluation.json"), productSanity);
    writeJson(join(reports, "rule-coverage-comparison.json"), {
      candidates: Object.fromEntries(
        fullEvals.map((e) => [
          e.candidateId,
          {
            thienMa: e.thienMa,
            ruleCount: e.ruleCoverage.length,
          },
        ]),
      ),
    });
    writeJson(join(reports, "contribution-mass-comparison.json"), {
      candidates: Object.fromEntries(
        fullEvals.map((e) => [e.candidateId, e.contributionMass.overall]),
      ),
    });
    writeJson(join(reports, "sensitivity-analysis.json"), sensitivity);
    writeJson(join(reports, "candidate-comparison.json"), {
      selection,
      holdout: holdoutEvals.map(summarizeEval),
      full: fullEvals.map(summarizeEval),
    });
    writeJson(join(reports, "production-decision.json"), productionDecision);
    writeJson(join(root, "fixtures/control-product.json"), {
      scores: control.scores,
      fixtureHash: control.fixtureHash,
    });
    writeJson(join(root, "fixtures/candidate-product-vectors.json"), productSanity);
    writeJson(join(root, "fixtures/selected-candidate-product.json"), {
      selectedCandidateId: selection.selectedCandidateId,
      product: selection.selectedCandidateId
        ? productSanity[selection.selectedCandidateId]
        : null,
    });
    writeHandoffs(root, productionDecision);
    writeRound2DecisionMarkdown(root, {
      foundation,
      control,
      split,
      freeze,
      trainingFinal,
      holdoutEvals,
      fullEvals,
      productSanity,
      sensitivity,
      selection,
      productionDecision,
    });
    reportsWritten.push(
      ...[
        "candidate-freeze.json",
        "training-evaluation.json",
        "holdout-evaluation.json",
        "full-corpus-evaluation.json",
        "gate-evaluation.json",
        "product-sanity-evaluation.json",
        "rule-coverage-comparison.json",
        "contribution-mass-comparison.json",
        "sensitivity-analysis.json",
        "candidate-comparison.json",
        "production-decision.json",
      ].map((n) => join(reports, n)),
    );
  }

  return {
    foundation,
    control,
    selection,
    productionDecision,
    freeze,
    split,
    reportsWritten,
  };
}

function summarizeEval(e: CandidateEvalBundle) {
  return {
    candidateId: e.candidateId,
    passedGateCount: e.passedGateIds.length,
    failedGateCount: e.failedGateIds.length,
    failedGateIds: e.failedGateIds,
    passedMandatoryAbsolute: e.passedMandatoryAbsolute,
    improvedVsControl: e.improvedVsControl,
    degradedVsControl: e.degradedVsControl,
    thienMa: e.thienMa,
    noSignalRate: e.noSignal.noSignalRate,
    massRatio: e.contributionMass.overall.massRatioPositiveToNegative,
    meanIntraYearSd: e.metrics.meanIntraYearAxisStandardDeviation,
    medianIntraYearRange: e.metrics.medianIntraYearAxisRange,
  };
}

function writeRound2DecisionMarkdown(
  root: string,
  ctx: {
    foundation: ReturnType<typeof intakeFoundationRound2>;
    control: ReturnType<typeof verifyControlV08>;
    split: ReturnType<typeof splitCorpusByBaseChart>;
    freeze: ReturnType<typeof buildFreezeRecord>;
    trainingFinal: CandidateEvalBundle[];
    holdoutEvals: CandidateEvalBundle[];
    fullEvals: CandidateEvalBundle[];
    productSanity: Record<string, ProductSanityResult>;
    sensitivity: ReturnType<typeof runSensitivityAnalysis>;
    selection: CandidateSelectionRound2;
    productionDecision: AnnualAxesProductionDecisionRound2;
  },
): void {
  const pack = loadCandidatePackRound2(root);
  const lines: string[] = [];
  lines.push("# Annual Axes V0.9 Round-2 Candidate Decision");
  lines.push("");
  lines.push("## A. Base and foundation");
  lines.push("");
  lines.push("- Base master SHA: recorded in PR body at open time");
  lines.push(`- Foundation readiness: \`${ctx.foundation.readiness}\``);
  lines.push("- Authorized shape: `SHAPE-AAV09-THIEN-MA-MOVEMENT`");
  lines.push("- Authorized star: `Lưu Thiên Mã`");
  lines.push("- Production safety: Nam Phái remains Engine 0.8.0; Trung Châu remains 0.2.0; no production route added.");
  lines.push("");
  lines.push("## B. Control verification");
  lines.push("");
  lines.push(`- Engine: \`${ctx.control.engineVersion}\``);
  lines.push(`- Formula: \`${ctx.control.formulaVersion}\``);
  lines.push(`- Score equality: \`${ctx.control.scoreEquality}\``);
  lines.push(`- Routing equality: \`${ctx.control.routingEquality}\``);
  lines.push(`- Fixture equality: \`${ctx.control.fixtureEquality}\``);
  lines.push("");
  lines.push("## C. Candidate registry");
  lines.push("");
  lines.push("| Candidate | Domain binding | Point magnitude | Polarity mode | Selectable |");
  lines.push("| --------- | -------------- | --------------: | ------------- | ---------: |");
  for (const c of pack.candidates) {
    const sel = ctx.selection.candidateResults.find((r) => r.candidateId === c.candidateId);
    lines.push(
      `| ${c.candidateId} | ${c.domainBindings.join("+") || "control"} | ${c.candidateType === "control" ? "—" : c.pointMagnitude} | ${c.candidateType === "control" ? "—" : c.polarityMode} | ${sel?.selectable ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  lines.push("## D. Corpus split");
  lines.push("");
  lines.push(`- Training charts: ${ctx.split.trainingChartIndexes.length}`);
  lines.push(`- Holdout charts: ${ctx.split.holdoutChartIndexes.length}`);
  lines.push(`- Years per chart: ${ctx.split.yearsPerChart}`);
  lines.push(`- Split method: \`${ctx.split.method}\` seed ${ctx.split.seed}`);
  lines.push(`- Overlap: ${ctx.split.overlapCount}`);
  lines.push(`- Freeze registry hash: \`${ctx.freeze.registryHash}\``);
  lines.push("");
  lines.push("## E. Training results");
  lines.push("");
  for (const e of ctx.trainingFinal) {
    lines.push(`### ${e.candidateId}`);
    lines.push(`- Failed gates: ${e.failedGateIds.length}`);
    lines.push(`- Thiên Mã matches: ${e.thienMa.matchCount}`);
    lines.push(`- Mean intra-year SD: ${e.metrics.meanIntraYearAxisStandardDeviation}`);
    lines.push("");
  }
  lines.push("## F. Holdout results");
  lines.push("");
  lines.push("| Candidate | Mandatory absolute | Failed gates | Selectable |");
  lines.push("| --------- | -----------------: | ------------ | ---------: |");
  for (const r of ctx.selection.candidateResults) {
    lines.push(
      `| ${r.candidateId} | ${r.passedMandatoryGates} | ${r.failedGateIds.length} | ${r.selectable ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  lines.push("## G. Full-corpus gate evaluation");
  lines.push("");
  for (const e of ctx.fullEvals) {
    lines.push(
      `- ${e.candidateId}: passed ${e.passedGateIds.length}, failed ${e.failedGateIds.length}, improved ${e.improvedVsControl.length}, degraded ${e.degradedVsControl.length}`,
    );
  }
  lines.push("");
  lines.push("## H. Product sanity");
  lines.push("");
  for (const id of Object.keys(ctx.productSanity).sort()) {
    const p = ctx.productSanity[id]!;
    lines.push(
      `- ${id}: ok=${p.ok} L1=${p.l1Distance} rangeDelta=${p.rangeDelta} uniformUplift=${p.uniformUplift} issues=${p.issues.join(",") || "none"}`,
    );
  }
  lines.push("");
  lines.push("## I. Sensitivity");
  lines.push("");
  lines.push(`- Stable parameters: ${ctx.sensitivity.stableParameters.join(", ") || "none"}`);
  lines.push(`- Fragile parameters: ${ctx.sensitivity.fragileParameters.join(", ") || "none"}`);
  lines.push(`- Gate reversals: ${ctx.sensitivity.gateReversals.join("; ") || "none"}`);
  lines.push("");
  lines.push("## J. Candidate selection");
  lines.push("");
  lines.push("```");
  lines.push(`selectedCandidateId: ${ctx.selection.selectedCandidateId}`);
  lines.push("```");
  lines.push("");
  lines.push("## K. Production decision");
  lines.push("");
  lines.push("```");
  lines.push(ctx.productionDecision.decision);
  lines.push("```");
  lines.push("");
  lines.push("## L. Residual risks");
  lines.push("");
  for (const risk of ctx.productionDecision.residualRisks) lines.push(`- ${risk}`);
  lines.push("");
  lines.push("## M. Next task");
  lines.push("");
  lines.push(ctx.productionDecision.nextTask);
  lines.push("");
  writeFileSync(join(root, "ROUND-2-CANDIDATE-DECISION.md"), `${lines.join("\n")}`);
}

/** Lightweight stage runners used by npm scripts. */
export function round2Validate(root = ROUND2_ROOT): {
  foundation: ReturnType<typeof intakeFoundationRound2>;
  packIssues: ReturnType<typeof loadCandidatePackRound2>["issues"];
  ok: boolean;
} {
  const foundation = intakeFoundationRound2();
  const pack = loadCandidatePackRound2(root);
  return {
    foundation,
    packIssues: pack.issues,
    ok: foundation.ok && pack.issues.length === 0,
  };
}

export function round2Control(): ReturnType<typeof verifyControlV08> {
  return verifyControlV08();
}

export function round2Freeze(root = ROUND2_ROOT): ReturnType<typeof buildFreezeRecord> {
  const pack = loadCandidatePackRound2(root);
  if (pack.issues.length) throw new Error(JSON.stringify(pack.issues));
  const freeze = buildFreezeRecord(pack);
  ensureDirs(root);
  writeJson(join(root, "reports/candidate-freeze.json"), freeze);
  return freeze;
}

export function readFreeze(root = ROUND2_ROOT): ReturnType<typeof buildFreezeRecord> | null {
  const path = join(root, "reports/candidate-freeze.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}
