# Expert Fixture Guide

Fixtures are scenario templates awaiting sourced extraction and expert review.
**They are not approved answers.**

## Rules

- No personal birth data — synthetic canonical facts only.
- Reviews **append**; earlier reviews are never overwritten.
- Disagreement is retained as `disputed`; it is never averaged.
- `disputed` fixtures are excluded from the approved promotion count.
- Review order does not change the stored result (deterministic).

## Review record

Each review keeps: reviewer ID, role, school profile, decision, expected
dimensions, expected/forbidden rules, rationale, timestamp.

## Promotion gate

The symbolic evaluator phase must not begin until **≥ 30 fixtures are approved** (derived from the review ledger).
V0.1 ships 36 draft scenarios.

Append a review with:

```bash
npm run research:huyen-khi:review-fixture -- \
  --fixture HK-FIX-001-MAJOR-MIEU-SUPPORT \
  --reviewer expert-a --role school-expert --school shared \
  --decision reviewed --rationale "locator confirmed"
```

## Maturity levels

Authoring stages (set by hand): `planned` → `research-ready` → `reviewable`.
Derived from the review ledger (never set by hand): `reviewed` / `approved` /
`disputed`. See `fixture-maturity-policy.v0.1.json` for per-level requirements.
`fixtureTemplateCountMin` counts templates and never implies approval; only
`approvedExpertFixtureCountMin` may unlock the symbolic evaluator phase.
