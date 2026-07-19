# Corrective Implementation Prompt — Annual Axes V0.4

Repository:

`st-mich43l/apexvoid-occult`

Existing pull request:

`#90 — feat(ziwei): Annual Axes V0.2 + Nam Phái resolver + chart UI`

Existing branch:

`feat/ziwei-annual-axes-v0-2-nam-phai-ui`

Reviewed PR head:

`0cb5e3a1dc3aa4514f8353bbfaac7f92bb1f0646`

Before changing code, fetch the PR again and confirm that the head has not moved.
Continue on the same branch unless the repository owner has already replaced it.

Do not merge the current implementation.

---

# Mission

Replace the current Annual Axes scoring model with:

**Annual Axes V0.4 — Annual Delta + Routed Head + Domain Affinity**

The current model is release-blocked because practical review found that:

- different charts frequently produce six favorable axes;
- the six axes are too close to one another;
- changing the annual year changes scores too little;
- the result resembles a repackaged natal quality score rather than a
  year-specific climate score.

The new model must make the six values represent **annual change around a
neutral score of 50**, not static natal quality multiplied by annual activation.

The annual-head palace remains important, but it acts primarily as a
**domain router and trigger frame**. It must not copy one common favorable or
unfavorable vector into all six domains.

---

# Release decision

Until every V0.4 anti-degeneracy and distribution gate passes:

```text
Annual Axes UI flag: default OFF
PR #90: not mergeable for release
V0.2 scoring: deprecated
V0.3 55–80% common head-share formula: rejected
```

Use a new kill-switch:

```text
ziweiAnnualAxesV04
VITE_ZIWEI_ANNUAL_AXES_V04
?ziweiAnnualAxesV04=1
```

Default must be `false`.

Do not retain V0.2 as the default fallback scoring implementation.

---

# Terminology and Calculation Core boundary

## Nam Phái coordinates

Keep these physical facts separate:

```text
annualHeadPalace
  = resolved one-year palace inside the active Major Fortune decade
  = Calculation Core fact currently represented by unique isLuuNienDaiVan

smallLimitPalace
  = Tam Hợp small-limit coordinate
  = secondary annual context

taiTuePalace
  = calendar-year / external-context coordinate

majorFortunePalace
  = decade background
```

The product may label `annualHeadPalace` as:

```text
Lưu Tiểu Hạn / cung hạn năm
```

but the typed technical identity must remain unambiguous.

## Trung Châu coordinate

Trung Châu keeps its school-specific annual Mệnh resolution.

Do not route Trung Châu through the Nam Phái resolver.

## Strict ownership boundary

Calculation Core owns:

- annual-head placement;
- small-limit placement;
- Tai Tuế placement;
- Major Fortune placement;
- annual stars;
- annual Tứ Hóa;
- physical palace and star identities.

Annual Axes may consume these facts but may not recalculate them.

The scorer must not import:

- `getAnnualMajorFortuneIndex`;
- `assignSmallLimits`;
- a concrete Nam Phái engine;
- a concrete Trung Châu engine;
- Tứ Hóa placement tables.

Expose missing facts through typed `ChartData` fields or a typed adapter.

---

# Non-goals

Do not implement:

- event prediction prose;
- Lưu Nhật or Lưu Giờ;
- Monthly Flow UI;
- Major Fortune UI;
- an LLM interpretation layer;
- a hidden statistical rescaling designed only to make the radar look varied;
- forced good/bad quotas;
- random noise;
- per-user special cases;
- branch-, age-, year-, or palace-specific production hacks;
- reuse of Palace Overview, Major Fortune, or Monthly Flow scores.

A healthy distribution is an engineering validity check, not a quota.

---

# 1. Reproduce and instrument the current failure first

Before replacing the formula, create a deterministic audit harness that can run
both the current V0.2 scorer and the candidate V0.4 scorer.

Suggested location:

```text
src/lib/ziwei/analysis/modules/annual-axes/audit/
├── build-audit-corpus.ts
├── compute-distribution-report.ts
├── compare-annual-vectors.ts
├── types.ts
└── __tests__/
```

