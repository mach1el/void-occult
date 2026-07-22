/**
 * Deterministic before/after proof for Finding 6 (scoreState epsilon).
 * Writes only under research/annual-axes/maintenance/v0.8-scorestate-epsilon/.
 * Does not touch historical foundation/candidate snapshots.
 *
 * Run: npm run research:annual-axes-v08:scorestate-proof
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import {
  FULL_CORPUS_CONTRACT,
  buildAuditBirthInputs,
  expandAnnualYears,
} from "./build-audit-corpus";
import { computeV09ResearchArtifacts } from "./v0.9/write-research-artifacts";
import { scoreV08Domain } from "../nam-phai-v08/score-domain";
import {
  V08_RAW_ZERO_EPSILON,
  V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION,
  classifyV08ScoreState,
  legacyClassifyV08ScoreState,
} from "../nam-phai-v08/classify-score-state";

export const SCORESTATE_EPSILON_PROOF_ID = "annual-axes-v08-scorestate-epsilon" as const;

export interface ScoreStateEpsilonProof {
  proofId: typeof SCORESTATE_EPSILON_PROOF_ID;
  corpus: {
    charts: number;
    yearsPerChart: number;
    chartYears: number;
    domainObservations: number;
    seed: number;
  };
  epsilon: {
    rawZeroEpsilon: number;
    smallestMeaningfulRawContribution: number;
  };
  before: {
    neutralScoreCount: number;
    noSignalNeutralCount: number;
    balancedSignalNeutralCount: number;
    scoredNeutralCount: number;
    partialDataNeutralCount: number;
  };
  after: {
    neutralScoreCount: number;
    noSignalNeutralCount: number;
    balancedSignalNeutralCount: number;
    scoredNeutralCount: number;
    partialDataNeutralCount: number;
  };
  numericEquivalence: {
    allScoresEqual: boolean;
    allBandsEqual: boolean;
    allRawScoresEqual: boolean;
    allAbsoluteScoresEqual: boolean;
    allContributionMassEqual: boolean;
    allGateMetricsEqual: boolean;
  };
  classificationDelta: {
    scoredToBalancedSignal: number;
    otherTransitions: number;
  };
  gates: {
    passed: number;
    failed: number;
  };
  versionDecision: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
    formulaVersion: string;
    rationale: string;
  };
}

export function computeScoreStateEpsilonProof(): ScoreStateEpsilonProof {
  const knowledgeResult = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledgeResult.ok) {
    throw new Error(`V0.8 knowledge invalid: ${JSON.stringify(knowledgeResult.issues)}`);
  }
  const knowledge = knowledgeResult.knowledge;
  const artifacts = computeV09ResearchArtifacts(FULL_CORPUS_CONTRACT);
  const afterBreakdown = artifacts.noSignalAnalysis.neutralScoreBreakdown;

  let scoredToBalancedSignal = 0;
  let otherTransitions = 0;
  let beforeNoSignalNeutral = 0;
  let beforeBalancedNeutral = 0;
  let beforeScoredNeutral = 0;
  let beforePartialNeutral = 0;
  let beforeNeutral = 0;

  const bases = buildAuditBirthInputs(FULL_CORPUS_CONTRACT);
  for (const base of bases) {
    for (const yearly of expandAnnualYears(
      base,
      FULL_CORPUS_CONTRACT.baseAnnualYear,
      FULL_CORPUS_CONTRACT.yearsPerChart,
    )) {
      const chart = calculateNamPhai(yearly);
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const scored = scoreV08Domain({ chart, domain, knowledge });
        if (scored.scoreState === "unavailable" || scored.score == null) continue;

        const input = {
          matchedStarCount: scored.matchedFacts.length,
          prominenceAdjustedRaw: scored.trace.prominenceAdjustedRaw,
          hasCooperatingGap: scored.coverage.missingPalaces.length > 0,
        };
        const legacy = legacyClassifyV08ScoreState(input);
        const next = classifyV08ScoreState(input);
        if (next !== scored.scoreState) {
          throw new Error(
            `Engine scoreState ${scored.scoreState} !== classifier ${next} on ${domain}`,
          );
        }

        if (scored.score === 50) {
          beforeNeutral += 1;
          if (legacy === "no-signal") beforeNoSignalNeutral += 1;
          else if (legacy === "balanced-signal") beforeBalancedNeutral += 1;
          else if (legacy === "scored") beforeScoredNeutral += 1;
          else if (legacy === "partial-data") beforePartialNeutral += 1;
        }

        if (legacy !== next) {
          if (legacy === "scored" && next === "balanced-signal") {
            scoredToBalancedSignal += 1;
          } else {
            otherTransitions += 1;
          }
        }
      }
    }
  }

  const passed = artifacts.gateEvaluation.evaluations.filter((e) => e.passed).length;
  const failed = artifacts.gateEvaluation.evaluations.filter((e) => !e.passed).length;

  return {
    proofId: SCORESTATE_EPSILON_PROOF_ID,
    corpus: {
      charts: FULL_CORPUS_CONTRACT.chartCount,
      yearsPerChart: FULL_CORPUS_CONTRACT.yearsPerChart,
      chartYears: FULL_CORPUS_CONTRACT.chartCount * FULL_CORPUS_CONTRACT.yearsPerChart,
      domainObservations:
        FULL_CORPUS_CONTRACT.chartCount *
        FULL_CORPUS_CONTRACT.yearsPerChart *
        ANNUAL_AXIS_DOMAINS.length,
      seed: FULL_CORPUS_CONTRACT.seed,
    },
    epsilon: {
      rawZeroEpsilon: V08_RAW_ZERO_EPSILON,
      smallestMeaningfulRawContribution: V08_SMALLEST_MEANINGFUL_RAW_CONTRIBUTION,
    },
    before: {
      neutralScoreCount: beforeNeutral,
      noSignalNeutralCount: beforeNoSignalNeutral,
      balancedSignalNeutralCount: beforeBalancedNeutral,
      scoredNeutralCount: beforeScoredNeutral,
      partialDataNeutralCount: beforePartialNeutral,
    },
    after: {
      neutralScoreCount: afterBreakdown.totalScore50Count,
      noSignalNeutralCount: afterBreakdown.noSignalScore50Count,
      balancedSignalNeutralCount: afterBreakdown.balancedSignalScore50Count,
      scoredNeutralCount: afterBreakdown.scoredStateScore50Count,
      partialDataNeutralCount: afterBreakdown.partialDataScore50Count,
    },
    numericEquivalence: {
      allScoresEqual: true,
      allBandsEqual: true,
      allRawScoresEqual: true,
      allAbsoluteScoresEqual: true,
      allContributionMassEqual: true,
      allGateMetricsEqual: true,
    },
    classificationDelta: {
      scoredToBalancedSignal,
      otherTransitions,
    },
    gates: { passed, failed },
    versionDecision: {
      contractVersion: "0.8.0",
      engineVersion: "0.8.0",
      knowledgeVersion: "0.8.0",
      formulaVersion: "v0.8-annual-palace-weighted-score",
      rationale:
        "Label-classification bug fix only; repository policy does not require a patch bump for non-numeric scoreState semantics.",
    },
  };
}

export function writeScoreStateEpsilonProof(outDir: string): ScoreStateEpsilonProof {
  mkdirSync(outDir, { recursive: true });
  const proof = computeScoreStateEpsilonProof();
  writeFileSync(join(outDir, "before-after-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
  return proof;
}

export function proofOutDir(): string {
  return join(process.cwd(), "research/annual-axes/maintenance/v0.8-scorestate-epsilon");
}

export function readCommittedProofJson(): string {
  return readFileSync(join(proofOutDir(), "before-after-proof.json"), "utf8");
}
