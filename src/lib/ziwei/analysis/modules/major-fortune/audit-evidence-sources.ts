import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  DeepReadonly,
  MajorFortuneScoringKnowledgeV0,
} from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneDiagnostics, MajorFortuneEvidence } from "./types";

/**
 * Known provenance IDs from Major Fortune scoring sources plus Palace
 * Overview numeric sources (star evidence reuses the latter).
 */
export function collectKnownSourceIds(
  mfKnowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
  palaceKnowledge: PalaceOverviewKnowledgeV1,
): Set<string> {
  return new Set([
    ...mfKnowledge.sourceRegistry.sources.flatMap((source) => [source.sourceId]),
    ...palaceKnowledge.sources.sources.flatMap((source) => [source.id, ...source.sourceIds]),
  ]);
}

/**
 * Flag evidence whose `sourceIds` are empty or not registered in either
 * Major Fortune or Palace Overview source catalogs.
 */
export function auditEvidenceSources(
  evidence: readonly MajorFortuneEvidence[],
  mfKnowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
  palaceKnowledge: PalaceOverviewKnowledgeV1,
  diagnostics: MajorFortuneDiagnostics,
): void {
  const knownSourceIds = collectKnownSourceIds(mfKnowledge, palaceKnowledge);

  for (const item of evidence) {
    if (item.sourceIds.length === 0) {
      diagnostics.missingSourceIds.push(`${item.id}:empty`);
      continue;
    }

    for (const sourceId of item.sourceIds) {
      if (!knownSourceIds.has(sourceId)) {
        diagnostics.missingSourceIds.push(`${item.id}:${sourceId}`);
      }
    }
  }
}