The harness must produce a machine-readable JSON report with at least:

```ts
interface AnnualAxesDistributionReport {
  profileId: string;
  chartCount: number;
  yearsPerChart: number;
  resultCount: number;

  scoreSummaryByDomain: Record<
    AnnualAxisDomain,
    {
      min: number;
      max: number;
      mean: number;
      median: number;
      p10: number;
      p90: number;
      standardDeviation: number;
    }
  >;

  allSixAbove50Rate: number;
  allSixAbove60Rate: number;
  exactDuplicateVectorRate: number;

  intraYearAxisSpread: {
    meanStandardDeviation: number;
    medianRange: number;
    p10Range: number;
  };

  longitudinalChange: {
    medianPerDomainTwelveYearRange: Record<AnnualAxisDomain, number>;
    medianAdjacentYearAbsoluteDelta: Record<AnnualAxisDomain, number>;
    annualHeadMoveSensitivityRate: number;
  };

  interAxisCorrelation: Record<string, number>;

  crossChartSimilarity: {
    medianNearestNeighborDistance: number;
    nearDuplicateVectorRate: number;
  };

  unavailableRate: number;
  partialRate: number;
}
```

Save reports under a non-runtime research/test path, for example:

```text
research/annual-axes/distribution/
```

Do not commit thousands of raw charts.

Commit:

- corpus generation parameters;
- aggregate report;
- a small deterministic sample;
- the seed or generation contract.

The V0.2 baseline report must demonstrate the observed failure or an equivalent
degeneracy on the deterministic corpus.

Do not tune V0.4 before the baseline report exists.

---

# 2. Build a deterministic audit corpus

Minimum smoke corpus:

```text
100 deterministic charts
× 12 consecutive annual years
× 6 domains
= 7,200 axis scores
```

Cover:

- both genders;
- all ten year stems;
- all twelve year branches;
- all twelve lunar months;
- all twelve hour branches;
- multiple Cục values;
- forward and reverse Major Fortune directions;
- all twelve annual-head physical palace indexes;
- at least two consecutive Major Fortune decades where practical;
- both schools in separate reports.

The corpus must be deterministic and reproducible.

Do not use the repository owner's personal birth data as a committed fixture.

Add a smaller fast corpus for normal unit tests and a full audit corpus for the
explicit distribution command.

Suggested commands:

```json
{
  "scripts": {
    "test:annual-axes-distribution:fast": "...",
    "audit:annual-axes-distribution": "..."
  }
}
```

The full audit may be slower than the default unit suite but must be runnable
before release.

---

# 3. Redefine the meaning of the annual score

For every domain:

```text
50 = neutral annual delta
>50 = annual factors support this domain
<50 = annual factors pressure this domain
```

The score must not represent the domain's total natal quality.

A chart with an excellent natal career structure can still have a difficult
career year.

A chart with a difficult natal structure can still have a temporarily supportive
year.

Natal structure may alter sensitivity, resilience, or how strongly annual facts
express themselves. It must not inject a permanent positive score offset.

---

# 4. Remove static natal quality from direct annual support

The current implementation collects broad natal evidence from static domain
frames each year. This is the main source of year-to-year inertia.

Replace that behavior.

A natal physical star may become annual numeric evidence only when at least one
enabled annual trigger applies:

```text
A. the star is physically inside the annual-head TP4C;
B. the star is an exact target of annual Tứ Hóa;
C. an enabled annual moving-star rule physically targets or occupies its palace;
D. the star is at a physical intersection between the annual-head frame and the
   domain's local frame;
E. another explicit, sourced, enabled annual trigger references that fact.
```

Without an annual trigger:

```text
natal star = background/sensitivity only
numeric annual support/pressure contribution = zero
```

Do not scan a complete local TP4C and treat every natal star there as annual
support merely because the domain exists.

Add a field:

```ts
annualTriggerIds: string[];
```

Every natal-derived annual evidence item must contain at least one trigger ID.

