import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV05NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV05NamPhai,
  type AnnualKnowledgeV05ValidationIssue,
} from "./validate";

import spatialBudget from "./annual-spatial-budget.nam-phai.v0.5.json";
import dedupePolicy from "./annual-evidence-dedupe-policy.nam-phai.v0.5.json";
import bucketFormula from "./annual-bucket-formula.nam-phai.v0.5.json";
import natalGain from "./annual-natal-gain.nam-phai.v0.5.json";
import scoreProfile from "./annual-score-profile.nam-phai.v0.5.json";
import calibration from "./annual-axis-calibration.nam-phai.v0.5.json";
import distributionGates from "./annual-distribution-gates.v0.5.json";

import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV05NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV05NamPhai }
  | { ok: false; issues: AnnualKnowledgeV05ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV05NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV05NamPhai {
  return {
    spatialBudget: spatialBudget as unknown as AnnualAxesKnowledgeV05NamPhai["spatialBudget"],
    dedupePolicy: dedupePolicy as unknown as AnnualAxesKnowledgeV05NamPhai["dedupePolicy"],
    bucketFormula: bucketFormula as unknown as AnnualAxesKnowledgeV05NamPhai["bucketFormula"],
    natalGain: natalGain as unknown as AnnualAxesKnowledgeV05NamPhai["natalGain"],
    scoreProfile: scoreProfile as unknown as AnnualAxesKnowledgeV05NamPhai["scoreProfile"],
    calibration: calibration as unknown as AnnualAxesKnowledgeV05NamPhai["calibration"],
    distributionGates: distributionGates as unknown as AnnualAxesKnowledgeV05NamPhai["distributionGates"],
  };
}

/**
 * Load the Annual Axes V0.5 calibrated Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze. Fail closed on invalid packs.
 */
export function loadAnnualAxesKnowledgeV05NamPhai(): LoadAnnualAxesKnowledgeV05NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV05NamPhai(knowledge, sourceIds);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.5 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV05NamPhaiCache(): void {
  cached = null;
}

