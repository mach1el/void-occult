/**
 * Deterministic report generators (§13).
 *
 * Reports distinguish schema-valid / source-reviewed / expert-reviewed /
 * approved / disputed / unresolved — schema validity is NEVER equated with
 * approved knowledge. Output is byte-stable: no timestamps, arrays sorted,
 * object keys built in fixed order, 2-space JSON with trailing newline.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { ONTOLOGY_REPORTS_DIR } from "../paths";
import { validateOntology } from "../validate-ontology";
import { analyzeConflictsInActivationContexts } from "../validate-ontology";
import { countFixtureMaturity, countFixtureStatuses, promotionContext } from "../validate-fixture";
import { scanNamespaceBoundary } from "../namespace-scan";
import type { HuyenKhiOntology, HuyenKhiValidationIssue } from "../types";

const KNOWLEDGE_STATUS_LEGEND = [
  "schema-valid: structurally conforms; NOT approved knowledge",
  "source-reviewed: a locator + source review exists",
  "expert-reviewed: a school-expert review exists",
  "approved: meets promotion review requirements",
  "disputed: conflicting reviews retained; excluded from promotion",
  "unresolved: relationship or provenance not settled",
] as const;

function sortIssues(
  issues: readonly HuyenKhiValidationIssue[],
): HuyenKhiValidationIssue[] {
  return [...issues].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.code.localeCompare(b.code) ||
      a.path.localeCompare(b.path) ||
      a.message.localeCompare(b.message),
  );
}

export function buildReports(): Record<string, unknown> {
  const result = validateOntology();
  const ontology = result.ontology;
  if (!ontology) {
    return {
      "ontology-validation-report.v0.1.json": {
        reportId: "huyen-khi-ontology-validation-report-v0-1",
        ok: false,
        issues: sortIssues(result.issues),
      },
    };
  }

  return {
    "ontology-validation-report.v0.1.json": ontologyValidationReport(result.issues, result.summary, result.ok),
    "source-coverage-report.v0.1.json": sourceCoverageReport(ontology),
    "claim-coverage-report.v0.1.json": claimCoverageReport(ontology),
    "rule-coverage-report.v0.1.json": ruleCoverageReport(ontology),
    "rule-conflict-report.v0.1.json": ruleConflictReport(ontology),
    "fixture-coverage-report.v0.1.json": fixtureCoverageReport(ontology),
    "school-isolation-report.v0.1.json": schoolIsolationReport(ontology),
    "namespace-boundary-report.v0.1.json": namespaceBoundaryReport(ontology),
  };
}

function ontologyValidationReport(
  issues: readonly HuyenKhiValidationIssue[],
  summary: unknown,
  ok: boolean,
): unknown {
  return {
    reportId: "huyen-khi-ontology-validation-report-v0-1",
    knowledgeStatusLegend: KNOWLEDGE_STATUS_LEGEND,
    ok,
    summary,
    errorCount: issues.filter((i) => i.severity === "error").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    issues: sortIssues(issues),
  };
}

function sourceCoverageReport(ontology: HuyenKhiOntology): unknown {
  const claimRefs = new Map<string, number>();
  for (const claim of ontology.claimRegistry.claims) {
    for (const id of claim.sourceIds) claimRefs.set(id, (claimRefs.get(id) ?? 0) + 1);
  }
  const sources = [...ontology.sourceRegistry.sources]
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
    .map((s) => ({
      sourceId: s.sourceId,
      kind: s.kind,
      status: s.status,
      referencedByClaimCount: claimRefs.get(s.sourceId) ?? 0,
      hasAllowedUsage: Array.isArray(s.allowedUsage) && s.allowedUsage.length > 0,
      hasProhibitedUsage: Array.isArray(s.prohibitedUsage) && s.prohibitedUsage.length > 0,
    }));
  const byKind = countBy(ontology.sourceRegistry.sources.map((s) => s.kind));
  return {
    reportId: "huyen-khi-source-coverage-report-v0-1",
    sourceCount: sources.length,
    byKind,
    externalBenchmarkIsRuntimeForbidden: true,
    sources,
  };
}

function claimCoverageReport(ontology: HuyenKhiOntology): unknown {
  const byStatus = countBy(ontology.claimRegistry.claims.map((c) => c.status));
  const claims = [...ontology.claimRegistry.claims]
    .sort((a, b) => a.claimId.localeCompare(b.claimId))
    .map((c) => ({
      claimId: c.claimId,
      status: c.status,
      sourceCount: c.sourceIds.length,
      hasLocator: c.locator !== undefined && Object.keys(c.locator).length > 0,
    }));
  return {
    reportId: "huyen-khi-claim-coverage-report-v0-1",
    claimCount: claims.length,
    byStatus,
    note: "status is doctrinal standing; not schema validity",
    claims,
  };
}

function ruleCoverageReport(ontology: HuyenKhiOntology): unknown {
  return {
    reportId: "huyen-khi-rule-coverage-report-v0-1",
    effectiveRuleCount: ontology.rules.length,
    byStatus: countBy(ontology.rules.map((r) => r.status)),
    fullyTraceableCount: 0,
    note: "V0.1 loads no effective rules; no evaluator exists",
  };
}

function ruleConflictReport(ontology: HuyenKhiOntology): unknown {
  const conflicts = analyzeConflictsInActivationContexts(ontology.rules);
  return {
    reportId: "huyen-khi-rule-conflict-report-v0-1",
    activationContexts: ["shared+nam-phai", "shared+trung-chau"],
    unresolvedConflictCount: conflicts.unresolved.length,
    suppressedConflictCount: conflicts.suppressed.length,
    silentResolutionCount: 0,
    silentResolutionForbidden: ontology.ruleConflictPolicy.silentResolutionForbidden,
    unresolved: [...conflicts.unresolved].sort((a, b) => `${a.ruleA}${a.ruleB}`.localeCompare(`${b.ruleA}${b.ruleB}`)),
  };
}

function fixtureCoverageReport(ontology: HuyenKhiOntology): unknown {
  const status = countFixtureStatuses(ontology.fixturePlan, promotionContext(ontology));
  const maturity = countFixtureMaturity(ontology.fixturePlan);
  const byCategory = countBy(ontology.fixturePlan.fixtures.map((f) => f.category));
  const bySchool = countBy(ontology.fixturePlan.fixtures.map((f) => f.schoolProfile));
  return {
    reportId: "huyen-khi-fixture-coverage-report-v0-1",
    note: "derivedStatus counts come only from eligible reviews in the append-only ledger; maturity is the authoring stage; only a reviewable fixture with distinct eligible approvers can be approved",
    templateCount: status.total,
    derivedStatus: {
      draft: status.draft,
      reviewed: status.reviewed,
      approved: status.approved,
      disputed: status.disputed,
      approvedForPromotion: status.approvedForPromotion,
    },
    reviewEligibility: {
      ineligibleReviewCount: status.ineligibleReviewCount,
      schoolIncompatibleReviewCount: status.schoolIncompatibleReviewCount,
      unresolvedReviewReferenceCount: status.unresolvedReviewReferenceCount,
      distinctApprovedReviewerCount: status.distinctApprovedReviewerCount,
    },
    maturity,
    minimumApprovedRequiredForNextPhase: ontology.fixturePlan.minimumApprovedRequiredForNextPhase,
    meetsTemplateMinimum: status.total >= 30,
    meetsApprovedPromotionGate: status.approvedForPromotion >= ontology.fixturePlan.minimumApprovedRequiredForNextPhase,
    byCategory,
    bySchool,
  };
}

function schoolIsolationReport(ontology: HuyenKhiOntology): unknown {
  const policy = ontology.schoolPolicy;
  const profiles = Object.entries(policy.profiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, cfg]) => ({
      profile: name,
      ruleFallbackToOtherSchool: cfg.ruleFallbackToOtherSchool ?? false,
      inheritsSharedFacts: cfg.inheritsSharedFacts ?? false,
    }));
  return {
    reportId: "huyen-khi-school-isolation-report-v0-1",
    missingProfileBehavior: policy.missingProfileBehavior,
    crossSchoolFallbackCount: profiles.filter((p) => p.ruleFallbackToOtherSchool && p.profile !== "shared").length,
    profiles,
  };
}

function namespaceBoundaryReport(ontology: HuyenKhiOntology): unknown {
  const scan = scanNamespaceBoundary();
  return {
    reportId: "huyen-khi-namespace-boundary-report-v0-1",
    filesScanned: scan.filesScanned,
    clean: scan.clean,
    forbiddenImportHits: [...scan.forbiddenImportHits].sort((a, b) => `${a.file}${a.line}`.localeCompare(`${b.file}${b.line}`)),
    networkHits: [...scan.networkHits].sort((a, b) => `${a.file}${a.line}`.localeCompare(`${b.file}${b.line}`)),
    forbiddenRuntimeDependencies: [...ontology.manifest.forbiddenRuntimeDependencies].sort(),
    allowedNeutralImport: "@/lib/ziwei/analysis/facts/types",
  };
}

function countBy(values: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of [...values].sort()) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** Serialize byte-stably: 2-space JSON with a single trailing newline. */
export function serializeReport(report: unknown): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function writeReports(): { readonly written: readonly string[] } {
  const reports = buildReports();
  mkdirSync(ONTOLOGY_REPORTS_DIR, { recursive: true });
  const written: string[] = [];
  for (const [name, report] of Object.entries(reports)) {
    writeFileSync(path.join(ONTOLOGY_REPORTS_DIR, name), serializeReport(report), "utf-8");
    written.push(name);
  }
  return { written: written.sort() };
}
