/**
 * Round-2 CLI entrypoints for npm scripts.
 */

import { intakeFoundationRound2 } from "./foundation-intake";
import { verifyControlV08 } from "./control-v08";
import { loadCandidatePackRound2 } from "./load-candidates";
import {
  round2Control,
  round2Freeze,
  round2Validate,
  runRound2Decision,
  readFreeze,
} from "./run-decision";
import { assertFreezeMatches } from "./freeze-candidates";

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function cliValidate(): void {
  const result = round2Validate();
  printJson({ command: "validate", ...result });
  if (!result.ok) process.exitCode = 1;
}

export function cliControl(): void {
  const control = round2Control();
  printJson({ command: "control", ...control });
  if (!control.ok) process.exitCode = 1;
}

export function cliTraining(): void {
  // Training is embedded in decision; this stage confirms foundation+pack+control.
  const foundation = intakeFoundationRound2();
  const pack = loadCandidatePackRound2();
  const control = verifyControlV08();
  printJson({
    command: "training",
    foundationReadiness: foundation.readiness,
    candidateCount: pack.candidates.length,
    controlOk: control.ok,
    note: "Full training metrics are written by research:annual-axes-v09-r2:decision",
  });
  if (!foundation.ok || pack.issues.length > 0 || !control.ok) process.exitCode = 1;
}

export function cliFreeze(): void {
  const freeze = round2Freeze();
  printJson({ command: "freeze", freeze });
}

export function cliHoldout(): void {
  const freeze = readFreeze();
  const pack = loadCandidatePackRound2();
  if (!freeze) {
    printJson({ command: "holdout", ok: false, error: "missing freeze; run freeze first" });
    process.exitCode = 1;
    return;
  }
  const issues = assertFreezeMatches(freeze, pack);
  printJson({
    command: "holdout",
    freezeOk: issues.length === 0,
    issues,
    note: "Full holdout metrics are written by research:annual-axes-v09-r2:decision",
  });
  if (issues.length) process.exitCode = 1;
}

export function cliFull(): void {
  printJson({
    command: "full",
    note: "Full-corpus evaluation is written by research:annual-axes-v09-r2:decision",
  });
}

export function cliProduct(): void {
  printJson({
    command: "product",
    note: "Product sanity evaluation is written by research:annual-axes-v09-r2:decision",
  });
}

export function cliSensitivity(): void {
  printJson({
    command: "sensitivity",
    note: "Sensitivity analysis is written by research:annual-axes-v09-r2:decision",
  });
}

export function cliDecision(): void {
  const result = runRound2Decision({ writeArtifacts: true });
  printJson({
    command: "decision",
    foundationReadiness: result.foundation.readiness,
    controlOk: result.control.ok,
    selectionStatus: result.selection.selectionStatus,
    selectedCandidateId: result.selection.selectedCandidateId,
    decision: result.productionDecision.decision,
    freezeRegistryHash: result.freeze.registryHash,
    trainingCharts: result.split.trainingChartIndexes.length,
    holdoutCharts: result.split.holdoutChartIndexes.length,
    reportsWritten: result.reportsWritten.length,
  });
  if (!result.control.ok || !result.foundation.ok) process.exitCode = 1;
}

export function cliAll(): void {
  cliValidate();
  if (process.exitCode) return;
  cliControl();
  if (process.exitCode) return;
  cliTraining();
  if (process.exitCode) return;
  cliFreeze();
  if (process.exitCode) return;
  cliHoldout();
  if (process.exitCode) return;
  cliDecision();
}
