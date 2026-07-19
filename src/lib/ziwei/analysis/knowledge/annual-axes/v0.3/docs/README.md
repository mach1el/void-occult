# Annual Axes V0.3 — Nam Phái Annual-Head Climate Model

This pack corrects the architecture used by PR #90.

## Terminology lock

The repository currently exposes two different one-year coordinates:

1. `isLuuNienDaiVan` / `getAnnualMajorFortuneIndex()`
   - the one-year palace moving inside the active Major Fortune decade;
   - this is the coordinate the product owner calls **Lưu Tiểu Hạn / cung hạn năm**;
   - this is the **annual head** for the Nam Phái six-axis model.

2. `smallLimitPalace`
   - the Tam Hợp small-limit ring resolved from birth branch and gender;
   - retained as a secondary annual context;
   - it must not replace the annual head.

PR #90 currently uses `smallLimitPalace` as the primary focus. V0.3 rejects that mapping.

## Doctrine and engineering boundary

Source-backed structural claims:

- A one-year limit must be read from its entered palace and the stars joining that limit.
- The palace entered by the limit identifies the field of life emphasized during that period.
- Major Fortune, one-year moving limit, annual small limit and moving stars are separate layers that must be weighed together.
- A favorable decade can moderate a difficult year, and a difficult decade can reduce a favorable year.

Not source-backed as traditional numbers:

- 1.00 / 0.80 / 0.70 TP4C weights;
- six-domain anchor weights;
- routing equation;
- head/local blend;
- layer coefficients;
- 0–100 normalization.

Every numeric record in this pack is therefore `experimental` and requires calibration.

## Core model

Facts are combined at physical-evidence level:

```text
annual head frame
+ local six-axis domain frames
+ annual Tứ Hóa and annual moving facts
+ decade/secondary contexts
→ one deduplicated evidence stream per axis
→ normalization
```

The same physical star is never summed once as “head” and again as “local”. Its two channel weights are combined through a convex blend before numeric aggregation.

## Dynamic/no-hardcode guarantee

The pack includes `annual-dynamic-resolution-guard.v0.3.json`.

The Annual Axes scorer must consume resolved Calculation Core facts and
versioned knowledge only. It may not recalculate annual limits, embed school
tables, infer missing palaces, or special-case a branch, age, palace name or
user chart.

The Dậu/Tử Tức example is a regression fixture, not a production rule.

