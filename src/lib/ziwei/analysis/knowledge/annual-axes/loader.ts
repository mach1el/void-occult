import type { AnnualAxesKnowledgeV0 } from "./schema";
import {
  validateAnnualAxesKnowledge,
  type AnnualKnowledgeValidationIssue,
} from "./validate";
import { deepFreeze } from "./deep-freeze";

import axisDefinitions from "./annual-axis-definitions.v0.json";
import scoringProfile from "./annual-scoring-profile.v0.json";
import focalMarkers from "./annual-focal-markers.v0.json";
import interactionRules from "./annual-interaction-rules.v0.json";
import mutagenImpact from "./annual-mutagen-impact.v0.json";
import starOverrides from "./annual-star-overrides.v0.json";
import sourceRegistry from "./annual-source-registry.v0.json";
import calibrationFixtures from "./annual-calibration-fixtures.v0.json";
import schoolDomainPolicy from "./annual-school-domain-policy.v0.2.json";

export type LoadAnnualAxesKnowledgeResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV0 }
  | { ok: false; issues: AnnualKnowledgeValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV0 {
  return {
    axisDefinitions: axisDefinitions as unknown as AnnualAxesKnowledgeV0["axisDefinitions"],
    scoringProfile: scoringProfile as unknown as AnnualAxesKnowledgeV0["scoringProfile"],
    focalMarkers: focalMarkers as unknown as AnnualAxesKnowledgeV0["focalMarkers"],
    interactionRules:
      interactionRules as unknown as AnnualAxesKnowledgeV0["interactionRules"],
    mutagenImpact: mutagenImpact as unknown as AnnualAxesKnowledgeV0["mutagenImpact"],
    starOverrides: starOverrides as unknown as AnnualAxesKnowledgeV0["starOverrides"],
    sourceRegistry: sourceRegistry as unknown as AnnualAxesKnowledgeV0["sourceRegistry"],
    calibrationFixtures:
      calibrationFixtures as unknown as AnnualAxesKnowledgeV0["calibrationFixtures"],
    schoolDomainPolicy:
      schoolDomainPolicy as unknown as AnnualAxesKnowledgeV0["schoolDomainPolicy"],
  };
}

/** Load Annual Axes V0 knowledge once; validate then deep-freeze. */
export function loadAnnualAxesKnowledgeV0(): LoadAnnualAxesKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const validation = validateAnnualAxesKnowledge(knowledge);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized knowledge. */
export function resetAnnualAxesKnowledgeCache(): void {
  cached = null;
}
