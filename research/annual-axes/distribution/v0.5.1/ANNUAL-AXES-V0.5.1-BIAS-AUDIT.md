# Annual Axes V0.5.1 Baseline Bias Audit

Engine: V0.5.0 (production baseline)
Corpus: annual-axes-audit-full-v0.4
Baseline reproduced: true

## Score distribution (global)

| Metric | Value |
|--------|------:|
| Median score | 57.10 |
| Mean score | 55.88 |
| scoreAbove50Rate | 73.3% |
| scoreBelow50Rate | 25.9% |
| scoreAtOrBelow45Rate | 15.6% |
| scoreAtOrAbove60Rate | 38.2% |

## Annual-vector distribution

| Metric | Value |
|--------|------:|
| allSixAbove50Rate | 15.0% |
| fiveOrMoreAbove50Rate | 47.0% |
| allSixInside45To65Rate | 5.0% |
| atLeastOneAtOrBelow45Rate | 68.8% |
| atLeastOneAtOrAbove60Rate | 96.4% |
| oneLowAndOneHighRate | 66.2% |
| median intra-year range | 26.20 |

## Signed-signal distribution

| Metric | Value |
|--------|------:|
| spatialSigned median | 0.1643 |
| latent median | 0.1035 |
| positive latent rate | 73.5% |
| negative latent rate | 26.1% |
| support/pressure raw mass ratio | 1.404 |

## Diagnosis (required answers)

1. **Softness in spatialSigned?** No — spatialSigned has spread
2. **Latent positively biased?** Yes (global positive rate 73.5%)
3. **Support raw mass > pressure?** Yes (ratio 1.404)
4. **Pressure disproportionately TP4C?** No
5. **Pressure dropped by eligibility/dedupe?** Not indicated
6. **Activation too weak?** No (median gate 0.707)
7. **Calibration-only would amplify positive bias?** Yes — blocker for scale-only tightening

## Evidence bias flags

- Global positive latent bias: true
- Per-domain bias domains (5): health, family, wealth, career, social
- Scale-only tightening blocked: true
