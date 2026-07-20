/**
 * Claim resolution and the full provenance chain (§5):
 *   rule → claim → source → locator
 */

import { resolveSource } from "./resolve-source";
import type {
  HuyenKhiClaim,
  HuyenKhiOntology,
  HuyenKhiRule,
  HuyenKhiSource,
} from "./types";

export function resolveClaim(
  ontology: HuyenKhiOntology,
  claimId: string,
): HuyenKhiClaim | undefined {
  return ontology.claimRegistry.claims.find((c) => c.claimId === claimId);
}

export interface ClaimProvenance {
  readonly claim: HuyenKhiClaim;
  readonly sources: readonly HuyenKhiSource[];
  readonly missingSourceIds: readonly string[];
  readonly hasLocator: boolean;
  /** The locator names a source that resolves in the registry. */
  readonly locatorSourceResolved: boolean;
  /** The locator's source is also listed among the claim's cited sources. */
  readonly locatorSourceInClaimSources: boolean;
  /** A locator exists, its source resolves, and it is a cited source. */
  readonly locatorFullyResolved: boolean;
}

export function resolveClaimProvenance(
  ontology: HuyenKhiOntology,
  claimId: string,
): ClaimProvenance | undefined {
  const claim = resolveClaim(ontology, claimId);
  if (!claim) return undefined;
  const sources: HuyenKhiSource[] = [];
  const missing: string[] = [];
  for (const id of claim.sourceIds) {
    const source = resolveSource(ontology, id);
    if (source) sources.push(source);
    else missing.push(id);
  }
  const hasLocator =
    claim.locator !== undefined && Object.keys(claim.locator).length > 0;
  const locatorSourceResolved =
    hasLocator && resolveSource(ontology, claim.locator!.sourceId) !== undefined;
  const locatorSourceInClaimSources =
    hasLocator && claim.sourceIds.includes(claim.locator!.sourceId);
  return {
    claim,
    sources,
    missingSourceIds: missing,
    hasLocator,
    locatorSourceResolved,
    locatorSourceInClaimSources,
    locatorFullyResolved: hasLocator && locatorSourceResolved && locatorSourceInClaimSources,
  };
}

export interface RuleProvenance {
  readonly rule: HuyenKhiRule;
  readonly claims: readonly ClaimProvenance[];
  readonly directSources: readonly HuyenKhiSource[];
  readonly missingClaimIds: readonly string[];
  readonly missingSourceIds: readonly string[];
  /** True when rule → claim → source → locator fully resolves. */
  readonly fullyTraceable: boolean;
}

/**
 * Full provenance for a future EFFECTIVE rule. V0.1 loads no effective rules,
 * so this exercises the contract, not runtime doctrine.
 */
export function resolveRuleProvenance(
  ontology: HuyenKhiOntology,
  rule: HuyenKhiRule,
): RuleProvenance {
  const claims: ClaimProvenance[] = [];
  const missingClaimIds: string[] = [];
  for (const id of rule.claimIds ?? []) {
    const provenance = resolveClaimProvenance(ontology, id);
    if (provenance) claims.push(provenance);
    else missingClaimIds.push(id);
  }

  const directSources: HuyenKhiSource[] = [];
  const missingSourceIds: string[] = [];
  for (const id of rule.sourceIds) {
    const source = resolveSource(ontology, id);
    if (source) directSources.push(source);
    else missingSourceIds.push(id);
  }

  const hasResolvedSource =
    directSources.length > 0 ||
    claims.some((c) => c.sources.length > 0 && c.missingSourceIds.length === 0);

  // A4/§5: a fully-traceable doctrinal rule must reach a LOCATOR. Every claim it
  // cites must carry a locator whose named source both resolves AND is one of
  // the claim's cited sources — a source alone is not enough. A rule with no
  // claims cannot be fully traceable.
  const allClaimsLocated =
    claims.length > 0 &&
    claims.every((c) => c.locatorFullyResolved && c.missingSourceIds.length === 0);

  const fullyTraceable =
    missingClaimIds.length === 0 &&
    missingSourceIds.length === 0 &&
    hasResolvedSource &&
    allClaimsLocated;

  return {
    rule,
    claims,
    directSources,
    missingClaimIds,
    missingSourceIds,
    fullyTraceable,
  };
}
