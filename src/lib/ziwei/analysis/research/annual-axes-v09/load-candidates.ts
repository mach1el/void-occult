/**
 * Load V0.9 candidate registry from research pack.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { AnnualAxesCandidateV09 } from "./schema";
import { validateCandidates } from "./validate";

export const CANDIDATES_ROOT = join(process.cwd(), "research/annual-axes/v0.9-candidates");

export interface LoadedCandidatePack {
  candidates: AnnualAxesCandidateV09[];
  registryPath: string;
  issues: Array<{ code: string; message: string }>;
}

export function loadCandidatePack(root = CANDIDATES_ROOT): LoadedCandidatePack {
  const registryPath = join(root, "candidate-registry.v0.9.json");
  const issues: Array<{ code: string; message: string }> = [];
  if (!existsSync(registryPath)) {
    return {
      candidates: [],
      registryPath,
      issues: [{ code: "missing-registry", message: registryPath }],
    };
  }

  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    candidates: Array<{ candidateId: string; path: string }>;
  };
  const candidates: AnnualAxesCandidateV09[] = [];
  for (const entry of registry.candidates) {
    const path = join(root, entry.path);
    if (!existsSync(path)) {
      issues.push({ code: "missing-candidate-file", message: entry.path });
      continue;
    }
    const candidate = JSON.parse(readFileSync(path, "utf8")) as AnnualAxesCandidateV09;
    if (candidate.candidateId !== entry.candidateId) {
      issues.push({
        code: "candidate-id-mismatch",
        message: `${entry.path} id ${candidate.candidateId} !== registry ${entry.candidateId}`,
      });
    }
    candidates.push(candidate);
  }

  issues.push(...validateCandidates(candidates));

  const candidatesDir = join(root, "candidates");
  if (existsSync(candidatesDir)) {
    const registered = new Set(
      registry.candidates.map((c) => c.path.replace(/^candidates\//, "")),
    );
    for (const name of readdirSync(candidatesDir)) {
      if (!name.endsWith(".json")) continue;
      if (!registered.has(name)) {
        issues.push({
          code: "unregistered-candidate-file",
          message: `candidates/${name} is not listed in candidate-registry.v0.9.json`,
        });
      }
    }
  }

  return { candidates, registryPath, issues };
}
