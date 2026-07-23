import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getAnalysisStatus } from "../../../../src/lib/ziwei/analysis/contracts/common";
import { compareV01AgainstFrozen } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/v01-frozen-control";
import { loadSourceLocatorPackFromDisk } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/load-source-locator-pack";
import {
  MF_V02_SOURCE_MAX_EXCERPT,
  validateSourceLocatorPack,
  type SourceLocatorPackInput,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/validate-source-locator-pack";

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PACK, "../../..");

function clonePack(): SourceLocatorPackInput {
  return JSON.parse(JSON.stringify(loadSourceLocatorPackFromDisk(PACK))) as SourceLocatorPackInput;
}

function expectCodes(
  input: SourceLocatorPackInput,
  expected: string[],
): void {
  const result = validateSourceLocatorPack(input);
  expect(result.ok, JSON.stringify(result.issues, null, 2)).toBe(false);
  const codes = new Set(result.issues.map((i) => i.code));
  for (const code of expected) {
    expect(codes.has(code), `missing ${code} in ${[...codes].join(",")}`).toBe(true);
  }
}

describe("Major Fortune V0.2 source locator — positive pack", () => {
  it("passes reusable validator with SOURCE_GAPS_REMAIN and zero eligibility", () => {
    const input = loadSourceLocatorPackFromDisk(PACK);
    const result = validateSourceLocatorPack(input);
    expect(result.ok, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(result.derived?.eligibleScoringFamilyCount).toBe(0);
    expect(result.derived?.eligibleShapeFragmentCount).toBe(0);
    const decision = input.artifacts["reports/decision.json"] as {
      readinessDecision: string;
    };
    expect(decision.readinessDecision).toBe("SOURCE_GAPS_REMAIN");
  });

  it(
    "CLI validate/report/decision are deterministic across two runs",
    () => {
      const run = (script: string) =>
        execFileSync("npx", ["tsx", script], { cwd: REPO, encoding: "utf8" });
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/report-source.ts");
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/validate-source-pack.ts");
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/decision-source.ts");
      const files = [
        "reports/summary-report.json",
        "reports/validation-report.json",
        "reports/decision-check.json",
      ];
      const first = Object.fromEntries(
        files.map((f) => [f, fs.readFileSync(path.join(PACK, f), "utf8")]),
      );
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/report-source.ts");
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/validate-source-pack.ts");
      run("src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2-source/cli/decision-source.ts");
      for (const f of files) {
        expect(fs.readFileSync(path.join(PACK, f), "utf8")).toEqual(first[f]);
      }
    },
    60_000,
  );

  it("production routing and V0.1 frozen control unchanged", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "unavailable",
      module: "major-fortune",
      reason: "rebuilding",
    });
    expect(compareV01AgainstFrozen().v01FrozenControlEquivalent).toBe(true);
  });

  it("does not rewrite historical doctrine/foundation decisions", () => {
    expect(
      fs.readFileSync(
        path.join(REPO, "research/major-fortune/v0.2-doctrine-adjudication/V0.2-DOCTRINE-DECISION.md"),
        "utf8",
      ),
    ).toContain("RESEARCH_INCOMPLETE");
    expect(
      fs.readFileSync(
        path.join(REPO, "research/major-fortune/v0.2-foundation/V0.2-FOUNDATION-DECISION.md"),
        "utf8",
      ),
    ).toContain("RESEARCH_INCOMPLETE");
  });
});

