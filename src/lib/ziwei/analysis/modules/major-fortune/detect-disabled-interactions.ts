import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type { DeepReadonly } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneDiagnostics } from "./types";

function palaceHasCanonicalStar(palace: ChartPalace, targetStarName: string): boolean {
  const want = canonicalStarName(targetStarName);
  return (palace.stars ?? []).some((star) => canonicalStarName(star.name) === want);
}

/**
 * Exact-target identity: same physical palace index + same canonical star.
 * Returns null when the record has no usable palace / unresolved target.
 */
export function transformationTargetKey(record: MutagenRecord): string | null {
  if (!record.palace) return null;
  return `${record.palace.index}:${canonicalStarName(record.starName)}`;
}

/**
 * Require the canonical target star on both the record palace and the chart
 * palace at that index — same gate as transformation scoring evidence.
 */
function isVerifiedExactTarget(chart: ChartData, record: MutagenRecord): boolean {
  if (!record.palace) return false;
  if (!palaceHasCanonicalStar(record.palace, record.starName)) return false;
  const chartPalace = chart.palaces.find((p) => p.index === record.palace!.index);
  if (!chartPalace || !palaceHasCanonicalStar(chartPalace, record.starName)) return false;
  return true;
}

function indexMutagensByExactTarget(
  chart: ChartData,
  records: readonly MutagenRecord[],
): Map<string, Set<string>> {
  const byTarget = new Map<string, Set<string>>();
  for (const record of records) {
    if (!isVerifiedExactTarget(chart, record)) continue;
    const key = transformationTargetKey(record);
    if (!key) continue;
    const set = byTarget.get(key) ?? new Set();
    set.add(record.mutagen);
    byTarget.set(key, set);
  }
  return byTarget;
}

/**
 * Recognize disabled V0 interaction candidate patterns and record
 * diagnostics without emitting scoring evidence.
 *
 * Exact target means the same canonical star on the same physical palace.
 */
export function detectDisabledInteractionHits(
  chart: ChartData,
  majorTransformations: readonly MutagenRecord[] | undefined,
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
  diagnostics: MajorFortuneDiagnostics,
): void {
  const disabledRules = knowledge.interactionRules.records.filter((r) => !r.enabled);
  if (disabledRules.length === 0) return;

  const majorByTarget = indexMutagensByExactTarget(chart, majorTransformations ?? []);
  const natalByTarget = indexMutagensByExactTarget(chart, chart.natalMutagens ?? []);

  const hit = (ruleId: string, detail: string) => {
    if (disabledRules.some((r) => r.ruleId === ruleId)) {
      diagnostics.disabledInteractionHits.push(`${ruleId}:${detail}`);
    }
  };

  for (const [target, mutagens] of majorByTarget) {
    if (mutagens.has("Khoa") && mutagens.has("Kỵ")) {
      hit("RULE-MFS-KHOA-KY-MODERATION-CANDIDATE", target);
    }
    if (mutagens.has("Lộc") && mutagens.has("Kỵ")) {
      hit("RULE-MFS-LOC-KY-TENSION-CANDIDATE", target);
    }
    const natal = natalByTarget.get(target);
    if (natal && natal.size > 0 && mutagens.size > 0) {
      hit("RULE-MFS-NATAL-MAJOR-SAME-TRANSFORMATION-CANDIDATE", target);
    }
  }
}
