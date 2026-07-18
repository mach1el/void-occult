import {
  indexFactsByPalace,
  normalizeNatalFacts,
  type ZiweiSchool,
} from "../../facts";
import {
  loadPalaceOverviewKnowledgeV1,
  type PalaceOverviewKnowledgeV1,
} from "../../knowledge";
import type { ChartData } from "@/types/chart";
import { analyzePalace } from "./analyze-palace";
import { emptyDiagnostics } from "./collect-evidence";
import type {
  PalaceOverviewDiagnostics,
  PalaceOverviewResult,
} from "./types";

export interface AnalyzeAllPalacesOptions {
  school: ZiweiSchool;
  knowledge?: PalaceOverviewKnowledgeV1;
}

export interface AnalyzeAllPalacesResult {
  results: PalaceOverviewResult[];
  diagnostics: PalaceOverviewDiagnostics;
  knowledgeValid: boolean;
  knowledgeIssues?: string[];
}

/**
 * Analyze all 12 palaces. Normalizes natal facts and loads knowledge once.
 */
export function analyzeAllPalaces(
  chart: ChartData,
  options: AnalyzeAllPalacesOptions,
): AnalyzeAllPalacesResult {
  const diagnostics = emptyDiagnostics();
  const loaded =
    options.knowledge != null
      ? { ok: true as const, knowledge: options.knowledge }
      : loadPalaceOverviewKnowledgeV1();

  if (!loaded.ok) {
    return {
      results: [],
      diagnostics,
      knowledgeValid: false,
      knowledgeIssues: loaded.issues.map((i) => `${i.path}: ${i.message}`),
    };
  }

  const { facts, duplicateIds } = normalizeNatalFacts(chart, {
    school: options.school,
  });
  diagnostics.duplicateFacts.push(...duplicateIds);
  const factsByPalace = indexFactsByPalace(facts);

  const results: PalaceOverviewResult[] = [];
  for (const palace of chart.palaces) {
    // Per-palace diagnostics bucket — share global unknown lists carefully.
    const localDiag = emptyDiagnostics();
    const result = analyzePalace({
      chart,
      palaceIndex: palace.index,
      school: options.school,
      factsByPalace,
      knowledge: loaded.knowledge,
      duplicateFactIds: duplicateIds,
      diagnostics: localDiag,
    });
    results.push(result);
    diagnostics.unknownStars.push(...localDiag.unknownStars);
    diagnostics.missingBrightness.push(...localDiag.missingBrightness);
    diagnostics.unmappedTransformations.push(
      ...localDiag.unmappedTransformations,
    );
    diagnostics.contextOnlyFacts.push(...localDiag.contextOnlyFacts);
    diagnostics.ruleHits.push(...localDiag.ruleHits);
  }

  // Dedupe diagnostic lists
  diagnostics.unknownStars = [...new Set(diagnostics.unknownStars)];
  diagnostics.missingBrightness = [...new Set(diagnostics.missingBrightness)];
  diagnostics.unmappedTransformations = [
    ...new Set(diagnostics.unmappedTransformations),
  ];
  diagnostics.contextOnlyFacts = [...new Set(diagnostics.contextOnlyFacts)];
  diagnostics.duplicateFacts = [...new Set(diagnostics.duplicateFacts)];

  return {
    results,
    diagnostics,
    knowledgeValid: true,
  };
}
