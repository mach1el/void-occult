/**
 * Deterministic dedupe for V0.4.3 — never uses Map/array insertion order
 * to decide which duplicate path survives.
 */

import type { AnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import type { ClassifiedPathCandidate } from "./classify-paths";

export interface DedupedSpatialPaths {
  signedRetained: ClassifiedPathCandidate[];
  activationRetained: ClassifiedPathCandidate[];
  rejected: Array<ClassifiedPathCandidate & { rejectedPathReason: string }>;
  trace: {
    candidateEvidenceCount: number;
    candidatePathCount: number;
    retainedSignedFactCount: number;
    retainedActivationFactCount: number;
    droppedDuplicatePathCount: number;
    directWonCollisionCount: number;
  };
}

function precedenceIndex<T extends string>(list: readonly T[], value: T): number {
  const idx = list.indexOf(value);
  return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
}

/** Lower return = higher precedence (better survivor). Stable total order. */
export function comparePathPrecedence(
  a: ClassifiedPathCandidate,
  b: ClassifiedPathCandidate,
  knowledge: AnnualAxesKnowledgeV043NamPhai,
): number {
  const geo = knowledge.dedupePolicy.geometryPrecedence;
  const layers = knowledge.dedupePolicy.layerPrecedence;

  const geoCmp =
    precedenceIndex(geo, a.geometryClass) - precedenceIndex(geo, b.geometryClass);
  if (geoCmp !== 0) return geoCmp;

  const layerCmp =
    precedenceIndex(layers, a.evidence.layer) - precedenceIndex(layers, b.evidence.layer);
  if (layerCmp !== 0) return layerCmp;

  const strengthA =
    a.geometryRoleWeight * a.ownershipSubjectProduct * a.confidenceWeight;
  const strengthB =
    b.geometryRoleWeight * b.ownershipSubjectProduct * b.confidenceWeight;
  if (strengthB !== strengthA) return strengthB > strengthA ? 1 : -1;

  const ruleCmp = a.evidence.ruleId.localeCompare(b.evidence.ruleId);
  if (ruleCmp !== 0) return ruleCmp;

  const idCmp = a.evidence.id.localeCompare(b.evidence.id);
  if (idCmp !== 0) return idCmp;

  return a.candidatePathId.localeCompare(b.candidatePathId);
}

function signedEligible(c: ClassifiedPathCandidate): boolean {
  return c.geometryBucket === "direct" || c.geometryBucket === "tp4c";
}

function activationEligible(
  c: ClassifiedPathCandidate,
  knowledge: AnnualAxesKnowledgeV043NamPhai,
): boolean {
  if (c.geometryBucket === "direct" || c.geometryBucket === "tp4c") return true;
  return knowledge.aggregationProfile.contextChannels.mayContributeActivation;
}

/**
 * Dedupe by domain + physicalFactId using configured precedence.
 * Rejected paths are retained for audit/explanation.
 */
export function dedupeSpatialPaths(
  candidates: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV043NamPhai,
): DedupedSpatialPaths {
  const sorted = [...candidates].sort((a, b) => comparePathPrecedence(a, b, knowledge));

  const byFact = new Map<string, ClassifiedPathCandidate[]>();
  for (const c of sorted) {
    const key = `${c.evidence.domain}|${c.evidence.physicalFactId}`;
    const list = byFact.get(key) ?? [];
    list.push(c);
    byFact.set(key, list);
  }

  // Sort fact keys for deterministic iteration (not insertion order).
  const factKeys = [...byFact.keys()].sort((a, b) => a.localeCompare(b));

  const signedRetained: ClassifiedPathCandidate[] = [];
  const activationRetained: ClassifiedPathCandidate[] = [];
  const rejected: Array<ClassifiedPathCandidate & { rejectedPathReason: string }> = [];
  let droppedDuplicatePathCount = 0;
  let directWonCollisionCount = 0;

  const evidenceIds = new Set(candidates.map((c) => c.evidence.id));

  for (const key of factKeys) {
    const group = byFact.get(key)!;
    // Already globally sorted; re-sort within group for safety.
    group.sort((a, b) => comparePathPrecedence(a, b, knowledge));

    const signedWinner = group.find(signedEligible) ?? null;
    const activationWinner = group.find((c) => activationEligible(c, knowledge)) ?? null;

    if (signedWinner) {
      signedRetained.push(signedWinner);
      const hasTp4c = group.some((c) => c.geometryBucket === "tp4c");
      const hasDirect = group.some((c) => c.geometryBucket === "direct");
      if (hasDirect && hasTp4c && signedWinner.geometryBucket === "direct") {
        directWonCollisionCount += 1;
      }
    }

    if (activationWinner) {
      activationRetained.push(activationWinner);
    }

    for (const c of group) {
      const isSigned = signedWinner === c;
      const isActivation = activationWinner === c;
      if (isSigned || isActivation) continue;

      droppedDuplicatePathCount += 1;
      let reason = "lower-precedence-duplicate";
      if (
        signedWinner &&
        signedEligible(c) &&
        signedWinner.geometryBucket === "direct" &&
        c.geometryBucket === "tp4c"
      ) {
        reason = "direct-wins-collision";
      } else if (signedWinner && signedEligible(c)) {
        reason = "signed-duplicate-same-physical-fact";
      } else if (activationWinner && activationEligible(c, knowledge)) {
        reason = "activation-duplicate-same-physical-fact";
      } else if (c.geometryBucket === "context-only") {
        reason = "context-only-not-signed";
      }
      rejected.push({ ...c, rejectedPathReason: reason });
    }
  }

  signedRetained.sort((a, b) => comparePathPrecedence(a, b, knowledge));
  activationRetained.sort((a, b) => comparePathPrecedence(a, b, knowledge));
  rejected.sort((a, b) => comparePathPrecedence(a, b, knowledge));

  return {
    signedRetained,
    activationRetained,
    rejected,
    trace: {
      candidateEvidenceCount: evidenceIds.size,
      candidatePathCount: candidates.length,
      retainedSignedFactCount: signedRetained.length,
      retainedActivationFactCount: activationRetained.length,
      droppedDuplicatePathCount,
      directWonCollisionCount,
    },
  };
}
