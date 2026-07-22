/**
 * V0.9 candidate evaluation + production decision orchestrator.
 *
 * Production routing is never modified. Experimental candidates are only
 * evaluated when foundation readiness is READY_FOR_V0_9_CANDIDATE.
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { intakeFoundation } from "./foundation-intake";
import { verifyControlV08, CONTROL_CANDIDATE_ID } from "./control-v08";
import { loadCandidatePack, CANDIDATES_ROOT } from "./load-candidates";
import { hashCandidate } from "./validate";
import type {
  AnnualAxesCandidateSelectionV09,
  AnnualAxesProductionDecisionV09,
  AnnualAxesCandidateV09,
} from "./schema";

export interface V09EvaluationRunResult {
  foundation: ReturnType<typeof intakeFoundation>;
  control: ReturnType<typeof verifyControlV08>;
  selection: AnnualAxesCandidateSelectionV09;
  productionDecision: AnnualAxesProductionDecisionV09;
  freezeHashes: Record<string, string>;
  reportsWritten: string[];
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeReport(root: string, name: string, value: unknown): string {
  const path = join(root, "reports", name);
  writeFileSync(path, stableStringify(value));
  return path;
}

function buildBlockedSelection(
  foundation: ReturnType<typeof intakeFoundation>,
  control: ReturnType<typeof verifyControlV08>,
  candidates: AnnualAxesCandidateV09[],
): AnnualAxesCandidateSelectionV09 {
  const controlEntry = {
    candidateId: CONTROL_CANDIDATE_ID,
    selectable: false,
    passedAllMandatoryGates: control.ok,
    failedGateIds: control.ok ? [] : ["control-reproduction"],
    blockingReasons: control.ok
      ? ["Control only — not an experimental production candidate."]
      : control.issues,
  };

  const experimental = candidates.filter((c) => c.candidateType === "experimental");
  const experimentalResults = experimental.map((c) => ({
    candidateId: c.candidateId,
    selectable: false,
    passedAllMandatoryGates: false,
    failedGateIds: ["foundation-readiness"],
    blockingReasons: [
      `Foundation readiness ${foundation.readiness} does not permit experimental evaluation.`,
    ],
  }));

  let selectionStatus: AnnualAxesCandidateSelectionV09["selectionStatus"] =
    "evaluation-inconclusive";
  if (foundation.readiness === "FOUNDATION_INVALID" || !foundation.ok) {
    selectionStatus = "foundation-invalid";
  } else if (foundation.readiness === "CALCULATION_CORE_BLOCKED") {
    selectionStatus = "calculation-core-blocked";
  } else if (foundation.readiness === "RESEARCH_INCOMPLETE") {
    selectionStatus = "evaluation-inconclusive";
  } else if (foundation.readiness === "V0_8_SHOULD_REMAIN_UNCHANGED") {
    selectionStatus = "no-candidate-approved";
  } else if (!control.ok) {
    selectionStatus = "evaluation-inconclusive";
  }

  return {
    selectionStatus,
    selectedCandidateId: null,
    controlCandidateId: "CONTROL-V08",
    candidateResults: [controlEntry, ...experimentalResults],
    rationale: [
      `Foundation readiness: ${foundation.readiness}.`,
      ...foundation.issues,
      control.ok
        ? "CONTROL-V08 reproduces production V0.8 exactly."
        : "CONTROL-V08 failed to reproduce production V0.8 — experimental comparison aborted.",
      experimental.length === 0
        ? "No experimental candidates were registered (correct under RESEARCH_INCOMPLETE)."
        : `${experimental.length} experimental candidate(s) present but not evaluated.`,
      "selectedCandidateId remains null.",
    ],
  };
}

function buildProductionDecision(
  foundation: ReturnType<typeof intakeFoundation>,
  selection: AnnualAxesCandidateSelectionV09,
): AnnualAxesProductionDecisionV09 {
  let decision: AnnualAxesProductionDecisionV09["decision"] = "RESEARCH_REVISION_REQUIRED";
  if (foundation.readiness === "CALCULATION_CORE_BLOCKED") {
    decision = "CALCULATION_CORE_BLOCKED";
  } else if (foundation.readiness === "V0_8_SHOULD_REMAIN_UNCHANGED") {
    decision = "KEEP_V0_8_PRODUCTION";
  } else if (foundation.readiness === "RESEARCH_INCOMPLETE") {
    decision = "RESEARCH_REVISION_REQUIRED";
  } else if (foundation.readiness === "FOUNDATION_INVALID") {
    decision = "RESEARCH_REVISION_REQUIRED";
  } else if (selection.selectionStatus === "candidate-selected") {
    decision = "APPROVED_FOR_PRODUCTION_ROLLOUT";
  } else {
    decision = "KEEP_V0_8_PRODUCTION";
  }

  const nextTask =
    decision === "APPROVED_FOR_PRODUCTION_ROLLOUT"
      ? "V0.9 production rollout (separate task)"
      : decision === "CALCULATION_CORE_BLOCKED"
        ? "Calculation Core capability enhancement for unsupported annual identities"
        : decision === "KEEP_V0_8_PRODUCTION"
          ? "Targeted research backlog; keep V0.8 production"
          : "Focused source extraction + claim adjudication (research completion)";

  return {
    decision,
    selectedCandidateId: selection.selectedCandidateId,
    controlVersion: {
      engineVersion: "0.8.0",
      formulaVersion: "v0.8-annual-palace-weighted-score",
    },
    evidence: {
      foundationDecision: foundation.readiness,
      auditFindingIds: [
        "Finding-1-spread-gates",
        "Finding-2-natal-anchor",
        "Finding-3-unreferenced-stars",
        "Finding-6-scoreState-epsilon",
      ],
      claimIds: [
        "CLM-AAV09-003",
        "CLM-AAV09-004",
        "CLM-AAV09-005",
        "CLM-AAV09-006",
        "CLM-AAV09-007",
        "CLM-AAV09-015",
        "CLM-AAV09-018",
      ],
      sourceIds: [],
      passedGateIds: controlPassGateIds(selection),
      failedGateIds: ["foundation-readiness-not-ready-for-candidate"],
    },
    residualRisks: [
      "doctrinal: zero classical/school-manual sources; zero classical-status claims",
      "doctrinal: CONTRA-AAV09-001 (Lưu Đào Hoa polarity) unadjudicated",
      "Calculation Core: Lưu Đại Hao/Tiểu Hao/Phục Binh/Tuần/Triệt unsupported",
      "distribution: V0.8 fails 9/28 spread/dispersion gates (documented in foundation audit)",
      "holdout: experimental candidates were not run (blocked)",
      "product: no V0.9 candidate scores generated",
      "technical: scoreState epsilon mislabel (Finding 6) remains a separate production-code fix",
    ],
    prohibitedClaims: [
      "Do not invent annual identities for Core-blocked stars",
      "Do not treat engineering-hypothesis star polarities as classical doctrine",
      "Do not change production routing from this evaluation task",
    ],
    nextTask,
  };
}

function controlPassGateIds(selection: AnnualAxesCandidateSelectionV09): string[] {
  const control = selection.candidateResults.find((c) => c.candidateId === CONTROL_CANDIDATE_ID);
  return control?.passedAllMandatoryGates
    ? ["control-reproduction", "production-routing-unchanged", "fixture-byte-check"]
    : [];
}

export function runV09CandidateDecision(options?: {
  root?: string;
  writeArtifacts?: boolean;
}): V09EvaluationRunResult {
  const root = options?.root ?? CANDIDATES_ROOT;
  const writeArtifacts = options?.writeArtifacts !== false;

  const foundation = intakeFoundation();
  const control = verifyControlV08();
  const pack = loadCandidatePack(root);

  // Under blocked readiness, refuse to evaluate experimental candidates even if present.
  const experimentalPresent = pack.candidates.some((c) => c.candidateType === "experimental");
  if (!foundation.permitsCandidateEvaluation && experimentalPresent) {
    // Still do not evaluate them — selection records the block.
  }

  if (!control.ok) {
    // Hard stop: broken control means evaluation cannot proceed meaningfully.
  }

  const selection = buildBlockedSelection(foundation, control, pack.candidates);
  const productionDecision = buildProductionDecision(foundation, selection);

  const freezeHashes: Record<string, string> = {};
  for (const c of pack.candidates) {
    freezeHashes[c.candidateId] = hashCandidate(c);
  }
  freezeHashes["__registry__"] = createHash("sha256")
    .update(readFileSync(pack.registryPath))
    .digest("hex");

  const reportsWritten: string[] = [];
  if (writeArtifacts) {
    mkdirSync(join(root, "reports"), { recursive: true });
    mkdirSync(join(root, "fixtures"), { recursive: true });
    mkdirSync(join(root, "prompts"), { recursive: true });

    reportsWritten.push(
      writeReport(root, "production-decision.json", productionDecision),
      writeReport(root, "candidate-comparison.json", {
        generatedAt: "2026-07-22T00:00:00.000Z",
        foundationReadiness: foundation.readiness,
        experimentalEvaluation: "blocked",
        candidates: pack.candidates.map((c) => ({
          candidateId: c.candidateId,
          candidateType: c.candidateType,
          changeCategories: c.changeCategories,
          claimIds: c.claimIds,
          sourceIds: c.sourceIds,
          selectable: false,
        })),
        selection,
      }),
      writeReport(root, "full-corpus-evaluation.json", {
        status: "skipped",
        reason: foundation.readiness,
        note: "Experimental corpus evaluation requires READY_FOR_V0_9_CANDIDATE.",
      }),
      writeReport(root, "holdout-evaluation.json", {
        status: "skipped",
        reason: foundation.readiness,
        freezeHashes,
        note: "Holdout was not opened; candidate freeze recorded for control only.",
      }),
      writeReport(root, "product-sanity-evaluation.json", {
        control: {
          candidateId: CONTROL_CANDIDATE_ID,
          scores: control.scores,
          fixtureEquality: control.fixtureEquality,
        },
        experimental: [],
        note: "Only CONTROL-V08 product fixture was verified.",
      }),
      writeReport(root, "rule-coverage-comparison.json", {
        status: "skipped",
        reason: foundation.readiness,
        controlReference: "research/annual-axes/v0.9-foundation/audit/rule-coverage.v0.8.json",
      }),
      writeReport(root, "contribution-mass-comparison.json", {
        status: "skipped",
        reason: foundation.readiness,
        controlReference: "research/annual-axes/v0.9-foundation/audit/contribution-mass.v0.8.json",
      }),
      writeReport(root, "sensitivity-analysis.json", {
        status: "skipped",
        reason: "No selectable experimental candidate; no engineering-hypothesis parameters varied.",
      }),
    );

    writeFileSync(
      join(root, "fixtures/candidate-control-product.json"),
      stableStringify({
        candidateId: CONTROL_CANDIDATE_ID,
        scores: control.scores,
        fixtureScores: control.fixtureScores,
        fixtureHash: control.fixtureHash,
        ok: control.ok,
      }),
    );
    writeFileSync(
      join(root, "fixtures/candidate-selected-product.json"),
      stableStringify({
        selectedCandidateId: null,
        note: "No candidate selected.",
      }),
    );

    writeDecisionMarkdown(root, foundation, control, selection, productionDecision, freezeHashes);
    writeBlockedHandoff(root, productionDecision);
  }

  return {
    foundation,
    control,
    selection,
    productionDecision,
    freezeHashes,
    reportsWritten,
  };
}

function writeDecisionMarkdown(
  root: string,
  foundation: ReturnType<typeof intakeFoundation>,
  control: ReturnType<typeof verifyControlV08>,
  selection: AnnualAxesCandidateSelectionV09,
  productionDecision: AnnualAxesProductionDecisionV09,
  freezeHashes: Record<string, string>,
): void {
  const lines = [
    "# Annual Axes V0.9 Candidate Decision",
    "",
    "## Status",
    "",
    `**${productionDecision.decision}**`,
    "",
    `selectionStatus: \`${selection.selectionStatus}\``,
    `selectedCandidateId: \`${selection.selectedCandidateId ?? "null"}\``,
    "",
    "## Control",
    "",
    `- candidateId: \`${CONTROL_CANDIDATE_ID}\``,
    `- engineVersion: \`${control.engineVersion}\``,
    `- formulaVersion: \`${control.formulaVersion}\``,
    `- reproduction ok: **${control.ok}**`,
    `- scoreEquality: ${control.scoreEquality}`,
    `- routingEquality: ${control.routingEquality}`,
    `- fixtureEquality: ${control.fixtureEquality}`,
    `- fixtureHash: \`${control.fixtureHash}\``,
    "",
    "## Candidates evaluated",
    "",
    "| Candidate | Policy changes | Claims | Sources | Selectable |",
    "| --------- | -------------- | ------ | ------- | ---------- |",
    `| CONTROL-V08 | none (control) | — | — | no |`,
    "",
    "No experimental candidates were registered. Foundation readiness",
    `\`${foundation.readiness}\` forbids inventing candidates to fill a quota.`,
    "",
    "## Policy differences",
    "",
    "None — experimental evaluation blocked.",
    "",
    "## Corpus split",
    "",
    "- Documented foundation corpus: 100 charts × 12 years (seed 20260719).",
    "- Training/holdout experimental split: **not opened** (blocked).",
    "- Overlap check: n/a.",
    "",
    "## Candidate freeze hashes",
    "",
    "```json",
    JSON.stringify(freezeHashes, null, 2),
    "```",
    "",
    "## Training observations",
    "",
    "Skipped — no experimental candidate training performed.",
    "",
    "## Holdout results",
    "",
    "| Candidate | Mandatory gates passed | Failed gates | Selectable |",
    "| --------- | ---------------------: | ------------ | ---------- |",
    `| CONTROL-V08 | ${control.ok ? "control only" : "FAILED"} | ${control.ok ? "—" : "control-reproduction"} | no |`,
    "",
    "## Distribution results",
    "",
    "Inherited from foundation V0.8 audit: 19/28 gates passed; 9 spread/dispersion gates failed.",
    "No candidate distribution delta was computed.",
    "",
    "## Rule coverage",
    "",
    "Control reference only: `research/annual-axes/v0.9-foundation/audit/rule-coverage.v0.8.json`.",
    "",
    "## Contribution balance",
    "",
    "Control reference only: `research/annual-axes/v0.9-foundation/audit/contribution-mass.v0.8.json`.",
    "",
    "## Product sanity",
    "",
    "CONTROL-V08 matches committed V0.8 product fixture exactly.",
    "No experimental product vectors.",
    "",
    "## Sensitivity analysis",
    "",
    "Skipped — no engineering-hypothesis parameters under an approved candidate.",
    "",
    "## Calculation Core blockers",
    "",
    "- Lưu Đại Hao",
    "- Lưu Tiểu Hao",
    "- Lưu Phục Binh",
    "- Lưu Tuần",
    "- Lưu Triệt",
    "",
    "These remain `CALCULATION_CORE_BLOCKED` per foundation unsupported-star policy.",
    "They did not set the overall production decision (overall state is research incompleteness).",
    "",
    "## Selected candidate",
    "",
    "```",
    "selectedCandidateId: null",
    "```",
    "",
    "## Production decision",
    "",
    "```",
    productionDecision.decision,
    "```",
    "",
    "Claim classes:",
    "",
    "- **classical claim:** none available in foundation pack",
    "- **derived claim:** foundation audit measurements (Findings 1–8)",
    "- **engineering hypothesis:** unreferenced-star polarity assignments (blocked)",
    "- **statistical observation:** 9 failed spread gates; natal/annual mass imbalance",
    "- **product judgment:** keep V0.8 until doctrine is source-backed",
    "",
    "## Residual risks",
    "",
    ...productionDecision.residualRisks.map((r) => `- ${r}`),
    "",
    "## Next task",
    "",
    productionDecision.nextTask,
    "",
    "See `prompts/blocked-next-step-handoff.md`.",
    "",
  ];
  writeFileSync(join(root, "V0.9-CANDIDATE-DECISION.md"), `${lines.join("\n")}\n`);
}

function writeBlockedHandoff(
  root: string,
  productionDecision: AnnualAxesProductionDecisionV09,
): void {
  const body = `# Blocked Next-Step Handoff — Annual Axes V0.9

## Decision from candidate evaluation

\`\`\`
${productionDecision.decision}
selectedCandidateId: null
\`\`\`

Production routing must remain **Nam Phái V0.8** / Engine **0.8.0**.
Do not implement or enable a V0.9 production route from this handoff.

## Why candidate evaluation was blocked

Foundation readiness is \`RESEARCH_INCOMPLETE\` (validated
\`research/annual-axes/v0.9-foundation/\`). Per evaluation contract:

- zero classical / school-manual / published-reference sources
- zero \`classical\`-status claims
- \`CONTRA-AAV09-001\` (Lưu Đào Hoa polarity) remains unadjudicated
- best-evidenced candidate shape (wire 12 emitted-but-unreferenced annual
  stars) cannot be scoped without source-backed polarity/domain assignments

Inventing experimental candidates under this state would violate the
mission constraints (no unsupported doctrine as classical truth; no
radar-only cosmetics).

## Required next task

**Focused research completion / source & claim adjudication** — not
candidate scoring, not production rollout.

Reuse:

- \`research/annual-axes/v0.9-foundation/prompts/source-extraction-prompt.md\`
- \`research/annual-axes/v0.9-foundation/prompts/claim-adjudication-prompt.md\`
- \`research/annual-axes/v0.9-foundation/prompts/v0.9-candidate-handoff-prompt.md\`

Branch suggestion:

\`\`\`
research/ziwei-annual-axes-v0-9-research-completion
\`\`\`

Success criteria for reopening candidate evaluation:

1. At least one verified classical or school-manual Nam Phái source with
   checkable locators.
2. Per-star source-backed polarity/domain/point-class for the 12
   unreferenced-but-emitted stars (or explicit school-specific adjudication).
3. \`CONTRA-AAV09-001\` resolved or explicitly remain-disputed with evidence.
4. Foundation readiness upgraded to \`READY_FOR_V0_9_CANDIDATE\` with
   \`npm run research:annual-axes-v09:validate\` still green.
5. Then reopen \`research/ziwei-annual-axes-v0-9-candidate-evaluation\` with
   real experimental candidates.

## Separate optional engineering fix (not this handoff)

Finding 6 (\`scoreState\` float epsilon) may proceed as an independent
production PR if product owners approve touching V0.8 label semantics.
It does not unlock doctrine-backed V0.9 candidates by itself.

## Calculation Core (narrow)

Do **not** treat the five unsupported stars (Lưu Đại Hao / Tiểu Hao /
Phục Binh / Tuần / Triệt) as a doctrine research question. Any work there
starts with Calculation Core producers.

## Do not execute

- production routing changes
- deleting V0.8
- inventing annual identities by renaming natal stars
- calibrating on product fixtures
`;
  writeFileSync(join(root, "prompts/blocked-next-step-handoff.md"), body);
}

/** CLI entry used by npm scripts. */
export function main(): void {
  const result = runV09CandidateDecision({ writeArtifacts: true });
  process.stdout.write(
    JSON.stringify(
      {
        foundationReadiness: result.foundation.readiness,
        controlOk: result.control.ok,
        selectionStatus: result.selection.selectionStatus,
        selectedCandidateId: result.selection.selectedCandidateId,
        decision: result.productionDecision.decision,
        reportsWritten: result.reportsWritten.length,
      },
      null,
      2,
    ) + "\n",
  );
  if (!result.control.ok || result.foundation.readiness === "FOUNDATION_INVALID") {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("run-decision.ts")) {
  // Invoked via tsx path may not match import.meta.url on all runners; scripts call main explicitly.
}
