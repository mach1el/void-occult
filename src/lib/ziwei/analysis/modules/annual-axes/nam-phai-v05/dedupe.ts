import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import {
  dedupeSpatialPaths,
  type DedupedSpatialPaths,
} from "../nam-phai-v043/dedupe";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { isAnnualActivationCandidate } from "./annual-activation";
import { asV043DedupeKnowledge } from "./knowledge-adapter";

/** V0.5 dedupe — signed paths unchanged; activation filtered before dedupe. */
export function dedupeV05SpatialPaths(
  candidates: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV05NamPhai,
): DedupedSpatialPaths {
  return dedupeSpatialPaths(candidates, asV043DedupeKnowledge(knowledge), {
    activationEligibilityPredicate: isAnnualActivationCandidate,
  });
}
