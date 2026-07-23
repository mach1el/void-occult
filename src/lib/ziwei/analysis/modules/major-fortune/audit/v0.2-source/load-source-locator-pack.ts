/**
 * Load Major Fortune V0.2 source-locator pack artifacts + schemas from disk.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SourceLocatorPackInput } from "./validate-source-locator-pack";

export const MF_V02_SOURCE_PACK_DIR = join(
  process.cwd(),
  "research/major-fortune/v0.2-source-locator-completion",
);

function readJson(abs: string): unknown {
  return JSON.parse(readFileSync(abs, "utf8"));
}

export function loadSourceLocatorPackFromDisk(
  packRoot = MF_V02_SOURCE_PACK_DIR,
): SourceLocatorPackInput {
  const schemas: Record<string, unknown> = {};
  const artifacts: Record<string, unknown> = {};

  const schemaDir = join(packRoot, "schema");
  for (const file of readdirSync(schemaDir)) {
    if (file.endsWith(".schema.json")) {
      schemas[`schema/${file}`] = readJson(join(schemaDir, file));
    }
  }

  const artifactRels = [
    "sources/source-registry.json",
    "sources/source-acquisition-ledger.json",
    "sources/page-scan-extraction-ledger.json",
    "claims/claim-registry.json",
    "matrices/candidate-family-eligibility-matrix.json",
    "matrices/claim-to-source-matrix.json",
    "matrices/topic-evidence-report.json",
    "matrices/polarity-evidence-matrix.json",
    "matrices/frame-stacking-matrix.json",
    "contradictions/contradiction-log.json",
    "fragments/eligible-shape-fragments.json",
    "queue/unresolved-source-queue.json",
    "reports/decision.json",
    "reports/summary-report.json",
    "reports/validation-report.json",
    "reports/decision-check.json",
  ];
  for (const rel of artifactRels) {
    artifacts[rel] = readJson(join(packRoot, rel));
  }
  return { schemas, artifacts };
}
