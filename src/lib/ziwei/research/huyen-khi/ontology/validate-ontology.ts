/**
 * Ontology-wide validation orchestration.
 *
 * Runs: load (fail-closed) → unique IDs → referential integrity → manifest
 * completeness → version consistency → numeric-key scan → school isolation →
 * school-isolated conflict analysis → claim-locator traceability → source
 * witness/transcription separation → operation/dimension compatibility →
 * hard-coded PR-number scan → non-effective-not-loaded. Nothing is silently
 * skipped; malformed inputs already failed closed in the loader.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import {
  NON_EFFECTIVE_EXAMPLE_FILE,
  ONTOLOGY_DIR,
  ONTOLOGY_FILES,
} from "./paths";
import { loadHuyenKhiOntology } from "./load-ontology";
import { scanForbiddenScoringKeys } from "./numeric-key-scan";
import { scanHardCodedPrNumbers } from "./pr-number-scan";
import { unresolvedSourceReferences } from "./resolve-source";
import { isCompatible } from "./validate-compatibility";
import { validateFixture } from "./validate-fixture";
import type {
  HuyenKhiClaim,
  HuyenKhiOntology,
  HuyenKhiRule,
  HuyenKhiSchoolProfile,
  HuyenKhiValidationIssue,
} from "./types";

export interface OntologyValidationResult {
  readonly ok: boolean;
  readonly issues: readonly HuyenKhiValidationIssue[];
  readonly summary: OntologyValidationSummary;
  readonly ontology?: HuyenKhiOntology;
}

export interface OntologyValidationSummary {
  readonly sourceCount: number;
  readonly claimCount: number;
  readonly fixtureCount: number;
  readonly effectiveRuleCount: number;
  readonly duplicateIdCount: number;
  readonly unresolvedReferenceCount: number;
  readonly numericScoringKeyCount: number;
  readonly crossSchoolFallbackCount: number;
  readonly unresolvedConflictCount: number;
  readonly silentConflictResolutionCount: number;
  readonly nonEffectiveExampleLoadedCount: number;
  readonly claimLocatorViolationCount: number;
  readonly witnessSeparationViolationCount: number;
  readonly incompatibleOperationDimensionCount: number;
  readonly hardCodedPrNumberCount: number;
  readonly storedDerivedStatusKeyCount: number;
  readonly reviewReferenceViolationCount: number;
  readonly manifestComplete: boolean;
  readonly versionConsistent: boolean;
}

const EMPTY_SUMMARY: OntologyValidationSummary = {
  sourceCount: 0,
  claimCount: 0,
  fixtureCount: 0,
  effectiveRuleCount: 0,
  duplicateIdCount: 0,
  unresolvedReferenceCount: 0,
  numericScoringKeyCount: 0,
  crossSchoolFallbackCount: 0,
  unresolvedConflictCount: 0,
  silentConflictResolutionCount: 0,
  nonEffectiveExampleLoadedCount: 0,
  claimLocatorViolationCount: 0,
  witnessSeparationViolationCount: 0,
  incompatibleOperationDimensionCount: 0,
  hardCodedPrNumberCount: 0,
  storedDerivedStatusKeyCount: 0,
  reviewReferenceViolationCount: 0,
  manifestComplete: false,
  versionConsistent: false,
};

export function validateOntology(): OntologyValidationResult {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    return { ok: false, issues: loaded.issues, summary: EMPTY_SUMMARY };
  }
  const ontology = loaded.ontology;
  const issues: HuyenKhiValidationIssue[] = [];

  // 1. Unique IDs
  const duplicateIdCount =
    collectDuplicates(ontology.sourceRegistry.sources.map((s) => s.sourceId), "sourceId", ONTOLOGY_FILES.sourceRegistry, issues) +
    collectDuplicates(ontology.claimRegistry.claims.map((c) => c.claimId), "claimId", ONTOLOGY_FILES.claimRegistry, issues) +
    collectDuplicates(ontology.fixturePlan.fixtures.map((f) => f.fixtureId), "fixtureId", ONTOLOGY_FILES.fixturePlan, issues) +
    collectDuplicates(ontology.terminology.terms.map((t) => t.termId), "termId", ONTOLOGY_FILES.terminology, issues) +
    collectDuplicates(ontology.researchTopicCoverage.topics.map((t) => t.topicId), "topicId", ONTOLOGY_FILES.researchTopicCoverage, issues) +
    collectDuplicates(ontology.rules.map((r) => r.ruleId), "ruleId", "rules", issues);

  // 2. Referential integrity
  const unresolvedSources = unresolvedSourceReferences(ontology);
  for (const ref of unresolvedSources) {
    issues.push({ severity: "error", code: "unresolved-source-ref", file: ONTOLOGY_FILES.claimRegistry, path: ref.from, message: `sourceId '${ref.sourceId}' does not resolve` });
  }
  const knownRuleIds = new Set(ontology.rules.map((r) => r.ruleId));
  const knownClaimIds = new Set(ontology.claimRegistry.claims.map((c) => c.claimId));
  const knownSourceIds = new Set(ontology.sourceRegistry.sources.map((s) => s.sourceId));
  let unresolvedReferenceCount = unresolvedSources.length;

  for (const rule of ontology.rules) {
    for (const claimId of rule.claimIds ?? []) {
      if (!knownClaimIds.has(claimId)) {
        unresolvedReferenceCount += 1;
        issues.push({ severity: "error", code: "unresolved-claim-ref", file: "rules", path: rule.ruleId, message: `claimId '${claimId}' does not resolve` });
      }
    }
  }
  // Claim contradiction links must resolve to known claims.
  for (const claim of ontology.claimRegistry.claims) {
    for (const [field, ids] of contradictionLinks(claim)) {
      for (const id of ids) {
        if (!knownClaimIds.has(id)) {
          unresolvedReferenceCount += 1;
          issues.push({ severity: "error", code: "unresolved-claim-link", file: ONTOLOGY_FILES.claimRegistry, path: `${claim.claimId}.${field}`, message: `linked claim '${id}' does not resolve` });
        }
      }
    }
  }
  for (const fixture of ontology.fixturePlan.fixtures) {
    for (const id of [...(fixture.expectedEffectiveRuleIds ?? []), ...(fixture.forbiddenRuleIds ?? [])]) {
      if (!knownRuleIds.has(id)) {
        unresolvedReferenceCount += 1;
        issues.push({ severity: "error", code: "unresolved-rule-ref", file: ONTOLOGY_FILES.fixturePlan, path: fixture.fixtureId, message: `ruleId '${id}' does not resolve (no effective rules in V0.1)` });
      }
    }
    for (const id of fixture.candidateSourceIds ?? []) {
      if (!knownSourceIds.has(id)) {
        unresolvedReferenceCount += 1;
        issues.push({ severity: "error", code: "unresolved-source-ref", file: ONTOLOGY_FILES.fixturePlan, path: fixture.fixtureId, message: `candidate sourceId '${id}' does not resolve` });
      }
    }
  }

  // 3. Manifest completeness / 4. version consistency
  const manifestComplete = checkManifestCompleteness(ontology, issues);
  const versionConsistent = checkVersionConsistency(ontology, issues);

  // 5. Numeric-key scan
  const numericHits = scanAllCatalogs(ontology, issues);

  // 6. School isolation / fallback
  const crossSchoolFallbackCount = checkSchoolPolicy(ontology, issues);

  // 7. School-isolated conflict analysis (A3)
  const conflicts = analyzeConflictsInActivationContexts(ontology.rules);
  for (const conflict of conflicts.unresolved) {
    issues.push({ severity: "error", code: "unresolved-rule-conflict", file: "rules", path: `${conflict.ruleA} vs ${conflict.ruleB}`, message: conflict.reason });
  }

  // 8. Claim-locator traceability (A4)
  const claimLocatorViolationCount = checkClaimLocators(ontology, issues);

  // 9. Source witness / transcription separation (E, F)
  const witnessSeparationViolationCount = checkWitnessSeparation(ontology, issues);

  // 10. Operation/dimension compatibility over effective rules (D)
  const incompatibleOperationDimensionCount = checkRuleCompatibility(ontology, issues);

  // 11. Hard-coded PR numbers (B)
  const prHits = scanHardCodedPrNumbers();
  for (const hit of prHits) {
    issues.push({ severity: "error", code: "hard-coded-pr-number", file: hit.file, path: `line ${hit.line}`, message: hit.text });
  }

  // 11b. Fixture governance: per-fixture schema/personal/stored-status/maturity
  // + review referential integrity (§2, §3). Nothing is silently skipped.
  const fixtureGovernance = checkFixtureGovernance(ontology, issues, knownSourceIds, knownClaimIds, knownRuleIds);

  // 12. Non-effective example must never be loaded
  if ((Object.values(ONTOLOGY_FILES) as string[]).includes(NON_EFFECTIVE_EXAMPLE_FILE) &&
      existsSync(path.join(ONTOLOGY_DIR, NON_EFFECTIVE_EXAMPLE_FILE))) {
    issues.push({ severity: "error", code: "non-effective-loaded", file: NON_EFFECTIVE_EXAMPLE_FILE, path: "$", message: "non-effective example must not be a loaded knowledge file" });
  }

  const summary: OntologyValidationSummary = {
    sourceCount: ontology.sourceRegistry.sources.length,
    claimCount: ontology.claimRegistry.claims.length,
    fixtureCount: ontology.fixturePlan.fixtures.length,
    effectiveRuleCount: ontology.rules.length,
    duplicateIdCount,
    unresolvedReferenceCount,
    numericScoringKeyCount: numericHits,
    crossSchoolFallbackCount,
    unresolvedConflictCount: conflicts.unresolved.length,
    silentConflictResolutionCount: 0,
    nonEffectiveExampleLoadedCount: 0,
    claimLocatorViolationCount,
    witnessSeparationViolationCount,
    incompatibleOperationDimensionCount,
    hardCodedPrNumberCount: prHits.length,
    storedDerivedStatusKeyCount: fixtureGovernance.storedDerivedStatusKeyCount,
    reviewReferenceViolationCount: fixtureGovernance.reviewReferenceViolationCount,
    manifestComplete,
    versionConsistent,
  };

  return {
    ok: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    summary,
    ontology,
  };
}

function contradictionLinks(claim: HuyenKhiClaim): [string, readonly string[]][] {
  return [
    ["supportsClaimIds", claim.supportsClaimIds ?? []],
    ["contradictsClaimIds", claim.contradictsClaimIds ?? []],
    ["qualifiesClaimIds", claim.qualifiesClaimIds ?? []],
  ];
}

function collectDuplicates(
  ids: readonly string[],
  label: string,
  file: string,
  issues: HuyenKhiValidationIssue[],
): number {
  const seen = new Set<string>();
  let dups = 0;
  for (const id of ids) {
    if (seen.has(id)) {
      dups += 1;
      issues.push({ severity: "error", code: "duplicate-id", file, path: id, message: `duplicate ${label} '${id}'` });
    }
    seen.add(id);
  }
  return dups;
}

function checkManifestCompleteness(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): boolean {
  let complete = true;
  for (const file of ontology.manifest.files) {
    if (!existsSync(path.join(ONTOLOGY_DIR, file))) {
      complete = false;
      issues.push({ severity: "error", code: "manifest-missing-file", file, path: "$.files", message: `manifest lists '${file}' but it does not exist` });
    }
  }
  for (const [role, relPath] of Object.entries(ONTOLOGY_FILES)) {
    if (role === "manifest") continue;
    if (!ontology.manifest.files.includes(relPath)) {
      complete = false;
      issues.push({ severity: "error", code: "manifest-undeclared-file", file: relPath, path: "$.files", message: `loaded file '${relPath}' is not declared in manifest` });
    }
  }
  return complete;
}

function checkVersionConsistency(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): boolean {
  const expected = ontology.manifest.schemaVersion;
  const bearers: { file: string; version: string | undefined }[] = [
    { file: ONTOLOGY_FILES.sourceRegistry, version: ontology.sourceRegistry.schemaVersion },
    { file: ONTOLOGY_FILES.claimRegistry, version: ontology.claimRegistry.schemaVersion },
    { file: ONTOLOGY_FILES.terminology, version: ontology.terminology.schemaVersion },
    { file: ONTOLOGY_FILES.symbolicDimensions, version: ontology.symbolicDimensions.schemaVersion },
    { file: ONTOLOGY_FILES.dimensionOperationCompatibility, version: ontology.dimensionOperationCompatibility.schemaVersion },
    { file: ONTOLOGY_FILES.claimProvenancePolicy, version: ontology.claimProvenancePolicy.schemaVersion },
    { file: ONTOLOGY_FILES.sourceWitnessMatrix, version: ontology.sourceWitnessMatrix.schemaVersion },
    { file: ONTOLOGY_FILES.fixtureMaturityPolicy, version: ontology.fixtureMaturityPolicy.schemaVersion },
    { file: ONTOLOGY_FILES.researchTopicCoverage, version: ontology.researchTopicCoverage.schemaVersion },
    { file: ONTOLOGY_FILES.schoolPolicy, version: ontology.schoolPolicy.schemaVersion },
    { file: ONTOLOGY_FILES.ruleConflictPolicy, version: ontology.ruleConflictPolicy.schemaVersion },
    { file: ONTOLOGY_FILES.expertReviewWorkflow, version: ontology.expertReviewWorkflow.schemaVersion },
    { file: ONTOLOGY_FILES.releaseGates, version: ontology.releaseGates.schemaVersion },
    { file: ONTOLOGY_FILES.fixturePlan, version: ontology.fixturePlan.schemaVersion },
  ];
  let consistent = true;
  for (const bearer of bearers) {
    if (bearer.version !== expected) {
      consistent = false;
      issues.push({ severity: "error", code: "version-mismatch", file: bearer.file, path: "$.schemaVersion", message: `schemaVersion '${bearer.version}' != manifest '${expected}'` });
    }
  }
  return consistent;
}

function scanAllCatalogs(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): number {
  let count = 0;
  const targets: { file: string; value: unknown }[] = [
    { file: ONTOLOGY_FILES.sourceRegistry, value: ontology.sourceRegistry },
    { file: ONTOLOGY_FILES.claimRegistry, value: ontology.claimRegistry },
    { file: ONTOLOGY_FILES.terminology, value: ontology.terminology },
    { file: ONTOLOGY_FILES.symbolicDimensions, value: ontology.symbolicDimensions },
    { file: ONTOLOGY_FILES.dimensionOperationCompatibility, value: ontology.dimensionOperationCompatibility },
    { file: ONTOLOGY_FILES.claimProvenancePolicy, value: ontology.claimProvenancePolicy },
    { file: ONTOLOGY_FILES.sourceWitnessMatrix, value: ontology.sourceWitnessMatrix },
    { file: ONTOLOGY_FILES.fixtureMaturityPolicy, value: ontology.fixtureMaturityPolicy },
    { file: ONTOLOGY_FILES.researchTopicCoverage, value: ontology.researchTopicCoverage },
    { file: ONTOLOGY_FILES.schoolPolicy, value: ontology.schoolPolicy },
    { file: ONTOLOGY_FILES.ruleConflictPolicy, value: ontology.ruleConflictPolicy },
    { file: ONTOLOGY_FILES.fixturePlan, value: ontology.fixturePlan },
    { file: "rules", value: ontology.rules },
  ];
  for (const target of targets) {
    for (const hit of scanForbiddenScoringKeys(target.value, "$")) {
      count += 1;
      issues.push({ severity: "error", code: "numeric-scoring-key", file: target.file, path: hit.path, message: `forbidden scoring key '${hit.key}'` });
    }
  }
  return count;
}

function checkSchoolPolicy(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): number {
  let fallbackCount = 0;
  const policy = ontology.schoolPolicy;
  if (policy.missingProfileBehavior !== "invalid-knowledge") {
    issues.push({ severity: "error", code: "school-fail-open", file: ONTOLOGY_FILES.schoolPolicy, path: "$.missingProfileBehavior", message: "missing profile must fail closed (invalid-knowledge)" });
  }
  for (const [name, cfg] of Object.entries(policy.profiles)) {
    if (name === "shared") continue;
    if (cfg.ruleFallbackToOtherSchool === true) {
      fallbackCount += 1;
      issues.push({ severity: "error", code: "cross-school-fallback", file: ONTOLOGY_FILES.schoolPolicy, path: `$.profiles.${name}`, message: `school '${name}' must not fall back to another school` });
    }
  }
  const validProfiles = new Set<HuyenKhiSchoolProfile>(["shared", "nam-phai", "trung-chau"]);
  for (const rule of ontology.rules) {
    if (!validProfiles.has(rule.schoolProfile)) {
      issues.push({ severity: "error", code: "school-missing", file: "rules", path: rule.ruleId, message: `rule has no valid school profile` });
    }
  }
  return fallbackCount;
}

/** A4: enforce the claim-locator provenance policy. */
function checkClaimLocators(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): number {
  const policy = ontology.claimProvenancePolicy;
  const doctrinalRequired = new Set(policy.doctrinalLocatorRequiredForStatus);
  const doctrinalKinds = new Set(policy.doctrinalLocatorKinds);
  const engineeringStatuses = new Set(policy.engineeringPolicyStatuses);
  const engineeringKinds = new Set(policy.engineeringPolicyLocatorKinds);
  const knownSourceIds = new Set(ontology.sourceRegistry.sources.map((s) => s.sourceId));
  let violations = 0;
  const push = (claimId: string, message: string) => {
    violations += 1;
    issues.push({ severity: "error", code: "claim-locator-violation", file: ONTOLOGY_FILES.claimRegistry, path: claimId, message });
  };

  for (const claim of ontology.claimRegistry.claims) {
    const locator = claim.locator;
    if (doctrinalRequired.has(claim.status)) {
      if (!locator) {
        push(claim.claimId, `status '${claim.status}' requires a structured locator`);
        continue;
      }
      if (!doctrinalKinds.has(locator.locatorKind)) {
        push(claim.claimId, `doctrinal locatorKind must be one of [${[...doctrinalKinds].join(", ")}]`);
      }
    }
    if (locator) {
      if (!knownSourceIds.has(locator.sourceId)) {
        push(claim.claimId, `locator.sourceId '${locator.sourceId}' does not resolve`);
      }
      if (!claim.sourceIds.includes(locator.sourceId)) {
        push(claim.claimId, `locator.sourceId '${locator.sourceId}' must also be listed in the claim's sourceIds`);
      }
      if (engineeringStatuses.has(claim.status) && !engineeringKinds.has(locator.locatorKind)) {
        push(claim.claimId, `engineering/policy claim locatorKind must be one of [${[...engineeringKinds].join(", ")}]`);
      }
    }
  }
  return violations;
}

