/**
 * Sensitivity analysis for Round-2 — magnitude and binding only.
 */

import type { AnnualAxesCandidateRound2 } from "./schema";
import {
  evaluateCandidateOnCorpus,
  type CandidateEvalBundle,
} from "./evaluate-candidates";
import type { ChartCorpusEntry } from "./collect-corpus";

export interface SensitivityReport {
  variants: Array<{
    label: string;
    candidateId: string;
    pointMagnitude: number;
    domainBindings: string[];
    failedGateCount: number;
    improvedVsControl: number;
    degradedVsControl: number;
    thienMaMatches: number;
  }>;
  gateReversals: string[];
  rankingReversals: string[];
  stableParameters: string[];
  fragileParameters: string[];
}

export function runSensitivityAnalysis(input: {
  baseCandidates: AnnualAxesCandidateRound2[];
  holdoutEntries: ChartCorpusEntry[];
  controlEval: CandidateEvalBundle;
  holdoutEvalsById?: Record<string, CandidateEvalBundle>;
}): SensitivityReport {
  const variants: SensitivityReport["variants"] = [];

  for (const base of input.baseCandidates.filter((c) => c.candidateType === "experimental")) {
    // Probe magnitude 2 only; magnitude 1 uses frozen holdout eval when provided.
    const mag = 2;
    const probe: AnnualAxesCandidateRound2 = {
      ...base,
      candidateId: `${base.candidateId}__mag${mag}`,
      pointMagnitude: mag,
      assumptions: [
        ...base.assumptions,
        {
          statement: `Sensitivity probe magnitude=${mag} (engineering-hypothesis).`,
          status: "engineering-hypothesis",
        },
      ],
    };
    const evalBundle = evaluateCandidateOnCorpus(probe, input.holdoutEntries, input.controlEval);
    const frozenEval =
      input.holdoutEvalsById?.[base.candidateId] ??
      evaluateCandidateOnCorpus(base, input.holdoutEntries, input.controlEval);
    for (const [label, ev, magnitude] of [
      [`${base.candidateId}@1`, frozenEval, 1],
      [`${base.candidateId}@2`, evalBundle, 2],
    ] as const) {
      variants.push({
        label,
        candidateId: base.candidateId,
        pointMagnitude: magnitude,
        domainBindings: [...base.domainBindings].sort(),
        failedGateCount: ev.failedGateIds.length,
        improvedVsControl: ev.improvedVsControl.length,
        degradedVsControl: ev.degradedVsControl.length,
        thienMaMatches: ev.thienMa.matchCount,
      });
    }
  }

  variants.sort((a, b) => a.label.localeCompare(b.label));

  const byBase = new Map<string, typeof variants>();
  for (const v of variants) {
    const list = byBase.get(v.candidateId) ?? [];
    list.push(v);
    byBase.set(v.candidateId, list);
  }

  const gateReversals: string[] = [];
  const rankingReversals: string[] = [];
  for (const [id, list] of [...byBase.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (list.length < 2) continue;
    const a = list[0]!;
    const b = list[1]!;
    if (a.failedGateCount !== b.failedGateCount) {
      gateReversals.push(`${id}: failedGateCount ${a.failedGateCount} vs ${b.failedGateCount}`);
    }
    if (a.improvedVsControl !== b.improvedVsControl) {
      rankingReversals.push(`${id}: improvedVsControl ${a.improvedVsControl} vs ${b.improvedVsControl}`);
    }
  }

  return {
    variants,
    gateReversals,
    rankingReversals,
    stableParameters: gateReversals.length === 0 ? ["pointMagnitude-within-{1,2}"] : [],
    fragileParameters: gateReversals.length > 0 ? ["pointMagnitude"] : [],
  };
}
