# Major Fortune V0.2 — Source Locator Completion

Base master: `92e89ef` (doctrine adjudication PR #121 merged).

## Purpose

Acquire and verify **Layer-1 locators** for Major Fortune V0.2 scoring doctrine.

This pack does **not**:

- select final `rawDelta`;
- evaluate numeric candidates;
- modify runtime scoring, Calculation Core, UI, or V0.1;
- change `getAnalysisStatus` (remains `rebuilding`);
- fabricate pages, quotations, or school positions.

## Decision

See [`SOURCE-COMPLETION-DECISION.md`](./SOURCE-COMPLETION-DECISION.md).

Current decision: **`SOURCE_GAPS_REMAIN`**.

## Why gaps remain

Classical primary texts (Tân Biên, Toàn Thư leads) are **bibliographic-only** in this workspace — no PDF/scan/page was inspected. Engineering repo locators are verified for capability gates and branch–element maps only; they **cannot** authorize classical polarity.

## Scripts

```bash
npm run research:major-fortune-v02-source:validate
npm run research:major-fortune-v02-source:report
npm run research:major-fortune-v02-source:decision
```

## Relation to prior packs

- Foundation: `../v0.2-foundation/` (historical)
- Doctrine adjudication: `../v0.2-doctrine-adjudication/` (historical `RESEARCH_INCOMPLETE`)
- This pack **extends** registries; it does not rewrite historical decisions.
