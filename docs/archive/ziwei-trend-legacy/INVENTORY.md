# Legacy trend engine — dependency inventory (Phase 0)

**Base commit:** `da4b7f4` (master after PR #79)  
**Working branch:** `refactor/ziwei-trend-engine-reset`  
**Backup branch:** `backup/ziwei-trend-engine-legacy` (points at same commit; do not delete)

This inventory was written **before** deleting scorers. No production code removed in the inventory commit.

---

## 1. Production library (`src/lib/ziwei/trend/`)

| Path | Role | Consumers |
|------|------|-----------|
| `weights.ts` | `SCORING_WEIGHTS` / `ScoringWeights` | `score.ts`, `frame.ts`, ChartPage, tests |
| `star-scores.ts` + `star-scores.csv` | CSV star points (`findStarScore`, `STAR_SCORES`) | `star-energy.ts`, `frame.ts`, `palace-radar.ts` |
| `star-energy.ts` | Per-star energy routing | `monthly-flow.ts`, `frame.ts` |
| `frame.ts` | `scoreFortuneFrame` (Đại vận) | `score.ts` → `getDaiVanTrend` |
| `monthly-flow.ts` | `scoreLuuNguyetFrame` (Lưu nguyệt) | `score.ts` → `getLuuNienTrend` |
| `palace-radar.ts` | `getPalaceStrengths`, `RADAR_WEIGHTS` | ChartPage via PalaceRadar; annual-axis-radar |
| `annual-axis-radar.ts` | `getAnnualAxisStrengths` | ChartPage via AnnualRadar |
| `combo-rules.ts` / `combo-eval.ts` | Combo CAT/HUNG scoring | `frame.ts` |
| `pairs.ts` / `star-sets.ts` | Pair / set scoring helpers | combo-eval / frame path |
| `zones.ts` | `TAM_HOP`, `XUNG_CHIEU`, element factors | scorers only (CompactChart has its own copy) |
| `util.ts` | `finalizeLayer` (“Chuẩn hóa”), mutagen helpers | scorers |
| `ui-breakdown.ts` | `roundTo1Decimal`, format breakdown | scorers + TrendPointPanel |
| `score.ts` | Facade `getDaiVanTrend` / `getLuuNienTrend` | ChartPage |
| `types.ts` | `TrendPoint`, `ScoreLine`, radar types, `MonthlyFocusEntry` | scorers + UI |
| `index.ts` | Public re-exports | UI + tests |
| `CACH-CUC-PROPOSAL.md` | Proposal notes | docs only |

**No API routes / server loaders / stories** import `@/lib/ziwei/trend`.

---

## 2. UI consumers (`src/components/ziwei/`)

| Component | Uses |
|-----------|------|
| `ChartPage.tsx` | `getDaiVanTrend`, `getLuuNienTrend`, `SCORING_WEIGHTS`, `TrendChart` ×2, `TrendPointPanel`, `PalaceRadar`, `AnnualRadar` |
| `trend/TrendChart.tsx` | `TrendPoint` bars Cát/Hung |
| `trend/TrendPointPanel.tsx` | breakdown + `groupScoreLines` |
| `trend/breakdown-groups.ts` | semantic grouping of `ScoreLine` |
| `trend/PalaceRadar.tsx` | `getPalaceStrengths` |
| `trend/AnnualRadar.tsx` | `getAnnualAxisStrengths` |
| CSS: `trend-chart.css`, `palace-radar.css`, `annual-radar.css` | scoring visuals |

**Out of scope (keep):** `chart/CompactChart.tsx`, `MobileChart.tsx` — lá số; local TAM_HOP/XUNG_CHIEU for highlight only, not trend scores.

---

## 3. Tests that score legacy (to delete or rewrite)

| Path | Action |
|------|--------|
| `trend/__tests__/score.test.ts` | Delete score asserts; keep / move calc protections separately |
| `trend/__tests__/monthly-flow.test.ts` | Delete scorer tests; **extract** Can Chi / mapping / Giáp Ngọ asserts into calc tests |
| `trend/__tests__/frame.test.ts` | Delete |
| `trend/__tests__/palace-radar.test.ts` | Delete |
| `trend/__tests__/annual-axis-radar.test.ts` | Delete |
| `trend/__tests__/combo-rules.test.ts` | Delete |
| `trend/__tests__/pairs.test.ts` | Delete |
| `trend/__tests__/zones.test.ts` | Delete with zones (or keep geometry in neutral module if extracted) |
| `trend/__tests__/ui-breakdown.test.ts` | Delete with ui-breakdown |
| `components/ziwei/trend/*.test.tsx` | Replace with rebuilding UI tests |

**Keep unchanged:** `src/lib/ziwei/golden.test.ts`, engine tests, chart calculation tests.

---

## 4. Symbols to remove from production exports

```
getDaiVanTrend, getLuuNienTrend,
getPalaceStrengths, getAnnualAxisStrengths,
scoreFortuneFrame, scoreLuuNguyetFrame,
SCORING_WEIGHTS, ScoringWeights, RADAR_WEIGHTS, RadarWeights,
findStarScore, STAR_SCORES, StarScoreRow,
evaluateCombos, detectPairRules, finalizeLayer,
TrendPoint, PalaceStrength, AnnualAxisStrength, ScoreLine,
ScoreSignalCategory, ScorePalaceRole, ScoreLayer, …
```

---

## 5. Geometry note

`TAM_HOP` / `XUNG_CHIEU` in `trend/zones.ts` are **only** used by scoring. CompactChart duplicates them. Phase 0: delete with scorers; do **not** move CSV/weights into a new “knowledge” package.

---

## 6. Can Chi Lưu Nguyệt (must survive)

Independent of scorers:

- Engine: `stemBranchForLunarMonth`, Lưu Đẩu Quân mapping, `FlowMonthEntry` display
- Semantics documented in Sprint 0 / PR #79

Phase 0 must **re-home** calendar/focus independence tests onto Calculation Core APIs (not `scoreLuuNguyetFrame`).

---

## 7. Planned deletion set (Commit B+)

All of `src/lib/ziwei/trend/**` scorers/weights/tables/combo/pairs/star-sets/star-energy/star-scores/frame/monthly-flow/palace-radar/annual-axis-radar/score facade scoring paths, plus scoring UI under `src/components/ziwei/trend/` (replaced by rebuilding placeholder).

Archive pointer only: `docs/archive/ziwei-trend-legacy/README.md` (no code copy).
