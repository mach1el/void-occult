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
 * Build one TP4C for a given annual domain.
 * When `explicitFocusPalaceIndex` is provided, use it (production path).
 * Otherwise fall back to `pickAnnualDomainFocusIndex` (legacy / unit tests).
 */
export function buildAnnualDomainFrame(
  domain: AnnualAxisDomain,
  map: AnnualDomainMap,
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
  monthlyGeometry: MonthlyFlowDomainDefinitionsCatalog["annualDomainFrame"],
  options?: {
    explicitFocusPalaceIndex?: number;
    diagnostics?: MonthlyFlowYearDiagnostics;
  },
): AnnualDomainFrame | null {
  const focusIndex =
    options?.explicitFocusPalaceIndex !== undefined
      ? options.explicitFocusPalaceIndex
      : pickAnnualDomainFocusIndex(
          domain,
          map,
          chart,
          axisDefinitions.domains,
          options?.diagnostics,
        );
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
  focusPalaceIndexByDomain?: ReadonlyMap<AnnualAxisDomain, number> | null,
): Map<AnnualAxisDomain, AnnualDomainFrame> {
  const out = new Map<AnnualAxisDomain, AnnualDomainFrame>();
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const explicitFocus = focusPalaceIndexByDomain?.get(domain);
    if (focusPalaceIndexByDomain && explicitFocus === undefined) {
      diagnostics.missingFocusAnchor.push(`domain:${domain}`);
      continue;
    }
    const frame = buildAnnualDomainFrame(
      domain,
      map,
      chart,
      axisDefinitions,
      monthlyGeometry,
      {
        explicitFocusPalaceIndex: explicitFocus,
        diagnostics: focusPalaceIndexByDomain ? undefined : diagnostics,
      },
    );
    if (!frame) {
      diagnostics.missingMonthlyFrameNodes.push(`annual-domain:${domain}`);
      continue;
    }
    if (
      focusPalaceIndexByDomain &&
      map.get(frame.focusPalaceIndex) !== domain
    ) {
      diagnostics.focusAnchorDomainMismatch.push(
        `domain:${domain}:palaceIndex:${frame.focusPalaceIndex}`,
      );
      continue;
    }
    out.set(domain, frame);
  }
  return out;
}
