import type { AnnualAxesKnowledgeV03NamPhai } from "../../../knowledge/annual-axes/v0.3";
import { scaleAnnualAxes, type AnnualAxisEvidence } from "../types";

/**
 * V0.3 aggregator — the per-fact channel blend already produced one
 * evidence row per physical fact per domain (channel weights and layer
 * weight applied). This function only applies diminishing returns per
 * `1 / sqrt(rank)` within layer + stackingGroup and scales `weightedAxes`
 * by the final `effectiveWeight`.
 */
export function aggregateNamPhaiV03DomainEvidence(
  candidates: AnnualAxisEvidence[],
  knowledge: AnnualAxesKnowledgeV03NamPhai,
): AnnualAxisEvidence[] {
  if (knowledge.scoringProfile.diminishingReturns.formula !== "inverse_square_root_rank") {
    throw new Error(
      `unsupported diminishingReturns.formula: ${knowledge.scoringProfile.diminishingReturns.formula}`,
    );
  }

  const sorted = [...candidates].sort((a, b) => {
    if (b.effectiveWeight !== a.effectiveWeight) return b.effectiveWeight - a.effectiveWeight;
    return a.physicalFactId < b.physicalFactId ? -1 : 1;
  });

  const rankCounters = new Map<string, number>();
  const out: AnnualAxisEvidence[] = [];
  for (const evidence of sorted) {
    const groupKey = `${evidence.layer}|${evidence.stackingGroup}`;
    const rank = (rankCounters.get(groupKey) ?? 0) + 1;
    rankCounters.set(groupKey, rank);
    const diminishing = 1 / Math.sqrt(rank);
    const finalWeight = evidence.effectiveWeight * diminishing;
    out.push({
      ...evidence,
      effectiveWeight: finalWeight,
      weightedAxes: scaleAnnualAxes(evidence.rawAxes, finalWeight),
    });
  }
  return out;
}
