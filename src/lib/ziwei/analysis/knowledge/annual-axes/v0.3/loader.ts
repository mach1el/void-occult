import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV03NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV03NamPhai,
  type AnnualKnowledgeV03ValidationIssue,
} from "./validate";

import headPolicy from "./annual-head-policy.v0.3.json";
import axisDefinitions from "./annual-axis-definitions.nam-phai.v0.3.json";
import routingProfile from "./annual-routing-profile.v0.3.json";
import scoringProfile from "./annual-scoring-profile.nam-phai.v0.3.json";
import layerWeights from "./annual-layer-weights.nam-phai.v0.3.json";
import contextMarkers from "./annual-context-markers.nam-phai.v0.3.json";
import calibrationFixtures from "./annual-calibration-fixtures.v0.3.json";
import sourceRegistry from "./annual-source-registry.v0.3.json";
import migrationGuard from "./annual-v0.2-migration-guard.json";
import dynamicResolutionGuard from "./annual-dynamic-resolution-guard.v0.3.json";

export type LoadAnnualAxesKnowledgeV03NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV03NamPhai }
  | { ok: false; issues: AnnualKnowledgeV03ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV03NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV03NamPhai {
  return {
    headPolicy: headPolicy as unknown as AnnualAxesKnowledgeV03NamPhai["headPolicy"],
    axisDefinitions:
      axisDefinitions as unknown as AnnualAxesKnowledgeV03NamPhai["axisDefinitions"],
    routingProfile:
      routingProfile as unknown as AnnualAxesKnowledgeV03NamPhai["routingProfile"],
    scoringProfile:
      scoringProfile as unknown as AnnualAxesKnowledgeV03NamPhai["scoringProfile"],
    layerWeights:
      layerWeights as unknown as AnnualAxesKnowledgeV03NamPhai["layerWeights"],
    contextMarkers:
      contextMarkers as unknown as AnnualAxesKnowledgeV03NamPhai["contextMarkers"],
    calibrationFixtures:
      calibrationFixtures as unknown as AnnualAxesKnowledgeV03NamPhai["calibrationFixtures"],
    sourceRegistry:
      sourceRegistry as unknown as AnnualAxesKnowledgeV03NamPhai["sourceRegistry"],
    migrationGuard:
      migrationGuard as unknown as AnnualAxesKnowledgeV03NamPhai["migrationGuard"],
    dynamicResolutionGuard:
      dynamicResolutionGuard as unknown as AnnualAxesKnowledgeV03NamPhai["dynamicResolutionGuard"],
  };
}

/**
 * Load the head-centric Annual Axes V0.3 Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze. Trung Châu continues to use
 * `loadAnnualAxesKnowledgeV0` — these paths are intentionally divergent
 * so the locked V0.2 Trung Châu numeric fixture stays byte-identical.
 */
export function loadAnnualAxesKnowledgeV03NamPhai(): LoadAnnualAxesKnowledgeV03NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const validation = validateAnnualAxesKnowledgeV03NamPhai(knowledge);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.3 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV03NamPhaiCache(): void {
  cached = null;
}
