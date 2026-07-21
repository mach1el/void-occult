import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";
import {
  dedupeSpatialPaths,
  type DedupedSpatialPaths,
} from "../nam-phai-v043/dedupe";
import type { AnnualAxesKnowledgeV06NamPhai } from "../../../knowledge/annual-axes/v0.6";
import { isAnnualActivationCandidate } from "./annual-activation";
import { asV043DedupeKnowledge } from "./knowledge-adapter";

/** V0.6 dedupe — signed paths unchanged; activation filtered before dedupe. */
export function dedupeV06SpatialPaths(
  candidates: ClassifiedPathCandidate[],
  knowledge: AnnualAxesKnowledgeV06NamPhai,
): DedupedSpatialPaths {
  return dedupeSpatialPaths(candidates, asV043DedupeKnowledge(knowledge), {
    activationEligibilityPredicate: isAnnualActivationCandidate,
  });
}
