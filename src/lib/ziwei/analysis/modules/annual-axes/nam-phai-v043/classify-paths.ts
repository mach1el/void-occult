/**
 * Geometry classification for Annual Axes V0.4.3 spatial budget.
 * Focus is direct; opposite/trine are TP4C; global/MF are context-only.
 */

import type {
  AnnualGeometryBucket,
  AnnualGeometryClass,
} from "../../../knowledge/annual-axes/v0.4.3";
import type { AnnualAxisHeadRole } from "../../../knowledge/annual-axes/v0.4";
import type { AnnualEvidenceActivationPath, AnnualAxisEvidence } from "../types";
import { relationRole } from "../nam-phai-v04/routing";

export interface ClassifiedPathCandidate {
  evidence: AnnualAxisEvidence;
  path: AnnualEvidenceActivationPath;
  geometryClass: AnnualGeometryClass;
  geometryBucket: AnnualGeometryBucket;
  headRole: AnnualAxisHeadRole;
  /** ownership × subjectModifier (from V0.4.2 path affinity). */
  ownershipSubjectProduct: number;
  ownershipWeight: number;
  subjectModifier: number;
  geometryRoleWeight: number;
  confidenceWeight: number;
  candidatePathId: string;
}

function bucketFor(geometryClass: AnnualGeometryClass): AnnualGeometryBucket {
  if (geometryClass === "direct-exact-target" || geometryClass === "direct-head-focus") {
    return "direct";
  }
  if (geometryClass === "tp4c-opposite" || geometryClass === "tp4c-trine") {
    return "tp4c";
  }
  return "context-only";
}

/**
 * Classify one V0.4.2 activation path into a V0.4.3 geometry class.
 * Head role is recomputed from palace indexes — do not trust display
 * `frameRole` (outside is remapped to focus for legacy display).
 */
export function classifyActivationPath(
  evidence: AnnualAxisEvidence,
  path: AnnualEvidenceActivationPath,
  annualHeadFocusIndex: number,
  tp4cRelativeRoleWeights: { opposite: number; trine: number },
): ClassifiedPathCandidate {
  const headRole = relationRole(annualHeadFocusIndex, evidence.targetPalaceIndex);
  const ownershipWeight = evidence.ownershipWeight ?? path.affinityWeight;
  const subjectModifier =
    ownershipWeight > 0 ? path.affinityWeight / ownershipWeight : 1;
  const ownershipSubjectProduct = path.affinityWeight;
  const confidenceWeight = evidence.confidenceWeight ?? 1;

  let geometryClass: AnnualGeometryClass = "context-only";

  if (path.channel === "direct-domain") {
    if (
      path.triggerId === "annual-moving-star-palace" ||
      path.triggerId === "annual-transformation-exact-target"
    ) {
      geometryClass = "direct-exact-target";
    } else {
      geometryClass = "direct-exact-target";
    }
  } else if (path.channel === "routed-head") {
    if (headRole === "focus") {
      geometryClass = "direct-head-focus";
    } else if (headRole === "opposite") {
      geometryClass = "tp4c-opposite";
    } else if (headRole === "trine") {
      geometryClass = "tp4c-trine";
    } else {
      geometryClass = "context-only";
    }
  } else {
    // global / major-background
    geometryClass = "context-only";
  }

  let geometryRoleWeight = 0;
  if (geometryClass === "direct-exact-target" || geometryClass === "direct-head-focus") {
    geometryRoleWeight = 1;
  } else if (geometryClass === "tp4c-opposite") {
    geometryRoleWeight = tp4cRelativeRoleWeights.opposite;
  } else if (geometryClass === "tp4c-trine") {
    geometryRoleWeight = tp4cRelativeRoleWeights.trine;
  }

  return {
    evidence,
    path,
    geometryClass,
    geometryBucket: bucketFor(geometryClass),
    headRole,
    ownershipSubjectProduct,
    ownershipWeight,
    subjectModifier,
    geometryRoleWeight,
    confidenceWeight,
    candidatePathId: `${evidence.id}|${path.channel}|${path.triggerId}|${geometryClass}`,
  };
}

export function classifyEvidencePaths(
  evidence: AnnualAxisEvidence[],
  annualHeadFocusIndex: number,
  tp4cRelativeRoleWeights: { opposite: number; trine: number },
): ClassifiedPathCandidate[] {
  const out: ClassifiedPathCandidate[] = [];
  for (const e of evidence) {
    for (const path of e.activationPaths ?? []) {
      out.push(
        classifyActivationPath(e, path, annualHeadFocusIndex, tp4cRelativeRoleWeights),
      );
    }
  }
  return out;
}
