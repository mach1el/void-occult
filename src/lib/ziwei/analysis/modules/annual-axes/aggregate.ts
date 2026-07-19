import type { AnnualScoringProfile } from "../../knowledge/annual-axes";
import { scaleAnnualAxes, type AnnualAxisEvidence, type AnnualAxisEvidenceLayer } from "./types";

function layerWeightKey(layer: AnnualAxisEvidenceLayer): "annual" | "major_fortune" | "natal_activated" {
  if (layer === "major-fortune") return "major_fortune";
  if (layer === "natal-activated") return "natal_activated";
  return "annual";
}

function baseWeight(evidence: AnnualAxisEvidence, profile: AnnualScoringProfile): number {
  const domainAnchorWeight = evidence.effectiveWeight;
  const frameRoleWeight = profile.frameRoleWeights[evidence.frameRole];
  const layerWeight = profile.layerWeights[layerWeightKey(evidence.layer)];
  const confidenceWeight = profile.confidenceWeights[evidence.knowledgeStatus];
  return domainAnchorWeight * frameRoleWeight * layerWeight * confidenceWeight;
}

/** Identity per `annual-scoring-profile.v0.json#dedup.identityFields`
 * (annualYear + school are constant for one analysis call and therefore
 * omitted from the in-run key). */
function dedupIdentity(evidence: AnnualAxisEvidence): string {
  return [
    evidence.domain,
    evidence.layer,
    evidence.category,
    evidence.physicalFactId,
    evidence.ruleId,
    evidence.targetPalaceIndex,
  ].join("|");
}

/** Diminishing-rank competition group for one evidence item within a
 * domain. `"natal-activated"` ranks globally across the whole layer —
 * every domain's TP4C frame spans most-to-all of the natal chart once
 * multiple anchors are unioned, so splitting by `stackingGroup` there left
 * dozens of independent near-rank-1 slots and effectively let the entire
 * static natal chart flow into every domain every year. `"annual"` and
 * `"major-fortune"` evidence are genuinely bounded in count (a handful of
 * flowing stars/mutagens per year) and keep the original per-stackingGroup
 * grouping. */
function diminishingGroupKey(evidence: AnnualAxisEvidence): string {
  if (evidence.layer === "natal-activated") return evidence.layer;
  return `${evidence.layer}|${evidence.stackingGroup}`;
}

/**
 * Resolve raw per-anchor candidates into the final, dedup'd, weighted
 * evidence list for one domain:
 *  1. When the same physical fact is reachable through multiple anchors,
 *     keep only the highest-base-weight candidate (stable tie-break).
 *  2. Diminishing returns apply per one-based rank within
 *     `diminishingGroupKey()`, `diminishingFactor = 1/sqrt(rank)`.
 *  3. `effectiveWeight = baseWeight * diminishingFactor`;
 *     `weightedAxes = rawAxes * effectiveWeight`.
 */
export function aggregateDomainEvidence(
  candidates: AnnualAxisEvidence[],
  profile: AnnualScoringProfile,
): AnnualAxisEvidence[] {
  if (profile.diminishingReturns.formula !== "inverse_square_root_rank") {
    throw new Error(
      `unsupported diminishingReturns.formula: ${profile.diminishingReturns.formula}`,
    );
  }

  // Step 1 — cross-anchor dedup, keep highest base weight.
  const byIdentity = new Map<string, { evidence: AnnualAxisEvidence; weight: number }[]>();
  for (const evidence of candidates) {
    const key = dedupIdentity(evidence);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push({ evidence, weight: baseWeight(evidence, profile) });
    byIdentity.set(key, bucket);
  }

  const survivors: { evidence: AnnualAxisEvidence; weight: number }[] = [];
  for (const bucket of byIdentity.values()) {
    bucket.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      if (a.evidence.anchorPalaceName !== b.evidence.anchorPalaceName) {
        return a.evidence.anchorPalaceName < b.evidence.anchorPalaceName ? -1 : 1;
      }
      return a.evidence.frameRole < b.evidence.frameRole ? -1 : 1;
    });
    const winner = bucket[0];
    if (winner) survivors.push(winner);
  }

  // Step 2 — stable ordering, then rank within layer+stackingGroup.
  survivors.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.evidence.physicalFactId < b.evidence.physicalFactId ? -1 : 1;
  });

  const rankCounters = new Map<string, number>();
  const out: AnnualAxisEvidence[] = [];
  for (const { evidence, weight } of survivors) {
    const groupKey = diminishingGroupKey(evidence);
    const rank = (rankCounters.get(groupKey) ?? 0) + 1;
    rankCounters.set(groupKey, rank);

    const diminishingFactor = 1 / Math.sqrt(rank);
    const effectiveWeight = weight * diminishingFactor;

    out.push({
      ...evidence,
      effectiveWeight,
      weightedAxes: scaleAnnualAxes(evidence.rawAxes, effectiveWeight),
    });
  }

  return out;
}