/** E/F: physical witnesses and transcriptions are separate identities. */
function checkWitnessSeparation(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): number {
  const byId = new Map(ontology.sourceRegistry.sources.map((s) => [s.sourceId, s]));
  let violations = 0;
  for (const source of ontology.sourceRegistry.sources) {
    if (source.kind === "classical-transcription") {
      const parentId = source.derivedFromSourceId;
      if (!parentId) {
        violations += 1;
        issues.push({ severity: "error", code: "witness-separation", file: ONTOLOGY_FILES.sourceRegistry, path: source.sourceId, message: "transcription must declare derivedFromSourceId to its physical witness" });
        continue;
      }
      const parent = byId.get(parentId);
      if (!parent || parent.witnessKind !== "physical-scan") {
        violations += 1;
        issues.push({ severity: "error", code: "witness-separation", file: ONTOLOGY_FILES.sourceRegistry, path: source.sourceId, message: `derivedFromSourceId '${parentId}' must be a physical-scan witness` });
      }
    }
  }
  return violations;
}

/**
 * §2/§3: per-fixture governance (schema, personal-data, stored derived-status,
 * maturity) plus referential integrity of every review's cited IDs. A review
 * that references a source/claim that does not resolve, or ANY effective rule
 * (there are none in V0.1), fails closed.
 */
