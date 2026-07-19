import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";

export type AffinitySubjectKey =
  | { kind: "star"; canonicalStarName: string; familyId?: string }
  | { kind: "transformation"; transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ" }
  | { kind: "category"; category: "star" | "mutagen" };

export type AffinityResolutionSource = "exact-star" | "star-family" | "transformation";

/**
 * V0.4.1 — resolved domain affinity with provenance (§3). A subject with no
 * exact/star-family/transformation record is context-only: it returns
 * `null`, never a numeric category default. `null` is not the same as a
 * resolved `value: 0` — the caller can distinguish "no mapping" from "this
 * star is mapped and explicitly has zero relevance to this domain."
 */
export interface ResolvedDomainAffinity {
  value: number;
  source: AffinityResolutionSource;
  recordId: string;
  sourceIds: string[];
  knowledgeStatus: "approved" | "experimental";
}

/**
 * Resolve domain affinity per V0.4.1 precedence: exact star → star family →
 * exact transformation → null (context-only, no numeric evidence). There is
 * no universal category default — an unmapped subject never becomes
 * numerically eligible for a domain.
 */
export function resolveDomainAffinity(
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  domain: AnnualAxisDomain,
  subject: AffinitySubjectKey,
): ResolvedDomainAffinity | null {
  const records = knowledge.domainAffinity.records;

  if (subject.kind === "star") {
    const exact = records.find(
      (r) => r.subject.kind === "star" && r.subject.canonicalStarName === subject.canonicalStarName,
    );
    if (exact) {
      return {
        value: exact.affinities[domain],
        source: "exact-star",
        recordId: exact.id,
        sourceIds: exact.sourceIds,
        knowledgeStatus: exact.knowledgeStatus,
      };
    }

    if (subject.familyId) {
      const family = records.find(
        (r) => r.subject.kind === "star-family" && r.subject.familyId === subject.familyId,
      );
      if (family) {
        return {
          value: family.affinities[domain],
          source: "star-family",
          recordId: family.id,
          sourceIds: family.sourceIds,
          knowledgeStatus: family.knowledgeStatus,
        };
      }
    }

    // Unmapped star / star-family: fallbackPolicy.unmappedStar is
    // "context-only" — no numeric evidence, ever.
    return null;
  }

  if (subject.kind === "transformation") {
    const exact = records.find(
      (r) =>
        r.subject.kind === "transformation" && r.subject.transformation === subject.transformation,
    );
    if (exact) {
      return {
        value: exact.affinities[domain],
        source: "transformation",
        recordId: exact.id,
        sourceIds: exact.sourceIds,
        knowledgeStatus: exact.knowledgeStatus,
      };
    }
    // Should be unreachable — validate.ts requires 100% transformation
    // coverage — but fail closed (context-only) rather than default.
    return null;
  }

  // "category" subjects (bare star/mutagen with no identity) never resolve
  // under V0.4.1 — there is no category-level numeric policy anymore.
  return null;
}
