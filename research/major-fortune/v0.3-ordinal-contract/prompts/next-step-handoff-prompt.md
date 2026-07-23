# Next-step handoff — Major Fortune V0.3 ChartData adapter

## Goal

Build a **research-only** adapter that extracts normalized `MajorFortuneOrdinalEvidence` from `ChartData` for the pure V0.3 ordinal evaluator.

## Must not

- Change pillar budgets, ordinal formula, or bands
- Add per-rule `rawDelta`
- Route production UI / feature flags
- Mutate V0.1 or V0.2 packs
- Fabricate Nam Phái Major Fortune transformations
- Accept annual/monthly facts

## Must

- Deduplicate by `physicalFactId` and `evidenceClusterId`
- Honor cross-pillar ownership policy
- Emit complete Trung Châu transformation tuples or reject
- Mark Nam Phái transformations unavailable/partial
- Preserve provenance (`sourceIds`, `claimIds`, `factIds`)
- Keep `getAnalysisStatus("major-fortune")` as rebuilding/unavailable

## Allowed Round 1 families

- Thiên Thời: `element-relation`
- Địa Lợi: `principal-star-dignity`
- Nhân Hòa: `support-pressure-auxiliary-sets`
- Tứ Hóa & Sát Tinh: `major-fortune-transformations`, `severe-pressure-evidence`
