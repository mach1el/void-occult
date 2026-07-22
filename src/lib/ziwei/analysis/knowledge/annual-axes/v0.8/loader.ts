import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV08NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV08NamPhai,
  type AnnualKnowledgeV08ValidationIssue,
} from "./validate";

import domainMapping from "./annual-domain-mapping.nam-phai.v0.8.json";
import pointClasses from "./annual-point-classes.nam-phai.v0.8.json";
import starRegistry from "./annual-star-registry.nam-phai.v0.8.json";
import starAliases from "./annual-star-aliases.nam-phai.v0.8.json";
import distributionGates from "./annual-distribution-gates.v0.8.json";
import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV08NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV08NamPhai }
  | { ok: false; issues: AnnualKnowledgeV08ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV08NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV08NamPhai {
  return {
    domainMapping: domainMapping as unknown as AnnualAxesKnowledgeV08NamPhai["domainMapping"],
    pointClasses: pointClasses as unknown as AnnualAxesKnowledgeV08NamPhai["pointClasses"],
    starRegistry: starRegistry as unknown as AnnualAxesKnowledgeV08NamPhai["starRegistry"],
    starAliases: starAliases as unknown as AnnualAxesKnowledgeV08NamPhai["starAliases"],
    distributionGates:
      distributionGates as unknown as AnnualAxesKnowledgeV08NamPhai["distributionGates"],
  };
}

export function loadAnnualAxesKnowledgeV08NamPhai(): LoadAnnualAxesKnowledgeV08NamPhaiResult {
  if (cached) return cached;
  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV08NamPhai(knowledge, sourceIds);
  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

export function resetAnnualAxesKnowledgeV08NamPhaiCache(): void {
  cached = null;
}
