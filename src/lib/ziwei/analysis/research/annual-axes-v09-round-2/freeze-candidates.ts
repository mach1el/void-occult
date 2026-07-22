/**
 * Candidate freeze records for Round-2.
 */

import { readFileSync } from "node:fs";
import type { AnnualAxesCandidateRound2 } from "./schema";
import { hashCandidateRound2, type CandidatePackRound2 } from "./load-candidates";
import { sha256Text, stableStringify } from "./stable-hash";

export interface CandidateFreezeRound2 {
  schemaVersion: "0.9.0-r2";
  freezeId: "annual-axes-v0.9-round-2-freeze";
  candidateHashes: Record<string, string>;
  registryHash: string;
  candidateOrder: string[];
}

export function buildFreezeRecord(pack: CandidatePackRound2): CandidateFreezeRound2 {
  const candidateHashes: Record<string, string> = {};
  const order = [...pack.candidates].map((c) => c.candidateId).sort();
  for (const id of order) {
    const candidate = pack.candidates.find((c) => c.candidateId === id)!;
    candidateHashes[id] = hashCandidateRound2(candidate);
  }
  const registryRaw = readFileSync(pack.registryPath, "utf8");
  return {
    schemaVersion: "0.9.0-r2",
    freezeId: "annual-axes-v0.9-round-2-freeze",
    candidateHashes,
    registryHash: sha256Text(registryRaw),
    candidateOrder: order,
  };
}

export function assertFreezeMatches(
  freeze: CandidateFreezeRound2,
  pack: CandidatePackRound2,
): string[] {
  const issues: string[] = [];
  const fresh = buildFreezeRecord(pack);
  if (fresh.registryHash !== freeze.registryHash) {
    issues.push("registry hash mismatch after freeze");
  }
  for (const id of freeze.candidateOrder) {
    if (fresh.candidateHashes[id] !== freeze.candidateHashes[id]) {
      issues.push(`candidate hash mismatch: ${id}`);
    }
  }
  if (stableStringify(fresh.candidateOrder) !== stableStringify(freeze.candidateOrder)) {
    issues.push("candidate order mismatch");
  }
  return issues;
}

export function mutateCandidateForTest(candidate: AnnualAxesCandidateRound2): AnnualAxesCandidateRound2 {
  return {
    ...candidate,
    description: `${candidate.description} [mutated]`,
  };
}
