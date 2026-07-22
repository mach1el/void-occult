/**
 * Foundation intake for Round-2. Fail-closed unless READY_FOR_V0_9_CANDIDATE
 * and authorized Thiên Mã shape/policy resolve.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const FOUNDATION_ROOT = join(process.cwd(), "research/annual-axes/v0.9-foundation");
export const AUTHORIZED_SHAPE_ID = "SHAPE-AAV09-THIEN-MA-MOVEMENT" as const;
export const AUTHORIZED_POLICY_ID = "POL-AAV09-STAR-LUU-THIEN-MA" as const;
export const AUTHORIZED_STAR = "Lưu Thiên Mã" as const;
export const AUTHORIZED_CLAIM_IDS = ["CLM-AAV09-019", "CLM-AAV09-007", "CLM-AAV09-015"] as const;
export const AUTHORIZED_SOURCE_IDS = ["SRC-AA-V09-TAN-BIEN-1956", "SRC-AA-CORE-001"] as const;

export type FoundationReadinessState =
  | "READY_FOR_V0_9_CANDIDATE"
  | "RESEARCH_INCOMPLETE"
  | "V0_8_SHOULD_REMAIN_UNCHANGED"
  | "CALCULATION_CORE_BLOCKED"
  | "FOUNDATION_INVALID";

export interface FoundationIntakeRound2 {
  ok: boolean;
  readiness: FoundationReadinessState;
  issues: string[];
  permitsCandidateEvaluation: boolean;
  authorizedShapeIds: string[];
  authorizedPolicyIds: string[];
  authorizedStarNames: string[];
}

const READINESS_STATES = new Set([
  "READY_FOR_V0_9_CANDIDATE",
  "RESEARCH_INCOMPLETE",
  "V0_8_SHOULD_REMAIN_UNCHANGED",
  "CALCULATION_CORE_BLOCKED",
]);

export function intakeFoundationRound2(root = FOUNDATION_ROOT): FoundationIntakeRound2 {
  const issues: string[] = [];
  const readinessPath = join(root, "readiness.v0.9.json");
  const decisionPath = join(root, "V0.9-FOUNDATION-DECISION.md");
  const starPolicyPath = join(root, "policy/star-domain-policy.v0.9.json");
  const claimPath = join(root, "sources/claim-registry.v0.9.json");
  const sourcePath = join(root, "sources/source-registry.v0.9.json");

  for (const p of [readinessPath, decisionPath, starPolicyPath, claimPath, sourcePath]) {
    if (!existsSync(p)) issues.push(`Missing foundation file: ${p}`);
  }
  if (issues.length > 0) {
    return {
      ok: false,
      readiness: "FOUNDATION_INVALID",
      issues,
      permitsCandidateEvaluation: false,
      authorizedShapeIds: [],
      authorizedPolicyIds: [],
      authorizedStarNames: [],
    };
  }

  const readinessJson = JSON.parse(readFileSync(readinessPath, "utf8")) as {
    readinessState?: string;
    candidateShapes?: Array<{ candidateShapeId: string; includedStars?: string[] }>;
  };
  const readiness = readinessJson.readinessState;
  if (!readiness || !READINESS_STATES.has(readiness)) {
    issues.push(`Unrecognized readinessState: ${String(readiness)}`);
  }

  const decisionMd = readFileSync(decisionPath, "utf8");
  const finalMatch = decisionMd.match(
    /##\s*M\.\s*Final readiness state[\s\S]*?```\s*\n?\s*(READY_FOR_V0_9_CANDIDATE|RESEARCH_INCOMPLETE|V0_8_SHOULD_REMAIN_UNCHANGED|CALCULATION_CORE_BLOCKED)\s*\n?```/,
  );
  const mdReadiness = finalMatch?.[1];
  if (mdReadiness && readiness && mdReadiness !== readiness) {
    issues.push(`readiness JSON (${readiness}) disagrees with decision Markdown (${mdReadiness})`);
  }

  const shapes = readinessJson.candidateShapes ?? [];
  const shape = shapes.find((s) => s.candidateShapeId === AUTHORIZED_SHAPE_ID);
  if (!shape) issues.push(`Authorized shape ${AUTHORIZED_SHAPE_ID} missing from readiness.v0.9.json`);

  const starPolicy = JSON.parse(readFileSync(starPolicyPath, "utf8")) as {
    unreferencedButEmittedStars?: { entries?: Array<Record<string, unknown>> };
  };
  const entries = starPolicy.unreferencedButEmittedStars?.entries ?? [];
  const thienMa = entries.find((e) => e.exactStarName === AUTHORIZED_STAR);
  if (!thienMa) {
    issues.push(`Star-domain policy missing ${AUTHORIZED_STAR}`);
  } else {
    if (thienMa.policyRecordId !== AUTHORIZED_POLICY_ID) {
      issues.push(`Expected policy ${AUTHORIZED_POLICY_ID}, found ${String(thienMa.policyRecordId)}`);
    }
    if (thienMa.candidateEligible !== true || thienMa.decision !== "candidate-eligible") {
      issues.push(`${AUTHORIZED_STAR} is not candidate-eligible in star-domain policy`);
    }
  }

  const claims = JSON.parse(readFileSync(claimPath, "utf8")) as { claims: Array<{ claimId: string }> };
  const sources = JSON.parse(readFileSync(sourcePath, "utf8")) as { sources: Array<{ sourceId: string }> };
  const claimIds = new Set(claims.claims.map((c) => c.claimId));
  const sourceIds = new Set(sources.sources.map((s) => s.sourceId));
  for (const id of AUTHORIZED_CLAIM_IDS) {
    if (!claimIds.has(id)) issues.push(`Missing authorized claim ${id}`);
  }
  for (const id of AUTHORIZED_SOURCE_IDS) {
    if (!sourceIds.has(id)) issues.push(`Missing authorized source ${id}`);
  }

  const readinessState = (readiness ?? "FOUNDATION_INVALID") as FoundationReadinessState;
  const ready = readinessState === "READY_FOR_V0_9_CANDIDATE" && issues.length === 0;
  return {
    ok: ready,
    readiness: issues.length > 0 && readinessState === "READY_FOR_V0_9_CANDIDATE"
      ? "FOUNDATION_INVALID"
      : readinessState,
    issues: ready
      ? []
      : issues.length > 0
        ? issues
        : [`Foundation readiness is ${readinessState}; Round-2 evaluation blocked.`],
    permitsCandidateEvaluation: ready,
    authorizedShapeIds: shape ? [AUTHORIZED_SHAPE_ID] : [],
    authorizedPolicyIds: thienMa ? [AUTHORIZED_POLICY_ID] : [],
    authorizedStarNames: thienMa ? [AUTHORIZED_STAR] : [],
  };
}
