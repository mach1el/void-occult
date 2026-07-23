/**
 * Validate Major Fortune V0.2 source locator completion pack.
 * Exit non-zero on schema / cross-reference / eligibility rule failures.
 */
import Ajv from "ajv";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join(process.cwd(), "research/major-fortune/v0.2-source-locator-completion");
const MAX_EXCERPT = 400;

interface Issue {
  code: string;
  message: string;
}

function readJson(abs: string): unknown {
  return JSON.parse(readFileSync(abs, "utf8"));
}

function main(): void {
  const issues: Issue[] = [];
  const ajv = new Ajv({ allErrors: true, strict: false });

  const pairs: Array<[string, string]> = [
    ["sources/source-registry.json", "schema/source-registry.schema.json"],
    ["claims/claim-registry.json", "schema/claim-registry.schema.json"],
    ["reports/decision.json", "schema/decision.schema.json"],
    ["matrices/candidate-family-eligibility-matrix.json", "schema/family-eligibility.schema.json"],
    ["fragments/eligible-shape-fragments.json", "schema/fragments.schema.json"],
  ];

  for (const [dataRel, schemaRel] of pairs) {
    const dataPath = join(PACK, dataRel);
    const schemaPath = join(PACK, schemaRel);
    if (!existsSync(dataPath) || !existsSync(schemaPath)) {
      issues.push({ code: "missing-artifact", message: `${dataRel}` });
      continue;
    }
    const validate = ajv.compile(readJson(schemaPath) as object);
    const ok = validate(readJson(dataPath));
    if (!ok) {
      issues.push({
        code: "schema-invalid",
        message: `${dataRel}: ${JSON.stringify(validate.errors)}`,
      });
    }
  }

  const sourcesDoc = readJson(join(PACK, "sources/source-registry.json")) as {
    historicalMutationForbidden: boolean;
    sources: Array<{
      sourceId: string;
      qualityTier: string;
      sourceType: string;
      pageOrInternalLocator: string;
      extractionStatus: string;
      prohibitedUsage: string[];
    }>;
  };
  if (sourcesDoc.historicalMutationForbidden !== true) {
    issues.push({ code: "history-mutation", message: "historicalMutationForbidden must be true" });
  }
  const sourceIds = new Set(sourcesDoc.sources.map((s) => s.sourceId));
  const engineeringIds = new Set(
    sourcesDoc.sources
      .filter(
        (s) =>
          s.qualityTier === "engineering" ||
          s.sourceType.includes("engineering") ||
          s.sourceType.includes("calculation-contract"),
      )
      .map((s) => s.sourceId),
  );

  const claimsDoc = readJson(join(PACK, "claims/claim-registry.json")) as {
    exactRawDeltaForbidden: boolean;
    claims: Array<{
      claimId: string;
      sourceIds: string[];
      locators: string[];
      status: string;
      dimension: string;
      candidateEligibility: string;
      polarity: string | null;
      frame: string | null;
      extractionIds: string[];
    }>;
  };
  if (claimsDoc.exactRawDeltaForbidden !== true) {
    issues.push({ code: "rawDelta-policy", message: "exactRawDeltaForbidden must be true" });
  }
  const claimIds = new Set(claimsDoc.claims.map((c) => c.claimId));

  const extractions = readJson(join(PACK, "sources/page-scan-extraction-ledger.json")) as {
    extractions: Array<{
      extractionId: string;
      excerptLengthChars: number;
      sourceId: string;
      locator: string;
    }>;
  };
  const extractionIds = new Set(extractions.extractions.map((e) => e.extractionId));
  for (const e of extractions.extractions) {
    if (e.excerptLengthChars > MAX_EXCERPT) {
      issues.push({
        code: "long-copied-passage",
        message: `${e.extractionId} excerptLengthChars=${e.excerptLengthChars}`,
      });
    }
    if (!sourceIds.has(e.sourceId)) {
      issues.push({ code: "unresolved-source", message: `extraction → ${e.sourceId}` });
    }
  }

  for (const c of claimsDoc.claims) {
    for (const sid of c.sourceIds) {
      if (!sourceIds.has(sid)) {
        issues.push({ code: "unresolved-source", message: `${c.claimId} → ${sid}` });
      }
    }
    for (const eid of c.extractionIds ?? []) {
      if (!extractionIds.has(eid)) {
        issues.push({ code: "missing-extraction", message: `${c.claimId} → ${eid}` });
      }
    }
    if (c.status === "verified-doctrine") {
      if (c.locators.some((l) => l === "Unknown")) {
        issues.push({
          code: "verified-unknown-locator",
          message: c.claimId,
        });
      }
      if (c.dimension === "polarity" && c.sourceIds.every((sid) => engineeringIds.has(sid))) {
        issues.push({
          code: "polarity-from-engineering",
          message: c.claimId,
        });
      }
      for (const sid of c.sourceIds) {
        const src = sourcesDoc.sources.find((s) => s.sourceId === sid);
        if (src?.pageOrInternalLocator === "Unknown") {
          issues.push({
            code: "verified-unknown-locator",
            message: `${c.claimId} cites ${sid}`,
          });
        }
      }
    }
    if (c.candidateEligibility === "candidate-eligible" && c.dimension === "polarity") {
      if (!c.frame) {
        issues.push({ code: "eligible-missing-frame", message: c.claimId });
      }
    }
  }

  const families = readJson(join(PACK, "matrices/candidate-family-eligibility-matrix.json")) as {
    families: Array<{
      familyId: string;
      eligibility: string;
      existence: boolean;
      scope: boolean;
      polarity: boolean;
      frame: boolean;
    }>;
  };

  let eligibleScoring = 0;
  for (const f of families.families) {
    if (f.eligibility === "candidate-eligible") {
      eligibleScoring += 1;
      if (!f.existence) issues.push({ code: "eligible-missing-existence", message: f.familyId });
      if (!f.scope) issues.push({ code: "eligible-missing-scope", message: f.familyId });
      if (!f.polarity) issues.push({ code: "eligible-missing-polarity", message: f.familyId });
      if (!f.frame) issues.push({ code: "eligible-missing-frame", message: f.familyId });
    }
  }

  const fragments = readJson(join(PACK, "fragments/eligible-shape-fragments.json")) as {
    fragments: Array<Record<string, unknown>>;
  };
  for (const frag of fragments.fragments) {
    const text = JSON.stringify(frag);
    if (/"rawDelta"\s*:/.test(text) || /"selectedRawDelta"\s*:/.test(text)) {
      issues.push({ code: "authorized-rawDelta", message: String(frag.familyId ?? frag.fragmentId) });
    }
    if (JSON.stringify(frag).toLowerCase().includes("annual") && frag.requiresAnnual) {
      issues.push({ code: "annual-monthly-dependency", message: String(frag.familyId) });
    }
  }

  const decision = readJson(join(PACK, "reports/decision.json")) as {
    readinessDecision: string;
    eligibleScoringFamilyCount: number;
    eligibleShapeFragmentCount: number;
    authorizedFinalRawDelta: boolean;
    numericCandidatesEvaluated: boolean;
    historicalRegistryMutation: boolean;
    productionRoutingExpected: { reason: string };
  };

  if (decision.authorizedFinalRawDelta !== false) {
    issues.push({ code: "authorized-rawDelta", message: "decision.authorizedFinalRawDelta" });
  }
  if (decision.numericCandidatesEvaluated !== false) {
    issues.push({ code: "numeric-eval", message: "numericCandidatesEvaluated" });
  }
  if (decision.historicalRegistryMutation !== false) {
    issues.push({ code: "history-mutation", message: "historicalRegistryMutation" });
  }
  if (decision.productionRoutingExpected?.reason !== "rebuilding") {
    issues.push({ code: "routing", message: "production routing must remain rebuilding" });
  }
  if (decision.eligibleScoringFamilyCount !== eligibleScoring) {
    // scoring families only — independence is a claim not a family in matrix as candidate-eligible
    const matrixEligible = families.families.filter((f) => f.eligibility === "candidate-eligible").length;
    if (decision.eligibleScoringFamilyCount !== matrixEligible) {
      issues.push({
        code: "decision-mismatch",
        message: `eligibleScoringFamilyCount ${decision.eligibleScoringFamilyCount} != ${matrixEligible}`,
      });
    }
  }
  if (decision.eligibleShapeFragmentCount !== fragments.fragments.length) {
    issues.push({
      code: "decision-mismatch",
      message: `eligibleShapeFragmentCount ${decision.eligibleShapeFragmentCount} != ${fragments.fragments.length}`,
    });
  }

  if (
    decision.readinessDecision === "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE" &&
    fragments.fragments.length === 0
  ) {
    issues.push({
      code: "decision-mismatch",
      message: "READY_FOR_SHAPE_FREEZE requires non-empty fragments",
    });
  }
  if (decision.readinessDecision === "SOURCE_GAPS_REMAIN" && fragments.fragments.length > 0) {
    // allowed if fragments provisional? Mission: READY only when non-empty coherent combination.
    // GAPS_REMAIN with fragments would be inconsistent if fragments claim eligibility.
    const anyEligible = fragments.fragments.length > 0;
    if (anyEligible && decision.eligibleScoringFamilyCount === 0) {
      issues.push({
        code: "decision-mismatch",
        message: "fragments present but no eligible scoring families",
      });
    }
  }

  // Negative fixtures must illustrate forbidden patterns
  const negDir = join(PACK, "fixtures/negative");
  for (const file of readdirSync(negDir)) {
    if (!file.endsWith(".json")) continue;
    const body = readJson(join(negDir, file)) as Record<string, unknown>;
    if (file === "verified-unknown-locator.json") {
      if (body.status === "verified-doctrine" && Array.isArray(body.locators) && body.locators.includes("Unknown")) {
        // expected bad fixture — ok
      } else {
        issues.push({ code: "neg-fixture", message: file });
      }
    }
    if (file === "long-copied-passage.json") {
      if ((body.excerptLengthChars as number) <= MAX_EXCERPT) {
        issues.push({ code: "neg-fixture", message: `${file} should exceed max excerpt` });
      }
    }
    if (file === "authorized-rawDelta.json") {
      if (body.authorizedFinalRawDelta !== true && body.rawDelta == null) {
        issues.push({ code: "neg-fixture", message: file });
      }
    }
  }

  // Ensure no claim silently merges polarity+existence dimensions incorrectly: each claim one dimension
  for (const c of claimsDoc.claims) {
    if (!c.dimension) {
      issues.push({ code: "merged-dimensions", message: c.claimId });
    }
  }

  const report = {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    readinessDecision: decision.readinessDecision,
    sourceCount: sourcesDoc.sources.length,
    claimCount: claimsDoc.claims.length,
    eligibleScoringFamilyCount: decision.eligibleScoringFamilyCount,
    eligibleShapeFragmentCount: decision.eligibleShapeFragmentCount,
  };
  writeFileSync(join(PACK, "reports/validation-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
