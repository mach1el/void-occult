import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type {
  MonthlyFlowCalendarRelationsCatalog,
  MonthlyFlowInteractionRulesCatalog,
} from "../../knowledge/monthly-flow";
import type {
  MonthlyFlowMonthDiagnostics,
  ResolvedMonthlyTransformation,
} from "./types";

function palaceHasCanonicalStar(palace: ChartPalace, starName: string): boolean {
  const want = canonicalStarName(starName);
  return (palace.stars ?? []).some((s) => canonicalStarName(s.name) === want);
}

function indexMutagensByExactTarget(
  chart: ChartData,
  records: readonly MutagenRecord[],
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const record of records) {
    if (!record.palace) continue;
    if (!palaceHasCanonicalStar(record.palace, record.starName)) continue;
    const chartPalace = chart.palaces.find((p) => p.index === record.palace!.index);
    if (!chartPalace || !palaceHasCanonicalStar(chartPalace, record.starName)) continue;
    const key = `${record.palace.index}:${canonicalStarName(record.starName)}`;
    const set = out.get(key) ?? new Set();
    set.add(record.mutagen);
    out.set(key, set);
  }
  return out;
}

function indexMonthlyByExactTarget(
  transformations: readonly ResolvedMonthlyTransformation[],
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const t of transformations) {
    const key = `${t.targetPalaceIndex}:${t.canonicalStarName}`;
    const set = out.get(key) ?? new Set();
    set.add(t.mutagen);
    out.set(key, set);
  }
  return out;
}

export interface DetectDisabledRulesInput {
  chart: ChartData;
  monthKey: string;
  monthlyTransformations: readonly ResolvedMonthlyTransformation[];
  interactionRules: MonthlyFlowInteractionRulesCatalog;
  calendarRelations: MonthlyFlowCalendarRelationsCatalog;
  monthDiagnostics: MonthlyFlowMonthDiagnostics;
}

/**
 * Recognize V0-disabled monthly interaction patterns and emit diagnostics
 * only. Never returns evidence. Interaction hits key on
 * `${palaceIndex}:${canonicalStarName}` so the same natal palace with the
 * same star across different transformation kinds is one hit; two palaces
 * that happen to share the same canonical star are two separate hits.
 * Calendar relations remain diagnostic-only in V0.
 */
export function detectDisabledRules(input: DetectDisabledRulesInput): void {
  const {
    chart,
    monthKey,
    monthlyTransformations,
    interactionRules,
    calendarRelations,
    monthDiagnostics,
  } = input;

  const disabledInteractionRules = interactionRules.records.filter((r) => !r.enabled);
  if (disabledInteractionRules.length > 0) {
    const monthlyByTarget = indexMonthlyByExactTarget(monthlyTransformations);
    const annualByTarget = indexMutagensByExactTarget(chart, chart.annualMutagens ?? []);

    const hit = (ruleId: string, detail: string) => {
      if (disabledInteractionRules.some((r) => r.ruleId === ruleId)) {
        monthDiagnostics.disabledInteractionHits.push(`${monthKey}:${ruleId}:${detail}`);
      }
    };

    for (const [target, mutagens] of monthlyByTarget) {
      if (mutagens.has("Khoa") && mutagens.has("Kỵ")) {
        hit("RULE-MONTHLY-KHOA-KY-CANDIDATE", target);
      }
      if (mutagens.has("Lộc") && mutagens.has("Kỵ")) {
        hit("RULE-MONTHLY-LOC-KY-CANDIDATE", target);
      }
      const annual = annualByTarget.get(target);
      if (annual && annual.size > 0 && mutagens.size > 0) {
        for (const m of mutagens) {
          if (annual.has(m)) {
            hit("RULE-MONTHLY-ANNUAL-SAME-MUTAGEN-CANDIDATE", `${target}:${m}`);
          }
        }
      }
    }
  }

  // Calendar-relation candidates require a resolved relation table that
  // Calculation Core does not yet expose. In V0 we simply confirm the rule
  // catalog stays disabled — no diagnostics fire from unresolved data,
  // otherwise every call would report a false-positive "hit".
  void calendarRelations;
}
