# Annual Axes V0.7 Decision

NO VARIANT APPROVED

selectionStatus: no-variant-approved
formulaVersion: v0.7-robust-centered-annual-score
engineVersion: 0.7.0

## Selection rationale
- Holdout gates failed (9): globalMedianScoreMax: 52.6 vs <= 52; domainMedianMax_health: 55.400000000000006 vs <= 54; domainMedianMax_family: 56.95 vs <= 54; domainMedianMin_wealth: 40.7 vs >= 46; domainPositiveStrictLatentRateMin_wealth: 0.26666666666666666 vs >= 0.3
- Product fixture gates failed: maximum 61.1 < 65; countAtOrAbove58 1 < 2
- Do not enable V0.7 as Nam Phái production default.

## Calibration
- activationScale: 12.089302186318386
- domainCenters: health=0.22637242840828048, family=0.15353121830378516, wealth=0.16559944882809458, career=0.14805572596012612, social=0.11626945688948156, romance=0.15253213740311772
- domainScales: health=0.3376364599898803, family=0.346986345839938, wealth=0.2767155204144342, career=0.27242937659598243, social=0.3817431821921644, romance=0.32277226132324854

## Holdout
- passedAllHoldoutGates: false
- globalMedian: 52.6
- globalMean: 49.57173611111112
- positive/negative strictLatent: 0.5451388888888888 / 0.45069444444444445
- median radar range: 51.2

## Holdout blockers
- globalMedianScoreMax: 52.6 vs <= 52
- domainMedianMax_health: 55.400000000000006 vs <= 54
- domainMedianMax_family: 56.95 vs <= 54
- domainMedianMin_wealth: 40.7 vs >= 46
- domainPositiveStrictLatentRateMin_wealth: 0.26666666666666666 vs >= 0.3
- domainNegativeStrictLatentRateMax_wealth: 0.7291666666666666 vs <= 0.7
- domainMedianMax_social: 61.7 vs <= 54
- domainPositiveStrictLatentRateMax_social: 0.7125 vs <= 0.7
- domainNegativeStrictLatentRateMin_social: 0.2875 vs >= 0.3

## Product fixture
- scores: health=16.4, family=61.1, wealth=38.2, career=35.2, social=44.4, romance=56.5
- range=44.7, L1=63.199999999999996, min=16.4, max=61.1
- passesProductGates: false
  - maximum 61.1 < 65
  - countAtOrAbove58 1 < 2

## Notes
- Domain centers are training-only medians of spatialSignedRaw (activationGate > 0).
- Score uses amplitude 44 and atanh(0.5) domain-scale target.
- No React-side stretching, visualScore, or final-score offset.
