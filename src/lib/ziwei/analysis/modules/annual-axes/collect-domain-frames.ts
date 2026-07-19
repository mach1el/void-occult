import type { ChartData, ChartPalace } from "@/types/chart";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../knowledge/annual-axes";
import type { ResolvedDomainAnchor } from "./resolvers/types";
import type { AnnualAxesDiagnostics, AnnualAxisFrameRole } from "./types";

export interface AnnualFrameNode {
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  /** This node's own resolved annual label — distinct from the frame's
   * `anchorPalaceName` for opposite/trine roles. Null only if the physical
   * palace genuinely has no annual label (never backfilled from
   * `palaceName`). */
  annualPalaceName: string | null;
  role: AnnualAxisFrameRole;
}

export interface AnnualDomainAnchorFrame {
  /** The axis-definition label this anchor is defined against. For Nam
   * Phái this equals the anchor palace's natal `palace.name`; for Trung
   * Châu it equals the anchor palace's `annualPalaceName`. Never a
   * different-school fallback. */
  anchorPalaceName: string;
  /** Which resolver produced this anchor — `nam-phai-natal-domain-anchor`
   * or `trung-chau-annual-palace-name`. */
  anchorProvenance: string;
  domainAnchorWeight: number;
  nodes: AnnualFrameNode[];
}

function toFrameNode(
  palace: ChartPalace,
  role: AnnualAxisFrameRole,
): AnnualFrameNode {
  return {
    palaceIndex: palace.index,
    palaceName: palace.name,
    palaceBranch: palace.branch,
    annualPalaceName: palace.annualPalaceName ?? null,
    role,
  };
}

/**
 * Build TP4C frames for one domain from *pre-resolved* anchors (produced
 * by a school-specific `AnnualAxisDomainResolver`). Frame geometry
 * (opposite = index+6 mod 12, trines = index+4, index+8 mod 12) is
 * identical for both schools — the only school-specific step is anchor
 * resolution, which happens upstream.
 *
 * Missing physical palaces at any TP4C offset raise a diagnostic and skip
 * that node; the anchor itself always exists (the resolver guarantees a
 * concrete `palaceIndex`).
 */
export function collectDomainAnchorFrames(
  chart: ChartData,
  domain: AnnualAxisDomain,
  resolvedAnchors: ResolvedDomainAnchor[],
  diagnostics: AnnualAxesDiagnostics,
): AnnualDomainAnchorFrame[] {
  const frames: AnnualDomainAnchorFrame[] = [];

  for (const anchor of resolvedAnchors) {
    const anchorPalace = chart.palaces.find((p) => p.index === anchor.palaceIndex);
    if (!anchorPalace) {
      diagnostics.missingAnnualPalaceNames.push(
        `${domain}:${anchor.annualPalaceName}:missing-index-${anchor.palaceIndex}`,
      );
      continue;
    }

    const oppositeIndex = (anchor.palaceIndex + 6) % 12;
    const trineIndexA = (anchor.palaceIndex + 4) % 12;
    const trineIndexB = (anchor.palaceIndex + 8) % 12;

    const nodes: AnnualFrameNode[] = [toFrameNode(anchorPalace, "focus")];
    const opposite = chart.palaces.find((p) => p.index === oppositeIndex);
    if (opposite) nodes.push(toFrameNode(opposite, "opposite"));
    const trineA = chart.palaces.find((p) => p.index === trineIndexA);
    if (trineA) nodes.push(toFrameNode(trineA, "trine"));
    const trineB = chart.palaces.find((p) => p.index === trineIndexB);
    if (trineB) nodes.push(toFrameNode(trineB, "trine"));

    frames.push({
      anchorPalaceName: anchor.annualPalaceName,
      anchorProvenance: anchor.provenance,
      domainAnchorWeight: anchor.weight,
      nodes,
    });
  }

  return frames;
}

export function collectAllDomainFrames(
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
  anchorsByDomain: Map<AnnualAxisDomain, ResolvedDomainAnchor[]>,
  diagnostics: AnnualAxesDiagnostics,
): Map<AnnualAxisDomain, AnnualDomainAnchorFrame[]> {
  const map = new Map<AnnualAxisDomain, AnnualDomainAnchorFrame[]>();
  for (const domainDefinition of axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const resolved = anchorsByDomain.get(domain) ?? [];
    map.set(domain, collectDomainAnchorFrames(chart, domain, resolved, diagnostics));
  }
  return map;
}
