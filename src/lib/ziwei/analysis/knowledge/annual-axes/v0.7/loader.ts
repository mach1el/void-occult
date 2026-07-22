import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV07NamPhai } from "./schema";
import {
  validateAnnualAxesKnowledgeV07NamPhai,
  type AnnualKnowledgeV07ValidationIssue,
} from "./validate";

import spatialBudget from "./annual-spatial-budget.nam-phai.v0.7.json";
import dedupePolicy from "./annual-evidence-dedupe-policy.nam-phai.v0.7.json";
import bucketFormula from "./annual-bucket-formula.nam-phai.v0.7.json";
import natalGain from "./annual-natal-gain.nam-phai.v0.7.json";
import scoreProfile from "./annual-score-profile.nam-phai.v0.7.json";
import calibration from "./annual-axis-calibration.nam-phai.v0.7.json";
import distributionGates from "./annual-distribution-gates.v0.7.json";

import sourceRegistry from "../v0.4/annual-source-registry.v0.4.json";

export type LoadAnnualAxesKnowledgeV07NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV07NamPhai }
  | { ok: false; issues: AnnualKnowledgeV07ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV07NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV07NamPhai {
  return {
    spatialBudget: spatialBudget as unknown as AnnualAxesKnowledgeV07NamPhai["spatialBudget"],
    dedupePolicy: dedupePolicy as unknown as AnnualAxesKnowledgeV07NamPhai["dedupePolicy"],
    bucketFormula: bucketFormula as unknown as AnnualAxesKnowledgeV07NamPhai["bucketFormula"],
    natalGain: natalGain as unknown as AnnualAxesKnowledgeV07NamPhai["natalGain"],
    scoreProfile: scoreProfile as unknown as AnnualAxesKnowledgeV07NamPhai["scoreProfile"],
    calibration: calibration as unknown as AnnualAxesKnowledgeV07NamPhai["calibration"],
    distributionGates: distributionGates as unknown as AnnualAxesKnowledgeV07NamPhai["distributionGates"],
  };
}

/**
 * Load the Annual Axes V0.7 calibrated Nam Phái knowledge bundle once,
 * validate structurally, then deep-freeze. Fail closed on invalid packs.
 */
export function loadAnnualAxesKnowledgeV07NamPhai(): LoadAnnualAxesKnowledgeV07NamPhaiResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const sourceIds = new Set(sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV07NamPhai(knowledge, sourceIds);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized V0.7 Nam Phái knowledge. */
export function resetAnnualAxesKnowledgeV07NamPhaiCache(): void {
  cached = null;
}