The validator/test suite must reject natal-derived annual numeric evidence with
an empty trigger list.

---

# 5. Separate annual evidence channels

For each domain compute four signed channels.

```ts
interface AnnualDomainChannels {
  globalAnnualClimate: SignedAnnualChannel;
  routedHeadImpact: SignedAnnualChannel;
  directDomainImpact: SignedAnnualChannel;
  majorFortuneBackground: SignedAnnualChannel;
}
```

Each signed channel retains independent:

```ts
supportRaw: number;
pressureRaw: number;
activationRaw: number;
evidenceIds: string[];
```

Do not reduce support and pressure into one signed number until after evidence
deduplication and diminishing returns.

## A. Global annual climate

Purpose:

- represent truly broad annual conditions;
- remain small enough that it cannot synchronize all six axes.

Eligible facts must be explicitly marked globally applicable in knowledge.

Do not classify every annual star or every Tứ Hóa as global.

The coefficient and maximum share must come from versioned JSON.

The initial V0.4 profile must cap this channel to a small minority of the final
delta.

## B. Routed annual-head impact

The annual head is the primary router.

Build its TP4C generically:

```ts
focus = index;
opposite = (index + 6) % 12;
trines = [
  (index + 4) % 12,
  (index + 8) % 12,
];
```

For domain `d`:

```ts
routing_d =
  sum(
    domainAnchorWeight *
    annualHeadRelationWeight(anchorPhysicalPalace)
  );
```

There must be no positive routing floor.

```text
routing = 0
→ routed-head delta = 0
```

Use a configurable nonlinear routing curve from JSON, for example:

```ts
routedStrength =
  Math.pow(routing, routingExponent);
```

Do not hardcode the exponent.

The annual-head channel must be projected through domain affinity. Do not compute
one common `headQuality` and copy it into all domains.

## C. Direct annual-domain impact

This is the strongest domain-specific channel.

Eligible evidence includes:

- annual Tứ Hóa exact-target facts;
- annual moving stars physically affecting domain anchors;
- annual triggered natal stars in the domain frame;
- enabled annual interactions with explicit provenance.

A fact's effect is multiplied by its domain affinity.

This channel must be capable of moving one domain while leaving unrelated
domains near neutral.

## D. Major Fortune background

Use physical Major Fortune context only.

Do not read the Major Fortune scorer's output score.

This channel is slower and weaker than direct annual-domain impact.

It may moderate annual effects but must not dominate year-to-year variation.

---

# 6. Add explicit domain affinity

The current model allows general evidence to affect many domains too similarly.

Create a versioned affinity catalog, for example:

```text
src/lib/ziwei/analysis/knowledge/annual-axes/v0.4/
├── annual-domain-affinity.v0.4.json
├── annual-channel-profile.v0.4.json
├── annual-trigger-policy.v0.4.json
├── annual-delta-profile.v0.4.json
├── annual-distribution-gates.v0.4.json
└── ...
```

Affinity is a number in `[0, 1]`.

Suggested contract:

```ts
interface AnnualDomainAffinityRecord {
  id: string;

  subject:
    | { kind: "star"; canonicalStarName: string }
    | { kind: "star-family"; familyId: string }
    | { kind: "transformation"; transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ" }
    | { kind: "moving-marker"; markerId: string };

  affinities: Record<AnnualAxisDomain, number>;

  sourceIds: string[];
  knowledgeStatus: "approved" | "experimental";
}
```

Resolution precedence:

```text
exact star
→ star family
→ evidence category default
→ no numeric evidence
```

Do not use a universal all-domain affinity of `1`.

Unknown or unmapped annual evidence remains diagnostic/context-only until a
record exists.

Validator requirements:

- all affinity values in `[0,1]`;
- at least one non-zero domain per numeric record;
- no unresolved source IDs;
- exact records unique;
- every annual-scorable emitted subject has coverage;
- no numeric affinities in TypeScript.

The affinity values are engineering hypotheses unless a source supports them.
Label them experimental and calibration-required.

---

# 7. Natal sensitivity must be sign-neutral

