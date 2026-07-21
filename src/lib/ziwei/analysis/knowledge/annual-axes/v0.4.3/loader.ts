import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV043NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV043NamPhai,
  type AnnualKnowledgeV043ValidationIssue,
} from "./validate";

import spatialBudget from "./annual-spatial-budget.nam-phai.v0.4.3.json";
import dedupePolicy from "./annual-evidence-dedupe-policy.nam-phai.v0.4.3.json";
import aggregationProfile from "./annual-aggregation-profile.nam-phai.v0.4.3.json";
import fixtureMatrix from "./annual-axis-fixture-matrix.nam-phai.v0.4.3.json";
import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV043NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV043NamPhai }
  | { ok: false; issues: AnnualKnowledgeV043ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV043NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV043NamPhai {
  return {
    spatialBudget: spatialBudget as unknown as AnnualAxesKnowledgeV043NamPhai["spatialBudget"],
    dedupePolicy: dedupePolicy as unknown as AnnualAxesKnowledgeV043NamPhai["dedupePolicy"],
    aggregationProfile:
      aggregationProfile as unknown as AnnualAxesKnowledgeV043NamPhai["aggregationProfile"],
    fixtureMatrix: fixtureMatrix as unknown as AnnualAxesKnowledgeV043NamPhai["fixtureMatrix"],
  };
}

/**
 * Load the Annual Axes V0.4.3 spatial-budget Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze. Fail closed on invalid packs.
 */
export function loadAnnualAxesKnowledgeV043NamPhai(): LoadAnnualAxesKnowledgeV043NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV043NamPhai(knowledge, sourceIds);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.4.3 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV043NamPhaiCache(): void {
  cached = null;
}
