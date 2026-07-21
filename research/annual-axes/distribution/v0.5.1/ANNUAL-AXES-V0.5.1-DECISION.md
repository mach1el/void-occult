# Annual Axes V0.5.1 Decision

## Status: NO VARIANT APPROVED

**Selected variant:** null
**Baseline reproduced:** true
**Evidence bias detected:** true

## Root cause of softness

Production V0.5 expanded score range versus V0.4.2 but annual vectors remain
positively skewed: high `fiveOrMoreAbove50Rate` with low pressure-band reach.
Primary driver is positive latent evidence bias — scale-only tightening would amplify bias.

## Candidate summary

- **BASELINE-V05**: passedAllGates=false, blockers=13, globalMedian=57.95, allSixAbove50=17.9%
- **STRICT-SCALE**: passedAllGates=false, blockers=14, globalMedian=60.45, allSixAbove50=17.9%
- **STRICT-BALANCED**: passedAllGates=false, blockers=14, globalMedian=60.00, allSixAbove50=17.9%
- **STRICT-ACTIVATION**: passedAllGates=false, blockers=14, globalMedian=60.70, allSixAbove50=17.9%

## Product fixture (1991-09-21 / 2026)

Production V0.5.0: {"health":41.9,"family":59.2,"wealth":47.5,"career":50,"social":53.7,"romance":58.9}
Range: 17.3, above50: 3

## V0.5.1 routing

No V0.5.1 analyzer — audit artifacts only.

## Prohibited post-processing

No UI stretching, per-chart centering, global pressure multipliers, or score
post-processing were applied. All scores derive from the V0.5 evidence pipeline.
