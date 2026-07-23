/**
 * Deterministic summary report — counts derived from pack artifacts.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadSourceLocatorPackFromDisk, MF_V02_SOURCE_PACK_DIR } from "../load-source-locator-pack";
import { validateSourceLocatorPack } from "../validate-source-locator-pack";

function main(): void {
  const input = loadSourceLocatorPackFromDisk();
  const families = input.artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
    families: Array<{ familyId: string; eligibility: string }>;
  };
  const decision = input.artifacts["reports/decision.json"] as Record<string, unknown>;

  // First pass may fail only on stale summary — rebuild summary from a soft derive.
  // Clone input and temporarily use a minimal valid summary for derivation.
  const soft = structuredClone(input);
  soft.artifacts["reports/summary-report.json"] = {
    reportId: "major-fortune-v0.2-source-locator-summary",
    readinessDecision: decision.readinessDecision,
    sourcesByAccess: {},
    sourcesByExtraction: {},
    familyEligibility: {},
    eligibleShapeFragmentCount: 0,
    unresolvedQueueCount: 0,
    openContradictions: [],
    numericCandidatesEvaluated: false,
    authorizedFinalRawDelta: false,
    v01Unchanged: true,
    productionRoutingUnchanged: true,
  };
  // Skip summary consistency by validating after write

  const provisional = validateSourceLocatorPack({
    schemas: input.schemas,
    artifacts: {
      ...input.artifacts,
      // use existing decision; ignore summary mismatch by matching derived after compute
      "reports/summary-report.json": soft.artifacts["reports/summary-report.json"],
    },
  });

  // Even if provisional has summary mismatches, derived counts are usable when other checks pass.
  // Recompute derived without summary check: call validate then filter — simpler: build report from artifacts directly.
  const sourcesDoc = input.artifacts["sources/source-registry.json"] as {
    sources: Array<{ accessStatus: string; extractionStatus: string }>;
  };
  const fragments = input.artifacts["fragments/eligible-shape-fragments.json"] as {
    fragments: unknown[];
  };
  const queue = input.artifacts["queue/unresolved-source-queue.json"] as { items: unknown[] };
  const contra = input.artifacts["contradictions/contradiction-log.json"] as {
    contradictions: Array<{ contradictionId: string; status: string }>;
  };
  const sourcesByAccess: Record<string, number> = {};
  const sourcesByExtraction: Record<string, number> = {};
  for (const s of sourcesDoc.sources) {
    sourcesByAccess[s.accessStatus] = (sourcesByAccess[s.accessStatus] ?? 0) + 1;
    sourcesByExtraction[s.extractionStatus] = (sourcesByExtraction[s.extractionStatus] ?? 0) + 1;
  }
  const openContradictions = contra.contradictions
    .filter((c) => c.status === "open")
    .map((c) => c.contradictionId)
    .sort();

  const report = {
    reportId: "major-fortune-v0.2-source-locator-summary",
    readinessDecision: decision.readinessDecision,
    sourcesByAccess,
    sourcesByExtraction,
    familyEligibility: Object.fromEntries(
      families.families.map((f) => [f.familyId, f.eligibility]),
    ),
    eligibleShapeFragmentCount: fragments.fragments.length,
    unresolvedQueueCount: queue.items.length,
    openContradictions,
    numericCandidatesEvaluated: false,
    authorizedFinalRawDelta: false,
    v01Unchanged: true,
    productionRoutingUnchanged: true,
  };

  void provisional;
  const body = JSON.stringify(report, null, 2) + "\n";
  writeFileSync(join(MF_V02_SOURCE_PACK_DIR, "reports/summary-report.json"), body);

  input.artifacts["reports/summary-report.json"] = report;
  const again = validateSourceLocatorPack(input);
  if (!again.ok) {
    console.error(JSON.stringify(again.issues, null, 2));
    process.exit(1);
  }
  console.log(body);
}

main();
