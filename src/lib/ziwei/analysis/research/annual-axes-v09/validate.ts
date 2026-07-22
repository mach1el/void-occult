/**
 * Validate V0.9 candidate definitions against foundation registries.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FOUNDATION_ROOT } from "./foundation-intake";
import type { AnnualAxesCandidateV09 } from "./schema";

export interface CandidateValidationIssue {
  code: string;
  message: string;
}

export function hashCandidate(candidate: AnnualAxesCandidateV09): string {
  return createHash("sha256")
    .update(JSON.stringify(candidate, Object.keys(candidate).sort()))
    .digest("hex");
}

export function validateCandidates(
  candidates: AnnualAxesCandidateV09[],
  foundationRoot = FOUNDATION_ROOT,
): CandidateValidationIssue[] {
  const issues: CandidateValidationIssue[] = [];
  const sourceRegistry = JSON.parse(
    readFileSync(join(foundationRoot, "sources/source-registry.v0.9.json"), "utf8"),
  );
  const claimRegistry = JSON.parse(
    readFileSync(join(foundationRoot, "sources/claim-registry.v0.9.json"), "utf8"),
  );
  const sourceIds = new Set(sourceRegistry.sources.map((s: { sourceId: string }) => s.sourceId));
  const claims = new Map<string, { claimId: string; status: string }>(
    claimRegistry.claims.map((c: { claimId: string; status: string }) => [c.claimId, c]),
  );

  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.candidateId)) {
      issues.push({ code: "duplicate-candidate-id", message: c.candidateId });
    }
    seen.add(c.candidateId);

    for (const sourceId of c.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        issues.push({
          code: "missing-source",
          message: `${c.candidateId} references unknown source ${sourceId}`,
        });
      }
    }
    for (const claimId of c.claimIds) {
      const claim = claims.get(claimId);
      if (!claim) {
        issues.push({
          code: "missing-claim",
          message: `${c.candidateId} references unknown claim ${claimId}`,
        });
        continue;
      }
      if (claim.status === "unsupported" && c.candidateType === "experimental") {
        issues.push({
          code: "unsupported-policy",
          message: `${c.candidateId} references unsupported claim ${claimId}`,
        });
      }
      if (
        claim.status === "disputed" &&
        !c.assumptions.some((a) => a.status === "disputed")
      ) {
        issues.push({
          code: "disputed-without-rationale",
          message: `${c.candidateId} uses disputed claim ${claimId} without disputed assumption`,
        });
      }
    }

    if (c.candidateType === "control") {
      if (c.changeCategories.length > 0) {
        issues.push({
          code: "control-with-modifications",
          message: `${c.candidateId} control cannot declare changeCategories`,
        });
      }
      if (c.candidateId !== "CONTROL-V08") {
        issues.push({
          code: "invalid-control-id",
          message: `control candidateId must be CONTROL-V08, got ${c.candidateId}`,
        });
      }
    }
  }

  return issues;
}