Create a domain sensitivity/resilience value from natal structure.

It may control annual amplitude but may not add positive or negative annual
quality.

Suggested normalized contract:

```ts
interface NatalDomainResponseProfile {
  sensitivity: number; // 0..1
  resilience: number;  // 0..1
  provenance: string[];
}
```

Allowed effect:

```ts
amplitudeMultiplier =
  responseFloor +
  responseRange * sensitivity;

dampedDelta =
  annualSignedDelta *
  amplitudeMultiplier *
  resilienceDamping(resilience);
```

Requirements:

- the multiplier is always non-negative;
- it cannot change the sign of annual delta;
- neutral annual evidence remains score 50;
- identical annual facts can express with different amplitude on different
  charts;
- natal support alone never pushes the score above 50;
- natal pressure alone never pushes the score below 50.

All coefficients come from JSON.

Do not reuse `PalaceOverviewResult.score`, its normalized axes, or top drivers.

Physical natal facts may be processed independently through Annual Axes
knowledge.

---

# 8. Stability must not create a positive-score bias

The current formula adds positive stability directly to net quality.

Remove that behavior for V0.4.

Stability/resilience may:

- damp extreme movement;
- reduce volatility;
- influence confidence;
- influence conflict interpretation.

It must not automatically make an annual domain favorable.

Final signed quality must fundamentally be:

```ts
supportNorm - pressureNorm
```

not:

```ts
supportNorm - pressureNorm + positiveStabilityBonus
```

Add tests proving:

```text
support = 0
pressure = 0
stability > 0
→ score = 50
```

and:

```text
support = 0
pressure = 0
activation > 0
→ score = 50
```

---

# 9. Annual delta formula

Create a data-driven profile.

Suggested generic implementation:

```ts
globalSigned =
  globalSupportNorm - globalPressureNorm;

headSigned =
  headSupportNorm - headPressureNorm;

directSigned =
  directSupportNorm - directPressureNorm;

majorSigned =
  majorSupportNorm - majorPressureNorm;

annualSignedDelta =
  globalWeight * globalSigned
  + routedHeadWeight * routedStrength * headSigned
  + directDomainWeight * directSigned
  + majorBackgroundWeight * majorSigned;
```

Then:

```ts
annualActivation =
  combineActivationChannels(...);

responseAdjustedDelta =
  applyNatalResponse(
    annualSignedDelta,
    natalSensitivity,
    natalResilience,
  );

effectiveDelta =
  responseAdjustedDelta *
  annualActivation;
```

No annual activation means no annual score departure:

```text
annualActivation = 0
→ score = 50
```

Final mapping:

```ts
score =
  clamp(
    50 +
      scoreAmplitude *
      Math.tanh(
        effectiveDelta / scoreDivisor
      ),
    0,
    100,
  );
```

All weights, scales, routing exponent, response coefficients, amplitude and
divisor must come from knowledge JSON.

Do not embed fallback literals.

Invalid knowledge must fail closed:

```text
status = unavailable
score = null
reason = invalid-knowledge
```

---

# 10. Deduplicate before channel aggregation

A physical fact may qualify for:

- annual-head frame;
- local domain frame;
- exact Tứ Hóa target;
- a moving-star trigger.

It remains one physical fact.

Suggested evidence identity:

```text
annualYear
school
domain
physicalFactId
ruleId
targetPalaceIndex
```

Store all activation paths:

```ts
activationPaths: Array<{
  triggerId: string;
  channel:
    | "global"
    | "routed-head"
    | "direct-domain"
    | "major-background";
  geometryWeight: number;
  affinityWeight: number;
  effectivePathWeight: number;
}>;
```

Resolve multiple paths according to a versioned combination policy.

Do not naively sum all paths.

A reasonable default is bounded union or strongest-path-plus-discounted-rest,
but the exact policy must live in JSON and be calibration-tested.

Tests must prove:

- one physical fact creates one numeric evidence record per domain;
- adding a second path cannot multiply the contribution without bound;
- removing a path changes only its bounded incremental effect;
- evidence order does not change output.

