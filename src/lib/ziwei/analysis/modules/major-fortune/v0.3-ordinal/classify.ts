import type {
  MajorFortuneOrdinalLevel,
  MajorFortuneOrdinalPillarState,
  MajorFortuneOrdinalScoreState,
} from "./types";

export function clampOrdinalLevel(netMass: number): MajorFortuneOrdinalLevel {
  if (!Number.isFinite(netMass)) {
    throw new Error(`ordinal netMass must be finite; got ${String(netMass)}`);
  }
  const clamped = Math.min(2, Math.max(-2, Math.trunc(netMass)));
  return clamped as MajorFortuneOrdinalLevel;
}

export function classifyPillarState(input: {
  availability: "available" | "partial-data" | "unavailable";
  acceptedCount: number;
  supportMass: number;
  pressureMass: number;
  level: MajorFortuneOrdinalLevel | null;
}): MajorFortuneOrdinalPillarState {
  if (input.availability === "unavailable") return "unavailable";
  if (input.availability === "partial-data") return "partial-data";
  if (input.acceptedCount === 0) return "no-signal";
  if (input.level === 0) return "balanced-signal";
  return "classified";
}

export function classifyModuleScoreState(input: {
  status: "available" | "partial" | "unavailable";
  acceptedEvidenceCount: number;
  score: number | null;
  baseScore: number;
  anyClassifiedPillar: boolean;
  anyBalancedPillar: boolean;
}): MajorFortuneOrdinalScoreState {
  if (input.status === "unavailable" || input.score == null) return "unavailable";
  if (input.status === "partial") return "partial-data";
  if (input.acceptedEvidenceCount === 0) return "no-signal";
  if (!input.anyClassifiedPillar && input.anyBalancedPillar) return "balanced-signal";
  if (!input.anyClassifiedPillar && input.score === input.baseScore) return "balanced-signal";
  return "scored";
}
