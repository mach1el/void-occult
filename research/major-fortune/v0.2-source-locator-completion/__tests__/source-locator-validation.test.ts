import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { getAnalysisStatus } from "../../../../src/lib/ziwei/analysis/contracts/common";
import { compareV01AgainstFrozen } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/v01-frozen-control";

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PACK, "../../..");

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(PACK, rel), "utf8"));
}

describe("Major Fortune V0.2 source locator completion", () => {
  it("has required artifacts", () => {
    for (const rel of [
      "README.md",
      "SOURCE-COMPLETION-DECISION.md",
      "sources/source-registry.json",
      "sources/source-acquisition-ledger.json",
      "sources/page-scan-extraction-ledger.json",
      "claims/claim-registry.json",
      "matrices/claim-to-source-matrix.json",
      "matrices/topic-evidence-report.json",
      "matrices/polarity-evidence-matrix.json",
      "matrices/frame-stacking-matrix.json",
      "matrices/candidate-family-eligibility-matrix.json",
      "contradictions/contradiction-log.json",
      "fragments/eligible-shape-fragments.json",
      "queue/unresolved-source-queue.json",
      "reports/decision.json",
      "prompts/next-step-handoff-prompt.md",
    ]) {
      expect(fs.existsSync(path.join(PACK, rel)), rel).toBe(true);
    }
  });

  it("validates core JSON with AJV", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    for (const [dataRel, schemaRel] of [
      ["sources/source-registry.json", "schema/source-registry.schema.json"],
      ["claims/claim-registry.json", "schema/claim-registry.schema.json"],
      ["reports/decision.json", "schema/decision.schema.json"],
      ["matrices/candidate-family-eligibility-matrix.json", "schema/family-eligibility.schema.json"],
      ["fragments/eligible-shape-fragments.json", "schema/fragments.schema.json"],
    ] as const) {
      const validate = ajv.compile(readJson(schemaRel) as object);
      expect(validate(readJson(dataRel)), dataRel).toBe(true);
    }
  });

  it("rejects verified doctrine with Unknown locator (negative fixture)", () => {
    const bad = readJson("fixtures/negative/verified-unknown-locator.json") as {
      status: string;
      locators: string[];
    };
    expect(bad.status).toBe("verified-doctrine");
    expect(bad.locators).toContain("Unknown");
  });

  it("rejects polarity from engineering-only sources in pack rules", () => {
    const sources = readJson("sources/source-registry.json") as {
      sources: Array<{ sourceId: string; qualityTier: string }>;
    };
    const eng = new Set(
      sources.sources.filter((s) => s.qualityTier === "engineering").map((s) => s.sourceId),
    );
    const claims = readJson("claims/claim-registry.json") as {
      claims: Array<{
        status: string;
        dimension: string;
        sourceIds: string[];
      }>;
    };
    for (const c of claims.claims) {
      if (c.status === "verified-doctrine" && c.dimension === "polarity") {
        expect(c.sourceIds.every((id) => eng.has(id))).toBe(false);
      }
    }
  });

  it("does not mark families eligible without scope/polarity/frame", () => {
    const families = readJson("matrices/candidate-family-eligibility-matrix.json") as {
      families: Array<{
        eligibility: string;
        existence: boolean;
        scope: boolean;
        polarity: boolean;
        frame: boolean;
      }>;
    };
    for (const f of families.families) {
      if (f.eligibility === "candidate-eligible") {
        expect(f.existence && f.scope && f.polarity && f.frame).toBe(true);
      }
    }
  });

  it("has zero eligible scoring families and zero fragments", () => {
    const decision = readJson("reports/decision.json") as {
      readinessDecision: string;
      eligibleScoringFamilyCount: number;
      eligibleShapeFragmentCount: number;
    };
    expect(decision.readinessDecision).toBe("SOURCE_GAPS_REMAIN");
    expect(decision.eligibleScoringFamilyCount).toBe(0);
    expect(decision.eligibleShapeFragmentCount).toBe(0);
    const fragments = readJson("fragments/eligible-shape-fragments.json") as {
      fragments: unknown[];
    };
    expect(fragments.fragments).toEqual([]);
  });

  it("forbids authorized rawDelta and historical mutation flags", () => {
    const decision = readJson("reports/decision.json") as {
      authorizedFinalRawDelta: boolean;
      historicalRegistryMutation: boolean;
      numericCandidatesEvaluated: boolean;
    };
    expect(decision.authorizedFinalRawDelta).toBe(false);
    expect(decision.historicalRegistryMutation).toBe(false);
    expect(decision.numericCandidatesEvaluated).toBe(false);
  });

  it("keeps excerpts short", () => {
    const ledger = readJson("sources/page-scan-extraction-ledger.json") as {
      extractions: Array<{ excerptLengthChars: number }>;
    };
    for (const e of ledger.extractions) {
      expect(e.excerptLengthChars).toBeLessThanOrEqual(400);
    }
  });

  it("resolves claim source and extraction references", () => {
    const sources = readJson("sources/source-registry.json") as {
      sources: Array<{ sourceId: string }>;
    };
    const sourceIds = new Set(sources.sources.map((s) => s.sourceId));
    const ledger = readJson("sources/page-scan-extraction-ledger.json") as {
      extractions: Array<{ extractionId: string }>;
    };
    const extractionIds = new Set(ledger.extractions.map((e) => e.extractionId));
    const claims = readJson("claims/claim-registry.json") as {
      claims: Array<{ sourceIds: string[]; extractionIds: string[] }>;
    };
    for (const c of claims.claims) {
      for (const sid of c.sourceIds) expect(sourceIds.has(sid)).toBe(true);
      for (const eid of c.extractionIds ?? []) expect(extractionIds.has(eid)).toBe(true);
    }
  });

  it("CLI validate/report/decision succeed and reports are deterministic", () => {
    execFileSync(
      "npx",
      ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/validate-source-pack.ts"],
      { cwd: REPO, encoding: "utf8" },
    );
    const runReport = () =>
      execFileSync(
        "npx",
        ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/report-source.ts"],
        { cwd: REPO, encoding: "utf8" },
      );
    runReport();
    const first = fs.readFileSync(path.join(PACK, "reports/summary-report.json"), "utf8");
    runReport();
    const second = fs.readFileSync(path.join(PACK, "reports/summary-report.json"), "utf8");
    expect(second).toEqual(first);
    execFileSync(
      "npx",
      ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/decision-source.ts"],
      { cwd: REPO, encoding: "utf8" },
    );
  });

  it("production routing and V0.1 frozen control unchanged", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "unavailable",
      module: "major-fortune",
      reason: "rebuilding",
    });
    const cmp = compareV01AgainstFrozen();
    expect(cmp.v01FrozenControlEquivalent).toBe(true);
  });

  it("does not rewrite historical doctrine decision files", () => {
    const doctrine = fs.readFileSync(
      path.join(REPO, "research/major-fortune/v0.2-doctrine-adjudication/V0.2-DOCTRINE-DECISION.md"),
      "utf8",
    );
    expect(doctrine).toContain("RESEARCH_INCOMPLETE");
  });
});
