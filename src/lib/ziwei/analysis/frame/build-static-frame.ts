import type { ChartData, ChartPalace } from "@/types/chart";
import { oppositePalaceIndex, trineBranches } from "./geometry";
import type {
  BuildStaticFrameOptions,
  StaticFrame,
  StaticFrameNode,
} from "./types";

function palaceAt(chart: ChartData, index: number): ChartPalace | undefined {
  return chart.palaces.find((p) => p.index === index);
}

function palaceByBranch(
  chart: ChartData,
  branch: string,
): ChartPalace | undefined {
  return chart.palaces.find((p) => p.branch === branch);
}

/**
 * Build TP4C static frame for one focus palace.
 * Geometry only — no scoring, VCD, or knowledge.
 */
export function buildStaticFrame(
  chart: ChartData,
  focusIndex: number,
  options: BuildStaticFrameOptions,
): StaticFrame {
  const { geometry } = options;
  const focus = palaceAt(chart, focusIndex);
  if (!focus) {
    return { focusIndex, nodes: [] };
  }

  const nodes: StaticFrameNode[] = [
    {
      palaceIndex: focus.index,
      palaceName: focus.name,
      palaceBranch: focus.branch,
      role: "focus",
      geometryWeight: geometry.focus,
    },
  ];

  const oppositeIndex = oppositePalaceIndex(focus.index);
  const opposite = palaceAt(chart, oppositeIndex);
  if (opposite) {
    nodes.push({
      palaceIndex: opposite.index,
      palaceName: opposite.name,
      palaceBranch: opposite.branch,
      role: "opposite",
      geometryWeight: geometry.opposite,
    });
  }

  for (const branch of trineBranches(focus.branch)) {
    const palace = palaceByBranch(chart, branch);
    if (!palace || palace.index === focus.index) continue;
    nodes.push({
      palaceIndex: palace.index,
      palaceName: palace.name,
      palaceBranch: palace.branch,
      role: "trine",
      geometryWeight: geometry.trine,
    });
  }

  return { focusIndex, nodes };
}
