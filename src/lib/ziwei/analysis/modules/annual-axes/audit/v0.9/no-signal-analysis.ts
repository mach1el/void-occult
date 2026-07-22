import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import type { AnnualAxesAuditObservationV09 } from "./types";

const NEUTRAL_SCORE = 50;

export interface NeutralScoreBreakdown {
  totalScore50Count: number;
  noSignalScore50Count: number;
  balancedSignalScore50Count: number;
  partialDataScore50Count: number;
  scoredStateScore50Count: number;
}

export interface AnnualAxesNoSignalAnalysisV09 {
  totalDomainObservations: number;
  noSignalCount: number;
  noSignalRate: number;
  balancedSignalCount: number;
  balancedSignalRate: number;
  neutralScoreBreakdown: NeutralScoreBreakdown;
  perDomain: Record<
    AnnualAxisDomain,
    { noSignalRate: number; balancedSignalRate: number; neutralScoreBreakdown: NeutralScoreBreakdown }
  >;
  notes: string[];
}

function emptyBreakdown(): NeutralScoreBreakdown {
  return {
    totalScore50Count: 0,
    noSignalScore50Count: 0,
    balancedSignalScore50Count: 0,
    partialDataScore50Count: 0,
    scoredStateScore50Count: 0,
  };
}

function accumulateBreakdown(
  breakdown: NeutralScoreBreakdown,
  scoreState: string,
): void {
  breakdown.totalScore50Count += 1;
  if (scoreState === "no-signal") breakdown.noSignalScore50Count += 1;
  else if (scoreState === "balanced-signal") breakdown.balancedSignalScore50Count += 1;
  else if (scoreState === "partial-data") breakdown.partialDataScore50Count += 1;
  else if (scoreState === "scored") breakdown.scoredStateScore50Count += 1;
}

/**
 * Score === 50 is not synonymous with "no signal" under the V0.8 formula:
 * `no-signal` (zero matched stars), `balanced-signal` (matched stars whose
 * raw net is effectively zero), and `partial-data` (missing cooperating palace)
 * can all land on 50. Historically, strict `raw === 0` misclassified near-zero
 * floating-point cancellation residues (e.g. `5.55e-17`) as `scored` while the
 * rounded score correctly remained 50 (Finding 6). Production classification
 * now uses an absolute epsilon (`V08_RAW_ZERO_EPSILON`) so those cases become
 * `balanced-signal` without changing numeric scores.
 */
export function buildNoSignalAnalysisV09(
  observations: AnnualAxesAuditObservationV09[],
): AnnualAxesNoSignalAnalysisV09 {
  const perDomainBreakdown = {} as Record<AnnualAxisDomain, NeutralScoreBreakdown>;
  const perDomainNoSignal: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };
  const perDomainBalanced: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };
  const perDomainCount: Record<AnnualAxisDomain, number> = {
    health: 0, family: 0, wealth: 0, career: 0, social: 0, romance: 0,
  };
  for (const domain of ANNUAL_AXIS_DOMAINS) perDomainBreakdown[domain] = emptyBreakdown();

  let totalDomainObservations = 0;
  let noSignalCount = 0;
  let balancedSignalCount = 0;
  const breakdown = emptyBreakdown();

  for (const obs of observations) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const d = obs.domains[domain];
      totalDomainObservations += 1;
      perDomainCount[domain] += 1;
      if (d.scoreState === "no-signal") {
        noSignalCount += 1;
        perDomainNoSignal[domain] += 1;
      }
      if (d.scoreState === "balanced-signal") {
        balancedSignalCount += 1;
        perDomainBalanced[domain] += 1;
      }
      if (d.score === NEUTRAL_SCORE) {
        accumulateBreakdown(breakdown, d.scoreState);
        accumulateBreakdown(perDomainBreakdown[domain], d.scoreState);
      }
    }
  }

  const perDomain = {} as AnnualAxesNoSignalAnalysisV09["perDomain"];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    perDomain[domain] = {
      noSignalRate: perDomainCount[domain] === 0 ? 0 : perDomainNoSignal[domain] / perDomainCount[domain],
      balancedSignalRate: perDomainCount[domain] === 0 ? 0 : perDomainBalanced[domain] / perDomainCount[domain],
      neutralScoreBreakdown: perDomainBreakdown[domain],
    };
  }

  return {
    totalDomainObservations,
    noSignalCount,
    noSignalRate: totalDomainObservations === 0 ? 0 : noSignalCount / totalDomainObservations,
    balancedSignalCount,
    balancedSignalRate: totalDomainObservations === 0 ? 0 : balancedSignalCount / totalDomainObservations,
    neutralScoreBreakdown: breakdown,
    perDomain,
    notes: [
      "score === 50 is split into no-signal / balanced-signal / partial-data / scored buckets.",
      "scoredStateScore50Count should always be 0 under the current V0.8 formula (raw=0 cannot coexist with the 'scored' state); a nonzero value is a regression signal, not a doctrinal finding.",
    ],
  };
}
