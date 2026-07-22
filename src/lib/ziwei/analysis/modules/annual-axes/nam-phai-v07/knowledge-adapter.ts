import type { AnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import type { AnnualAxesKnowledgeV07NamPhai } from "../../../knowledge/annual-axes/v0.7";

/** Bridge V0.7 knowledge into V0.4.3 dedupe helpers without duplicating policy logic. */
export function asV043DedupeKnowledge(
  knowledge: AnnualAxesKnowledgeV07NamPhai,
): AnnualAxesKnowledgeV043NamPhai {
  return {
    spatialBudget: knowledge.spatialBudget as AnnualAxesKnowledgeV043NamPhai["spatialBudget"],
    dedupePolicy: knowledge.dedupePolicy as AnnualAxesKnowledgeV043NamPhai["dedupePolicy"],
    aggregationProfile: {
      normalization: {
        function: "one-minus-exp",
        supportScale: knowledge.bucketFormula.evidenceScale,
        pressureScale: knowledge.bucketFormula.evidenceScale,
        activationScale: knowledge.bucketFormula.evidenceScale,
      },
      diminishingReturns: knowledge.bucketFormula.diminishingReturns,
      contextChannels: knowledge.bucketFormula.contextChannels,
      activationGate: { floor: 0, range: 1 },
      score: {
        neutral: knowledge.scoreProfile.neutral,
        amplitude: knowledge.scoreProfile.amplitude,
        divisor: 1,
        minimum: knowledge.scoreProfile.minimum,
        maximum: knowledge.scoreProfile.maximum,
        precision: knowledge.scoreProfile.precision,
      },
    },
    fixtureMatrix: { directAnchors: [] },
  } as unknown as AnnualAxesKnowledgeV043NamPhai;
}
