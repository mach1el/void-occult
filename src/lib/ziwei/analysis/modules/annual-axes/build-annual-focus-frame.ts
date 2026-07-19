import type { ChartData, ChartPalace } from "@/types/chart";
import type { AnnualAxisFrameRole } from "./types";
import type { AnnualFrameNode } from "./collect-domain-frames";
import type { ResolvedAnnualFocus } from "./resolvers/types";

export interface AnnualFocusFrame {
  focusPalaceIndex: number;
  focusPalaceName: string;
  focusAnnualPalaceName: string | null;
  focusBranch: string;
  nodes: AnnualFrameNode[];
  frameBranches: string[];
}

function toFrameNode(palace: ChartPalace, role: AnnualAxisFrameRole): AnnualFrameNode {
  return {
    palaceIndex: palace.index,
    palaceName: palace.name,
    palaceBranch: palace.branch,
    annualPalaceName: palace.annualPalaceName ?? null,
    role,
  };
}

/**
 * Build the TP4C frame for the annual focus palace (Tiểu Hạn for Nam
 * Phái, annual Mệnh for Trung Châu). Returns `null` if the focus itself
 * is missing OR its TP4C ring cannot be materialised (opposite + at least
 * one trine must be present — a well-formed 12-palace chart always
 * satisfies this, but we prefer `null` over a lopsided frame). Geometry
 * matches `collect-domain-frames`: opposite = i+6, trines = i+4 and i+8
 * (mod 12).
 */
export function buildAnnualFocusFrame(
  chart: ChartData,
  focus: ResolvedAnnualFocus | null,
): AnnualFocusFrame | null {
  if (!focus) return null;
  const focusPalace = chart.palaces.find((p) => p.index === focus.palaceIndex);
  if (!focusPalace) return null;

  const oppositeIndex = (focus.palaceIndex + 6) % 12;
  const trineIndexA = (focus.palaceIndex + 4) % 12;
  const trineIndexB = (focus.palaceIndex + 8) % 12;

  const opposite = chart.palaces.find((p) => p.index === oppositeIndex);
  const trineA = chart.palaces.find((p) => p.index === trineIndexA);
  const trineB = chart.palaces.find((p) => p.index === trineIndexB);

  if (!opposite || !trineA || !trineB) return null;

  const nodes: AnnualFrameNode[] = [
    toFrameNode(focusPalace, "focus"),
    toFrameNode(opposite, "opposite"),
    toFrameNode(trineA, "trine"),
    toFrameNode(trineB, "trine"),
  ];

  return {
    focusPalaceIndex: focus.palaceIndex,
    focusPalaceName: focus.palaceName,
    focusAnnualPalaceName: focus.annualPalaceName,
    focusBranch: focusPalace.branch,
    nodes,
    frameBranches: nodes.map((n) => n.palaceBranch),
  };
}
