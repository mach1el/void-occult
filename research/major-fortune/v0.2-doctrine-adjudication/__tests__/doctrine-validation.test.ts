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

describe("Major Fortune V0.2 doctrine adjudication pack", () => {
  it("has required artifacts", () => {
    for (const rel of [
      "README.md",
      "V0.2-DOCTRINE-DECISION.md",
      "sources/source-registry.json",
      "sources/source-extraction-ledger.json",
      "claims/claim-registry.json",
      "claims/claim-adjudication-report.json",
      "contradictions/contradiction-log.json",
      "matrices/topic-eligibility-matrix.json",
      "matrices/school-capability-matrix.json",
      "shapes/candidate-shape-registry.json",
      "blockers/calculation-core-blocker-registry.json",
      "excluded/excluded-rule-registry.json",
      "reports/decision.json",
      "prompts/next-step-handoff-prompt.md",
    ]) {
      expect(fs.existsSync(path.join(PACK, rel)), rel).toBe(true);
    }
  });

  it("validates pack schemas with AJV", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const pairs: Array<[string, string]> = [
      ["sources/source-registry.json", "schema/source-registry.schema.json"],
      ["claims/claim-registry.json", "schema/claim-registry.schema.json"],
      ["contradictions/contradiction-log.json", "schema/contradiction-log.schema.json"],
      ["matrices/topic-eligibility-matrix.json", "schema/topic-eligibility-matrix.schema.json"],
      ["shapes/candidate-shape-registry.json", "schema/candidate-shape-registry.schema.json"],
      ["reports/decision.json", "schema/decision.schema.json"],
      ["blockers/calculation-core-blocker-registry.json", "schema/core-blocker-registry.schema.json"],
    ];
    for (const [dataRel, schemaRel] of pairs) {
      const validate = ajv.compile(readJson(schemaRel) as object);
      const ok = validate(readJson(dataRel));
      expect(ok, `${dataRel}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("resolves all claim source references", () => {
    const sources = readJson("sources/source-registry.json") as {
      sources: Array<{ sourceId: string }>;
    };
    const ids = new Set(sources.sources.map((s) => s.sourceId));
    const claims = readJson("claims/claim-registry.json") as {
      claims: Array<{ claimId: string; sourceIds: string[] }>;
    };
    for (const c of claims.claims) {
      for (const sid of c.sourceIds) {
        expect(ids.has(sid), `${c.claimId} → ${sid}`).toBe(true);
      }
    }
  });

  it("requires locators and rejects Unknown for verified-doctrine", () => {
    const claims = readJson("claims/claim-registry.json") as {
      claims: Array<{ status: string; locators: string[]; claimId: string }>;
    };
    for (const c of claims.claims) {
      expect(c.locators.length).toBeGreaterThan(0);
      if (c.status === "verified-doctrine") {
        expect(c.locators.includes("Unknown")).toBe(false);
      }
    }
  });

  it("keeps classical Unknown sources from authorizing verified doctrine", () => {
    const sources = readJson("sources/source-registry.json") as {
      sources: Array<{
        sourceId: string;
        pageOrInternalLocator: string;
        sourceType: string;
        prohibitedUsage: string[];
      }>;
    };
    for (const s of sources.sources) {
      if (s.sourceType === "classical_text" && s.pageOrInternalLocator === "Unknown") {
        expect(
          s.prohibitedUsage.some((u) => u.includes("verified_doctrine") || u.includes("locator")),
        ).toBe(true);
      }
    }
  });

  it("forbids engineering sources from classical attribution", () => {
    const sources = readJson("sources/source-registry.json") as {
      sources: Array<{ qualityTier: string; prohibitedUsage: string[] }>;
    };
    for (const s of sources.sources) {
      if (s.qualityTier === "engineering") {
        expect(s.prohibitedUsage.some((u) => u.toLowerCase().includes("classical"))).toBe(true);
      }
    }
  });

  it("candidate-eligible claims only for independence gate today", () => {
    const claims = readJson("claims/claim-registry.json") as {
      claims: Array<{ claimId: string; candidateEligibility: string; topic: string }>;
    };
    const eligible = claims.claims.filter((c) => c.candidateEligibility === "candidate-eligible");
    expect(eligible.map((c) => c.claimId)).toEqual(["CLM-MFV02-ADJ-NO-ANNUAL"]);
  });

  it("excluded families cannot appear in any shape includedRuleFamilies", () => {
    const excluded = readJson("excluded/excluded-rule-registry.json") as {
      excluded: Array<{ familyId: string; eligibility: string }>;
    };
    const shapes = readJson("shapes/candidate-shape-registry.json") as {
      shapes: Array<{ includedRuleFamilies: string[] }>;
    };
    const ban = new Set(
      excluded.excluded
        .filter((e) => e.eligibility === "excluded-from-v0.2")
        .map((e) => e.familyId),
    );
    for (const shape of shapes.shapes) {
      for (const fam of shape.includedRuleFamilies) {
        expect(ban.has(fam)).toBe(false);
      }
    }
  });

  it("Core blockers declare required producer fields", () => {
    const blockers = readJson("blockers/calculation-core-blocker-registry.json") as {
      blockers: Array<{ eligibility: string; requiredProducerFields: string[] }>;
    };
    for (const b of blockers.blockers) {
      if (b.eligibility === "blocked-by-calculation-core") {
        expect(b.requiredProducerFields.length).toBeGreaterThan(0);
      }
    }
  });

  it("candidate shapes forbid exact rawDelta and annual/monthly families", () => {
    const shapes = readJson("shapes/candidate-shape-registry.json") as {
      exactRawDeltaForbidden: boolean;
      shapes: Array<Record<string, unknown>>;
    };
    expect(shapes.exactRawDeltaForbidden).toBe(true);
    for (const shape of shapes.shapes) {
      const text = JSON.stringify(shape);
      expect(/"rawDelta"\s*:/.test(text)).toBe(false);
      const included = shape.includedRuleFamilies as string[];
      for (const fam of included) {
        expect(fam.includes("annual") || fam.includes("monthly")).toBe(false);
      }
    }
  });

  it("school capabilities fail closed with identical annual/monthly bans", () => {
    const matrix = readJson("matrices/school-capability-matrix.json") as {
      schools: Record<string, { failClosed: boolean; forbiddenInputs: string[] }>;
    };
    expect(matrix.schools["nam-phai"]!.failClosed).toBe(true);
    expect(matrix.schools["trung-chau"]!.failClosed).toBe(true);
    expect(matrix.schools["nam-phai"]!.forbiddenInputs).toEqual(
      matrix.schools["trung-chau"]!.forbiddenInputs,
    );
  });

  it(
    "decision matches validator output and markdown",
    () => {
      execFileSync(
        "npx",
        ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-doctrine/cli/validate-doctrine-pack.ts"],
        { cwd: REPO, encoding: "utf8" },
      );
      execFileSync(
        "npx",
        ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-doctrine/cli/decision-doctrine.ts"],
        { cwd: REPO, encoding: "utf8" },
      );
      const decision = readJson("reports/decision.json") as { readinessDecision: string };
      expect(decision.readinessDecision).toBe("RESEARCH_INCOMPLETE");
      const md = fs.readFileSync(path.join(PACK, "V0.2-DOCTRINE-DECISION.md"), "utf8");
      expect(md).toContain("`RESEARCH_INCOMPLETE`");
    },
    60_000,
  );

  it("Major Fortune production routing is available 0.3.1", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.3.1",
    });
  });

  it("V0.1 frozen control remains equivalent", () => {
    const cmp = compareV01AgainstFrozen();
    expect(cmp.v01FrozenControlEquivalent).toBe(true);
    expect(cmp.failures).toEqual([]);
  });

  it("topic matrix uses exactly one eligibility per topic", () => {
    const matrix = readJson("matrices/topic-eligibility-matrix.json") as {
      topics: Array<{ topicId: string; eligibility: string }>;
    };
    const allowed = new Set([
      "candidate-eligible",
      "research-blocked",
      "blocked-by-calculation-core",
      "excluded-from-v0.2",
      "metadata-only",
    ]);
    const seen = new Set<string>();
    for (const t of matrix.topics) {
      expect(allowed.has(t.eligibility)).toBe(true);
      expect(seen.has(t.topicId)).toBe(false);
      seen.add(t.topicId);
    }
  });

  it(
    "report CLI is deterministic across two runs",
    () => {
      const run = () =>
        execFileSync(
          "npx",
          ["tsx", "src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-doctrine/cli/report-doctrine.ts"],
          { cwd: REPO, encoding: "utf8" },
        );
      run();
      const first = fs.readFileSync(path.join(PACK, "reports/summary-report.json"), "utf8");
      run();
      const second = fs.readFileSync(path.join(PACK, "reports/summary-report.json"), "utf8");
      expect(second).toEqual(first);
    },
    60_000,
  );
});
