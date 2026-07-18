import type { MonthlyFlowScoringProfile } from "../../knowledge/monthly-flow";
import type { DeepReadonly } from "../../knowledge/monthly-flow";
import {
  scaleMonthlyFlowAxes,
  type MonthlyFlowEvidence,
  type MonthlyFlowEvidenceCategory,
  type MonthlyFlowFrameRole,
  type MonthlyFlowMonthDiagnostics,
} from "./types";

type ScoringProfile = DeepReadonly<MonthlyFlowScoringProfile> | MonthlyFlowScoringProfile;

function layerWeightKey(
  category: MonthlyFlowEvidenceCategory,
): keyof MonthlyFlowScoringProfile["evidenceLayerWeights"] {
  switch (category) {
    case "monthly-focus-star":
      return "monthly-focus-star";
    case "monthly-transformation":
      return "monthly-transformation";
    case "annual-star-context":
      return "annual-star-context";
    case "annual-transformation-context":
      return "annual-transformation-context";
    case "major-transformation-context":
      return "major-transformation-context";
    case "major-active-palace-context":
      return "major-active-palace-context";
    case "structural-activation":
      return "structural-activation";
    case "interaction":
    default:
      return "interaction";
  }
}

function frameRoleWeight(
  role: MonthlyFlowFrameRole,
  weights: MonthlyFlowScoringProfile["frameRoleWeights"]["annualDomain"],
): number {
  if (role === "focus") return weights.focus;
  if (role === "opposite") return weights.opposite;
  if (role === "trine") return weights.trine;
  // "outside" — geometric mean uses zero on the corresponding side would
  // annihilate the contribution; instead treat it as 1 so the OTHER frame
  // supplies the whole geometric factor. Callers that want no weight for
  // outside must pre-filter.
  return 1;
}

function baseWeight(evidence: MonthlyFlowEvidence, profile: ScoringProfile): number {
  const annualRoleWeight = frameRoleWeight(
    evidence.annualDomainRole,
    profile.frameRoleWeights.annualDomain,
  );
  const monthlyRoleWeight = frameRoleWeight(
    evidence.monthlyFrameRole,
    profile.frameRoleWeights.monthlyActivation,
  );
  const geometricRoleWeight = Math.sqrt(
    Math.max(0, annualRoleWeight) * Math.max(0, monthlyRoleWeight),
  );
  const layerWeight = profile.evidenceLayerWeights[layerWeightKey(evidence.category)];
  const confidenceWeight = profile.confidenceWeights[evidence.knowledgeStatus];
  return geometricRoleWeight * layerWeight * confidenceWeight;
}

/** Identity per `monthly-scoring-profile.v0.json#dedup.identityFields`
 * (annualYear + school are constant within one analysis call so are
 * omitted from the in-run key). */
function dedupIdentity(evidence: MonthlyFlowEvidence): string {
  return [
    evidence.monthKey,
    evidence.domain,
    evidence.category,
    evidence.physicalFactId,
    evidence.ruleId,
    evidence.targetPalaceIndex,
  ].join("|");
}

export interface AggregateMonthlyEvidenceInput {
  candidates: MonthlyFlowEvidence[];
  profile: ScoringProfile;
  monthDiagnostics: MonthlyFlowMonthDiagnostics;
}

/**
 * Aggregate raw per-collector candidates into the final, dedup'd,
 * weighted evidence list for one (month, domain):
 *  1. Dedup on `identityFields` — highest base weight wins.
 *  2. Stable ordering by (weight desc, physicalFactId asc).
 *  3. Diminishing returns per rank inside
 *     `monthKey|domain|layer|stackingGroup`,
 *     `diminishingFactor = 1/sqrt(rank)`.
 *  4. `effectiveWeight = baseWeight * diminishingFactor`;
 *     `weightedAxes = rawAxes * effectiveWeight`.
 */
export function aggregateMonthlyEvidence(
  input: AggregateMonthlyEvidenceInput,
): MonthlyFlowEvidence[] {
  const { candidates, profile, monthDiagnostics } = input;

  if (profile.diminishingReturns.formula !== "inverse_square_root_rank") {
    throw new Error(
      `unsupported diminishingReturns.formula: ${profile.diminishingReturns.formula}`,
    );
  }

  const byIdentity = new Map<string, { evidence: MonthlyFlowEvidence; weight: number }[]>();
  for (const evidence of candidates) {
    const key = dedupIdentity(evidence);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push({ evidence, weight: baseWeight(evidence, profile) });
    byIdentity.set(key, bucket);
  }

  const survivors: { evidence: MonthlyFlowEvidence; weight: number }[] = [];
  for (const [identity, bucket] of byIdentity) {
    if (bucket.length > 1) monthDiagnostics.duplicatePhysicalFacts.push(identity);
    bucket.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.evidence.monthlyFrameRole < b.evidence.monthlyFrameRole ? -1 : 1;
    });
    const winner = bucket[0];
    if (winner) survivors.push(winner);
  }

  survivors.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.evidence.physicalFactId < b.evidence.physicalFactId ? -1 : 1;
  });

  const rankCounters = new Map<string, number>();
  const out: MonthlyFlowEvidence[] = [];
  for (const { evidence, weight } of survivors) {
    const layer = layerWeightKey(evidence.category);
    const groupKey = `${evidence.monthKey}|${evidence.domain}|${layer}|${evidence.stackingGroup}`;
    const rank = (rankCounters.get(groupKey) ?? 0) + 1;
    rankCounters.set(groupKey, rank);

    const diminishingFactor = 1 / Math.sqrt(rank);
    const effectiveWeight = weight * diminishingFactor;

    out.push({
      ...evidence,
      effectiveWeight,
      weightedAxes: scaleMonthlyFlowAxes(evidence.rawAxes, effectiveWeight),
    });
  }

  return out;
}
