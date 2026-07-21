import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";

/**
 * V0.6 annual-activation eligibility — applied BEFORE activation dedupe,
 * winner selection, diminishing ranking, and annualActivationRaw aggregation.
 *
 * Excludes global climate, Major Fortune background/layer, unactivated
 * natal context, and context-only paths without a concrete annual trigger.
 */
export function isAnnualActivationCandidate(c: ClassifiedPathCandidate): boolean {
  if (c.path.channel === "global" || c.path.channel === "major-background") return false;
  if (c.evidence.layer === "major-fortune") return false;

  const triggerCount = c.evidence.annualTriggerIds?.length ?? 0;

  if (c.evidence.layer === "annual") {
    if (c.geometryBucket === "context-only") return triggerCount > 0;
    return c.geometryBucket === "direct" || c.geometryBucket === "tp4c";
  }

  if (c.evidence.layer === "natal-activated") {
    return triggerCount > 0;
  }

  return false;
}
