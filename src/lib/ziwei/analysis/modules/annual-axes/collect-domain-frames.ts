import type { ChartData, ChartPalace } from "@/types/chart";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../knowledge/annual-axes";
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
  /** The annual-palace label this anchor is defined against (never natal palace.name). */
  anchorPalaceName: string;
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
 * Resolve one domain's anchor frames. Anchors are matched against
 * `palace.annualPalaceName` — the already-resolved annual label — never
 * against natal `palace.name`. Missing annual structure produces a
 * diagnostic and that anchor is skipped (not silently substituted).
 *
 * Frame geometry per the mission spec: opposite = index+6 mod 12,
 * trines = index+4 and index+8 mod 12. Pure index arithmetic — equivalent
 * to the Palace Overview frame geometry helper given this codebase's fixed
 * branch↔index correspondence, but implemented literally per spec rather
 * than reusing the natal-facing helper (which takes a branch string).
 */
export function collectDomainAnchorFrames(
  chart: ChartData,
  domainDefinition: { domain: AnnualAxisDomain; anchors: Array<{ annualPalaceName: string; weight: number }> },
  diagnostics: AnnualAxesDiagnostics,
): AnnualDomainAnchorFrame[] {
  const frames: AnnualDomainAnchorFrame[] = [];

  for (const anchor of domainDefinition.anchors) {
    const anchorPalace = chart.palaces.find(
      (p) => p.annualPalaceName === anchor.annualPalaceName,
    );
    if (!anchorPalace) {
      diagnostics.missingAnnualPalaceNames.push(
        `${domainDefinition.domain}:${anchor.annualPalaceName}`,
      );
      continue;
    }

    const oppositeIndex = (anchorPalace.index + 6) % 12;
    const trineIndexA = (anchorPalace.index + 4) % 12;
    const trineIndexB = (anchorPalace.index + 8) % 12;

    const nodes: AnnualFrameNode[] = [toFrameNode(anchorPalace, "focus")];
    const opposite = chart.palaces.find((p) => p.index === oppositeIndex);
    if (opposite) nodes.push(toFrameNode(opposite, "opposite"));
    const trineA = chart.palaces.find((p) => p.index === trineIndexA);
    if (trineA) nodes.push(toFrameNode(trineA, "trine"));
    const trineB = chart.palaces.find((p) => p.index === trineIndexB);
    if (trineB) nodes.push(toFrameNode(trineB, "trine"));

    frames.push({
      anchorPalaceName: anchor.annualPalaceName,
      domainAnchorWeight: anchor.weight,
      nodes,
    });
  }

  return frames;
}

export function collectAllDomainFrames(
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
  diagnostics: AnnualAxesDiagnostics,
): Map<AnnualAxisDomain, AnnualDomainAnchorFrame[]> {
  const map = new Map<AnnualAxisDomain, AnnualDomainAnchorFrame[]>();
  for (const domainDefinition of axisDefinitions.domains) {
    map.set(
      domainDefinition.domain,
      collectDomainAnchorFrames(chart, domainDefinition, diagnostics),
    );
  }
  return map;
}
