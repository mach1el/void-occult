import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV06NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV06NamPhai,
  type AnnualKnowledgeV06ValidationIssue,
} from "./validate";

import spatialBudget from "./annual-spatial-budget.nam-phai.v0.6.json";
import dedupePolicy from "./annual-evidence-dedupe-policy.nam-phai.v0.6.json";
import bucketFormula from "./annual-bucket-formula.nam-phai.v0.6.json";
import natalGain from "./annual-natal-gain.nam-phai.v0.6.json";
import scoreProfile from "./annual-score-profile.nam-phai.v0.6.json";
import calibration from "./annual-axis-calibration.nam-phai.v0.6.json";
import distributionGates from "./annual-distribution-gates.v0.6.json";

import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV06NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV06NamPhai }
  | { ok: false; issues: AnnualKnowledgeV06ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV06NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV06NamPhai {
  return {
    spatialBudget: spatialBudget as unknown as AnnualAxesKnowledgeV06NamPhai["spatialBudget"],
    dedupePolicy: dedupePolicy as unknown as AnnualAxesKnowledgeV06NamPhai["dedupePolicy"],
    bucketFormula: bucketFormula as unknown as AnnualAxesKnowledgeV06NamPhai["bucketFormula"],
    natalGain: natalGain as unknown as AnnualAxesKnowledgeV06NamPhai["natalGain"],
    scoreProfile: scoreProfile as unknown as AnnualAxesKnowledgeV06NamPhai["scoreProfile"],
    calibration: calibration as unknown as AnnualAxesKnowledgeV06NamPhai["calibration"],
    distributionGates: distributionGates as unknown as AnnualAxesKnowledgeV06NamPhai["distributionGates"],
  };
}

/**
 * Load the Annual Axes V0.6 calibrated Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze. Fail closed on invalid packs.
 */
export function loadAnnualAxesKnowledgeV06NamPhai(): LoadAnnualAxesKnowledgeV06NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV06NamPhai(knowledge, sourceIds);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.6 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV06NamPhaiCache(): void {
  cached = null;
}

