# Annual Axes V0.6 Decision

selectionStatus: no-variant-approved
selectedVariant: null
formulaVersion: v0.6-annual-dominant-core

## Selection rationale
- No selectable candidate passed all hard holdout gates.

## Candidates
### V05-CONTROL
- selectable: false
- passedAllGates: false
- signedLayerFactors: annual=1, natalActivated=1, majorFortune=1, global=0
- activationScale: 12.089302186318386
- domainScales: health=0.6768938665108606, family=0.6797515610489264, wealth=0.5037577382824203, career=0.5433609708169886, social=0.5434749951084742, romance=0.47405855038894545
- holdout median/mean: 58.00 / 55.99
- latent +/−: 72.8% / 26.7%
- product fixture: health=44.9, family=56.8, wealth=48.1, career=48.8, social=53.9, romance=55 (range=11.899999999999999, L1=11.3)
- blockers (25):
  - control-candidate-not-selectable
  - globalMedianScoreMax: 58 vs <= 52
  - globalMeanScoreMax: 55.990555555555574 vs <= 53
  - positiveLatentRateMax: 0.7284722222222222 vs <= 0.65
  - negativeLatentRateMin: 0.2673611111111111 vs >= 0.35
  - allSixAbove50RateMax: 0.1375 vs <= 0.12
  - fiveOrMoreAbove50RateMax: 0.4583333333333333 vs <= 0.28
  - domainMedianMax_health: 59.8 vs <= 55
  - domainPositiveLatentRateMax_health: 0.8291666666666667 vs <= 0.75
  - domainTwelveYearRangeMin_health: 4.900000000000002 vs >= 8
  - domainAdjacentDeltaMin_health: 0.899999999999995 vs >= 1.5
  - domainMedianMax_family: 59.75 vs <= 55
  - domainPositiveLatentRateMax_family: 0.8083333333333333 vs <= 0.75
  - domainTwelveYearRangeMin_family: 7.649999999999999 vs >= 8
  - domainAdjacentDeltaMin_family: 1.2999999999999972 vs >= 1.5
  - domainAdjacentDeltaMin_wealth: 1.4000000000000021 vs >= 1.5
  - domainMedianMax_career: 55.650000000000006 vs <= 55
  - domainPositiveLatentRateMax_career: 0.7625 vs <= 0.75
  - domainAdjacentDeltaMin_career: 1.4500000000000028 vs >= 1.5
  - domainMedianMax_social: 61.9 vs <= 55
  - domainPositiveLatentRateMax_social: 0.8041666666666667 vs <= 0.75
  - domainTwelveYearRangeMin_social: 7.900000000000002 vs >= 8
  - domainAdjacentDeltaMin_social: 1.3000000000000007 vs >= 1.5
  - domainMedianMax_romance: 57.75 vs <= 55
  - domainAdjacentDeltaMin_romance: 1.3999999999999986 vs >= 1.5

### ANNUAL-DOMINANT-50
- selectable: true
- passedAllGates: false
- signedLayerFactors: annual=1, natalActivated=0.5, majorFortune=0, global=0
- activationScale: 12.089302186318386
- domainScales: health=0.678996835327147, family=0.7078826601571743, wealth=0.4886298659958904, career=0.5318441146850877, social=0.5635270636309807, romance=0.47415494330911656
- holdout median/mean: 57.90 / 56.10
- latent +/−: 74.6% / 25.0%
- product fixture: health=43.3, family=60.4, wealth=45.6, career=49.4, social=53.7, romance=57.2 (range=17.1, L1=6.8)
- blockers (14):
  - globalMedianScoreMax: 57.9 vs <= 52
  - globalMeanScoreMax: 56.10034722222233 vs <= 53
  - positiveLatentRateMax: 0.7458333333333333 vs <= 0.65
  - negativeLatentRateMin: 0.25 vs >= 0.35
  - allSixAbove50RateMax: 0.2 vs <= 0.12
  - fiveOrMoreAbove50RateMax: 0.4625 vs <= 0.28
  - domainMedianMax_health: 59.9 vs <= 55
  - domainPositiveLatentRateMax_health: 0.8458333333333333 vs <= 0.75
  - domainMedianMax_family: 60 vs <= 55
  - domainPositiveLatentRateMax_family: 0.825 vs <= 0.75
  - domainMedianMax_career: 55.55 vs <= 55
  - domainMedianMax_social: 61.95 vs <= 55
  - domainPositiveLatentRateMax_social: 0.8125 vs <= 0.75
  - domainMedianMax_romance: 56.5 vs <= 55

