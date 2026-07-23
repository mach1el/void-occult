import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import { ANNUAL_AXIS_DOMAINS } from "../../contracts/annual-axes";
import type {
  AnnualAxisDefinitionsCatalog,
  AnnualDomainDefinition,
} from "../../knowledge/annual-axes/schema";
import type { MonthlyFlowYearDiagnostics } from "./types";

/**
 * The palace-index → annual-domain map used by monthly scoring. Every one
 * of the twelve palace indices carries exactly one primary annual domain
 * — used both to build per-domain frames (TP4C from the top anchor) and to
 * annotate a palace's `annualDomainRole` inside cross-frame evidence.
 */
export type AnnualDomainMap = ReadonlyMap<number, AnnualAxisDomain>;

interface ResolveAnnualDomainMapInput {
  chart: ChartData;
  axisDefinitions: AnnualAxisDefinitionsCatalog;
  explicitAnnualDomainMap?: ReadonlyMap<number, AnnualAxisDomain>;
  diagnostics: MonthlyFlowYearDiagnostics;
}

/** Look up the primary domain for a palace's `annualPalaceName` — the
 * anchor definition with the strictly highest weight; if two definitions
 * tie for top weight the tie is broken by domain id (stable ordering so
 * identical inputs never flip between runs). */
function pickPrimaryDomainForAnnualName(
  annualPalaceName: string,
  domains: readonly AnnualDomainDefinition[],
): AnnualAxisDomain | null {
  let best: { domain: AnnualAxisDomain; weight: number } | null = null;

  for (const domainDef of domains) {
    const anchor = domainDef.anchors.find((a) => a.annualPalaceName === annualPalaceName);
    if (!anchor) continue;
    if (
      best === null ||
      anchor.weight > best.weight ||
      (anchor.weight === best.weight && domainDef.domain < best.domain)
    ) {
      best = { domain: domainDef.domain, weight: anchor.weight };
    }
  }

  return best?.domain ?? null;
}

function validateComplete(
  map: ReadonlyMap<number, AnnualAxisDomain>,
  diagnostics: MonthlyFlowYearDiagnostics,
): ReadonlyMap<number, AnnualAxisDomain> | null {
  const missing: number[] = [];
  for (let i = 0; i < 12; i++) {
    if (!map.has(i)) missing.push(i);
  }
  if (missing.length > 0) {
    diagnostics.incompleteAnnualDomainLabels.push(
      ...missing.map((i) => `palaceIndex:${i}`),
    );
    return null;
  }
  const perDomain = new Map<AnnualAxisDomain, number[]>();
  for (const [palaceIndex, domain] of map) {
    const list = perDomain.get(domain) ?? [];
    list.push(palaceIndex);
    perDomain.set(domain, list);
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!perDomain.has(domain)) {
      diagnostics.incompleteAnnualDomainLabels.push(`domain:${domain}`);
    }
  }
  return diagnostics.incompleteAnnualDomainLabels.length > 0 ? null : map;
}

/**
 * Build the palace-index → annual-domain map. Two acceptable sources:
 *  1. `explicitAnnualDomainMap` — production callers should supply the map
 *     from `resolveMonthlyFlowAnnualDomains` (approved Annual Axes school
 *     resolver + primary-domain derivation). Ad-hoc maps are for tests only.
 *  2. The chart itself when every one of the twelve palaces carries a
 *     unique `annualPalaceName` (Trung Châu). Never falls back to natal
 *     `palace.name`.
 *
 * On missing/duplicate/ambiguous labels the function returns null and
 * records diagnostics — every axis then goes unavailable rather than a
 * fabricated partial map.
 */
export function resolveAnnualDomainMap(
  input: ResolveAnnualDomainMapInput,
): AnnualDomainMap | null {
  const { chart, axisDefinitions, explicitAnnualDomainMap, diagnostics } = input;

  if (explicitAnnualDomainMap) {
    return validateComplete(explicitAnnualDomainMap, diagnostics);
  }

  const seenNames = new Set<string>();
  const duplicated = new Set<string>();
  for (const palace of chart.palaces) {
    const name = palace.annualPalaceName;
    if (!name) continue;
    if (seenNames.has(name)) duplicated.add(name);
    seenNames.add(name);
  }
  if (duplicated.size > 0) {
    for (const name of duplicated) {
      diagnostics.duplicateAnnualDomainLabels.push(`annualPalaceName:${name}`);
    }
    return null;
  }

  const missingCount = chart.palaces.filter((p) => !p.annualPalaceName).length;
  if (missingCount > 0 || chart.palaces.length !== 12) {
    diagnostics.incompleteAnnualDomainLabels.push(
      `chart:annualPalaceName:missing=${missingCount}`,
    );
    return null;
  }

  const map = new Map<number, AnnualAxisDomain>();
  for (const palace of chart.palaces) {
    const name = palace.annualPalaceName as string;
    const domain = pickPrimaryDomainForAnnualName(name, axisDefinitions.domains);
    if (!domain) {
      diagnostics.incompleteAnnualDomainLabels.push(`annualPalaceName:${name}:no-anchor`);
      continue;
    }
    map.set(palace.index, domain);
  }

  return validateComplete(map, diagnostics);
}

/**
 * Pick the "focus" palace for one annual domain — the palace whose
 * `annualPalaceName` corresponds to the top-weight anchor of that domain.
 * Deterministic: on multiple palaces mapped to the same domain (which
 * happens when several anchors of that domain exist), the top-anchor's
 * palace wins; further ties break by palace index.
 */
export function pickAnnualDomainFocusIndex(
  domainId: AnnualAxisDomain,
  map: AnnualDomainMap,
  chart: ChartData,
  domains: readonly AnnualDomainDefinition[],
  diagnostics?: MonthlyFlowYearDiagnostics,
): number | null {
  const domainDef = domains.find((d) => d.domain === domainId);
  if (!domainDef) return null;

  const rankedAnchors = [...domainDef.anchors].sort((a, b) => b.weight - a.weight);
  for (const anchor of rankedAnchors) {
    const palace = chart.palaces.find(
      (p) => p.annualPalaceName === anchor.annualPalaceName && map.get(p.index) === domainId,
    );
    if (palace) return palace.index;
  }

  const fallback = [...map.entries()]
    .filter(([, d]) => d === domainId)
    .sort((a, b) => a[0] - b[0])[0];
  if (fallback) {
    diagnostics?.productionFocusFallbackUsed.push(
      `domain:${domainId}:palaceIndex:${fallback[0]}`,
    );
    return fallback[0];
  }
  return null;
}
