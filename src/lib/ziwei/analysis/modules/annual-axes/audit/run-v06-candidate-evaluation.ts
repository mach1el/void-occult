import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV06NamPhai } from "../../../knowledge/annual-axes/v0.6";
import { V06_CALIBRATION_GENERATED_AT } from "../../../knowledge/annual-axes/v0.6/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "./build-audit-corpus";
import { deriveV06Calibration, scoreV06HoldoutSamples } from "./v06-calibration";
import { evaluateV06HoldoutGates } from "./v06-gates";
import { scoreV06ChartDomains } from "../nam-phai-v06/score-chart";
import { analyzeAnnualAxesNamPhaiV05 } from "../nam-phai-v05/analyze";
import {
  V06_CANDIDATES,
  type V06CandidateEvaluationReport,
  type V06CandidateId,
  type V06CandidateResult,
  type V06ProductFixtureScores,
} from "./v06-types";

export const V06_PRODUCT_FIXTURE: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const V05_BASELINE = {
  health: 41.9,
  family: 59.2,
  wealth: 47.5,
  career: 50,
  social: 53.7,
  romance: 58.9,
} as const;

function productFixtureFor(
  knowledge: AnnualAxesKnowledgeV06NamPhai,
  result: Omit<V06CandidateResult, "productFixture">,
): V06ProductFixtureScores {
  const chart = calculateNamPhai(V06_PRODUCT_FIXTURE);
  const domains = scoreV06ChartDomains(chart, knowledge, {
    activationScaleOverride: result.calibration.activationScale,
    domainScaleOverride: result.calibration.domainScales,
    signedLayerFactorsOverride: result.calibration.signedLayerFactors,
    candidateId: result.candidateId,
  });
  const scores = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => {
      const row = domains?.find((x) => x.domain === d);
      return [d, row?.score ?? 50];
    }),
  ) as Record<(typeof ANNUAL_AXIS_DOMAINS)[number], number>;

  const vals = ANNUAL_AXIS_DOMAINS.map((d) => scores[d]);
  const minimum = Math.min(...vals);
  const maximum = Math.max(...vals);
  const radarRange = maximum - minimum;
  const l1FromV05 = ANNUAL_AXIS_DOMAINS.reduce(
    (s, d) => s + Math.abs(scores[d] - V05_BASELINE[d]),
    0,
  );
  const passesVisibleChangeGate =
    l1FromV05 >= 8 &&
    radarRange >= 20 &&
    vals.some((v) => v <= 45) &&
    vals.some((v) => v >= 58) &&
    !vals.every((v) => v >= 45 && v <= 60);

  return {
    ...scores,
    minimum,
    maximum,
    radarRange,
    countAbove50: vals.filter((v) => v > 50).length,
    countAtOrBelow45: vals.filter((v) => v <= 45).length,
    countAtOrAbove60: vals.filter((v) => v >= 60).length,
    l1FromV05,
    passesVisibleChangeGate,
  };
}

function selectCandidate(results: V06CandidateResult[]): {
  selectedVariant: V06CandidateId | null;
  selectionStatus: "approved" | "no-variant-approved";
  selectionRationale: string[];
} {
  const passers = results.filter((r) => r.selectable && r.passedAllGates);
  if (passers.length === 0) {
    return {
      selectedVariant: null,
      selectionStatus: "no-variant-approved",
      selectionRationale: ["No selectable candidate passed all hard holdout gates."],
    };
  }

  const aggressionRank: Record<string, number> = {
    "ANNUAL-DOMINANT-50": 0,
    "ANNUAL-DOMINANT-35": 1,
    "ANNUAL-DOMINANT-25": 2,
  };

  const metric = (r: V06CandidateResult, key: string) => r.holdoutMetrics[key] ?? 0;
  const sorted = [...passers].sort((a, b) => {
    const dMed = Math.abs(metric(a, "globalMedianScore") - 50) - Math.abs(metric(b, "globalMedianScore") - 50);
    if (dMed !== 0) return dMed;
    const dAll = metric(a, "allSixAbove50Rate") - metric(b, "allSixAbove50Rate");
    if (dAll !== 0) return dAll;
    const dFive = metric(a, "fiveOrMoreAbove50Rate") - metric(b, "fiveOrMoreAbove50Rate");
    if (dFive !== 0) return dFive;
    const dOne = metric(b, "oneLowAndOneHighRate") - metric(a, "oneLowAndOneHighRate");
    if (dOne !== 0) return dOne;
    const dP25 = metric(b, "p25IntraYearRange") - metric(a, "p25IntraYearRange");
    if (dP25 !== 0) return dP25;
    return (aggressionRank[a.candidateId] ?? 9) - (aggressionRank[b.candidateId] ?? 9);
  });

  const winner = sorted[0]!;
  return {
    selectedVariant: winner.candidateId,
    selectionStatus: "approved",
    selectionRationale: [
      `Selected ${winner.candidateId} by declared deterministic tie-break among ${passers.length} passing candidate(s).`,
    ],
  };
}

export function runV06CandidateEvaluation(
  knowledge: AnnualAxesKnowledgeV06NamPhai,
): V06CandidateEvaluationReport {
  // Sanity: V0.5 product fixture baseline remains exact on V0.5 engine.
  const v05 = analyzeAnnualAxesNamPhaiV05(calculateNamPhai(V06_PRODUCT_FIXTURE));
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = v05.axes[domain];
    if (axis.status === "available" && axis.score !== V05_BASELINE[domain]) {
      throw new Error(
        `V0.5 product fixture drift on ${domain}: ${axis.score} vs ${V05_BASELINE[domain]}`,
      );
    }
  }

  const candidates: V06CandidateResult[] = V06_CANDIDATES.map((spec) => {
    const calibration = deriveV06Calibration(
      knowledge,
      spec.signedLayerFactors,
      spec.id,
    );
    const holdoutSamples = scoreV06HoldoutSamples(knowledge, calibration);
    const evalResult = evaluateV06HoldoutGates(holdoutSamples);
    const partial = {
      candidateId: spec.id,
      selectable: spec.selectable,
      signedLayerFactors: spec.signedLayerFactors,
      calibration,
      holdoutMetrics: evalResult.metrics,
      gateResults: evalResult.gateResults,
      passedAllGates: evalResult.passedAllGates && spec.selectable
        ? evalResult.passedAllGates
        : spec.selectable
          ? evalResult.passedAllGates
          : false,
      blockers: spec.selectable
        ? evalResult.blockers
        : ["control-candidate-not-selectable", ...evalResult.blockers],
    };
    // Control cannot be selected even if gates pass.
    if (!spec.selectable) {
      partial.passedAllGates = false;
    }
    return {
      ...partial,
      productFixture: productFixtureFor(knowledge, partial),
    };
  });

  const selection = selectCandidate(candidates);

  return {
    profileId: "annual-axes-v0.6-candidate-evaluation",
    corpusId: FULL_CORPUS_CONTRACT.contractId,
    generatedAt: V06_CALIBRATION_GENERATED_AT,
    formulaVersion: "v0.6-annual-dominant-core",
    candidates,
    selectedVariant: selection.selectedVariant,
    selectionStatus: selection.selectionStatus,
    selectionRationale: selection.selectionRationale,
  };
}
