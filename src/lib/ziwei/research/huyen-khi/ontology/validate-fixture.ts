/**
 * Expert fixture validation + review-eligibility workflow (A1, A2, G, §2–§3).
 *
 * Fixtures are scenario templates, NOT approved answers. `maturity` is an
 * authoring stage set by hand; promotion status (reviewed/approved/disputed) is
 * DERIVED from the append-only review ledger — a manually written status can
 * never satisfy the promotion gate, and only reviews that are structurally
 * valid, school-compatible and provenance-resolved contribute. Reviews are
 * appended, never overwritten; disagreement is retained (disputed), never
 * averaged; disputed fixtures are excluded from the approved count. Approval
 * requires DISTINCT eligible reviewers. Only a `reviewable` fixture can be
 * approved. Fixtures carry no personal birth data.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { ONTOLOGY_SCHEMAS_DIR } from "./paths";
import { validateAgainstSchema, type JsonSchema } from "./schema-validator";
import { scanForbiddenScoringKeys } from "./numeric-key-scan";
import type {
  HuyenKhiDerivedFixtureStatus,
  HuyenKhiExpertFixture,
  HuyenKhiExpertFixturePlan,
  HuyenKhiFixtureMaturity,
  HuyenKhiFixtureReview,
  HuyenKhiOntology,
  HuyenKhiReviewRole,
  HuyenKhiSchoolProfile,
  HuyenKhiValidationIssue,
} from "./types";

let fixtureSchema: JsonSchema | null = null;
function getFixtureSchema(): JsonSchema {
  if (!fixtureSchema) {
    fixtureSchema = JSON.parse(
      readFileSync(path.join(ONTOLOGY_SCHEMAS_DIR, "expert-fixture.schema.v0.1.json"), "utf-8"),
    ) as JsonSchema;
  }
  return fixtureSchema;
}

/** The review sub-schema, extracted from the fixture schema. */
function getReviewSchema(): JsonSchema {
  const reviews = getFixtureSchema().properties?.reviews;
  const items = (reviews as JsonSchema | undefined)?.items;
  if (!items) throw new Error("fixture schema missing reviews.items");
  return items;
}

const PERSONAL_DATA_KEYS = [
  "solardate",
  "birthdate",
  "birthhour",
  "birthtime",
  "gender",
  "name",
  "fullname",
  "dob",
  "lunardate",
];

/**
 * Stored derived-status fields are forbidden anywhere in fixture data (A1 /
 * §2.1). Promotion status is derived, never stored — a hand-written value here
 * must never be able to satisfy a promotion gate. The schema already rejects
 * them (additionalProperties: false); this scan is a defence-in-depth guard
 * that also covers nested objects.
 */
const FORBIDDEN_STATUS_KEYS = [
  "reviewerstatus",
  "approvalstatus",
  "approved",
  "promotionready",
  "promotionstatus",
  "derivedstatus",
  "isapproved",
];

const ROLES: readonly HuyenKhiReviewRole[] = [
  "researcher",
  "source-reviewer",
  "school-expert",
  "adjudicator",
];
const SCHOOLS: readonly HuyenKhiSchoolProfile[] = ["shared", "nam-phai", "trung-chau"];
const DECISIONS = ["reviewed", "approved", "disputed"] as const;
const REVIEWER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

const RESEARCH_READY_REQUIRED = [
  "researchQuestion",
  "candidateSourceIds",
  "expectedEvidence",
] as const;

const REVIEWABLE_REQUIRED = ["rationale"] as const;

