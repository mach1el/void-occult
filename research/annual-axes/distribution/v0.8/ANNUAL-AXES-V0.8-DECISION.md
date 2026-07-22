# Annual Axes V0.8 Decision

PRODUCTION DEFAULT — palace-weighted Lưu Niên scoring

formulaVersion: v0.8-annual-palace-weighted-score
engineVersion: 0.8.0
knowledgeVersion: 0.8.0

## Formula

```
palaceRaw = clamp(positivePoints - negativePoints, -8, 8)
axisRaw = Σ configuredWeight_i * palaceRaw_i
prominenceAdjustedRaw = clamp(axisRaw * thaiTueMultiplier, -8, 8)
score = clamp(round(50 + 5 * prominenceAdjustedRaw, 1), 10, 90)
```

thaiTueMultiplier = 1.25 when Lưu Thái Tuế is in any mapped palace; else 1.00.

## Removed from V0.8 numeric scoring

- domainCenter / MAD / IQR / robustScale / Z-scores
- activationScale calibration
- DIRECT-STRICT candidate selection
- confidence percentage in public UI
- holdout approval as a production switch

## Routing

Default: V0.5 ON, V0.7 ON, V0.8 ON → Nam Phái runs V0.8.

Rollback:

- V08=0 → V0.7
- V08=0 and V07=0 → V0.5
- V05=0 → V0.4.2

Trung Châu remains Engine 0.2.0.

## Distribution reports

Advisory only. They do not control production routing.
Corpus calibration is not required to calculate a V0.8 score.
