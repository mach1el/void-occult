import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { AnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type {
  DeepReadonly,
  MonthlyFlowScoringKnowledgeV0,
} from "../../knowledge/monthly-flow";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowMonthDiagnostics,
} from "./types";

export interface KnownSourceInputs {
  monthlyKnowledge: DeepReadonly<MonthlyFlowScoringKnowledgeV0> | MonthlyFlowScoringKnowledgeV0;
  palaceKnowledge: PalaceOverviewKnowledgeV1;
  annualKnowledge: AnnualAxesKnowledgeV0;
  majorFortuneKnowledge:
    | DeepReadonly<MajorFortuneScoringKnowledgeV0>
    | MajorFortuneScoringKnowledgeV0;
}

/**
 * Known provenance IDs from every module the monthly scorer legitimately
 * builds on: monthly-flow scoring sources, Palace Overview numeric star
 * sources, annual axes registry, and Major Fortune registry (for context
 * layer). Every source id declared anywhere in these four registries
 * counts as known.
 */
export function collectKnownSourceIds(inputs: KnownSourceInputs): Set<string> {
  return new Set([
    ...inputs.monthlyKnowledge.sourceRegistry.sources.flatMap((s) => [s.sourceId]),
    ...inputs.palaceKnowledge.sources.sources.flatMap((s) => [s.id, ...s.sourceIds]),
    ...inputs.annualKnowledge.sourceRegistry.sources.flatMap((s) => [s.sourceId]),
    ...inputs.majorFortuneKnowledge.sourceRegistry.sources.flatMap((s) => [s.sourceId]),
  ]);
}

/**
 * Flag evidence whose `sourceIds` are empty or not registered in any of
 * the four registries. Empty is reported as `${evidence.id}:empty`; every
 * unknown id is reported as `${evidence.id}:${sourceId}`.
 */
export function auditEvidenceSources(
  evidence: readonly MonthlyFlowEvidence[],
  inputs: KnownSourceInputs,
  monthDiagnostics: MonthlyFlowMonthDiagnostics,
): void {
  const known = collectKnownSourceIds(inputs);

  for (const item of evidence) {
    if (item.sourceIds.length === 0) {
      monthDiagnostics.missingSourceIds.push(`${item.id}:empty`);
      continue;
    }
    for (const sourceId of item.sourceIds) {
      if (!known.has(sourceId)) {
        monthDiagnostics.missingSourceIds.push(`${item.id}:${sourceId}`);
      }
    }
  }
}