export function validateFixture(
  fixture: unknown,
  file = "expert-fixture-plan.v0.1.json",
  index = 0,
): HuyenKhiValidationIssue[] {
  const issues: HuyenKhiValidationIssue[] = [];
  const base = `$.fixtures[${index}]`;

  for (const v of validateAgainstSchema(fixture, getFixtureSchema(), base)) {
    issues.push({ severity: "error", code: "schema-invalid", file, path: v.path, message: v.message });
  }
  for (const hit of scanForbiddenScoringKeys(fixture, base)) {
    issues.push({ severity: "error", code: "numeric-scoring-key", file, path: hit.path, message: `forbidden scoring key '${hit.key}'` });
  }
  scanPersonalKeys(fixture, base).forEach((p) =>
    issues.push({ severity: "error", code: "personal-data", file, path: p.path, message: `possible personal-chart key '${p.key}'` }),
  );
  scanForbiddenStatusKeys(fixture, base).forEach((p) =>
    issues.push({ severity: "error", code: "stored-derived-status", file, path: p.path, message: `stored derived-status field '${p.key}' is forbidden; status is derived from reviews` }),
  );

  // Maturity-stage requirements (A/G). Only run when the object is shaped.
  if (!issues.some((i) => i.code === "schema-invalid") && isFixture(fixture)) {
    issues.push(...validateMaturityRequirements(fixture, file, base));
    // Every review record must also satisfy the review sub-schema + semantics.
    (fixture.reviews ?? []).forEach((review, ri) => {
      const rp = `${base}.reviews[${ri}]`;
      for (const v of validateAgainstSchema(review, getReviewSchema(), rp)) {
        issues.push({ severity: "error", code: "schema-invalid", file, path: v.path, message: v.message });
      }
      for (const msg of reviewSemanticViolations(review)) {
        issues.push({ severity: "error", code: "schema-invalid", file, path: rp, message: msg });
      }
    });
  }

  return issues;
}

function isFixture(value: unknown): value is HuyenKhiExpertFixture {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).maturity === "string"
  );
}

/** research-ready and reviewable stages must carry their required content. */
function validateMaturityRequirements(
  fixture: HuyenKhiExpertFixture,
  file: string,
  base: string,
): HuyenKhiValidationIssue[] {
  const issues: HuyenKhiValidationIssue[] = [];
  const maturity: HuyenKhiFixtureMaturity = fixture.maturity;
  const needsResearch = maturity === "research-ready" || maturity === "reviewable";
  const needsReviewable = maturity === "reviewable";
  const record = fixture as unknown as Record<string, unknown>;

  const missing = (key: string) => {
    const v = record[key];
    return v === undefined || (Array.isArray(v) && v.length === 0) || v === "";
  };

  if (needsResearch) {
    if (Object.keys(fixture.inputFacts ?? {}).length === 0) {
      issues.push({ severity: "error", code: "maturity-incomplete", file, path: `${base}.inputFacts`, message: `${maturity} requires non-empty canonical input facts` });
    }
    for (const key of RESEARCH_READY_REQUIRED) {
      if (missing(key)) {
        issues.push({ severity: "error", code: "maturity-incomplete", file, path: `${base}.${key}`, message: `${maturity} requires '${key}'` });
      }
    }
  }
  if (needsReviewable) {
    for (const key of REVIEWABLE_REQUIRED) {
      if (missing(key)) {
        issues.push({ severity: "error", code: "maturity-incomplete", file, path: `${base}.${key}`, message: `reviewable requires '${key}'` });
      }
    }
    if (!hasProposedExpectations(fixture)) {
      issues.push({ severity: "error", code: "maturity-incomplete", file, path: `${base}`, message: `reviewable requires proposed expected dimensions and/or expected/forbidden rule IDs` });
    }
  }
  return issues;
}

function hasProposedExpectations(fixture: HuyenKhiExpertFixture): boolean {
  return (
    (fixture.expectedEffectiveRuleIds?.length ?? 0) > 0 ||
    (fixture.forbiddenRuleIds?.length ?? 0) > 0 ||
    Object.keys(fixture.expectedState ?? {}).length > 0
  );
}

function scanPersonalKeys(value: unknown, basePath: string): { path: string; key: string }[] {
  return scanKeys(value, basePath, PERSONAL_DATA_KEYS);
}

function scanForbiddenStatusKeys(value: unknown, basePath: string): { path: string; key: string }[] {
  return scanKeys(value, basePath, FORBIDDEN_STATUS_KEYS);
}

function scanKeys(
  value: unknown,
  basePath: string,
  forbidden: readonly string[],
): { path: string; key: string }[] {
  const out: { path: string; key: string }[] = [];
  const set = new Set(forbidden);
  const walk = (v: unknown, p: string) => {
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${p}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [key, child] of Object.entries(v as Record<string, unknown>)) {
        if (set.has(key.toLowerCase())) {
          out.push({ path: `${p}.${key}`, key });
        }
        walk(child, `${p}.${key}`);
      }
    }
  };
  walk(value, basePath);
  return out;
}

/**
 * Semantic review checks the JSON-subset schema cannot express: a real UTC
 * timestamp (not merely pattern-shaped), and enum sanity. Referential
 * integrity of review IDs is checked separately where the registry is known.
 */
