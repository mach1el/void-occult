/**
 * Root-cause note — Annual Axes V0.4.2 before V0.4.3 spatial budget.
 *
 * Verified against master at research/ziwei-annual-axes-v0-4-3-spatial-budget.
 *
 * Defects / architectural gaps:
 *
 * 1. Channel weights (annual-channel-profile.v0.4.json):
 *    - directDomainImpact 0.45
 *    - routedHeadImpact 0.35
 *    - globalAnnualClimate 0.10
 *    - majorFortuneBackground 0.10
 *    There is no total TP4C contribution cap of 0.10. The routed-head channel
 *    alone may contribute up to 35% of signed delta (further scaled by
 *    routedStrength), far above a 10% contextual budget.
 *
 * 2. Path geometry (nam-phai-v04/collect-evidence.ts):
 *    resolveRoutedHeadPath assigns focus, opposite, and trine to the same
 *    channel "routed-head". Focus is treated as TP4C context even though it
 *    is the annual-head exact focus palace — it should be direct in a
 *    spatial-budget model.
 *
 * 3. Aggregation (nam-phai-v04/aggregate-channels.ts):
 *    Each activation path on one evidence item contributes independently to
 *    its channel. One physical fact can therefore add signed support/pressure
 *    through both direct-domain and routed-head paths.
 *
 * 4. Explainability:
 *    AnnualAxisResult exposes channel summaries but no result-level
 *    directSigned / tp4cSigned / directContribution / tp4cContribution /
 *    deduplicated physical-fact counts.
 *
 * 5. Corpus compression (committed full audit):
 *    See research/annual-axes/distribution/annual-axes-v0.4-nam-phai-annual-axes-audit-full-v0.4.json
 *    — near-duplicate / low intra-year spread remain known blockers. V0.4.3
 *    must not claim those gates are solved unless they actually pass.
 *
 * V0.4.3 response: separate experimental path with explicit 90/10 spatial
 * budget, geometry classes, direct-wins dedupe, and contribution traces.
 * Feature flag ziweiAnnualAxesV043 defaults OFF.
 */
export {};
