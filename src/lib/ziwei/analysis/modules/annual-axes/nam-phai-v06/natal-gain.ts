import type { AnnualAxesKnowledgeV06NamPhai } from "../../../knowledge/annual-axes/v0.6";
import type { NatalDomainResponseProfile } from "../types";

export function computeNatalGainV06(
  natalResponse: Pick<NatalDomainResponseProfile, "sensitivity" | "resilience">,
  knowledge: AnnualAxesKnowledgeV06NamPhai,
): number {
  const ng = knowledge.natalGain;
  const raw =
    1 +
    ng.sensitivityCoefficient * (natalResponse.sensitivity - 0.5) -
    ng.resilienceCoefficient * (natalResponse.resilience - 0.5);
  return Math.min(ng.maximum, Math.max(ng.minimum, raw));
}
