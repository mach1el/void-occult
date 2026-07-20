/**
 * Centralized paths for the Huyền Khí ontology data pack.
 *
 * Data lives under `research/huyen-khi/ontology/v0.1/` (repo root), OUTSIDE
 * `src/` — read with plain `fs`, matching the existing
 * `research/huyen-khi/v0.1/` loader convention rather than importing JSON
 * across the `src/` tsconfig boundary.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
// ontology → huyen-khi → research → ziwei → lib → src → <repo root>
export const REPO_ROOT = path.resolve(moduleDir, "../../../../../..");

export const ONTOLOGY_DIR = path.join(
  REPO_ROOT,
  "research/huyen-khi/ontology/v0.1",
);

export const ONTOLOGY_SCHEMAS_DIR = path.join(ONTOLOGY_DIR, "schemas");
export const ONTOLOGY_FIXTURES_DIR = path.join(ONTOLOGY_DIR, "fixtures");
export const ONTOLOGY_REPORTS_DIR = path.join(ONTOLOGY_DIR, "reports");

/** Files the loader parses as knowledge, keyed by role. */
export const ONTOLOGY_FILES = {
  manifest: "manifest.v0.1.json",
  sourceRegistry: "source-registry.v0.1.json",
  claimRegistry: "claim-registry.v0.1.json",
  terminology: "terminology.v0.1.json",
  symbolicDimensions: "symbolic-dimensions.v0.1.json",
  dimensionOperationCompatibility: "dimension-operation-compatibility.v0.1.json",
  claimProvenancePolicy: "claim-provenance-policy.v0.1.json",
  sourceWitnessMatrix: "source-witness-matrix.v0.1.json",
  fixtureMaturityPolicy: "fixture-maturity-policy.v0.1.json",
  researchTopicCoverage: "research-topic-coverage.v0.1.json",
  schoolPolicy: "school-policy.v0.1.json",
  ruleConflictPolicy: "rule-conflict-policy.v0.1.json",
  sourceExtractionQueue: "source-extraction-queue.v0.1.json",
  expertReviewWorkflow: "expert-review-workflow.v0.1.json",
  releaseGates: "release-gates.v0.1.json",
  fixturePlan: "fixtures/expert-fixture-plan.v0.1.json",
} as const;

/**
 * Explicitly non-loaded artifact: schema example catalog. The loader must
 * NEVER parse this as knowledge (release gate: nonEffectiveExampleLoaded = 0).
 */
export const NON_EFFECTIVE_EXAMPLE_FILE = "example-rules.NON-EFFECTIVE.v0.1.json";
