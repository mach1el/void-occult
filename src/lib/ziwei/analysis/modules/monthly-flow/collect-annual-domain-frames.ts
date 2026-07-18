import type { ChartData, ChartPalace } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../knowledge/annual-axes";
import type { MonthlyFlowDomainDefinitionsCatalog } from "../../knowledge/monthly-flow";
import { pickAnnualDomainFocusIndex, type AnnualDomainMap } from "./resolve-annual-domain-map";
import type { MonthlyFlowFrameRole, MonthlyFlowYearDiagnostics } from "./types";

export interface AnnualDomainFrameNode {
  palaceIndex: number;
  natalPalaceName: string;
  annualPalaceName: string | null;
  role: Exclude<MonthlyFlowFrameRole, "outside">;
}

export interface AnnualDomainFrame {
  domain: AnnualAxisDomain;
  focusPalaceIndex: number;
  nodes: AnnualDomainFrameNode[];
  indexSet: ReadonlySet<number>;
  roleByIndex: ReadonlyMap<number, Exclude<MonthlyFlowFrameRole, "outside">>;
}

function toFrameNode(
  palace: ChartPalace,
  role: AnnualDomainFrameNode["role"],
): AnnualDomainFrameNode {
  return {
    palaceIndex: palace.index,
    natalPalaceName: palace.name,
    annualPalaceName: palace.annualPalaceName ?? null,
    role,
  };
}

/**
 * Build one TP4C for a given annual domain. Focus palace is chosen by
 * `pickAnnualDomainFocusIndex` (top-anchor of that domain among the
 * palaces mapped to it), and opposite/trines are pure index arithmetic
 * off the monthly knowledge's `annualDomainFrame` offsets. Returns null
 * when any of the four physical palaces is missing — the caller must not
 * fabricate a partial frame.
 */
export function buildAnnualDomainFrame(
  domain: AnnualAxisDomain,
  map: AnnualDomainMap,
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
  monthlyGeometry: MonthlyFlowDomainDefinitionsCatalog["annualDomainFrame"],
): AnnualDomainFrame | null {
  const focusIndex = pickAnnualDomainFocusIndex(domain, map, chart, axisDefinitions.domains);
  if (focusIndex === null) return null;

  const { oppositeOffset, trineOffsets, modulo } = monthlyGeometry;
  const spec: Array<{ index: number; role: AnnualDomainFrameNode["role"] }> = [
    { index: focusIndex % modulo, role: "focus" },
    { index: (focusIndex + oppositeOffset) % modulo, role: "opposite" },
    ...trineOffsets.map((offset) => ({
      index: (focusIndex + offset) % modulo,
      role: "trine" as const,
    })),
  ];

  const nodes: AnnualDomainFrameNode[] = [];
  for (const { index, role } of spec) {
    const palace = chart.palaces.find((p) => p.index === index);
    if (!palace) return null;
    nodes.push(toFrameNode(palace, role));
  }

  const roleByIndex = new Map<number, AnnualDomainFrameNode["role"]>();
  for (const node of nodes) roleByIndex.set(node.palaceIndex, node.role);

  return {
    domain,
    focusPalaceIndex: focusIndex,
    nodes,
    indexSet: new Set(nodes.map((n) => n.palaceIndex)),
    roleByIndex,
  };
}

export function buildAllAnnualDomainFrames(
  map: AnnualDomainMap,
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
  monthlyGeometry: MonthlyFlowDomainDefinitionsCatalog["annualDomainFrame"],
  diagnostics: MonthlyFlowYearDiagnostics,
): Map<AnnualAxisDomain, AnnualDomainFrame> {
  const out = new Map<AnnualAxisDomain, AnnualDomainFrame>();
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const frame = buildAnnualDomainFrame(domain, map, chart, axisDefinitions, monthlyGeometry);
    if (!frame) {
      diagnostics.missingMonthlyFrameNodes.push(`annual-domain:${domain}`);
      continue;
    }
    out.set(domain, frame);
  }
  return out;
}
