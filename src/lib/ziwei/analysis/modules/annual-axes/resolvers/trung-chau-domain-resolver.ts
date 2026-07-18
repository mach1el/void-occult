import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxisDefinitionsCatalog } from "../../../knowledge/annual-axes";
import {
  emptyDomainResolverDiagnostics,
  type AnnualAxisDomainResolver,
  type ResolvedAnnualDomainAnchors,
  type ResolvedDomainAnchor,
} from "./types";

const PROVENANCE = "trung-chau-annual-palace-name";
const COORDINATE = "annual-palace-name" as const;

/** Trung Châu resolves each axis anchor by matching the axis-definition
 * label against `palace.annualPalaceName` — the annual "trùng bài" label
 * that Trung Châu's Calculation Core rotates onto every palace each year.
 * Never falls back to natal `palace.name`: on a chart that lacks annual
 * relabelling (e.g. a Nam Phái chart handed to the Trung Châu resolver by
 * mistake), the anchor simply fails to resolve and a diagnostic is logged.
 * V0.1 required exactly 12 unique annualPalaceName labels; that check is
 * preserved here so an incomplete annual structure surfaces as a hard
 * diagnostic rather than a silent partial. */
function resolveTrungChauAnnualAnchors(
  chart: ChartData,
  axisDefinitions: AnnualAxisDefinitionsCatalog,
): ResolvedAnnualDomainAnchors {
  const diagnostics = emptyDomainResolverDiagnostics();
  const anchorsByDomain = new Map<AnnualAxisDomain, ResolvedDomainAnchor[]>();

  const labels = chart.palaces
    .map((p) => p.annualPalaceName)
    .filter((v): v is string => typeof v === "string");
  const uniqueLabels = new Set(labels);
  if (labels.length !== 12 || uniqueLabels.size !== 12) {
    diagnostics.incompleteChartPalaces.push(
      `trung-chau:annualPalaceName-count=${labels.length}:unique=${uniqueLabels.size}`,
    );
  }

  for (const domainDefinition of axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const resolvedAnchors: ResolvedDomainAnchor[] = [];

    for (const anchor of domainDefinition.anchors) {
      const matches = chart.palaces.filter(
        (p) => p.annualPalaceName === anchor.annualPalaceName,
      );
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

export const trungChauDomainResolver: AnnualAxisDomainResolver = {
  coordinate: COORDINATE,
  provenance: PROVENANCE,
  resolve: resolveTrungChauAnnualAnchors,
};