function checkFixtureGovernance(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
  knownSourceIds: ReadonlySet<string>,
  knownClaimIds: ReadonlySet<string>,
  knownRuleIds: ReadonlySet<string>,
): { storedDerivedStatusKeyCount: number; reviewReferenceViolationCount: number } {
  let storedDerivedStatusKeyCount = 0;
  let reviewReferenceViolationCount = 0;

  ontology.fixturePlan.fixtures.forEach((fixture, index) => {
    for (const issue of validateFixture(fixture, ONTOLOGY_FILES.fixturePlan, index)) {
      issues.push(issue);
      if (issue.code === "stored-derived-status") storedDerivedStatusKeyCount += 1;
    }

    (fixture.reviews ?? []).forEach((review, ri) => {
      const cite = (ids: readonly string[] | undefined, known: ReadonlySet<string>, kind: string) => {
        for (const id of ids ?? []) {
          if (!known.has(id)) {
            reviewReferenceViolationCount += 1;
            issues.push({ severity: "error", code: "review-reference-unresolved", file: ONTOLOGY_FILES.fixturePlan, path: `${fixture.fixtureId}.reviews[${ri}]`, message: `review ${kind} '${id}' does not resolve` });
          }
        }
      };
      cite(review.sourceIds, knownSourceIds, "sourceId");
      cite(review.claimIds, knownClaimIds, "claimId");
      cite(review.expectedEffectiveRuleIds, knownRuleIds, "expectedEffectiveRuleId");
      cite(review.forbiddenRuleIds, knownRuleIds, "forbiddenRuleId");
    });
  });

  return { storedDerivedStatusKeyCount, reviewReferenceViolationCount };
}

