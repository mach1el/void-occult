/**
 * Round-2 candidate load + authorization validation.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnnualAxesCandidateRound2 } from "./schema";
import {
  AUTHORIZED_CLAIM_IDS,
  AUTHORIZED_POLICY_ID,
  AUTHORIZED_SHAPE_ID,
  AUTHORIZED_SOURCE_IDS,
  AUTHORIZED_STAR,
} from "./foundation-intake";
import { CONTROL_CANDIDATE_ID, CONTROL_ENGINE_VERSION, CONTROL_FORMULA_VERSION } from "./control-v08";
import { sha256Of } from "./stable-hash";

export const ROUND2_ROOT = join(process.cwd(), "research/annual-axes/v0.9-candidates-round-2");

const FORBIDDEN_STARS = new Set([
  "Lưu Đào Hoa",
  "Lưu Hồng Loan",
  "Lưu Hỷ Thần",
  "Lưu Kiếp Sát",
  "Lưu Long Đức",
  "Lưu Nguyệt Đức",
  "Lưu Phúc Đức",
  "Lưu Thiên Đức",
  "Lưu Thiên Hỷ",
  "Lưu Văn Khúc",
  "Lưu Văn Xương",
  "Lưu Đại Hao",
  "Lưu Tiểu Hao",
  "Lưu Phục Binh",
  "Lưu Tuần",
  "Lưu Triệt",
]);

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface CandidatePackRound2 {
  root: string;
  registryPath: string;
  candidates: AnnualAxesCandidateRound2[];
  issues: ValidationIssue[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function validateCandidatesRound2(
  candidates: AnnualAxesCandidateRound2[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const c of candidates) {
    if (ids.has(c.candidateId)) {
      issues.push({ code: "duplicate-candidate-id", message: c.candidateId });
    }
    ids.add(c.candidateId);

    if (c.candidateType === "control") {
      if (c.candidateId !== CONTROL_CANDIDATE_ID) {
        issues.push({ code: "control-id", message: `Control must be ${CONTROL_CANDIDATE_ID}` });
      }
      if (c.changeCategories.length > 0) {
        issues.push({ code: "control-with-modifications", message: c.candidateId });
      }
      if (c.engineVersion !== CONTROL_ENGINE_VERSION || c.formulaVersion !== CONTROL_FORMULA_VERSION) {
        issues.push({ code: "control-version-mismatch", message: c.candidateId });
      }
      continue;
    }

    if (!c.authorizedShapeIds.includes(AUTHORIZED_SHAPE_ID)) {
      issues.push({ code: "unauthorized-shape", message: c.candidateId });
    }
    if (!c.policyRecordIds.includes(AUTHORIZED_POLICY_ID)) {
      issues.push({ code: "unauthorized-policy", message: c.candidateId });
    }
    for (const claimId of AUTHORIZED_CLAIM_IDS) {
      if (!c.claimIds.includes(claimId)) {
        issues.push({ code: "missing-claim", message: `${c.candidateId}:${claimId}` });
      }
    }
    for (const sourceId of AUTHORIZED_SOURCE_IDS) {
      if (!c.sourceIds.includes(sourceId)) {
        issues.push({ code: "missing-source", message: `${c.candidateId}:${sourceId}` });
      }
    }
    if (c.includedStarNames.length !== 1 || c.includedStarNames[0] !== AUTHORIZED_STAR) {
      issues.push({ code: "unauthorized-star", message: `${c.candidateId} included=${c.includedStarNames.join(",")}` });
    }
    for (const star of c.includedStarNames) {
      if (FORBIDDEN_STARS.has(star)) {
        issues.push({ code: "forbidden-star", message: `${c.candidateId}:${star}` });
      }
    }
    for (const star of FORBIDDEN_STARS) {
      if (c.includedStarNames.includes(star)) {
        issues.push({ code: "forbidden-star", message: `${c.candidateId}:${star}` });
      }
    }
    for (const domain of c.domainBindings) {
      if (domain !== "career" && domain !== "social") {
        issues.push({ code: "unknown-domain", message: `${c.candidateId}:${domain}` });
      }
    }
    if (c.domainBindings.length === 0) {
      issues.push({ code: "empty-domain-bindings", message: c.candidateId });
    }
    if (c.polarityMode !== "positive-activation" && c.polarityMode !== "contextual-activation" && c.polarityMode !== "unsigned-activation") {
      issues.push({ code: "invalid-polarity-mode", message: c.candidateId });
    }
    if (c.pointMagnitude < 0) {
      issues.push({ code: "negative-fixed-polarity", message: c.candidateId });
    }
    const hasHypothesis = c.assumptions.some((a) => a.status === "engineering-hypothesis");
    if (!hasHypothesis) {
      issues.push({ code: "missing-engineering-hypothesis", message: c.candidateId });
    }
  }

  if (![...ids].includes(CONTROL_CANDIDATE_ID)) {
    issues.push({ code: "missing-control", message: CONTROL_CANDIDATE_ID });
  }

  return issues;
}

export function loadCandidatePackRound2(root = ROUND2_ROOT): CandidatePackRound2 {
  const registryPath = join(root, "candidate-registry.v0.9.json");
  const issues: ValidationIssue[] = [];
  if (!existsSync(registryPath)) {
    return { root, registryPath, candidates: [], issues: [{ code: "missing-registry", message: registryPath }] };
  }

  const registry = readJson<{ candidates: Array<{ candidateId: string; path: string }> }>(registryPath);
  const candidates: AnnualAxesCandidateRound2[] = [];
  for (const entry of registry.candidates) {
    const full = join(root, entry.path);
    if (!existsSync(full)) {
      issues.push({ code: "missing-candidate-file", message: full });
      continue;
    }
    const candidate = readJson<AnnualAxesCandidateRound2>(full);
    if (candidate.candidateId !== entry.candidateId) {
      issues.push({
        code: "registry-id-mismatch",
        message: `${entry.candidateId} vs ${candidate.candidateId}`,
      });
    }
    candidates.push(candidate);
  }

  const candidatesDir = join(root, "candidates");
  if (existsSync(candidatesDir)) {
    for (const file of readdirSync(candidatesDir).filter((f) => f.endsWith(".json")).sort()) {
      const loaded = readJson<AnnualAxesCandidateRound2>(join(candidatesDir, file));
      if (!candidates.some((c) => c.candidateId === loaded.candidateId)) {
        issues.push({ code: "unregistered-candidate-file", message: file });
      }
    }
  }

  issues.push(...validateCandidatesRound2(candidates));
  candidates.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  return { root, registryPath, candidates, issues };
}

export function hashCandidateRound2(candidate: AnnualAxesCandidateRound2): string {
  return sha256Of(candidate);
}
