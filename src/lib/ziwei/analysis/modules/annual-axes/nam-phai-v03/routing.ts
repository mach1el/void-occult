import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV03NamPhai,
  AnnualAxisHeadRole,
} from "../../../knowledge/annual-axes/v0.3";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type { AnnualAxesDiagnostics, AnnualDomainRouting } from "../types";

/** Role of a target palace within a TP4C frame anchored at `anchorIndex`.
 * The frame geometry is identical for both channels — head and every
 * local domain anchor share opposite = i+6, trines = i+4 and i+8. */
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

/** Map every physical palace index to the palace's natal name for O(1)
 * anchor→palace lookups. Nam Phái resolves anchors by natal `palace.name`.
 */
export function buildNamePalaceIndex(chart: ChartData): Map<string, number> {
  const map = new Map<string, number>();
  for (const palace of chart.palaces) {
    if (!palace.name) continue;
    if (!map.has(palace.name)) map.set(palace.name, palace.index);
  }
  return map;
}

/**
 * Compute per-domain routing and channel shares per the V0.3 head-
 * centric spec. `routing = sum(anchor.weight * headRoleWeight(anchor's
 * palace vs. head frame))`; `headShare = floor + range * routing`,
 * `localShare = 1 - headShare`.
 */
export function computeDomainRoutings(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV03NamPhai,
  headFrame: AnnualFocusFrame,
  diagnostics: AnnualAxesDiagnostics,
): Map<AnnualAxisDomain, AnnualDomainRouting> {
  const out = new Map<AnnualAxisDomain, AnnualDomainRouting>();
  const nameToIndex = buildNamePalaceIndex(chart);
  const headWeights = knowledge.routingProfile.headFrameRoleWeights;
  const { headShareFloor, headShareRange } = knowledge.routingProfile.channelBlend;
  const routingMin = knowledge.routingProfile.routing.min;
  const routingMax = knowledge.routingProfile.routing.max;

  for (const domainDefinition of knowledge.axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    let routing = 0;
    for (const anchor of domainDefinition.anchors) {
      const anchorIndex = nameToIndex.get(anchor.palaceName);
      if (anchorIndex === undefined) continue;
      const role = relationRole(headFrame.focusPalaceIndex, anchorIndex);
      routing += anchor.weight * headWeights[role];
    }

    if (routing < routingMin - 1e-9 || routing > routingMax + 1e-9) {
      diagnostics.routingOutOfRange.push(`${domain}:${routing.toFixed(6)}`);
    }
    const clamped = Math.min(routingMax, Math.max(routingMin, routing));
    const headShare = headShareFloor + headShareRange * clamped;
    const localShare = 1 - headShare;
    out.set(domain, { routing: clamped, headShare, localShare });
  }

  return out;
}
