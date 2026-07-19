import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV04NamPhai,
  AnnualAxisHeadRole,
} from "../../../knowledge/annual-axes/v0.4";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type { AnnualAxesDiagnostics, AnnualDomainRouting } from "../types";

/** Role of a target palace within a TP4C frame anchored at `anchorIndex`. */
export function relationRole(
  anchorIndex: number,
  targetIndex: number,
): AnnualAxisHeadRole {
  if (targetIndex === anchorIndex) return "focus";
  if (targetIndex === (anchorIndex + 6) % 12) return "opposite";
  if (
    targetIndex === (anchorIndex + 4) % 12 ||
    targetIndex === (anchorIndex + 8) % 12
  ) {
    return "trine";
  }
  return "outside";
}

export function buildNamePalaceIndex(chart: ChartData): Map<string, number> {
  const map = new Map<string, number>();
  for (const palace of chart.palaces) {
    if (!palace.name) continue;
    if (!map.has(palace.name)) map.set(palace.name, palace.index);
  }
  return map;
}

export interface DomainRoutingV04 extends AnnualDomainRouting {
  routedStrength: number;
}

/**
 * V0.4 routing — no positive floor. `routedStrength = routing^exponent`.
 * When routing is 0, routed-head delta is exactly 0.
 */
export function computeDomainRoutingsV04(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  headFrame: AnnualFocusFrame,
  diagnostics: AnnualAxesDiagnostics,
): Map<AnnualAxisDomain, DomainRoutingV04> {
  const out = new Map<AnnualAxisDomain, DomainRoutingV04>();
  const nameToIndex = buildNamePalaceIndex(chart);
  const headWeights = knowledge.channelProfile.routing.headFrameRoleWeights;
  const { min, max, exponent, floor } = knowledge.channelProfile.routing;

  for (const domainDefinition of knowledge.axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    let routing = 0;
    for (const anchor of domainDefinition.anchors) {
      const anchorIndex = nameToIndex.get(anchor.palaceName);
      if (anchorIndex === undefined) continue;
      const role = relationRole(headFrame.focusPalaceIndex, anchorIndex);
      routing += anchor.weight * headWeights[role];
    }

    if (routing < min - 1e-9 || routing > max + 1e-9) {
      diagnostics.routingOutOfRange.push(`${domain}:${routing.toFixed(6)}`);
    }
    const clamped = Math.min(max, Math.max(min, routing));
    // V0.4: no head-share floor. headShare/localShare kept for UI
    // compatibility with the shared AnnualDomainRouting shape; headShare
    // mirrors routedStrength so callers do not invent a blend floor.
    const routedStrength = Math.pow(Math.max(floor, clamped), exponent);
    out.set(domain, {
      routing: clamped,
      headShare: routedStrength,
      localShare: 1 - routedStrength,
      routedStrength,
    });
  }

  return out;
}

/** Physical palace indexes covered by a domain's multi-anchor TP4C union. */
export function domainFrameCoverage(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  domain: AnnualAxisDomain,
): { uniquePhysicalPalaceCount: number; physicalPalaceIndexes: number[] } {
  const nameToIndex = buildNamePalaceIndex(chart);
  const domainDefinition = knowledge.axisDefinitions.domains.find((d) => d.domain === domain);
  const indexes = new Set<number>();
  if (!domainDefinition) {
    return { uniquePhysicalPalaceCount: 0, physicalPalaceIndexes: [] };
  }
  for (const anchor of domainDefinition.anchors) {
    const anchorIndex = nameToIndex.get(anchor.palaceName);
    if (anchorIndex === undefined) continue;
    indexes.add(anchorIndex);
    indexes.add((anchorIndex + 6) % 12);
    indexes.add((anchorIndex + 4) % 12);
    indexes.add((anchorIndex + 8) % 12);
  }
  const physicalPalaceIndexes = [...indexes].sort((a, b) => a - b);
  return {
    uniquePhysicalPalaceCount: physicalPalaceIndexes.length,
    physicalPalaceIndexes,
  };
}
