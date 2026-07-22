import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import {
  dedupeSpatialPaths,
  type DedupedSpatialPaths,
} from "../nam-phai-v043/dedupe";
import type { AnnualAxesKnowledgeV07NamPhai } from "../../../knowledge/annual-axes/v0.7";
import { isAnnualActivationCandidate } from "./annual-activation";
import { asV043DedupeKnowledge } from "./knowledge-adapter";

/** V0.7 dedupe — signed paths unchanged; activation filtered before dedupe. */
export function dedupeV07SpatialPaths(
  candidates: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV07NamPhai,
): DedupedSpatialPaths {
  return dedupeSpatialPaths(candidates, asV043DedupeKnowledge(knowledge), {
    activationEligibilityPredicate: isAnnualActivationCandidate,
  });
}
