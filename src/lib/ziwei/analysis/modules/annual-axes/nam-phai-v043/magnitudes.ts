/**
 * Pure signed vs activation magnitude helpers (§4). Kept in their own module so
 * both `dedupe.ts` (winner selection) and `aggregate-spatial.ts` (diminishing
 * ranking + applied factors) can share them without a circular import.
 *
 * The two magnitudes are deliberately distinct: the signed score is ranked by
 * |support|+|pressure| under the head-role geometry weight, while activation is
 * ranked by raw activation under the activation-path geometry weight (bounded
 * path attenuation for context-only, never geometryRoleWeight which is 0 there).
 */

import type { ClassifiedPathCandidate } from "./classify-paths";

/** Signed-score geometry weight — the head-role weight (0 for context-only). */
export function signedGeometryWeight(c: ClassifiedPathCandidate): number {
  return c.geometryRoleWeight;
}

/**
 * Activation-path geometry weight. Direct/TP4C use the head-role weight; a
 * context-only path uses its own validated bounded path attenuation
 * (`path.boundedPathWeight`) — never `geometryRoleWeight` (0 for context-only)
 * and never silently promoted to 1. An out-of-range bounded weight fails closed
 * to 0 (contributes no activation).
 */
export function activationPathGeometryWeight(c: ClassifiedPathCandidate): number {
  if (c.geometryBucket === "context-only") {
    const w = c.path.boundedPathWeight;
    return Number.isFinite(w) && w >= 0 && w <= 1 ? w : 0;
  }
  return c.geometryRoleWeight;
}

/** Signed ranking magnitude — |support|+|pressure| scaled by signed geometry. */
export function signedMagnitude(c: ClassifiedPathCandidate): number {
  return (
    (Math.abs(c.evidence.rawAxes.support) + Math.abs(c.evidence.rawAxes.pressure)) *
    c.confidenceWeight *
    c.ownershipSubjectProduct *
    signedGeometryWeight(c)
  );
}

/** Activation ranking magnitude — max(0, activation) scaled by activation geometry. */
export function activationMagnitude(c: ClassifiedPathCandidate): number {
  return (
    Math.max(0, c.evidence.rawAxes.activation) *
    c.confidenceWeight *
    c.ownershipSubjectProduct *
    activationPathGeometryWeight(c)
  );
}
