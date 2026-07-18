import type { ChartData, ChartPalace } from "@/types/chart";
import type { MonthlyFlowDomainDefinitionsCatalog } from "../../knowledge/monthly-flow";
import type { MonthlyFlowFrameRole } from "./types";

export interface MonthlyFrameNode {
  palaceIndex: number;
  natalPalaceName: string;
  palaceBranch: string;
  annualPalaceName: string | null;
  role: Exclude<MonthlyFlowFrameRole, "outside">;
}

export interface MonthlyFrame {
  monthKey: string;
  focusPalaceIndex: number;
  nodes: MonthlyFrameNode[];
  /** Set of palace indices belonging to the monthly TP4C (focus/opposite/
   * both trines). Used for O(1) `hasIndex` checks in evidence collection
   * without repeated linear scans of `nodes`. */
  indexSet: ReadonlySet<number>;
}

function toFrameNode(
  palace: ChartPalace,
  role: MonthlyFrameNode["role"],
): MonthlyFrameNode {
  return {
    palaceIndex: palace.index,
    natalPalaceName: palace.name,
    palaceBranch: palace.branch,
    annualPalaceName: palace.annualPalaceName ?? null,
    role,
  };
}

export interface CollectMonthlyFrameInput {
  chart: ChartData;
  focusPalaceIndex: number;
  monthKey: string;
  geometry: MonthlyFlowDomainDefinitionsCatalog["monthlyActivationFrame"];
  onMissingNode?: (missingKey: string) => void;
}

/**
 * Monthly TP4C anchored at the resolved focus palace. Wraparound is
 * literal index arithmetic (per the knowledge file's offsets) so wraps
 * from index 11→3, 0→8 etc. are exact. Returns null when the chart
 * doesn't hold all four physical palaces — every callsite must treat
 * the missing frame as `missing-monthly-frame-nodes`, never fabricate
 * partial geometry.
 */
export function collectMonthlyFrame(input: CollectMonthlyFrameInput): MonthlyFrame | null {
  const { chart, focusPalaceIndex, monthKey, geometry, onMissingNode } = input;
  const { oppositeOffset, trineOffsets, modulo } = geometry;

  const indices: Array<{ index: number; role: MonthlyFrameNode["role"] }> = [
    { index: focusPalaceIndex % modulo, role: "focus" },
    { index: (focusPalaceIndex + oppositeOffset) % modulo, role: "opposite" },
    ...trineOffsets.map((offset) => ({
      index: (focusPalaceIndex + offset) % modulo,
      role: "trine" as const,
    })),
  ];

  const nodes: MonthlyFrameNode[] = [];
  for (const { index, role } of indices) {
    const palace = chart.palaces.find((p) => p.index === index);
    if (!palace) {
      onMissingNode?.(`${monthKey}:${role}:${index}`);
      continue;
    }
    nodes.push(toFrameNode(palace, role));
  }

  const focusCount = nodes.filter((n) => n.role === "focus").length;
  const oppositeCount = nodes.filter((n) => n.role === "opposite").length;
  const trineCount = nodes.filter((n) => n.role === "trine").length;
  if (focusCount !== 1 || oppositeCount !== 1 || trineCount !== 2) {
    if (focusCount === 0) onMissingNode?.(`${monthKey}:focus:absent`);
    if (oppositeCount === 0) onMissingNode?.(`${monthKey}:opposite:absent`);
    if (trineCount < 2) onMissingNode?.(`${monthKey}:trine:count=${trineCount}`);
    return null;
  }

  return {
    monthKey,
    focusPalaceIndex,
    nodes,
    indexSet: new Set(nodes.map((n) => n.palaceIndex)),
  };
}
