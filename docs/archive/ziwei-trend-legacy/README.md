# Archive: Zi Wei legacy trend engine

**Status:** historical reference only — **not** a production import source.

| Item | Value |
|------|--------|
| Backup branch | `backup/ziwei-trend-engine-legacy` |
| Commit at backup | `da4b7f4` (master after PR #79) |
| Working branch | `refactor/ziwei-trend-engine-reset` |
| Scorers removed | weights, star-scores CSV, frame, monthly-flow, palace-radar, annual-axis-radar, combo-eval/rules, pairs, star-sets, star-energy, score facade, util finalizeLayer, UI radars/charts |

**Why removed:** heuristic scorers shared inconsistent philosophies/weights with no unified knowledge model; Phase 0 resets before rebuilding four independent analysis modules.

See [INVENTORY.md](./INVENTORY.md) for the full dependency graph captured **before** deletion.

Do not copy scorer source trees here. Do not import this directory from `src/`.