### ANNUAL-DOMINANT-35
- selectable: true
- passedAllGates: false
- signedLayerFactors: annual=1, natalActivated=0.35, majorFortune=0, global=0
- activationScale: 12.089302186318386
- domainScales: health=0.6709037838693528, family=0.699286395364037, wealth=0.47591637241237145, career=0.5175093016762883, social=0.5774171980398594, romance=0.4718978854504019
- holdout median/mean: 57.90 / 56.10
- latent +/−: 75.0% / 24.6%
- product fixture: health=42, family=61.1, wealth=46.2, career=50, social=53.6, romance=58.7 (range=19.1, L1=3.6)
- blockers (14):
  - globalMedianScoreMax: 57.9 vs <= 52
  - globalMeanScoreMax: 56.10027777777783 vs <= 53
  - positiveLatentRateMax: 0.75 vs <= 0.65
  - negativeLatentRateMin: 0.24583333333333332 vs >= 0.35
  - allSixAbove50RateMax: 0.19583333333333333 vs <= 0.12
  - fiveOrMoreAbove50RateMax: 0.4666666666666667 vs <= 0.28
  - domainMedianMax_health: 60.05 vs <= 55
  - domainPositiveLatentRateMax_health: 0.8458333333333333 vs <= 0.75
  - domainMedianMax_family: 60.45 vs <= 55
  - domainPositiveLatentRateMax_family: 0.8333333333333334 vs <= 0.75
  - domainMedianMax_career: 56.1 vs <= 55
  - domainMedianMax_social: 61.6 vs <= 55
  - domainPositiveLatentRateMax_social: 0.8166666666666667 vs <= 0.75
  - domainMedianMax_romance: 55.5 vs <= 55

### ANNUAL-DOMINANT-25
- selectable: true
- passedAllGates: false
- signedLayerFactors: annual=1, natalActivated=0.25, majorFortune=0, global=0
- activationScale: 12.089302186318386
- domainScales: health=0.668149753507684, family=0.6933703160319541, wealth=0.46059218822486403, career=0.5026435553869345, social=0.6050040636650305, romance=0.4643166081208111
- holdout median/mean: 57.30 / 56.03
- latent +/−: 74.7% / 24.9%
- product fixture: health=40.6, family=61.8, wealth=46.7, career=50.8, social=53.5, romance=60.4 (range=21.199999999999996, L1=7.2)
- blockers (13):
  - globalMedianScoreMax: 57.3 vs <= 52
  - globalMeanScoreMax: 56.0280555555557 vs <= 53
  - positiveLatentRateMax: 0.7472222222222222 vs <= 0.65
  - negativeLatentRateMin: 0.24861111111111112 vs >= 0.35
  - allSixAbove50RateMax: 0.18333333333333332 vs <= 0.12
  - fiveOrMoreAbove50RateMax: 0.44166666666666665 vs <= 0.28
  - domainMedianMax_health: 60.1 vs <= 55
  - domainPositiveLatentRateMax_health: 0.8458333333333333 vs <= 0.75
  - domainMedianMax_family: 59.849999999999994 vs <= 55
  - domainPositiveLatentRateMax_family: 0.8166666666666667 vs <= 0.75
  - domainMedianMax_career: 56.25 vs <= 55
  - domainMedianMax_social: 61.099999999999994 vs <= 55
  - domainPositiveLatentRateMax_social: 0.825 vs <= 0.75

## Notes
- No V0.6 candidate approved. Production remains V0.5.0.