/** D: reject any effective rule effect whose (dimension, operation) is invalid. */
function checkRuleCompatibility(
  ontology: HuyenKhiOntology,
  issues: HuyenKhiValidationIssue[],
): number {
  let count = 0;
  for (const rule of ontology.rules) {
    rule.effects.forEach((effect, index) => {
      if (!isCompatible(ontology.dimensionOperationCompatibility, effect.dimension, effect.operation)) {
        count += 1;
        issues.push({ severity: "error", code: "incompatible-operation-dimension", file: "rules", path: `${rule.ruleId}.effects[${index}]`, message: `operation '${effect.operation}' incompatible with dimension '${effect.dimension}'` });
      }
    });
  }
  return count;
}

// ── Conflict analysis (§8, A3) ──────────────────────────────────────────────

export interface RuleConflict {
  readonly ruleA: string;
  readonly ruleB: string;
  readonly dimension: string;
  readonly reason: string;
}

export interface ConflictAnalysis {
  readonly unresolved: readonly RuleConflict[];
  readonly suppressed: readonly RuleConflict[];
}

const OPPOSITES: Record<string, string> = {
  strengthen: "weaken",
  weaken: "strengthen",
  stabilize: "destabilize",
  destabilize: "stabilize",
  block: "release",
  release: "block",
  restrict: "release",
  nourish: "deplete",
  deplete: "nourish",
  regulate: "overwhelm",
  overwhelm: "regulate",
};

