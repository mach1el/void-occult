/**
 * Deterministic summary report for source locator completion.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join(process.cwd(), "research/major-fortune/v0.2-source-locator-completion");

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(PACK, rel), "utf8"));
}

function main(): void {
  const decision = readJson("reports/decision.json") as Record<string, unknown>;
  const sources = readJson("sources/source-registry.json") as {
    sources: Array<{ accessStatus: string; extractionStatus: string; qualityTier: string }>;
  };
  const families = readJson("matrices/candidate-family-eligibility-matrix.json") as {
    families: Array<{ familyId: string; eligibility: string }>;
  };
  const fragments = readJson("fragments/eligible-shape-fragments.json") as { fragments: unknown[] };
  const queue = readJson("queue/unresolved-source-queue.json") as { items: unknown[] };
  const contra = readJson("contradictions/contradiction-log.json") as {
    contradictions: Array<{ contradictionId: string; status: string }>;
  };

  const report = {
    reportId: "major-fortune-v0.2-source-locator-summary",
    readinessDecision: decision.readinessDecision,
    sourcesByAccess: sources.sources.reduce<Record<string, number>>((acc, s) => {
      acc[s.accessStatus] = (acc[s.accessStatus] ?? 0) + 1;
      return acc;
    }, {}),
    sourcesByExtraction: sources.sources.reduce<Record<string, number>>((acc, s) => {
      acc[s.extractionStatus] = (acc[s.extractionStatus] ?? 0) + 1;
      return acc;
    }, {}),
    familyEligibility: Object.fromEntries(families.families.map((f) => [f.familyId, f.eligibility])),
    eligibleShapeFragmentCount: fragments.fragments.length,
    unresolvedQueueCount: queue.items.length,
    openContradictions: contra.contradictions.filter((c) => c.status === "open").map((c) => c.contradictionId),
    numericCandidatesEvaluated: decision.numericCandidatesEvaluated,
    authorizedFinalRawDelta: decision.authorizedFinalRawDelta,
    v01Unchanged: decision.v01Unchanged,
    productionRoutingUnchanged: decision.productionRoutingUnchanged,
  };

  const body = JSON.stringify(report, null, 2) + "\n";
  writeFileSync(join(PACK, "reports/summary-report.json"), body);
  console.log(body);
}

main();