---

# 11. Prevent domain-frame overcoverage

Measure physical coverage of each domain's local frame.

Report:

```ts
interface DomainFrameCoverage {
  domain: AnnualAxisDomain;
  uniquePhysicalPalaceCount: number;
  physicalPalaceIndexes: number[];
}
```

Add a diagnostic when a domain's multi-anchor TP4C union covers nearly all
twelve palaces.

Do not automatically collect all facts from this union.

Domain frames define relevance, while annual triggers define whether a fact is
active this year.

Add a test proving that a domain frame covering twelve palaces does not cause all
twelve palaces' natal stars to become annual evidence.

---

# 12. Year identity and cache correctness

The audit found scores that appear nearly unchanged across annual years.

Verify both calculation and UI identity.

The analyzer cache/memoization key must include, directly or through immutable
chart identity:

- annual year;
- annual head palace index;
- annual stem and branch;
- annual transformation identities;
- annual moving-star identities;
- school;
- Annual Axes contract, engine and knowledge versions.

Do not rely only on a mutable `chartData` object reference.

Prefer immutable ChartData creation.

Add a deterministic `annualFactsFingerprint` when useful.

Tests:

1. same natal chart + different annual years + different annual facts must not
   reuse the prior result;
2. changing annual Tứ Hóa changes the fingerprint;
3. changing annual head changes the fingerprint;
4. identical facts remain byte-stable;
5. UI rerenders the radar when annual year changes.

---

# 13. V0.4 output contract

Extend the axis result with explainability.

```ts
interface AnnualAxisV04AvailableResult {
  status: "available";
  domain: AnnualAxisDomain;

  score: number;
  band: AnnualAxisBand;

  annualDelta: number;
  routing: number;
  routedStrength: number;

  natalResponse: {
    sensitivity: number;
    resilience: number;
    amplitudeMultiplier: number;
  };

  channels: {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  };

  support: number;
  pressure: number;
  activation: number;
  intensity: number;
  conflict: number;

  evidence: AnnualAxisEvidenceV04[];
}
```

Keep unavailable as a discriminated union with `score: null`.

Expose engine/knowledge/profile versions.

Do not overload `activation` as quality.

---

# 14. UI requirements

Keep the radar and six cards, but change their semantics.

Display a visible experimental notice while V0.4 remains behind the off-by-default
flag.

Each card should show:

- score;
- annual delta from 50;
- band;
- intensity;
- conflict;
- strongest supportive annual factor;
- strongest pressuring annual factor.

Detail panel should show:

- annual-head identity and TP4C;
- routing and routed strength;
- four channel summaries;
- natal sensitivity/resilience separately;
- exact annual triggers;
- domain affinities;
- dedup activation paths;
- model versions;
- diagnostics.

Do not display natal sensitivity as a good/bad score.

Do not imply that a value above 50 predicts a guaranteed event.

Radar must never plot unavailable values as zero.

Fix the existing radar implementation if it converts `null` to a zero-radius
point.

For partial results, render only available points or an honest broken/segmented
shape.

---

# 15. Provisional anti-degeneracy gates

Place release gates in:

`annual-distribution-gates.v0.4.json`

These are engineering checks, not Tử Vi doctrine.

Start with provisional thresholds and report every result.

The release remains blocked when any hard gate fails.

Suggested initial gates for the deterministic corpus:

```json
{
  "allSixAbove60RateMax": 0.35,
  "exactDuplicateVectorRateMax": 0.01,
  "nearDuplicateVectorRateMax": 0.05,
  "meanIntraYearAxisStandardDeviationMin": 4.0,
  "medianIntraYearAxisRangeMin": 10.0,
  "medianPerDomainTwelveYearRangeMin": 8.0,
  "medianAdjacentYearAbsoluteDeltaMin": 1.5,
  "annualHeadMoveSensitivityRateMin": 0.70,
  "absoluteInterAxisCorrelationMax": 0.90,
  "unavailableRateMax": 0.02
}
```

Definitions must be documented precisely.

Do not manipulate scores after computation merely to pass these gates.