/**
 * Pairwise conflict detection WITHIN a single activation context. Suppression
 * is honored only when explicitly declared with matching target/dimension;
 * specificity never silently suppresses (silent resolution stays zero).
 */
export function analyzeRuleConflicts(
  rules: readonly HuyenKhiRule[],
): ConflictAnalysis {
  const unresolved: RuleConflict[] = [];
  const suppressed: RuleConflict[] = [];

  for (let i = 0; i < rules.length; i += 1) {
    for (let j = i + 1; j < rules.length; j += 1) {
      const a = rules[i]!;
      const b = rules[j]!;
      for (const ea of a.effects) {
        for (const eb of b.effects) {
          if (ea.dimension !== eb.dimension) continue;
          if (!sameTarget(ea.targetFactSelector, eb.targetFactSelector)) continue;
          if (OPPOSITES[ea.operation] !== eb.operation) continue;

          // Canonical order so ruleA/ruleB and the reason are independent of the
          // input order — reports stay byte-for-byte deterministic.
          const [first, second] =
            a.ruleId <= b.ruleId
              ? [{ rule: a, effect: ea }, { rule: b, effect: eb }]
              : [{ rule: b, effect: eb }, { rule: a, effect: ea }];
          const conflict: RuleConflict = {
            ruleA: first.rule.ruleId,
            ruleB: second.rule.ruleId,
            dimension: ea.dimension,
            reason: `${first.rule.ruleId}:${first.effect.operation} opposes ${second.rule.ruleId}:${second.effect.operation} on ${ea.dimension} of same target`,
          };
          if (declaresSuppression(a, b) || declaresSuppression(b, a)) {
            suppressed.push(conflict);
          } else {
            unresolved.push(conflict);
          }
        }
      }
    }
  }
  return { unresolved, suppressed };
}

