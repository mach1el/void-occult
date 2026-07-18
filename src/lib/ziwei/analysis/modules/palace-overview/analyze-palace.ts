import type { NatalZiweiFact, ZiweiBrightness, ZiweiSchool } from "../../facts";
import { buildStaticFrame, type StaticFrame } from "../../frame";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { ChartData } from "@/types/chart";
import { aggregateEvidence, topDrivers } from "./aggregate-evidence";
import {
  collectPalaceEvidence,
  emptyDiagnostics,
  type CollectEvidenceContext,
} from "./collect-evidence";
import { evaluateStructuralRules } from "./evaluate-structural-rules";
import {
  bandForScore,
  computeEvidenceCompleteness,
  computeIntensity,
  computeRadarScore,
  normalizeAxes,
} from "./normalize-result";
import type {
  PalaceOverviewDiagnostics,
  PalaceOverviewResult,
} from "./types";

export interface AnalyzePalaceInput {
  chart: ChartData;
  palaceIndex: number;
  school: ZiweiSchool;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  duplicateFactIds: string[];
  diagnostics?: PalaceOverviewDiagnostics;
}

export function analyzePalace(input: AnalyzePalaceInput): PalaceOverviewResult {
  const {
    chart,
    palaceIndex,
    school,
    factsByPalace,
    knowledge,
    duplicateFactIds,
  } = input;
  const diagnostics = input.diagnostics ?? emptyDiagnostics();
  diagnostics.duplicateFacts.push(...duplicateFactIds);

  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  if (!palace) {
    throw new Error(`palace index ${palaceIndex} not found`);
  }

  const frame: StaticFrame = buildStaticFrame(chart, palaceIndex, {
    geometry: knowledge.profile.geometry,
  });

  const ctx: CollectEvidenceContext = {
    frame,
    factsByPalace,
    knowledge,
    diagnostics,
  };

  const { evidence: baseEvidence, isVoidMajor } = collectPalaceEvidence(ctx);
  const ruleEvidence = evaluateStructuralRules({
    frame,
    factsByPalace,
    knowledge,
    diagnostics,
    focusPalaceName: palace.name,
    focusPalaceBranch: palace.branch,
  });

  const allEvidence = [...baseEvidence, ...ruleEvidence];
  const rawAxes = aggregateEvidence(allEvidence);
  const axes = normalizeAxes(rawAxes, knowledge);
  const score = computeRadarScore(rawAxes, knowledge);
  const intensity = computeIntensity(rawAxes, knowledge);
  const evidenceCompleteness = computeEvidenceCompleteness({
    missingBrightnessCount: new Set(diagnostics.missingBrightness).size,
    unmappedTransformationCount: new Set(diagnostics.unmappedTransformations)
      .size,
    unknownStarCount: new Set(diagnostics.unknownStars).size,
    frameNodeCount: frame.nodes.length,
    duplicateFactCount: new Set(duplicateFactIds).size,
  });

  const majorStars = frame.nodes.flatMap((node) => {
    const facts = factsByPalace.get(node.palaceIndex) ?? [];
    return facts
      .filter((f) => f.kind === "star" && f.starClass === "major")
      .map((f) => ({
        name: f.canonicalStarName ?? f.starName ?? "?",
        brightness: (f.brightness ?? "Bình") as ZiweiBrightness,
        role: node.role,
      }));
  });

  const contextOnlyByName = new Map(
    knowledge.minorStars.stars
      .filter((s) => s.scoringMode === "context-only")
      .map((s) => [s.canonicalName, s] as const),
  );
  const contextOnlyStars = frame.nodes.flatMap((node) => {
    const facts = factsByPalace.get(node.palaceIndex) ?? [];
    return facts
      .filter(
        (f) =>
          f.kind === "star" &&
          f.canonicalStarName &&
          contextOnlyByName.has(f.canonicalStarName),
      )
      .map((f) => ({ name: f.canonicalStarName!, role: node.role }));
  });

  return {
    module: "palace-overview",
    version: "1.0.0-experimental",
    palaceIndex: palace.index,
    palaceName: palace.name,
    palaceBranch: palace.branch,
    score,
    band: bandForScore(score),
    axes,
    rawAxes,
    intensity,
    evidenceCompleteness,
    majorStars,
    contextOnlyStars,
    isVoidMajor,
    topSupportDrivers: topDrivers(allEvidence, "support", 3),
    topPressureDrivers: topDrivers(allEvidence, "pressure", 3),
    allEvidence,
    profileId: knowledge.profile.id,
    school,
  };
}