A gate failure requires changing evidence semantics, routing, affinity,
normalization or knowledge—not rank-normalizing the six axes against one
another.

Do not force one axis below 50 or force artificial variance.

Run a sensitivity report showing how gate metrics change under candidate
profiles.

Keep every candidate profile versioned and identify the selected one.

---

# 16. Required invariants

Add tests proving:

## Annual neutrality

```text
no annual triggers
→ all available axes score exactly 50
```

## Activation neutrality

```text
activation-only evidence
→ score exactly 50
```

## Stability neutrality

```text
stability/resilience-only evidence
→ score exactly 50
```

## Sign monotonicity

```text
add support, hold everything else
→ score cannot decrease

add pressure, hold everything else
→ score cannot increase
```

## Domain isolation

A wealth-only direct annual fact with zero affinity to other domains:

```text
changes wealth
does not numerically change unrelated domains
```

## Router behavior

```text
routing = 0
→ routed-head delta = 0

higher routing with identical signed head evidence
→ larger absolute routed-head effect
```

## Year sensitivity

Changing annual head, annual Tứ Hóa, or annual moving facts must affect the
appropriate annual vector.

## Natal sign neutrality

Changing only natal support/pressure facts may change sensitivity/resilience,
but cannot create a signed annual delta without annual triggers.

## No previous-score dependency

Production source cannot read:

- Palace Overview scores;
- Major Fortune scores;
- Monthly Flow scores;
- legacy trend scores.

## Determinism

- input order does not change score;
- reordered palace array with stable indexes does not change score;
- identical input is byte-stable;
- knowledge and ChartData are not mutated.

---

# 17. Required targeted fixtures

Create at least these synthetic fixtures.

## A. Annual head at Dậu / Tử Tức

Frame:

```text
Dậu · Tử Tức      focus
Mão · Điền Trạch  opposite
Sửu · Phụ Mẫu     trine
Tỵ  · Nô Bộc      trine
```

Assert routing is dynamically computed from domain anchors.

Do not assert that all affected domains receive the same signed quality.

## B. Favorable wealth, pressured career

Construct annual facts where:

- annual Lộc targets a wealth-affine fact;
- annual Kỵ targets a career-affine fact;
- other domains receive no direct trigger.

Expected:

```text
wealth > 50
career < 50
at least two unrelated domains remain near 50
```

## C. Difficult annual head with supportive romance direct trigger

Expected:

- high-routing domains receive pressure from the annual head;
- romance can remain above 50 when its direct trigger outweighs routed pressure;
- the result is not a uniform all-negative vector.

## D. Two charts, same year

Use different natal sensitivity/resilience.

Expected:

- same annual sign pattern may express with different amplitude;
- the two six-axis vectors are not byte-identical;
- natal structure does not reverse signs without an explicit rule.

## E. One chart, twelve years

Expected:

- annual-head movement changes routing;
- annual Tứ Hóa movement changes direct impact;
- no exact repeated six-axis vector unless annual physical facts are identical.

---

# 18. Knowledge validation

Create independent V0.4 schemas, loaders and validators.

Validate:

- unique IDs;
- all six domains;
- all referenced source IDs;
- all weights within bounds;
- normalized domain anchor weights;
- affinity coverage;
- trigger-policy coverage;
- channel weights;
- routing formula parameters;
- score bands;
- distribution gate definitions;
- version manifest consistency;
- no forbidden numeric keys in annotation-only records.

Deep-freeze loaded knowledge.

V0.2 and rejected V0.3 profiles must not be selected by the V0.4 runtime.

---

# 19. Source and hardcode scans

Add automated import/source scans.

Fail tests when Annual Axes production code:

- imports Calculation Core placement functions;
- imports another analysis module's result;
- reads another module's score;
- embeds domain affinity tables;
- embeds channel weights;
- embeds routing coefficients;
- embeds score normalization coefficients;
- contains Dậu-, age-36-, Tử-Tức-, or personal-chart-specific logic;
- uses random values;
- rank-normalizes axes against each other.

