import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV042NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV042NamPhai,
  type AnnualKnowledgeV042ValidationIssue,
} from "./validate";

import ownership from "./annual-physical-domain-ownership.nam-phai.v0.4.2.json";
import fanoutPolicy from "./annual-evidence-fanout-policy.v0.4.2.json";
import globalPolicy from "./annual-global-evidence-policy.v0.4.2.json";
import subjectModifiers from "./annual-subject-modifiers.v0.4.2.json";
// Reuses the existing V0.4 source registry rather than duplicating it —
// the V0.4.2 ownership catalog cites the same engineering-model source.
import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV042NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV042NamPhai }
  | { ok: false; issues: AnnualKnowledgeV042ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV042NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV042NamPhai {
  return {
    ownership: ownership as unknown as AnnualAxesKnowledgeV042NamPhai["ownership"],
    fanoutPolicy: fanoutPolicy as unknown as AnnualAxesKnowledgeV042NamPhai["fanoutPolicy"],
    globalPolicy: globalPolicy as unknown as AnnualAxesKnowledgeV042NamPhai["globalPolicy"],
    subjectModifiers: subjectModifiers as unknown as AnnualAxesKnowledgeV042NamPhai["subjectModifiers"],
  };
}

/**
 * Load the Annual Axes V0.4.2 strict physical domain ownership Nam Phái
 * knowledge bundle once, validate structurally, then deep-freeze.
 */
export function loadAnnualAxesKnowledgeV042NamPhai(): LoadAnnualAxesKnowledgeV042NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV042NamPhai(knowledge, sourceIds);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.4.2 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV042NamPhaiCache(): void {
  cached = null;
}