/**
 * A3: conflicts are only meaningful inside an activation context. Nam Phái and
 * Trung Châu never co-activate, so a nam-phai-only rule and a trung-chau-only
 * rule are NOT a runtime conflict. A shared rule may conflict with either.
 */
export function analyzeConflictsInActivationContexts(
  rules: readonly HuyenKhiRule[],
): ConflictAnalysis {
  const unresolved = new Map<string, RuleConflict>();
  const suppressed = new Map<string, RuleConflict>();
  const key = (c: RuleConflict) =>
    [c.ruleA, c.ruleB].sort().join("|") + "|" + c.dimension;

  for (const school of ["nam-phai", "trung-chau"] as const) {
    const analysis = analyzeRuleConflicts(rulesVisibleToSchool(rules, school));
    for (const c of analysis.unresolved) unresolved.set(key(c), c);
    for (const c of analysis.suppressed) suppressed.set(key(c), c);
  }
  return {
    unresolved: [...unresolved.values()].sort((a, b) => key(a).localeCompare(key(b))),
    suppressed: [...suppressed.values()].sort((a, b) => key(a).localeCompare(key(b))),
  };
}

function sameTarget(
  a: Readonly<Record<string, unknown>> | undefined,
  b: Readonly<Record<string, unknown>> | undefined,
): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function declaresSuppression(a: HuyenKhiRule, b: HuyenKhiRule): boolean {
  return (a.suppressesRuleIds ?? []).includes(b.ruleId);
}

/** Rules visible to a school evaluator: shared + own only, never the other. */
export function rulesVisibleToSchool(
  rules: readonly HuyenKhiRule[],
  school: Exclude<HuyenKhiSchoolProfile, "shared">,
): readonly HuyenKhiRule[] {
  return rules.filter((r) => r.schoolProfile === "shared" || r.schoolProfile === school);
}
