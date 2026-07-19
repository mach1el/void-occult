# Research Memo — Annual Axes V0.3

## 1. Finding

The previous model treated Tiểu Hạn as a small activation marker added after six mostly independent domain scores. That does not match the intended Nam Phái product method.

The revised model treats the resolved one-year limit palace inside the active decade as the annual **head engine**. Its entered palace and TP4C define the climate that pulls all six axes. The individual axis palaces remain local expression channels.

## 2. Important coordinate distinction

The current codebase has two distinct facts:

- `getAnnualMajorFortuneIndex()` / `isLuuNienDaiVan`: one-year palace moving inside the decade;
- `smallLimitPalace`: Tam Hợp small-limit ring.

The user’s verified example — first decade year at Mão/Điền Trạch and second year at the opposite Dậu/Tử Tức — corresponds to the first coordinate. V0.3 names it `annualHeadPalace` at the scoring boundary.

## 3. Source synthesis

Vân Đằng Thái Thứ Lang’s *Tử Vi Đẩu Số Tân Biên*, Part III, instructs the reader to:

- assess the entered limit palace, its main star, the native element and the stars joining the limit;
- pay special attention to the life area represented by the palace entered by the limit;
- combine the decade, one-year moving limit, annual small limit and moving stars;
- allow the decade’s quality to moderate the annual limit.

This supports a layered annual model centered on the entered annual limit palace. It does not establish numeric coefficients.

## 4. Engineering hypothesis

### Head geometry

```text
focus     1.00
opposite  0.80
trine     0.70
outside   0.00
```

### Domain routing

For domain `d`:

```text
routing(d) = Σ anchorWeight × relationWeight(anchorPalace, annualHeadFrame)
```

### Head share

```text
headShare(d)  = 0.55 + 0.25 × routing(d)
localShare(d) = 1 - headShare(d)
```

This gives the annual head at least 55% influence and up to 80% when a domain’s anchors are strongly present in the head TP4C.

### Fact-level blend

For each physical fact:

```text
geometryWeight =
  headShare × headChannelWeight
  + localShare × localChannelWeight
```

This is a convex blend, not two additions. A physical fact contributes once.

### Structural annual activation

```text
routingActivationRaw = 0.80 + 0.70 × routing(d)
```

This affects activation only. It cannot turn a difficult head frame into a favorable one.

## 5. Synthetic Dậu / Tử Tức fixture

Annual head:

```text
Dậu — Tử Tức      focus
Mão — Điền Trạch  opposite
Sửu — Phụ Mẫu     trine
Tỵ  — Nô Bộc      trine
```

Using the candidate Nam Phái anchors:

```text
family routing   = 0.530 → head share 0.6825
social routing   = 0.350 → head share 0.6375
wealth routing   = 0.120 → head share 0.5800
romance routing  = 0.100 → head share 0.5750
career routing   = 0.070 → head share 0.5675
health routing   = 0.000 → head share 0.5500
```

These percentages express how strongly each axis is pulled by the annual head. They are not favorable/unfavorable scores.

## 6. Calibration gates

Do not promote V0.3 coefficients to approved until:

- at least 60 expert-reviewed annual charts are labeled;
- every axis has at least 10 high-routing and 10 low-routing cases;
- monotonicity tests pass;
- distributions avoid excessive clustering near 50 or extremes;
- school-specific regressions remain stable;
- physical fact dedup is verified by evidence ID, not only by final score.
