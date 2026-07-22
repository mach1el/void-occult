# Annual Axes V0.8 — scoreState epsilon maintenance proof

Maintenance proof for **Finding 6** (`scoreState` floating-point epsilon).
This directory is intentionally separate from historical research packs under
`v0.9-foundation/`, `v0.9-candidates/`, and `v0.9-candidates-round-2/`.

## A. Problem

V0.8 classified domain score state with a strict raw-zero comparison:

```ts
prominenceAdjustedRaw === 0
```

Weighted positive and negative contributions that cancel mathematically can
leave a tiny IEEE-754 residue such as `5.551115123125783e-17`. The public
score still rounds correctly to `50`, but the state was labeled `scored`
instead of `balanced-signal`.

## B. Root cause

Floating-point summation of palace-weighted contributions
(`weight × palaceRaw`) is not associative in binary floating point. Palace
weights such as `0.6` / `0.2` are not exactly representable, so exact
doctrinal cancellation can produce a near-zero residue. This is a numerical
stability issue in state labeling, not a doctrine or formula defect.

## C. Fix

- Introduced `V08_RAW_ZERO_EPSILON = 1e-9` and `isEffectivelyZeroRaw`.
- Classification uses `classifyV08ScoreState` on `prominenceAdjustedRaw`.
- Raw trace fields are **not** normalized or rewritten.
- Chosen epsilon is ≫ observed residues (~1e-16) and ≪ the smallest
  meaningful V0.8 contribution (`1 × 0.2 = 0.2`).

## D. Numeric non-regression

From the deterministic 100×12 corpus (`seed: 20260719`):

| Check | Result |
| --- | --- |
| Public scores identical | yes |
| Bands identical | yes |
| Raw / absolute scores identical | yes |
| Contribution mass identical | yes |
| Rule coverage identical | yes |
| Gate metrics identical | yes |
| Gate result | **19/28** passed (unchanged) |

## E. State transition

| Transition | Count |
| --- | --- |
| `scored` → `balanced-signal` | 107 |
| All other transitions | 0 |

## F. Corpus proof

| Metric | Before (legacy strict zero) | After (epsilon-safe) |
| --- | ---: | ---: |
| `score === 50` | 1,027 | 1,027 |
| `no-signal` at neutral | 522 | 522 |
| `balanced-signal` at neutral | 398 | 505 |
| `scored` at neutral | 107 | 0 |
| `partial-data` at neutral | 0 | 0 |

Machine-readable details: `before-after-proof.json`.

Regenerate:

```bash
npm run research:annual-axes-v08:scorestate-proof
```

## G. Version decision

| Field | Value |
| --- | --- |
| Contract version | `0.8.0` |
| Engine version | `0.8.0` |
| Knowledge version | `0.8.0` |
| Formula version | `v0.8-annual-palace-weighted-score` |

Rationale: label-classification bug fix only; no formula/knowledge/contract
change. Repository policy does not require a patch bump for non-numeric
`scoreState` semantics.

## H. Historical artifacts

Unchanged by this maintenance proof:

- `research/annual-axes/v0.9-foundation/`
- `research/annual-axes/v0.9-candidates/`
- `research/annual-axes/v0.9-candidates-round-2/`

Historical statements that the old audit observed 107 epsilon-misclassified
observations remain valid descriptions of the engine at those research
rounds.

## I. Production decision

Production remains:

```text
KEEP_V0_8_PRODUCTION
school: nam-phai
engine: V0.8
Trung Châu: 0.2.0
```

This fix corrects `scoreState` semantics only. It does **not** change scores,
does **not** resolve V0.8 distribution compression / the nine failed spread
gates, and does **not** reopen V0.9 candidate rollout.
