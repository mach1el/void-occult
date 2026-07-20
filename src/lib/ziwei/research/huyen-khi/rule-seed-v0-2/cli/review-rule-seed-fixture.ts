import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { loadHuyenKhiOntology } from "../../ontology/load-ontology";
import {
  appendFixtureReview,
  isReviewSchoolCompatible,
  validateFixture,
  validateReview,
} from "../../ontology/validate-fixture";
import type {
  HuyenKhiExpertFixture,
  HuyenKhiExpertFixturePlan,
  HuyenKhiFixtureReview,
  HuyenKhiSchoolProfile,
} from "../../ontology/types";
import { RULE_SEED_DIR } from "../paths";

const ROLES = ["researcher", "source-reviewer", "school-expert", "adjudicator"] as const;
const SCHOOLS = ["shared", "nam-phai", "trung-chau"] as const;
const DECISIONS = ["reviewed", "approved", "disputed"] as const;

function args(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((argument, index) => {
    if (argument === `--${name}`) {
      const value = process.argv[index + 1];
      if (value !== undefined) out.push(value);
    }
  });
  return out;
}

function arg(name: string): string | undefined {
  return args(name)[0];
}

function fail(message: string): never {
  process.stderr.write(`review-rule-seed-fixture-v02: ${message}\n`);
  process.exit(1);
}

function requireArg(name: string): string {
  const value = arg(name);
  if (!value) fail(`--${name} is required`);
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
  const values = args(name);
  return values.length > 0 ? values : undefined;
}

function main(): void {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    fail(
      `ontology fails to load; refusing to write: ${loaded.issues
        .map((issue) => issue.code)
        .join(", ")}`,
    );
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

  const reviewIssues = validateReview(review);
  if (reviewIssues.length > 0) {
    fail(reviewIssues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  }

  const knownSources = new Set(
    ontology.sourceRegistry.sources.map((source) => source.sourceId),
  );
  const knownClaims = new Set(
    ontology.claimRegistry.claims.map((claim) => claim.claimId),
  );
  for (const sourceId of review.sourceIds ?? []) {
    if (!knownSources.has(sourceId)) {
      fail(`--source '${sourceId}' does not resolve to a registered source`);
    }
  }
  for (const claimId of review.claimIds ?? []) {
    if (!knownClaims.has(claimId)) {
      fail(`--claim '${claimId}' does not resolve to a registered claim`);
    }
  }

  const planPath = path.join(
    RULE_SEED_DIR,
    "fixture-materialization-plan.v0.2.json",
  );
  const parsed: unknown = JSON.parse(readFileSync(planPath, "utf-8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { fixtures?: unknown }).fixtures)
  ) {
    fail("fixture plan is malformed (expected { fixtures: [...] })");
  }
  const plan = parsed as HuyenKhiExpertFixturePlan;
  const fixtureIndex = plan.fixtures.findIndex(
    (fixture) => fixture.fixtureId === fixtureId,
  );
  if (fixtureIndex < 0) fail(`fixture '${fixtureId}' not found in V0.2 plan`);

  const fixture = plan.fixtures[fixtureIndex]!;
  if (
    !isReviewSchoolCompatible(
      fixture.schoolProfile,
      review.schoolProfile as HuyenKhiSchoolProfile,
    )
  ) {
    fail(
      `review school '${review.schoolProfile}' is not compatible with the ${fixture.schoolProfile} fixture '${fixtureId}'`,
    );
  }
  if (
    (fixture.reviews ?? []).some(
      (existing) =>
        existing.reviewerId === review.reviewerId &&
        existing.reviewedAt === review.reviewedAt,
    )
  ) {
    fail(
      `reviewer '${review.reviewerId}' already has a review at '${review.reviewedAt}' on '${fixtureId}'`,
    );
  }

  const updated = appendFixtureReview(fixture, review);
  const updatedIssues = validateFixture(
    updated,
    "fixture-materialization-plan.v0.2.json",
    fixtureIndex,
  ).filter((issue) => issue.severity === "error");
  if (updatedIssues.length > 0) {
    fail(
      `updated fixture is invalid; nothing written:\n${updatedIssues
        .map((issue) => `  [${issue.code}] ${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
  }

  const fixtures: HuyenKhiExpertFixture[] = [...plan.fixtures];
  fixtures[fixtureIndex] = updated;
  const nextPlan: HuyenKhiExpertFixturePlan = { ...plan, fixtures };
  const temporaryPath = `${planPath}.tmp-${process.pid}`;
  writeFileSync(
    temporaryPath,
    `${JSON.stringify(nextPlan, null, 2)}\n`,
    "utf-8",
  );
  renameSync(temporaryPath, planPath);

  process.stdout.write(
    `Appended ${review.decision} review by ${review.reviewerId} to ${fixtureId}. Ledger now has ${updated.reviews?.length ?? 0} review(s).\n`,
  );
}

main();
