/**
 * CLI: append an expert review to a fixture (never overwrites earlier reviews).
 *   npm run research:huyen-khi:review-fixture -- \
 *     --fixture HK-FIX-001-MAJOR-MIEU-SUPPORT \
 *     --reviewer expert-a --role school-expert --school shared \
 *     --decision reviewed --rationale "..." [--source HK-SRC-… --claim HK-CLM-…]
 *
 * Every argument is validated BEFORE anything is written:
 *   - role/school/decision enums + timestamp semantics + reviewer-id pattern;
 *   - school compatibility with the fixture (no cross-school fallback);
 *   - source/claim IDs must resolve; rule IDs are rejected (no effective rules);
 *   - duplicate (reviewer + timestamp) identity is rejected;
 *   - the fully updated fixture and plan are re-validated.
 * On ANY failure the file is left untouched. The write is atomic (temp + rename).
 * Reviewer status is DERIVED from the ledger, never stored.
 */

import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { loadHuyenKhiOntology } from "../load-ontology";
import { ONTOLOGY_DIR, ONTOLOGY_FILES } from "../paths";
import {
  appendFixtureReview,
  isReviewSchoolCompatible,
  validateFixture,
  validateReview,
} from "../validate-fixture";
import type {
  HuyenKhiExpertFixture,
  HuyenKhiExpertFixturePlan,
  HuyenKhiFixtureReview,
  HuyenKhiSchoolProfile,
} from "../types";

const ROLES = ["researcher", "source-reviewer", "school-expert", "adjudicator"] as const;
const SCHOOLS = ["shared", "nam-phai", "trung-chau"] as const;
const DECISIONS = ["reviewed", "approved", "disputed"] as const;

function args(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}`) {
      const v = process.argv[i + 1];
      if (v !== undefined) out.push(v);
    }
  });
  return out;
}

function arg(name: string): string | undefined {
  return args(name)[0];
}

function fail(message: string): never {
  process.stderr.write(`review-fixture: ${message}\n`);
  process.exit(1);
}

function requireArg(name: string): string {
  const value = arg(name);
  if (value === undefined || value === "") fail(`--${name} is required`);
  return value;
}

function requireEnum<T extends string>(name: string, allowed: readonly T[]): T {
  const value = requireArg(name);
  if (!(allowed as readonly string[]).includes(value)) {
    fail(`--${name} must be one of [${allowed.join(", ")}]; got '${value}'`);
  }
  return value as T;
}

function optionalArray(name: string): string[] | undefined {
  const v = args(name);
  return v.length > 0 ? v : undefined;
}

function main(): void {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    fail(`ontology fails to load; refusing to write: ${loaded.issues.map((i) => i.code).join(", ")}`);
  }
  const ontology = loaded.ontology;

  const fixtureId = requireArg("fixture");
  const review: HuyenKhiFixtureReview = {
    reviewerId: requireArg("reviewer"),
    role: requireEnum("role", ROLES),
    schoolProfile: requireEnum("school", SCHOOLS),
    decision: requireEnum("decision", DECISIONS),
    rationale: requireArg("rationale"),
    reviewedAt: arg("at") ?? new Date().toISOString(),
    ...(optionalArray("source") ? { sourceIds: optionalArray("source") } : {}),
    ...(optionalArray("claim") ? { claimIds: optionalArray("claim") } : {}),
  };

  // 1. Schema + semantic validation of the review record.
  const reviewIssues = validateReview(review);
  if (reviewIssues.length > 0) {
    fail(reviewIssues.map((i) => `${i.path}: ${i.message}`).join("; "));
  }

  // 2. Registry resolution — sources/claims must resolve; rule IDs are rejected.
  const knownSources = new Set(ontology.sourceRegistry.sources.map((s) => s.sourceId));
  const knownClaims = new Set(ontology.claimRegistry.claims.map((c) => c.claimId));
  for (const id of review.sourceIds ?? []) {
    if (!knownSources.has(id)) fail(`--source '${id}' does not resolve to a registered source`);
  }
  for (const id of review.claimIds ?? []) {
    if (!knownClaims.has(id)) fail(`--claim '${id}' does not resolve to a registered claim`);
  }

  // 3. Locate the target fixture (from the loaded, validated plan).
  const fixture = ontology.fixturePlan.fixtures.find((f) => f.fixtureId === fixtureId);
  if (!fixture) fail(`fixture '${fixtureId}' not found`);

  // 4. School compatibility — no cross-school fallback.
  if (!isReviewSchoolCompatible(fixture.schoolProfile, review.schoolProfile as HuyenKhiSchoolProfile)) {
    fail(`review school '${review.schoolProfile}' is not compatible with the ${fixture.schoolProfile} fixture '${fixtureId}'`);
  }

  // 5. Reject a duplicate (reviewer + timestamp) identity in the ledger.
  if ((fixture.reviews ?? []).some((r) => r.reviewerId === review.reviewerId && r.reviewedAt === review.reviewedAt)) {
    fail(`reviewer '${review.reviewerId}' already has a review at '${review.reviewedAt}' on '${fixtureId}'`);
  }

  // 6. Read the on-disk plan for writing; validate its shape too.
  const planPath = path.join(ONTOLOGY_DIR, ONTOLOGY_FILES.fixturePlan);
  const parsed: unknown = JSON.parse(readFileSync(planPath, "utf-8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { fixtures?: unknown }).fixtures)
  ) {
    fail("fixture plan is malformed (expected { fixtures: [...] })");
  }
  const plan = parsed as HuyenKhiExpertFixturePlan;
  const index = plan.fixtures.findIndex((f) => f.fixtureId === fixtureId);
  if (index < 0) fail(`fixture '${fixtureId}' not found in on-disk plan`);

  const updated = appendFixtureReview(plan.fixtures[index]!, review);
  const fixtures: HuyenKhiExpertFixture[] = [...plan.fixtures];
  fixtures[index] = updated;
  const nextPlan: HuyenKhiExpertFixturePlan = { ...plan, fixtures };

  // 7. Re-validate the fully updated fixture before writing anything.
  const updatedIssues = validateFixture(updated, ONTOLOGY_FILES.fixturePlan, index).filter((i) => i.severity === "error");
  if (updatedIssues.length > 0) {
    fail(`updated fixture is invalid; nothing written:\n${updatedIssues.map((i) => `  [${i.code}] ${i.path}: ${i.message}`).join("\n")}`);
  }

  // 8. Atomic write: serialize to a temp file, then rename over the target.
  const tmpPath = `${planPath}.tmp-${process.pid}`;
  writeFileSync(tmpPath, `${JSON.stringify(nextPlan, null, 2)}\n`, "utf-8");
  renameSync(tmpPath, planPath);

  process.stdout.write(
    `Appended ${review.decision} review by ${review.reviewerId} to ${fixtureId}. Ledger now has ${updated.reviews?.length ?? 0} review(s).\n`,
  );
}

main();
