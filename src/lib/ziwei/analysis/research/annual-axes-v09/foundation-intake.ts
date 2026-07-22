/**
 * Foundation intake for Annual Axes V0.9 candidate evaluation.
 * Fail-closed unless readiness is READY_FOR_V0_9_CANDIDATE.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const FOUNDATION_ROOT = join(process.cwd(), "research/annual-axes/v0.9-foundation");

export type FoundationReadinessState =
  | "READY_FOR_V0_9_CANDIDATE"
  | "RESEARCH_INCOMPLETE"
  | "V0_8_SHOULD_REMAIN_UNCHANGED"
  | "CALCULATION_CORE_BLOCKED"
  | "FOUNDATION_INVALID";

export interface FoundationIntakeResult {
  ok: boolean;
  readiness: FoundationReadinessState;
  missingFiles: string[];
  issues: string[];
  permitsCandidateEvaluation: boolean;
}

const REQUIRED_RELATIVE_PATHS = [
  "V0.9-FOUNDATION-DECISION.md",
  "audit/full-distribution-report.v0.8.json",
  "audit/gate-evaluation.v0.8.json",
  "audit/rule-coverage.v0.8.json",
  "audit/capability-coverage.v0.8.json",
  "audit/no-signal-analysis.v0.8.json",
  "audit/contribution-mass.v0.8.json",
  "sources/source-registry.v0.9.json",
  "sources/claim-registry.v0.9.json",
  "sources/contradiction-log.md",
  "policy/school-policy-matrix.v0.9.json",
  "policy/domain-palace-policy.v0.9.json",
  "policy/star-domain-policy.v0.9.json",
  "policy/temporal-identity-policy.v0.9.json",
  "policy/dignity-policy.v0.9.json",
  "policy/thai-tue-policy.v0.9.json",
  "policy/unsupported-star-policy.v0.9.json",
  "prompts/v0.9-candidate-handoff-prompt.md",
] as const;

const READINESS_RE =
  /READY_FOR_V0_9_CANDIDATE|RESEARCH_INCOMPLETE|V0_8_SHOULD_REMAIN_UNCHANGED|CALCULATION_CORE_BLOCKED/;

export function readFoundationReadiness(
  decisionMarkdown: string,
): FoundationReadinessState | null {
  const match = decisionMarkdown.match(READINESS_RE);
  return match ? (match[0] as FoundationReadinessState) : null;
}

export function intakeFoundation(root = FOUNDATION_ROOT): FoundationIntakeResult {
  const missingFiles: string[] = [];
  const issues: string[] = [];

  for (const rel of REQUIRED_RELATIVE_PATHS) {
    if (!existsSync(join(root, rel))) missingFiles.push(rel);
  }

  if (missingFiles.length > 0) {
    return {
      ok: false,
      readiness: "FOUNDATION_INVALID",
      missingFiles,
      issues: [`Missing required foundation files: ${missingFiles.join(", ")}`],
      permitsCandidateEvaluation: false,
    };
  }

  // Parse critical JSON registries for basic well-formedness.
  for (const rel of [
    "sources/source-registry.v0.9.json",
    "sources/claim-registry.v0.9.json",
    "policy/school-policy-matrix.v0.9.json",
  ] as const) {
    try {
      JSON.parse(readFileSync(join(root, rel), "utf8"));
    } catch (err) {
      issues.push(`${rel}: malformed JSON (${String(err)})`);
    }
  }

  const decisionMarkdown = readFileSync(join(root, "V0.9-FOUNDATION-DECISION.md"), "utf8");
  const readiness = readFoundationReadiness(decisionMarkdown);
  if (!readiness) {
    issues.push("V0.9-FOUNDATION-DECISION.md has no recognized readiness state");
  }

  if (issues.length > 0 || !readiness) {
    return {
      ok: false,
      readiness: "FOUNDATION_INVALID",
      missingFiles,
      issues,
      permitsCandidateEvaluation: false,
    };
  }

  const permitsCandidateEvaluation = readiness === "READY_FOR_V0_9_CANDIDATE";
  return {
    ok: true,
    readiness,
    missingFiles: [],
    issues: permitsCandidateEvaluation
      ? []
      : [
          `Foundation readiness is ${readiness}; experimental candidate evaluation is blocked.`,
        ],
    permitsCandidateEvaluation,
  };
}
