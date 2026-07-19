import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV04NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV04NamPhai,
  type AnnualKnowledgeV04ValidationIssue,
} from "./validate";

import headPolicy from "./annual-head-policy.v0.4.json";
import axisDefinitions from "./annual-axis-definitions.nam-phai.v0.4.json";
import channelProfile from "./annual-channel-profile.v0.4.json";
import deltaProfile from "./annual-delta-profile.v0.4.json";
import triggerPolicy from "./annual-trigger-policy.v0.4.json";
// V0.4.1 signal-recovery: sparse, fallback-explicit affinity catalog.
// The original `annual-domain-affinity.v0.4.json` (universal category
// defaults) stays on disk untouched — never mutated silently — but is no
// longer loaded.
import domainAffinity from "./annual-domain-affinity.v0.4.1.json";
import distributionGates from "./annual-distribution-gates.v0.4.json";
import sourceRegistry from "./annual-source-registry.v0.4.json";
import dynamicResolutionGuard from "./annual-dynamic-resolution-guard.v0.4.json";

export type LoadAnnualAxesKnowledgeV04NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV04NamPhai }
  | { ok: false; issues: AnnualKnowledgeV04ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV04NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV04NamPhai {
  return {
    headPolicy: headPolicy as unknown as AnnualAxesKnowledgeV04NamPhai["headPolicy"],
    axisDefinitions:
      axisDefinitions as unknown as AnnualAxesKnowledgeV04NamPhai["axisDefinitions"],
    channelProfile:
      channelProfile as unknown as AnnualAxesKnowledgeV04NamPhai["channelProfile"],
    deltaProfile: deltaProfile as unknown as AnnualAxesKnowledgeV04NamPhai["deltaProfile"],
    triggerPolicy:
      triggerPolicy as unknown as AnnualAxesKnowledgeV04NamPhai["triggerPolicy"],
    domainAffinity:
      domainAffinity as unknown as AnnualAxesKnowledgeV04NamPhai["domainAffinity"],
    distributionGates:
      distributionGates as unknown as AnnualAxesKnowledgeV04NamPhai["distributionGates"],
    sourceRegistry:
      sourceRegistry as unknown as AnnualAxesKnowledgeV04NamPhai["sourceRegistry"],
    dynamicResolutionGuard:
      dynamicResolutionGuard as unknown as AnnualAxesKnowledgeV04NamPhai["dynamicResolutionGuard"],
  };
}

/**
 * Load the Annual Axes V0.4 annual-delta Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze.
 */
export function loadAnnualAxesKnowledgeV04NamPhai(): LoadAnnualAxesKnowledgeV04NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const validation = validateAnnualAxesKnowledgeV04NamPhai(knowledge);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.4 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV04NamPhaiCache(): void {
  cached = null;
}