export function reviewSemanticViolations(review: unknown): string[] {
  const out: string[] = [];
  if (typeof review !== "object" || review === null) return ["review must be an object"];
  const r = review as Record<string, unknown>;

  if (typeof r.reviewedAt !== "string" || !TIMESTAMP_PATTERN.test(r.reviewedAt)) {
    out.push("reviewedAt must be an ISO-8601 UTC timestamp (…Z)");
  } else if (!Number.isFinite(Date.parse(r.reviewedAt))) {
    out.push(`reviewedAt '${r.reviewedAt}' is not a real calendar instant`);
  } else if (new Date(r.reviewedAt).toISOString().slice(0, 19) !== r.reviewedAt.slice(0, 19)) {
    // Rejects impossible dates that Date.parse silently rolls over (e.g. month 13).
    out.push(`reviewedAt '${r.reviewedAt}' is not a valid calendar date`);
  }
  return out;
}

/** Validate a single review object against the review sub-schema (A2, CLI). */
export function validateReview(review: unknown): HuyenKhiValidationIssue[] {
  const issues: HuyenKhiValidationIssue[] = validateAgainstSchema(review, getReviewSchema(), "$review").map((v) => ({
    severity: "error" as const,
    code: "schema-invalid",
    file: "review",
    path: v.path,
    message: v.message,
  }));
  for (const msg of reviewSemanticViolations(review)) {
    issues.push({ severity: "error", code: "schema-invalid", file: "review", path: "$review", message: msg });
  }
  return issues;
}

/** Append a review WITHOUT overwriting earlier ones. Returns a NEW fixture. */
export function appendFixtureReview(
  fixture: HuyenKhiExpertFixture,
  review: HuyenKhiFixtureReview,
): HuyenKhiExpertFixture {
  return { ...fixture, reviews: sortReviews([...(fixture.reviews ?? []), review]) };
}

/** Order-independent: sort by reviewer then timestamp then decision. */
function sortReviews(
  reviews: readonly HuyenKhiFixtureReview[],
): HuyenKhiFixtureReview[] {
  return [...reviews].sort((a, b) =>
    a.reviewerId !== b.reviewerId
      ? a.reviewerId.localeCompare(b.reviewerId)
      : a.reviewedAt !== b.reviewedAt
        ? a.reviewedAt.localeCompare(b.reviewedAt)
        : a.decision.localeCompare(b.decision),
  );
}

// ── Promotion eligibility (§2) ───────────────────────────────────────────────

/** Registry knowledge needed to judge whether a review's references resolve. */
export interface PromotionContext {
  readonly knownSourceIds: ReadonlySet<string>;
  readonly knownClaimIds: ReadonlySet<string>;
  /** Effective rule IDs — empty in V0.1, so any rule reference fails closed. */
  readonly effectiveRuleIds: ReadonlySet<string>;
}

export function promotionContext(ontology: HuyenKhiOntology): PromotionContext {
  return {
    knownSourceIds: new Set(ontology.sourceRegistry.sources.map((s) => s.sourceId)),
    knownClaimIds: new Set(ontology.claimRegistry.claims.map((c) => c.claimId)),
    effectiveRuleIds: new Set(ontology.rules.map((r) => r.ruleId)),
  };
}

const EMPTY_CONTEXT: PromotionContext = {
  knownSourceIds: new Set(),
  knownClaimIds: new Set(),
  effectiveRuleIds: new Set(),
};

/** Per §2.4 — no cross-school fallback; school-specific never approves another. */
export function isReviewSchoolCompatible(
  fixtureSchool: HuyenKhiSchoolProfile,
  reviewSchool: HuyenKhiSchoolProfile,
): boolean {
  switch (fixtureSchool) {
    case "shared":
      // A shared fixture needs a shared consensus; a school-specific review may
      // be retained but cannot alone establish it.
      return reviewSchool === "shared";
    case "nam-phai":
      return reviewSchool === "nam-phai" || reviewSchool === "shared";
    case "trung-chau":
      return reviewSchool === "trung-chau" || reviewSchool === "shared";
  }
}

export interface FixtureReviewEligibility {
  readonly structurallyValid: boolean;
  readonly schoolCompatible: boolean;
  readonly provenanceResolved: boolean;
  readonly eligibleForReviewed: boolean;
  readonly eligibleForApproval: boolean;
  readonly reasons: readonly string[];
}

