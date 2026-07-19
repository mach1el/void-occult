import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";

export type OwnershipRole = "primary" | "secondary";

/**
 * V0.4.2 — resolved physical palace ownership for one domain (§1). `null`
 * means the exact physical palace does not own this domain: the core
 * strict-routing invariant is `physical ownership for domain = 0 ⇒
 * numeric contribution to domain = 0`, regardless of any star/Tứ Hóa
 * semantic affinity.
 */
export interface ResolvedOwnership {
  value: number;
  role: OwnershipRole;
  recordId: string;
  rationale: string;
  sourceIds: string[];
  knowledgeStatus: "approved" | "experimental";
}

/**
 * Resolve the exact physical palace's ownership of `domain`. The palace
 * name is the *sole* eligibility selector — star/transformation identity
 * plays no part here (that knowledge only shapes polarity elsewhere).
 */
export function resolveOwnership(
  knowledge042: AnnualAxesKnowledgeV042NamPhai,
  palaceName: string,
  domain: AnnualAxisDomain,
): ResolvedOwnership | null {
  const record = knowledge042.ownership.records.find((r) => r.palaceName === palaceName);
  if (!record) return null;
  const entry = record.numericDomains.find((d) => d.domain === domain);
  if (!entry) return null;
  return {
    value: entry.ownershipWeight,
    role: entry.role,
    recordId: `${record.palaceName}:${entry.domain}`,
    rationale: entry.rationale,
    sourceIds: entry.sourceIds,
    knowledgeStatus: entry.knowledgeStatus,
  };
}
