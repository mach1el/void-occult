/**
 * Source resolution (§5). No network — registry lookup only.
 */

import type { HuyenKhiOntology, HuyenKhiSource } from "./types";

export function resolveSource(
  ontology: HuyenKhiOntology,
  sourceId: string,
): HuyenKhiSource | undefined {
  return ontology.sourceRegistry.sources.find((s) => s.sourceId === sourceId);
}

/** Which sourceIds referenced by claims/rules do NOT resolve. */
export function unresolvedSourceReferences(
  ontology: HuyenKhiOntology,
): readonly { readonly from: string; readonly sourceId: string }[] {
  const known = new Set(ontology.sourceRegistry.sources.map((s) => s.sourceId));
  const out: { from: string; sourceId: string }[] = [];
  for (const claim of ontology.claimRegistry.claims) {
    for (const id of claim.sourceIds) {
      if (!known.has(id)) out.push({ from: claim.claimId, sourceId: id });
    }
  }
  for (const rule of ontology.rules) {
    for (const id of rule.sourceIds) {
      if (!known.has(id)) out.push({ from: rule.ruleId, sourceId: id });
    }
  }
  return out;
}