function uniqueNonEmpty(ids: readonly string[] | undefined): boolean {
  const arr = ids ?? [];
  return arr.every((id) => typeof id === "string" && id.length > 0) && new Set(arr).size === arr.length;
}

function allResolve(ids: readonly string[] | undefined, known: ReadonlySet<string>): boolean {
  return (ids ?? []).every((id) => known.has(id));
}

/**
 * §2.2 — explicit per-review eligibility. A review only contributes to
 * governance promotion when it is structurally valid, school-compatible and its
 * references resolve, AND its role qualifies:
 *   - researcher: never qualifies (research note only);
 *   - source-reviewer: qualifies only with non-empty resolved source IDs;
 *   - school-expert: qualifies with compatible school + resolved provenance;
 *   - adjudicator: may count toward approval but never alone.
 */
export function evaluateReviewEligibility(
  fixtureSchool: HuyenKhiSchoolProfile,
  review: HuyenKhiFixtureReview,
  ctx: PromotionContext = EMPTY_CONTEXT,
): FixtureReviewEligibility {
  const reasons: string[] = [];

  const structuralMsgs = [
    ...reviewSemanticViolations(review),
    ...(ROLES.includes(review.role) ? [] : [`invalid role '${review.role}'`]),
    ...(SCHOOLS.includes(review.schoolProfile) ? [] : [`invalid schoolProfile '${review.schoolProfile}'`]),
    ...((DECISIONS as readonly string[]).includes(review.decision) ? [] : [`invalid decision '${review.decision}'`]),
    ...(typeof review.reviewerId === "string" && review.reviewerId.length >= 2 && REVIEWER_ID_PATTERN.test(review.reviewerId) ? [] : ["invalid reviewerId"]),
    ...(typeof review.rationale === "string" && review.rationale.trim().length >= 10 ? [] : ["rationale too short"]),
    ...(uniqueNonEmpty(review.sourceIds) && uniqueNonEmpty(review.claimIds) && uniqueNonEmpty(review.expectedEffectiveRuleIds) && uniqueNonEmpty(review.forbiddenRuleIds) ? [] : ["review ID arrays must contain unique non-empty IDs"]),
  ];
  const structurallyValid = structuralMsgs.length === 0;
  reasons.push(...structuralMsgs);

  const schoolCompatible = isReviewSchoolCompatible(fixtureSchool, review.schoolProfile);
  if (!schoolCompatible) reasons.push(`review school '${review.schoolProfile}' is not compatible with a ${fixtureSchool} fixture`);

  const provenanceResolved =
    allResolve(review.sourceIds, ctx.knownSourceIds) &&
    allResolve(review.claimIds, ctx.knownClaimIds) &&
    allResolve(review.expectedEffectiveRuleIds, ctx.effectiveRuleIds) &&
    allResolve(review.forbiddenRuleIds, ctx.effectiveRuleIds);
  if (!provenanceResolved) reasons.push("review references do not all resolve");

  const hasResolvedSources = (review.sourceIds?.length ?? 0) > 0 && allResolve(review.sourceIds, ctx.knownSourceIds);

  let roleReviewed = false;
  let roleApproval = false;
  switch (review.role) {
    case "researcher":
      reasons.push("researcher reviews do not establish governance promotion");
      break;
    case "source-reviewer":
      roleReviewed = hasResolvedSources;
      roleApproval = hasResolvedSources;
      if (!hasResolvedSources) reasons.push("source-reviewer must cite non-empty resolved source IDs");
      break;
    case "school-expert":
      roleReviewed = true;
      roleApproval = true;
      break;
    case "adjudicator":
      // Eligible to be counted toward approval, but never establishes reviewed
      // and cannot approve alone (enforced by the distinct-reviewer rule).
      roleApproval = true;
      break;
  }

  const base = structurallyValid && schoolCompatible && provenanceResolved;
  const eligibleForReviewed = base && roleReviewed;
  const eligibleForApproval = base && roleApproval;

  return { structurallyValid, schoolCompatible, provenanceResolved, eligibleForReviewed, eligibleForApproval, reasons };
}

/**
 * Derived promotion status from the append-only ledger (A1, §2):
 * - no reviews → draft;
 * - any structurally-valid dispute → disputed;
 * - ≥2 DISTINCT eligible approvers, or an eligible school-expert plus a DISTINCT
 *   eligible adjudicator, AND the fixture is `reviewable` → approved;
 * - else an eligible reviewed/approved review → reviewed;
 * - else draft.
 *
 * A hand-written status field does not exist and cannot influence this.
 */