Generic constants unrelated to the scoring policy, such as `12` for palace count,
are allowed when represented clearly as structural constants.

---

# 20. Performance

The chart page must not run the full distribution corpus.

Runtime analysis remains one chart × one year.

Memoize safely using immutable annual facts or a deterministic fingerprint.

The audit harness is test/research tooling only.

Set a reasonable runtime budget and report it:

```text
single chart annual analysis p95
100-chart × 12-year audit duration
```

Do not sacrifice provenance or correctness for micro-optimization.

---

# 21. Migration and compatibility

Because PR #90 is still open and unmerged:

- rename public V0.2 identifiers to V0.4 where appropriate;
- remove stale V0.2 changelog claims;
- do not advertise the six-axis feature as released;
- keep the UI behind the default-off V0.4 flag;
- preserve Trung Châu fixtures, but audit Trung Châu for the same static-score
  degeneracy;
- do not claim Trung Châu is production-ready merely because its old snapshot is
  byte-identical.

A byte-identical regression is useful for unintended drift, but preserving a
known-degenerate model is not the release objective.

If V0.4 changes Trung Châu semantics, place that change behind a separate
school-specific profile and update the fixture intentionally.

---

# 22. Verification order

Run in this order and stop at the first failure:

```bash
npm run typecheck

npm test -- \
  src/lib/ziwei/analysis/knowledge/annual-axes

npm test -- \
  src/lib/ziwei/analysis/modules/annual-axes

npm test -- \
  src/components/ziwei/annual-axes

npm run test:annual-axes-distribution:fast

npm test

npm run build

npm run audit:annual-axes-distribution
```

The final full audit must generate both:

```text
V0.2 baseline report
V0.4 candidate report
```

Do not report release readiness when only unit tests are green.

---

# 23. Release acceptance

The PR is release-ready only when:

- all hard distribution gates pass;
- the V0.4 report materially improves over the V0.2 baseline;
- annual-year changes produce meaningful but not artificial variation;
- domain isolation fixtures pass;
- no static natal quality offset remains;
- activation-only and stability-only scores remain 50;
- no previous module scores are read;
- UI is default off until owner approval;
- desktop/mobile/dark-mode screenshots are reviewed;
- typecheck, focused tests, full tests, build and full audit pass.

Do not merge automatically.

---

# 24. PR metadata

Update title to:

```text
feat(ziwei): Annual Axes V0.4 annual-delta model + experimental UI
```

Update PR body with:

- root cause of V0.2 score convergence;
- V0.2 baseline metrics;
- V0.4 metrics;
- annual-delta semantics;
- routed annual-head design;
- domain affinity coverage;
- natal response neutrality;
- release gates;
- feature flag default-off;
- manual visual review status.

Remove claims that V0.2 is published or release-ready.

---

# 25. Suggested commits

```text
test(ziwei): reproduce Annual Axes score convergence
refactor(ziwei): separate annual triggers from natal background
feat(ziwei): add routed annual-delta channels
feat(ziwei): add Annual Axes domain affinity catalog
test(ziwei): enforce Annual Axes distribution gates
fix(ziwei): publish V0.4 UI behind default-off flag
docs(ziwei): document Annual Axes V0.4 audit results
```

---

# 26. Final report

Report exactly:

- current branch and final commit SHA;
- files changed;
- V0.2 root-cause findings;
- Calculation Core input facts;
- annual trigger policy;
- annual-head router formula and its JSON source;
- domain affinity coverage;
- natal sensitivity/resilience behavior;
- physical evidence dedup policy;
- targeted fixture results;
- V0.2 baseline distribution metrics;
- V0.4 distribution metrics;
- every release gate and pass/fail result;
- single-analysis and corpus runtime;
- focused test totals;
- full test total;
- typecheck result;
- build result;
- screenshot/manual review status;
- updated PR URL.

Do not claim completion when the full distribution audit has not run.

Do not claim the model is “classically proven.” Numeric weights and release gates
remain experimental engineering calibration until expert-reviewed benchmark data
supports them.
