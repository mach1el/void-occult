import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../../knowledge/annual-axes";
import {
  emptyDomainResolverDiagnostics,
  type AnnualAxisDomainResolver,
  type ResolvedAnnualDomainAnchors,
  type ResolvedDomainAnchor,
} from "./types";

const PROVENANCE = "nam-phai-natal-domain-anchor";
const COORDINATE = "natal-palace-name" as const;

/** Nam Phái resolves each axis anchor by matching the axis-definition
 * label against `palace.name` — the natal palace name (Mệnh / Phụ Mẫu /
 * Tài Bạch / …). Nam Phái's Calculation Core never populates
 * `annualPalaceName`, so any code path that reached for it would silently
 * fail; matching natal names is both the intended semantics for the
 * school and the only field that is actually populated on a Nam Phái
 * chart. The resolver rejects duplicates and ambiguity as diagnostics
 * (a well-formed Nam Phái chart has 12 uniquely-named palaces). */
function resolveNamPhaiAnnualAnchors(
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
): ResolvedAnnualDomainAnchors {
  const diagnostics = emptyDomainResolverDiagnostics();
  const anchorsByDomain = new Map<AnnualAxisDomain, ResolvedDomainAnchor[]>();

  if (chart.palaces.length !== 12) {
    diagnostics.incompleteChartPalaces.push(`nam-phai:palace-count=${chart.palaces.length}`);
  }

  const nameCounts = new Map<string, number>();
  for (const palace of chart.palaces) {
    if (typeof palace.name !== "string" || palace.name.length === 0) continue;
    nameCounts.set(palace.name, (nameCounts.get(palace.name) ?? 0) + 1);
  }
  for (const [name, count] of nameCounts) {
    if (count > 1) {
      diagnostics.duplicateNatalPalaceNames.push(`${name}:${count}`);
    }
  }

  for (const domainDefinition of axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const resolvedAnchors: ResolvedDomainAnchor[] = [];

    for (const anchor of domainDefinition.anchors) {
      const matches = chart.palaces.filter((p) => p.name === anchor.annualPalaceName);
      if (matches.length === 0) {
        diagnostics.missingDomainAnchor.push(`${domain}:${anchor.annualPalaceName}`);
        continue;
      }
      if (matches.length > 1) {
        diagnostics.ambiguousDomainAnchor.push(
          `${domain}:${anchor.annualPalaceName}:${matches.length}`,
        );
        continue;
      }
      const match = matches[0]!;
      resolvedAnchors.push({
        annualPalaceName: anchor.annualPalaceName,
        palaceIndex: match.index,
        weight: anchor.weight,
        provenance: PROVENANCE,
      });
    }

    if (resolvedAnchors.length > 0) {
      anchorsByDomain.set(domain, resolvedAnchors);
    }
  }

  return {
    coordinate: COORDINATE,
    provenance: PROVENANCE,
    anchorsByDomain,
    diagnostics,
  };
}

export const namPhaiDomainResolver: AnnualAxisDomainResolver = {
  coordinate: COORDINATE,
  provenance: PROVENANCE,
  resolve: resolveNamPhaiAnnualAnchors,
};
