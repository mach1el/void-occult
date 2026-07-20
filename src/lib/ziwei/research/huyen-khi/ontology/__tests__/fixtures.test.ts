import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import {
  appendFixtureReview,
  countFixtureMaturity,
  countFixtureStatuses,
  deriveFixtureStatus,
  evaluateReviewEligibility,
  promotionContext,
  validateFixture,
  type PromotionContext,
} from "../validate-fixture";
import type {
  HuyenKhiExpertFixture,
  HuyenKhiFixtureReview,
  HuyenKhiOntology,
} from "../types";

function ontology(): HuyenKhiOntology {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) throw new Error("expected load");
  return loaded.ontology;
}

function ctx(): PromotionContext {
  return promotionContext(ontology());
}

function shipped(): HuyenKhiExpertFixture {
  return ontology().fixturePlan.fixtures[0]!;
}

/** A reviewable fixture with all required content (approval-eligible stage). */
function reviewableFixture(
  overrides: Partial<HuyenKhiExpertFixture> = {},
): HuyenKhiExpertFixture {
  return {
    fixtureId: "HK-FIX-TEST-001",
    title: "test template",
    category: "major-star-brightness",
    schoolProfile: "shared",
    maturity: "reviewable",
    inputFacts: { majorStars: ["Tử Vi"], brightness: "Miếu" },
    researchQuestion: "Which dimensions change?",
    candidateSourceIds: ["HK-SRC-SPEC-001"],
    expectedEvidence: ["locator-verified brightness claim"],
    expectedState: { capacity: "strong" },
    reviewQuestions: ["Which symbolic dimensions change?"],
    rationale: "rationale that is long enough for review",
    reviews: [],
    ...overrides,
  };
}

