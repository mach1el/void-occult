# Huyền Khí Reverse-Spec — Limitations (V0.1)

## Proven (verified by tests, not just asserted)

- The additive output contract: 18/18 seed records' displayed whole-chart
  total equals the sum of twelve palace scores, after omitted palaces are
  inferred zero only where that inference validates exactly at two
  decimals (`validate-public-record.ts`, `validate-seed.test.ts`).
- The `displayTitle` free-text format parses deterministically into
  structured birth facts (yin/yang, gender, year stem/branch, lunar
  month/day, hour branch) for all 18 seeds (`parse-public-summary.ts`).
- The score alphabet: 170/207 (82.1%) nonzero palace values are exact
  multiples of 0.25; the tool reproduces the pack's own
  `sample-validation-report.v0.1.json` numbers exactly.

## Hypothesis (testable, not established)

- HYP-HK-002: palace scores = coarse quarter-step base + fine residual
  modifier. Supported by the score-alphabet distribution, not proven.
- HYP-HK-003 / HYP-HK-004: Mệnh/Cục/branch set the coarse base; Tuần/Triệt
  and Tứ Hóa produce the residual. **Untested in V0.1** — testing requires
  resolved chart-fact snapshots, which no seed record has yet (see below).

## Unresolved / explicitly rejected

- HYP-HK-005 (Đẩu Minh or Xí Hoa can stand in for Huyền Khí) — rejected,
  no public source establishes equivalence.
- HYP-HK-006 (a generic support-minus-pressure star sum is Huyền Khí) —
  rejected, already failed Annual Axes calibration and doesn't match the
  published conceptual definition.
- The hidden palace-score formula itself — completely unknown. The
  additive-total contract is an output inference, not the formula.
- Rounding/limit rules, and Nạp Âm naming (`stemBranchNapAm` is `null` in
  every fact snapshot — only a private element helper exists in the
  Calculation Core, not an exported 60-entry Nạp Âm name table).

## The lunar-year ambiguity (found during V0.1, not anticipated by the prompt)

All 18 seed titles give a lunar year as a **stem-branch pair** (e.g. "Giáp
Tuất"), never an absolute year. A stem-branch pair repeats every 60 years,
so within a plausible 1900–2026 window there are 2–3 candidate absolute
years per record, and the site gives no way to disambiguate them from the
title text alone. `resolve-solar-date.ts` brute-force-searches every
candidate year (using the Calculation Core's own `solarToLunar` as an
oracle) and reports `"ambiguous"` rather than guessing — **all 18 seed
records currently resolve as ambiguous**, so V0.1 has **zero** resolved
`HuyenKhiChartFactSnapshot`s. This means:

- Corpus Phase B/C stratification by Cục/major-star-configuration/VCD/
  Tuần-Triệt/Tứ Hóa is not yet possible on the seed set.
- Matched-pair analysis in V0.1 only compares parsed birth-title facts
  (yin/yang, gender, year stem/branch, lunar month/day, hour branch) — it
  found 0 pairs differing in exactly one fact at N=18 (honestly reported,
  not padded).
- Model 1 (the prompt's coarse lookup baseline: palace + Cục + Mệnh branch
  + major-star config + brightness) could not be built as specified;
  `baseline-models.ts` ships a documented placeholder that is numerically
  identical to Model 0 until real resolved charts exist.

Resolving this needs either an operator-confirmed absolute year per
record (a future `import-manual-record.ts` field), or additional real
public records that happen to state an absolute year.

## Explicitly deferred (not attempted, not faked)

- Live collection against the source site — the ethics contract requires
  checking robots.txt/terms and enforcing a 6 req/min cap before any
  automation; V0.1 does not perform any network access.
- Corpus Phase A completion (need 42 more real charts), Phase B (240),
  Phase C (2000), Phase D (200 expert-reviewed) — `build-controlled-corpus.ts`
  reports the current-vs-target gap; it never fabricates records.
- Model 2 (explainable additive rules), Model 3 (bounded interactions),
  Model 4 (symbolic hypothesis search) — need far more than 18 records.
- A held-out `HuyenKhiEvaluationReport` against the quality gates in
  `quality-gates.v0.1.json` — not meaningful at N=18; only in-sample
  descriptive baselines are reported, clearly labeled as such.

## Anti-fabrication statement

Nothing in this pack claims to reproduce the source site's proprietary
formula. All numeric findings are labeled "ApexVoid Huyền Khí Reverse-Spec"
— explicit, versioned, experimental engineering hypotheses requiring much
larger held-out benchmarks and expert review before any production use.
