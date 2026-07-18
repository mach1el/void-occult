import type { MonthlyFlowScoringKnowledgeV0 } from "./schema";
import {
  validateMonthlyFlowScoringKnowledge,
  type MonthlyFlowKnowledgeValidationIssue,
} from "./validate";
import { deepFreeze, type DeepReadonly } from "./deep-freeze";

import domainDefinitions from "./monthly-domain-definitions.v0.json";
import scoringProfile from "./monthly-scoring-profile.v0.json";
import focusMarkers from "./monthly-focus-markers.v0.json";
import transformationImpact from "./monthly-transformation-impact.v0.json";
import movingStars from "./monthly-moving-stars.v0.json";
import calendarRelations from "./monthly-calendar-relations.v0.json";
import interactionRules from "./monthly-interaction-rules.v0.json";
import schoolCapabilities from "./monthly-school-capabilities.v0.json";
import identityPolicy from "./monthly-identity-policy.v0.json";
import contextPolicy from "./monthly-context-policy.v0.json";
import sourceRegistry from "./monthly-source-registry.v0.json";
import calibrationFixtures from "./monthly-calibration-fixtures.v0.json";

export type LoadMonthlyFlowScoringKnowledgeResult =
  | { ok: true; knowledge: DeepReadonly<MonthlyFlowScoringKnowledgeV0> }
  | { ok: false; issues: MonthlyFlowKnowledgeValidationIssue[] };

let cached: LoadMonthlyFlowScoringKnowledgeResult | null = null;

function buildKnowledge(): MonthlyFlowScoringKnowledgeV0 {
  return {
    domainDefinitions:
      domainDefinitions as unknown as MonthlyFlowScoringKnowledgeV0["domainDefinitions"],
    scoringProfile: scoringProfile as unknown as MonthlyFlowScoringKnowledgeV0["scoringProfile"],
    focusMarkers: focusMarkers as unknown as MonthlyFlowScoringKnowledgeV0["focusMarkers"],
    transformationImpact:
      transformationImpact as unknown as MonthlyFlowScoringKnowledgeV0["transformationImpact"],
    movingStars: movingStars as unknown as MonthlyFlowScoringKnowledgeV0["movingStars"],
    calendarRelations:
      calendarRelations as unknown as MonthlyFlowScoringKnowledgeV0["calendarRelations"],
    interactionRules:
      interactionRules as unknown as MonthlyFlowScoringKnowledgeV0["interactionRules"],
    schoolCapabilities:
      schoolCapabilities as unknown as MonthlyFlowScoringKnowledgeV0["schoolCapabilities"],
    identityPolicy: identityPolicy as unknown as MonthlyFlowScoringKnowledgeV0["identityPolicy"],
    contextPolicy: contextPolicy as unknown as MonthlyFlowScoringKnowledgeV0["contextPolicy"],
    sourceRegistry: sourceRegistry as unknown as MonthlyFlowScoringKnowledgeV0["sourceRegistry"],
    calibrationFixtures:
      calibrationFixtures as unknown as MonthlyFlowScoringKnowledgeV0["calibrationFixtures"],
  };
}

/** Load Monthly Flow Scoring V0 knowledge once; validate then deep-freeze. */
export function loadMonthlyFlowScoringKnowledgeV0(): LoadMonthlyFlowScoringKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const validation = validateMonthlyFlowScoringKnowledge(knowledge);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized knowledge. */
export function resetMonthlyFlowScoringKnowledgeCache(): void {
  cached = null;
}