function review(
  reviewerId: string,
  decision: HuyenKhiFixtureReview["decision"],
  extra: Partial<HuyenKhiFixtureReview> = {},
): HuyenKhiFixtureReview {
  return {
    reviewerId,
    role: "school-expert",
    schoolProfile: "shared",
    decision,
    rationale: "reviewed against sourced material",
    reviewedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

const t = (h: number) => `2026-01-0${h}T00:00:00.000Z`;

describe("Huyền Khí ontology — shipped fixtures (A1, A2, G)", () => {
  it("ships ≥30 templates (36), all planned, all draft with no reviews", () => {
    const o = ontology();
    expect(o.fixturePlan.fixtures.length).toBe(36);
    expect(countFixtureMaturity(o.fixturePlan).planned).toBe(36);
    const counts = countFixtureStatuses(o.fixturePlan, ctx());
    expect(counts.draft).toBe(36);
    expect(counts.approvedForPromotion).toBe(0);
    expect(counts.distinctApprovedReviewerCount).toBe(0);
  });

  it("no shipped fixture contains personal birth data", () => {
    ontology().fixturePlan.fixtures.forEach((f, i) => {
      expect(validateFixture(f, "plan", i).filter((x) => x.code === "personal-data")).toEqual([]);
    });
  });

  it("flags injected personal-chart data", () => {
    const personal = { ...shipped(), inputFacts: { solarDate: "1991-09-21" } };
    expect(validateFixture(personal, "plan", 0).some((x) => x.code === "personal-data")).toBe(true);
  });
});

describe("Huyền Khí ontology — stored derived-status is forbidden (§2.1)", () => {
  it("A1: a manually stored status field is schema-invalid AND scanned", () => {
    const forged = { ...shipped(), reviewerStatus: "approved" };
    const issues = validateFixture(forged, "plan", 0);
    expect(issues.some((x) => x.code === "schema-invalid")).toBe(true);
    expect(issues.some((x) => x.code === "stored-derived-status")).toBe(true);
  });

  it("A1: a stored status cannot influence the derived promotion count", () => {
    // Even a fixture object carrying `approved: true` derives from reviews only.
    const forged = { ...reviewableFixture(), approved: true } as HuyenKhiExpertFixture;
    expect(deriveFixtureStatus(forged, ctx())).toBe("draft");
  });
});

describe("Huyền Khí ontology — review eligibility (§2.2)", () => {
  it("researcher reviews never establish reviewed", () => {
    const f = reviewableFixture({ reviews: [review("researcher1", "approved", { role: "researcher" })] });
    expect(deriveFixtureStatus(f, ctx())).toBe("draft");
  });

  it("source-reviewer qualifies only with non-empty resolved source IDs", () => {
    const without = evaluateReviewEligibility("shared", review("sourcerev", "reviewed", { role: "source-reviewer" }), ctx());
    expect(without.eligibleForReviewed).toBe(false);
    const withSources = evaluateReviewEligibility(
      "shared",
      review("sourcerev", "reviewed", { role: "source-reviewer", sourceIds: ["HK-SRC-SPEC-001"] }),
      ctx(),
    );
    expect(withSources.eligibleForReviewed).toBe(true);
  });

  it("a source-reviewer review is reviewed, not expert-approved", () => {
    const f = reviewableFixture({
      reviews: [review("sourcerev", "approved", { role: "source-reviewer", sourceIds: ["HK-SRC-SPEC-001"] })],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });

  it("adjudicator cannot approve a fixture alone", () => {
    const f = reviewableFixture({ reviews: [review("adj1", "approved", { role: "adjudicator" })] });
    expect(deriveFixtureStatus(f, ctx())).toBe("draft");
  });
});

describe("Huyền Khí ontology — approval requires distinct eligible reviewers (§2.3)", () => {
  it("two DISTINCT eligible experts approve", () => {
    const f = reviewableFixture({
      reviews: [review("expertA", "approved", { reviewedAt: t(1) }), review("expertB", "approved", { reviewedAt: t(2) })],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("approved");
  });

  it("the same reviewer twice does NOT satisfy independence", () => {
    const f = reviewableFixture({
      reviews: [review("expertA", "approved", { reviewedAt: t(1) }), review("expertA", "approved", { reviewedAt: t(2) })],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });

  it("expert + DISTINCT adjudicator approve", () => {
    const f = reviewableFixture({
      reviews: [
        review("expertA", "approved", { role: "school-expert", reviewedAt: t(1) }),
        review("adjB", "approved", { role: "adjudicator", reviewedAt: t(2) }),
      ],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("approved");
  });

  it("one person acting as expert AND adjudicator does NOT satisfy independence", () => {
    const f = reviewableFixture({
      reviews: [
        review("solo", "approved", { role: "school-expert", reviewedAt: t(1) }),
        review("solo", "approved", { role: "adjudicator", reviewedAt: t(2) }),
      ],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });
});

describe("Huyền Khí ontology — maturity gate (§2.5)", () => {
  it("a planned fixture cannot be promoted even with two approvals", () => {
    const f = reviewableFixture({
      maturity: "planned",
      reviews: [review("expertA", "approved", { reviewedAt: t(1) }), review("expertB", "approved", { reviewedAt: t(2) })],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });

  it("a research-ready fixture cannot be promoted even with two approvals", () => {
    const f = reviewableFixture({
      maturity: "research-ready",
      reviews: [review("expertA", "approved", { reviewedAt: t(1) }), review("expertB", "approved", { reviewedAt: t(2) })],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });
});

describe("Huyền Khí ontology — school compatibility (§2.4)", () => {
  it("a trung-chau reviewer cannot approve a shared fixture", () => {
    const f = reviewableFixture({
      schoolProfile: "shared",
      reviews: [
        review("expertA", "approved", { schoolProfile: "trung-chau", reviewedAt: t(1) }),
        review("expertB", "approved", { schoolProfile: "trung-chau", reviewedAt: t(2) }),
      ],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("draft");
  });

  it("a nam-phai-only reviewer cannot approve a trung-chau fixture", () => {
    const e = evaluateReviewEligibility("trung-chau", review("expertA", "approved", { schoolProfile: "nam-phai" }), ctx());
    expect(e.schoolCompatible).toBe(false);
    expect(e.eligibleForApproval).toBe(false);
  });

  it("shared reviewers may approve a nam-phai fixture", () => {
    const f = reviewableFixture({
      schoolProfile: "nam-phai",
      reviews: [
        review("expertA", "approved", { schoolProfile: "shared", reviewedAt: t(1) }),
        review("expertB", "approved", { schoolProfile: "nam-phai", reviewedAt: t(2) }),
      ],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("approved");
  });
});

describe("Huyền Khí ontology — provenance resolution (§2.2)", () => {
  it("an unresolved claim reference blocks approval", () => {
    const f = reviewableFixture({
      reviews: [
        review("expertA", "approved", { claimIds: ["HK-CLM-DOES-NOT-EXIST"], reviewedAt: t(1) }),
        review("expertB", "approved", { reviewedAt: t(2) }),
      ],
    });
    // expertA's review is ineligible (unresolved), leaving one eligible approver.
    expect(deriveFixtureStatus(f, ctx())).toBe("reviewed");
  });

  it("a resolved claim/source reference is eligible", () => {
    const e = evaluateReviewEligibility(
      "shared",
      review("expertA", "approved", { sourceIds: ["HK-SRC-SPEC-001"], claimIds: ["HK-CLM-BOUNDARY-001"] }),
      ctx(),
    );
    expect(e.provenanceResolved).toBe(true);
    expect(e.eligibleForApproval).toBe(true);
  });
});

describe("Huyền Khí ontology — dispute retention (§2.2)", () => {
  it("disagreement is retained as disputed and excluded from approval", () => {
    const f = reviewableFixture({
      reviews: [
        review("expertA", "approved", { reviewedAt: t(1) }),
        review("expertB", "approved", { reviewedAt: t(2) }),
        review("expertC", "disputed", { reviewedAt: t(3) }),
      ],
    });
    expect(deriveFixtureStatus(f, ctx())).toBe("disputed");
    const counts = countFixtureStatuses({ ...ontology().fixturePlan, fixtures: [f] }, ctx());
    expect(counts.disputed).toBe(1);
    expect(counts.approvedForPromotion).toBe(0);
  });
});

describe("Huyền Khí ontology — append-only ledger", () => {
  it("reviews append rather than overwrite, order-independently", () => {
    const f0 = reviewableFixture();
    const a = appendFixtureReview(appendFixtureReview(f0, review("expertA", "approved", { reviewedAt: t(1) })), review("expertB", "approved", { reviewedAt: t(2) }));
    const b = appendFixtureReview(appendFixtureReview(f0, review("expertB", "approved", { reviewedAt: t(2) })), review("expertA", "approved", { reviewedAt: t(1) }));
    expect(a.reviews).toEqual(b.reviews);
    expect(deriveFixtureStatus(a, ctx())).toBe(deriveFixtureStatus(b, ctx()));
  });
});

describe("Huyền Khí ontology — review record validation (A2, §3)", () => {
  it("a review missing required fields fails validation", () => {
    const bad = { ...reviewableFixture(), reviews: [{ reviewerId: "a", decision: "approved" }] };
    expect(validateFixture(bad, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
  });

  it("a review with an unknown enum value fails validation", () => {
    const bad = { ...reviewableFixture(), reviews: [{ ...review("expertA", "approved"), role: "hacker" }] };
    expect(validateFixture(bad, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
  });

  it("a non-UTC / impossible timestamp fails validation", () => {
    const badZone = { ...reviewableFixture(), reviews: [review("expertA", "approved", { reviewedAt: "2026-01-01T00:00:00+07:00" })] };
    expect(validateFixture(badZone, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
    const impossible = { ...reviewableFixture(), reviews: [review("expertA", "approved", { reviewedAt: "2026-13-40T00:00:00.000Z" })] };
    expect(validateFixture(impossible, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
  });

  it("duplicate review IDs (uniqueItems) fail validation", () => {
    const dup = { ...reviewableFixture(), reviews: [review("expertA", "approved", { sourceIds: ["HK-SRC-SPEC-001", "HK-SRC-SPEC-001"] })] };
    expect(validateFixture(dup, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
  });

  it("a too-short rationale fails validation", () => {
    const shortR = { ...reviewableFixture(), reviews: [review("expertA", "approved", { rationale: "no" })] };
    expect(validateFixture(shortR, "plan", 0).some((x) => x.code === "schema-invalid")).toBe(true);
  });
});
