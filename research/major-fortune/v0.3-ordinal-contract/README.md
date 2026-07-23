# Major Fortune V0.3 — Ordinal Engineering-Heuristic Contract

## Distinction from V0.2

| Line | Objective |
| --- | --- |
| **V0.2** | Doctrine-oriented research toward classical reconstruction |
| **V0.3** | Explainable **engineering heuristic** informed by Tử Vi concepts |

V0.2 historical outcomes remain unchanged:

- `RESEARCH_INCOMPLETE`
- `SOURCE_GAPS_REMAIN`
- zero candidate-eligible scoring families
- zero eligible shape fragments

V0.3 is **not** a restored classical formula, not a verified Nam Phái or Trung Châu scoring system, and not doctrine-authorized numeric scoring.

## Governance

```json
{
  "modelNature": "engineering-heuristic",
  "doctrineRelationship": "doctrine-informed-not-classical-reconstruction",
  "numericAuthority": "engineering-defined",
  "productionStatus": "research-only"
}
```

## Formula

```text
pillarDelta = pillarBudget × pillarLevel / 4
score = clamp(50 + Σ pillarDelta, 0, 100)   // 1 decimal
```

Budgets: Thiên Thời 30 · Địa Lợi 25 · Nhân Hòa 20 · Tứ Hóa & Sát Tinh 25 (= 100).

Ordinal levels: `-2 | -1 | 0 | 1 | 2`. No per-rule `rawDelta`.

## Scope of this pack

Includes: ordinal contract, schemas/validators, pure evaluator, synthetic fixtures, decision artifacts.

Does **not** include: `ChartData` adapter, corpus tuning, holdout, production routing, UI, feature flags.

## Decision

See `V0.3-ORDINAL-CONTRACT-DECISION.md` and `reports/decision.json`.

## Commands

```bash
npm run test:major-fortune-v03-ordinal
npm run research:major-fortune-v03-ordinal:validate
npm run research:major-fortune-v03-ordinal:report
npm run research:major-fortune-v03-ordinal:decision
```