export function deriveFixtureStatus(
  fixture: HuyenKhiExpertFixture,
  ctx: PromotionContext = EMPTY_CONTEXT,
): HuyenKhiDerivedFixtureStatus {
  const ledger = fixture.reviews ?? [];
  if (ledger.length === 0) return "draft";

  const judged = ledger.map((review) => ({ review, eligibility: evaluateReviewEligibility(fixture.schoolProfile, review, ctx) }));

  if (judged.some((j) => j.review.decision === "disputed" && j.eligibility.structurallyValid)) {
    return "disputed";
  }

  const approvedEligible = judged.filter((j) => j.review.decision === "approved" && j.eligibility.eligibleForApproval);
  const distinctApprovers = new Set(approvedEligible.map((j) => j.review.reviewerId));
  const expertPlusAdjudicator = approvedEligible.some(
    (exp) =>
      exp.review.role === "school-expert" &&
      approvedEligible.some((adj) => adj.review.role === "adjudicator" && adj.review.reviewerId !== exp.review.reviewerId),
  );
  const meetsApprovalConsensus = distinctApprovers.size >= 2 || expertPlusAdjudicator;

  // §2.5 — only a reviewable fixture can be approved, regardless of the ledger.
  if (meetsApprovalConsensus && fixture.maturity === "reviewable") return "approved";

  if (judged.some((j) => (j.review.decision === "reviewed" || j.review.decision === "approved") && j.eligibility.eligibleForReviewed)) {
    return "reviewed";
  }
  return "draft";
}

export interface FixtureStatusCounts {
  readonly total: number;
  readonly draft: number;
  readonly reviewed: number;
  readonly approved: number;
  readonly disputed: number;
  /** Approved (disputed already excluded) — the promotion metric. */
  readonly approvedForPromotion: number;
  /** Diagnostics (§7). */
  readonly ineligibleReviewCount: number;
  readonly schoolIncompatibleReviewCount: number;
  readonly unresolvedReviewReferenceCount: number;
  readonly distinctApprovedReviewerCount: number;
}

/** Counts DERIVED from each fixture's review ledger — never a stored status. */
export function countFixtureStatuses(
  plan: HuyenKhiExpertFixturePlan,
  ctx: PromotionContext = EMPTY_CONTEXT,
): FixtureStatusCounts {
  let draft = 0;
  let reviewed = 0;
  let approved = 0;
  let disputed = 0;
  let ineligibleReviewCount = 0;
  let schoolIncompatibleReviewCount = 0;
  let unresolvedReviewReferenceCount = 0;
  const distinctApprovers = new Set<string>();

  for (const fixture of plan.fixtures) {
    switch (deriveFixtureStatus(fixture, ctx)) {
      case "draft": draft += 1; break;
      case "reviewed": reviewed += 1; break;
      case "approved": approved += 1; break;
      case "disputed": disputed += 1; break;
    }
    for (const review of fixture.reviews ?? []) {
      const e = evaluateReviewEligibility(fixture.schoolProfile, review, ctx);
      if (!e.eligibleForReviewed && !e.eligibleForApproval) ineligibleReviewCount += 1;
      if (!e.schoolCompatible) schoolIncompatibleReviewCount += 1;
      if (!e.provenanceResolved) unresolvedReviewReferenceCount += 1;
      if (review.decision === "approved" && e.eligibleForApproval) distinctApprovers.add(`${fixture.fixtureId}::${review.reviewerId}`);
    }
  }
  return {
    total: plan.fixtures.length,
    draft,
    reviewed,
    approved,
    disputed,
    approvedForPromotion: approved,
    ineligibleReviewCount,
    schoolIncompatibleReviewCount,
    unresolvedReviewReferenceCount,
    distinctApprovedReviewerCount: distinctApprovers.size,
  };
}

export interface FixtureMaturityCounts {
  readonly planned: number;
  readonly researchReady: number;
  readonly reviewable: number;
}

export function countFixtureMaturity(
  plan: HuyenKhiExpertFixturePlan,
): FixtureMaturityCounts {
  let planned = 0;
  let researchReady = 0;
  let reviewable = 0;
  for (const fixture of plan.fixtures) {
    switch (fixture.maturity) {
      case "planned": planned += 1; break;
      case "research-ready": researchReady += 1; break;
      case "reviewable": reviewable += 1; break;
    }
  }
  return { planned, researchReady, reviewable };
}