describe("Major Fortune V0.2 source locator — negative fixtures via real validator", () => {
  it("verified doctrine with Unknown locator", () => {
    const pack = clonePack();
    const claims = pack.artifacts["claims/claim-registry.json"] as {
      claims: Array<Record<string, unknown>>;
    };
    claims.claims.push({
      claimId: "CLM-BAD-VERIFIED-UNKNOWN",
      topic: "principal-star-dignity",
      familyId: "principal-star-dignity",
      dimension: "existence",
      statement: "bad",
      school: "mixed",
      sourceIds: ["SRC-MF-V02-LOC-TAN-BIEN-001"],
      locators: ["Unknown"],
      confidence: "high",
      status: "verified-doctrine",
      candidateEligibility: "research-blocked",
      polarity: null,
      frame: null,
      extractionIds: [],
      requiredFacts: [],
      contradictions: [],
      runtimeImplication: "bad",
      notes: null,
    });
    expectCodes(pack, ["verified-unknown-locator"]);
  });

  it("polarity from engineering-only sources", () => {
    const pack = clonePack();
    const claims = pack.artifacts["claims/claim-registry.json"] as {
      claims: Array<Record<string, unknown>>;
    };
    claims.claims.push({
      claimId: "CLM-BAD-ENG-POL",
      topic: "element-relation",
      familyId: "element-relation",
      dimension: "polarity",
      statement: "bad",
      school: "mixed",
      sourceIds: ["SRC-MF-V02-LOC-CAP-001"],
      locators: [
        "school-capabilities.v0.2.json#profiles.nam-phai.supportsMajorFortuneTransformations",
      ],
      confidence: "high",
      status: "verified-doctrine",
      candidateEligibility: "research-blocked",
      polarity: "positive",
      frame: "direct",
      extractionIds: ["EXT-LOC-001"],
      requiredFacts: [],
      contradictions: [],
      runtimeImplication: "bad",
      notes: null,
    });
    const ext = pack.artifacts["sources/page-scan-extraction-ledger.json"] as {
      extractions: Array<{ extractionId: string; claimIds: string[] }>;
    };
    ext.extractions.find((e) => e.extractionId === "EXT-LOC-001")!.claimIds.push("CLM-BAD-ENG-POL");
    expectCodes(pack, ["polarity-from-engineering"]);
  });

  it("eligible family missing polarity / existence / scope / frame", () => {
    const pack = clonePack();
    const families = pack.artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
      families: Array<Record<string, unknown>>;
    };
    const target = families.families.find((f) => f.familyId === "element-relation")!;
    target.eligibility = "candidate-eligible";
    target.existence = true;
    target.scope = true;
    target.polarity = true;
    target.frame = true;
    target.evidence = {
      existenceClaimIds: [],
      scopeClaimIds: [],
      polarityClaimIds: [],
      frameClaimIds: [],
      stackingClaimIds: [],
    };
    target.stackingContract = "non-stacking";
    const decision = pack.artifacts["reports/decision.json"] as {
      eligibleScoringFamilyCount: number;
    };
    decision.eligibleScoringFamilyCount = 1;
    expectCodes(pack, [
      "eligible-missing-existence",
      "eligible-missing-scope",
      "eligible-missing-polarity",
      "eligible-missing-frame",
      "family-boolean-evidence-mismatch",
    ]);
  });

  it("eligible family backed by unverified / wrong-family claims", () => {
    const pack = clonePack();
    const families = pack.artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
      families: Array<Record<string, unknown>>;
    };
    const target = families.families.find((f) => f.familyId === "element-relation")!;
    target.eligibility = "candidate-eligible";
    target.stackingContract = "non-stacking";
    target.evidence = {
      existenceClaimIds: ["CLM-MFV02-LOC-PD-EXIST-GAP"],
      scopeClaimIds: ["CLM-MFV02-LOC-PD-EXIST-GAP"],
      polarityClaimIds: ["CLM-MFV02-LOC-PD-POLARITY-GAP"],
      frameClaimIds: ["CLM-MFV02-LOC-PD-EXIST-GAP"],
      stackingClaimIds: [],
    };
    // booleans match hasAnyResolvingClaims on those dimensions
    target.existence = true;
    target.scope = false;
    target.polarity = true;
    target.frame = false;
    const decision = pack.artifacts["reports/decision.json"] as {
      eligibleScoringFamilyCount: number;
    };
    decision.eligibleScoringFamilyCount = 1;
    expectCodes(pack, [
      "eligible-backed-by-unverified-claims",
      "eligible-backed-by-wrong-family",
    ]);
  });

  it("claim referencing missing source / extraction", () => {
    const pack = clonePack();
    const claims = pack.artifacts["claims/claim-registry.json"] as {
      claims: Array<Record<string, unknown>>;
    };
    claims.claims[0]!.sourceIds = ["SRC-DOES-NOT-EXIST"];
    expectCodes(pack, ["unresolved-source"]);

    const pack2 = clonePack();
    const claims2 = pack2.artifacts["claims/claim-registry.json"] as {
      claims: Array<Record<string, unknown>>;
    };
    claims2.claims[0]!.extractionIds = ["EXT-MISSING"];
    expectCodes(pack2, ["missing-extraction"]);
  });

  it("claim/extraction source and locator mismatch + reverse refs", () => {
    const pack = clonePack();
    const claims = pack.artifacts["claims/claim-registry.json"] as {
      claims: Array<{ claimId: string; sourceIds: string[]; locators: string[]; extractionIds: string[] }>;
    };
    const c = claims.claims.find((x) => x.claimId === "CLM-MFV02-LOC-EL-MAP")!;
    c.sourceIds = ["SRC-MF-V02-LOC-CAP-001"]; // extraction is BRANCH
    expectCodes(pack, ["claim-extraction-source-mismatch"]);

    const pack2 = clonePack();
    const claims2 = pack2.artifacts["claims/claim-registry.json"] as {
      claims: Array<{ claimId: string; locators: string[] }>;
    };
    const c2 = claims2.claims.find((x) => x.claimId === "CLM-MFV02-LOC-EL-MAP")!;
    c2.locators = ["totally-different-locator"];
    expectCodes(pack2, ["claim-extraction-locator-mismatch"]);

    const pack3 = clonePack();
    const ext = pack3.artifacts["sources/page-scan-extraction-ledger.json"] as {
      extractions: Array<{ extractionId: string; claimIds: string[] }>;
    };
    ext.extractions.find((e) => e.extractionId === "EXT-LOC-002")!.claimIds = [];
    expectCodes(pack3, ["extraction-missing-reverse-claim"]);
  });

  it("long copied passage and excerpt length mismatch", () => {
    const pack = clonePack();
    const ext = pack.artifacts["sources/page-scan-extraction-ledger.json"] as {
      extractions: Array<Record<string, unknown>>;
    };
    const e = ext.extractions.find((x) => x.extractionId === "EXT-LOC-002")!;
    e.excerptOrParaphrase = "x".repeat(MF_V02_SOURCE_MAX_EXCERPT + 10);
    e.excerptLengthChars = MF_V02_SOURCE_MAX_EXCERPT + 10;
    expectCodes(pack, ["long-copied-passage"]);

    const pack2 = clonePack();
    const ext2 = pack2.artifacts["sources/page-scan-extraction-ledger.json"] as {
      extractions: Array<Record<string, unknown>>;
    };
    const e2 = ext2.extractions.find((x) => x.extractionId === "EXT-LOC-002")!;
    e2.excerptLengthChars = 1;
    expectCodes(pack2, ["excerpt-length-mismatch"]);
  });

  it("authorized rawDelta, annual dependency, history mutation, ready with zero fragments", () => {
    const pack = clonePack();
    const decision = pack.artifacts["reports/decision.json"] as Record<string, unknown>;
    decision.authorizedFinalRawDelta = true;
    expectCodes(pack, ["authorized-rawDelta"]);

    const pack2 = clonePack();
    const fr = pack2.artifacts["fragments/eligible-shape-fragments.json"] as {
      fragments: Array<Record<string, unknown>>;
    };
    fr.fragments.push({
      familyId: "element-relation",
      requiresAnnual: true,
      candidateRange: "unset",
    });
    const d2 = pack2.artifacts["reports/decision.json"] as {
      eligibleShapeFragmentCount: number;
    };
    d2.eligibleShapeFragmentCount = 1;
    const sum = pack2.artifacts["reports/summary-report.json"] as {
      eligibleShapeFragmentCount: number;
    };
    sum.eligibleShapeFragmentCount = 1;
    expectCodes(pack2, ["annual-monthly-dependency"]);

    const pack3 = clonePack();
    const sources = pack3.artifacts["sources/source-registry.json"] as {
      historicalMutationForbidden: boolean;
    };
    sources.historicalMutationForbidden = false;
    expectCodes(pack3, ["history-mutation"]);

    const pack4 = clonePack();
    const d4 = pack4.artifacts["reports/decision.json"] as {
      readinessDecision: string;
    };
    d4.readinessDecision = "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE";
    const sum4 = pack4.artifacts["reports/summary-report.json"] as {
      readinessDecision: string;
    };
    sum4.readinessDecision = "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE";
    expectCodes(pack4, ["ready-with-zero-fragments"]);
  });

  it("decision/report count mismatch", () => {
    const pack = clonePack();
    const decision = pack.artifacts["reports/decision.json"] as {
      eligibleScoringFamilyCount: number;
    };
    decision.eligibleScoringFamilyCount = 99;
    expectCodes(pack, ["decision-count-mismatch"]);
  });

  it("booleans alone cannot authorize a family", () => {
    const pack = clonePack();
    const families = pack.artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
      families: Array<Record<string, unknown>>;
    };
    const target = families.families.find((f) => f.familyId === "principal-star-dignity")!;
    target.eligibility = "candidate-eligible";
    target.existence = true;
    target.scope = true;
    target.polarity = true;
    target.frame = true;
    target.stackingContract = "non-stacking";
    // evidence remains empty
    const decision = pack.artifacts["reports/decision.json"] as {
      eligibleScoringFamilyCount: number;
    };
    decision.eligibleScoringFamilyCount = 1;
    const result = validateSourceLocatorPack(pack);
    expect(result.ok).toBe(false);
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain("eligible-missing-existence");
    expect(codes).toContain("family-boolean-evidence-mismatch");
  });

  it("synthetic complete doctrine evidence would pass eligibility structurally (in-memory only)", () => {
    const pack = clonePack();
    const sources = pack.artifacts["sources/source-registry.json"] as {
      sources: Array<Record<string, unknown>>;
    };
    sources.sources.push({
      sourceId: "SRC-SYNTH-CLASSICAL-001",
      title: "Synthetic classical fixture",
      author: "fixture",
      editorOrTranslator: null,
      edition: "fixture",
      publisher: "fixture",
      publicationYear: 1900,
      language: "vi",
      schoolAlignment: ["mixed"],
      sourceType: "classical_text",
      qualityTier: "primary",
      accessStatus: "verified",
      pageOrInternalLocator: "fixture-scan-p12",
      extractionStatus: "inspected",
      allowedUsage: ["verified_doctrine_authority"],
      prohibitedUsage: [],
      uncertaintyNotes: "in-memory test only",
      topicsTargeted: ["element-relation"],
    });
    const ext = pack.artifacts["sources/page-scan-extraction-ledger.json"] as {
      extractions: Array<Record<string, unknown>>;
    };
    const paraphrase = "Synthetic short paraphrase for element relation polarity.";
    ext.extractions.push({
      extractionId: "EXT-SYNTH-001",
      sourceId: "SRC-SYNTH-CLASSICAL-001",
      locator: "fixture-scan-p12",
      excerptOrParaphrase: paraphrase,
      excerptLengthChars: paraphrase.length,
      claimIds: [
        "CLM-SYNTH-EL-EXIST",
        "CLM-SYNTH-EL-SCOPE",
        "CLM-SYNTH-EL-POL",
        "CLM-SYNTH-EL-FRAME",
      ],
      layer: "doctrine",
    });
    const claims = pack.artifacts["claims/claim-registry.json"] as {
      claims: Array<Record<string, unknown>>;
    };
    const base = {
      topic: "element-relation",
      familyId: "element-relation",
      school: "mixed",
      sourceIds: ["SRC-SYNTH-CLASSICAL-001"],
      locators: ["fixture-scan-p12"],
      extractionIds: ["EXT-SYNTH-001"],
      confidence: "high",
      status: "verified-doctrine",
      candidateEligibility: "candidate-eligible",
      requiredFacts: ["activePalaceBranch", "menhElement"],
      contradictions: [],
      runtimeImplication: "synthetic",
      notes: null,
      polarity: null,
      frame: "active-palace-branch-vs-menhElement",
      stacking: null,
    };
    claims.claims.push(
      { ...base, claimId: "CLM-SYNTH-EL-EXIST", dimension: "existence", statement: "exists" },
      { ...base, claimId: "CLM-SYNTH-EL-SCOPE", dimension: "scope", statement: "scope" },
      {
        ...base,
        claimId: "CLM-SYNTH-EL-POL",
        dimension: "polarity",
        statement: "polarity",
        polarity: "context-dependent",
      },
      { ...base, claimId: "CLM-SYNTH-EL-FRAME", dimension: "frame", statement: "frame" },
    );
    const families = pack.artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
      families: Array<Record<string, unknown>>;
    };
    const target = families.families.find((f) => f.familyId === "element-relation")!;
    target.eligibility = "candidate-eligible";
    target.existence = true;
    target.scope = true;
    target.polarity = true;
    target.frame = true;
    target.stackingContract = "mutually-exclusive-single-outcome";
    target.evidence = {
      existenceClaimIds: ["CLM-SYNTH-EL-EXIST"],
      scopeClaimIds: ["CLM-SYNTH-EL-SCOPE"],
      polarityClaimIds: ["CLM-SYNTH-EL-POL"],
      frameClaimIds: ["CLM-SYNTH-EL-FRAME"],
      stackingClaimIds: [],
    };
    const decision = pack.artifacts["reports/decision.json"] as {
      eligibleScoringFamilyCount: number;
      readinessDecision: string;
    };
    decision.eligibleScoringFamilyCount = 1;
    // Keep decision as SOURCE_GAPS_REMAIN would conflict — use READY with a fragment
    decision.readinessDecision = "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE";
    const fr = pack.artifacts["fragments/eligible-shape-fragments.json"] as {
      fragments: Array<Record<string, unknown>>;
    };
    fr.fragments.push({
      familyId: "element-relation",
      eligibleSchool: "mixed",
      verifiedSignConstraints: "context-dependent",
      verifiedFrame: "active-palace-branch-vs-menhElement",
      availableCoreInputs: ["activePalaceBranch", "menhElement"],
      exclusions: [],
      unresolvedInteractions: [],
      candidateRange: "unset",
    });
    decision.eligibleShapeFragmentCount = 1;
    const sum = pack.artifacts["reports/summary-report.json"] as Record<string, unknown>;
    sum.readinessDecision = "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE";
    sum.eligibleShapeFragmentCount = 1;
    sum.familyEligibility = {
      ...(sum.familyEligibility as object),
      "element-relation": "candidate-eligible",
    };

    const result = validateSourceLocatorPack(pack);
    expect(result.ok, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(result.derived?.eligibleScoringFamilyCount).toBe(1);

    // Committed pack on disk remains unchanged / still SOURCE_GAPS_REMAIN
    const disk = loadSourceLocatorPackFromDisk(PACK);
    expect(
      (disk.artifacts["reports/decision.json"] as { readinessDecision: string }).readinessDecision,
    ).toBe("SOURCE_GAPS_REMAIN");
    expect(
      (disk.artifacts["fragments/eligible-shape-fragments.json"] as { fragments: unknown[] })
        .fragments,
    ).toEqual([]);
  });
});
