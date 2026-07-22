import type { AnnualAxesKnowledgeV07NamPhai } from "../../../knowledge/annual-axes/v0.7";
import type { NatalDomainResponseProfile } from "../types";

export function computeNatalGainV07(
  natalResponse: Pick<NatalDomainResponseProfile, "sensitivity" | "resilience">,
  knowledge: AnnualAxesKnowledgeV07NamPhai,
): number {
  const ng = knowledge.natalGain;
  const raw =
    1 +
    ng.sensitivityCoefficient * (natalResponse.sensitivity - 0.5) -
    ng.resilienceCoefficient * (natalResponse.resilience - 0.5);
  return Math.min(ng.maximum, Math.max(ng.minimum, raw));
}
