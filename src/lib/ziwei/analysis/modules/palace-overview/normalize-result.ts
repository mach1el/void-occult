import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  PalaceEvidenceAxes,
  PalaceOverviewBand,
} from "./types";

function saturating(raw: number, scale: number): number {
  return 100 * (1 - Math.exp(-Math.max(raw, 0) / scale));
}

function logisticStability(raw: number, scale: number): number {
  return 100 / (1 + Math.exp(-raw / scale));
}

function logisticQuality(raw: number, scale: number): number {
  return 100 / (1 + Math.exp(-raw / scale));
}

export function normalizeAxes(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceEvidenceAxes {
  const scales = knowledge.profile.axisNormalization;
  return {
    support: round1(saturating(raw.support, scales.supportScale)),
    pressure: round1(saturating(raw.pressure, scales.pressureScale)),
    activation: round1(saturating(raw.activation, scales.activationScale)),
    stability: round1(logisticStability(raw.stability, scales.stabilityScale)),
  };
}

export function computeRadarScore(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const qualityRaw = raw.support - raw.pressure;
  const scale = knowledge.profile.qualityNormalization.scale;
  return round1(logisticQuality(qualityRaw, scale));
}

export function computeIntensity(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const intensityRaw =
    raw.support + raw.pressure + Math.max(raw.activation, 0);
  const scale = knowledge.profile.intensityNormalization.scale;
  return round1(saturating(intensityRaw, scale));
}

export function bandForScore(score: number): PalaceOverviewBand {
  if (score <= 24) return "low";
  if (score < 50) return "guarded";
  if (score < 60) return "balanced";
  if (score < 75) return "supportive";
  return "strong";
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clamp01to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export interface CompletenessInput {
  missingBrightnessCount: number;
  unmappedTransformationCount: number;
  unknownStarCount: number;
  frameNodeCount: number;
  duplicateFactCount: number;
}

export function computeEvidenceCompleteness(input: CompletenessInput): number {
  let score = 100;
  score -= 10 * input.missingBrightnessCount;
  score -= 10 * input.unmappedTransformationCount;
  score -= Math.min(20, 2 * input.unknownStarCount);
  if (input.frameNodeCount < 4) score -= 20;
  if (input.duplicateFactCount > 0) score -= 5;
  return clamp01to100(score);
}
