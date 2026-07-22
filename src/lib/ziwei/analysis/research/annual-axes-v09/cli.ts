/**
 * CLI wrappers for npm scripts (one purpose each).
 */
import { intakeFoundation } from "./foundation-intake";
import { verifyControlV08 } from "./control-v08";
import { loadCandidatePack } from "./load-candidates";
import { runV09CandidateDecision } from "./run-decision";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CANDIDATES_ROOT } from "./load-candidates";
import { hashCandidate } from "./validate";

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function cliValidate(): void {
  const foundation = intakeFoundation();
  const pack = loadCandidatePack();
  const ok = foundation.ok && pack.issues.length === 0;
  printJson({
    command: "validate",
    foundation,
    candidatePackIssues: pack.issues,
    ok,
  });
  if (!ok) process.exitCode = 1;
}

export function cliControl(): void {
  const control = verifyControlV08();
  printJson({ command: "control", ...control });
  if (!control.ok) process.exitCode = 1;
}

export function cliTraining(): void {
  const foundation = intakeFoundation();
  printJson({
    command: "training",
    status: "skipped",
    reason: foundation.readiness,
    note: "Experimental training requires READY_FOR_V0_9_CANDIDATE.",
  });
}

export function cliFreeze(): void {
  const pack = loadCandidatePack();
  const freezeHashes: Record<string, string> = {};
  for (const c of pack.candidates) freezeHashes[c.candidateId] = hashCandidate(c);
  freezeHashes.__registry__ = createHash("sha256")
    .update(readFileSync(pack.registryPath))
    .digest("hex");
  mkdirSync(join(CANDIDATES_ROOT, "reports"), { recursive: true });
  const out = {
    frozenAt: "2026-07-22T00:00:00.000Z",
    freezeHashes,
    candidateIds: pack.candidates.map((c) => c.candidateId),
    note: "Freeze recorded prior to holdout; experimental holdout remains closed under RESEARCH_INCOMPLETE.",
  };
  writeFileSync(
    join(CANDIDATES_ROOT, "reports/candidate-freeze.json"),
    `${JSON.stringify(out, null, 2)}\n`,
  );
  printJson({ command: "freeze", ...out });
}

export function cliHoldout(): void {
  const foundation = intakeFoundation();
  printJson({
    command: "holdout",
    status: "skipped",
    reason: foundation.readiness,
    note: "Holdout not opened; see reports/holdout-evaluation.json after decision.",
  });
}

export function cliProduct(): void {
  const control = verifyControlV08();
  printJson({
    command: "product",
    controlOk: control.ok,
    scores: control.scores,
    fixtureEquality: control.fixtureEquality,
  });
  if (!control.ok) process.exitCode = 1;
}

export function cliDecision(): void {
  const result = runV09CandidateDecision({ writeArtifacts: true });
  printJson({
    command: "decision",
    foundationReadiness: result.foundation.readiness,
    controlOk: result.control.ok,
    selectionStatus: result.selection.selectionStatus,
    selectedCandidateId: result.selection.selectedCandidateId,
    decision: result.productionDecision.decision,
  });
  if (!result.control.ok || result.foundation.readiness === "FOUNDATION_INVALID") {
    process.exitCode = 1;
  }
}
