# Corrective Prompt — PR #90 → Annual Axes V0.3

Repository:

`st-mich43l/apexvoid-occult`

Continue on the existing PR #90 branch:

`feat/ziwei-annual-axes-v0-2-nam-phai-ui`

Reviewed head before this corrective phase:

`0cb5e3a1dc3aa4514f8353bbfaac7f92bb1f0646`

Do not merge the current head.

Install the supplied Annual Axes V0.3 data pack and treat it as the mandatory
architecture for the Nam Phái model.

## Mission

Correct PR #90 so the six annual axes are led by the project’s resolved
**one-year limit palace inside the active Major Fortune decade**.

The product owner calls this coordinate:

`Lưu Tiểu Hạn / cung hạn năm`

The current runtime computes it through:

`getAnnualMajorFortuneIndex()`

and marks its physical palace with:

`isLuuNienDaiVan`

This coordinate is the Nam Phái annual head.

It is not the same fact as:

`chart.smallLimitPalace`

which is the Tam Hợp small-limit ring.

The current PR incorrectly uses `smallLimitPalace` as primary annual focus.
Replace that architecture.

## Non-goals

Do not add:

- prediction prose;
- event claims;
- Monthly Flow UI;
- Major Fortune UI;
- new Tứ Hóa tables;
- new one-year limit arithmetic;
- a universal cross-school annual model;
- unsourced convergence bonuses;
- previous module score reuse.

Do not weaken the existing available/partial/unavailable UI states.

## 1. Expose the resolved annual-head fact

Add an explicit ChartData field, preferably:

```ts
annualHeadPalace?: ChartPalace | null;
```

or, when naming must mirror Calculation Core:

```ts
annualMajorFortunePalace?: ChartPalace | null;
```

This is an additive Calculation Core contract change only.

Do not recalculate the palace inside Annual Axes.

In the Nam Phái engine, set the pointer from the already-computed
`luuNienDaiVanIndex`.

Retain `isLuuNienDaiVan` for chart rendering/backward compatibility.

Migration-only fallback inside the resolver may scan for exactly one
`isLuuNienDaiVan === true` palace. Emit a diagnostic when the explicit pointer
is absent. Reject zero or multiple flagged palaces.

## 2. Correct the coordinate policy

Nam Phái:

```text
primary annual head       = annualHeadPalace
secondary annual context  = smallLimitPalace
external calendar context = taiTuePalace
decade background         = majorFortunePalace
```

Trung Châu:

```text
primary annual head = physical palace with annualPalaceName === "Mệnh"
```

No cross-school fallback.

Replace the PR #90 policy record:

```json
"primaryAnnualFocus": "small-limit"
```

with the V0.3 policy catalog.

## 3. Preserve terminology explicitly

Do not rely on ambiguous variable names.

Use typed IDs:

```ts
type AnnualHeadKind =
  | "annual-major-fortune"
  | "annual-menh";

type SecondaryAnnualCoordinate =
  | "tam-hop-small-limit"
  | "tai-tue";
```

For Nam Phái UI, use a stable label such as:

```text
Lưu Tiểu Hạn tại Dậu · Tử Tức
```

The technical detail section may show:

```text
Calculation fact: annual-major-fortune / isLuuNienDaiVan
```

Do not label `smallLimitPalace` as the primary annual head.

## 4. Build the annual-head TP4C

From `annualHeadPalace.index`:

```text
focus     = index
opposite  = index + 6 mod 12
trines    = index + 4 and index + 8 mod 12
```

Use the V0.3 head weights from JSON:

```text
focus     1.00
opposite  0.80
trine     0.70
outside   0.00
```

Require a complete four-node frame.

## 5. Use school-specific domain catalogs

### Nam Phái

Load:

`annual-axis-definitions.nam-phai.v0.3.json`

Resolve anchors through unique natal palace names.

### Trung Châu

Continue using the existing Annual Axes V0.2 definitions and dynamic
`annualPalaceName` resolver.

Do not apply the new Nam Phái anchor weights to Trung Châu in this PR.

Preserve the locked Trung Châu numeric fixture byte-identically.

## 6. Compute domain routing

For every Nam Phái domain:

```ts
routing = sum(
  anchor.weight *
  relationWeight(anchor.physicalPalace, annualHeadFrame)
);
```

Use only coefficients loaded from:

`annual-routing-profile.v0.3.json`

Then:

```ts
headShare =
  headShareFloor +
  headShareRange * routing;

localShare = 1 - headShare;
```

With the supplied candidate data:

```text
headShare range: 0.55 to 0.80
```

Expose `routing`, `headShare` and `localShare` in each axis result for
explainability.

## 7. Blend at physical-fact level

Do not calculate a complete head score and a complete local score and add them.
That would count overlapping stars twice.

For every physical evidence fact, calculate:

```ts
combinedGeometryWeight =
  headShare * headChannelWeight +
  localShare * localChannelWeight;
```

Rules:

- `headChannelWeight` is zero outside the annual-head TP4C;
- `localChannelWeight` is the highest eligible local-anchor frame weight;
- one physical fact creates one numeric evidence item;
- apply confidence, layer weight and diminishing only after the channel blend;
- record both channel weights and the combined result in provenance.

Add evidence fields similar to:

```ts
headChannelWeight: number;
localChannelWeight: number;
routing: number;
headShare: number;
localShare: number;
combinedGeometryWeight: number;
```

## 8. Annual-head structural activation

The annual head identifies emphasis, not polarity.

Use the activation-only formula from JSON:

```ts
activationRaw =
  baseRaw + routingRangeRaw * routing;
```

It must add exactly zero:

- support;
- pressure;
- stability.

Activation-only input must preserve score 50.

Remove the V0.2 primary-focus implementation that adds one fixed
`small-limit +0.8 activation` marker.

## 9. Secondary contexts

Load V0.3 context marker data.

`smallLimitPalace`:

- secondary annual context only;
- activation-only;
- never replaces annual head;
- must have its own fact ID and label `tam-hop-small-limit`.

`taiTuePalace`:

- external/calendar context;
- activation-only;
- must not have a larger unsourced fixed activation than the annual head.

Remove V0.2 same-palace convergence bonuses.

All interaction rules remain disabled.

## 10. Evidence layer weights

Load:

`annual-layer-weights.nam-phai.v0.3.json`

Do not hardcode coefficients.

The annual head operates through geometry/routing and is not an additional
multiplicative layer weight.

Annual transformations remain exact-target physical facts.

The decade is background context and must not overwrite the annual head.

## 11. Normalization

Use exactly:

`annual-scoring-profile.nam-phai.v0.3.json`

Do not reuse the V0.2 normalization object for Nam Phái.

Do not change Trung Châu normalization/output in this PR.

## 12. Required Dậu / Tử Tức regression

Create a deterministic synthetic Nam Phái chart where:

```text
active Major Fortune: Mão · Điền Trạch, ages 35–44
nominal age:          36
annual head:          Dậu · Tử Tức
```

The annual-head frame must be exactly:

```text
Dậu · Tử Tức      focus
Mão · Điền Trạch  opposite
Sửu · Phụ Mẫu     trine
Tỵ  · Nô Bộc      trine
```

Load expected routing from the supplied fixture and assert:

```text
family   routing 0.5300, headShare 0.6825
social   routing 0.3500, headShare 0.6375
wealth   routing 0.1200, headShare 0.5800
romance  routing 0.1000, headShare 0.5750
career   routing 0.0700, headShare 0.5675
health   routing 0.0000, headShare 0.5500
```

These values are routing strengths, not favorable/unfavorable scores.

Also assert:

- changing `smallLimitPalace` alone does not change annual-head identity;
- changing annual head changes routing;
- focus structure adds no support/pressure/stability;
- the same star in head and local frames appears once;
- input and knowledge are not mutated.

## 13. Remove the misleading V0.2 fixture

The current PR body says:

```text
Nam Phái Mão / Tài Bạch focus fixture
```

Determine what Calculation Core fact that fixture represents.

If it is `smallLimitPalace`, it is not the annual head and must be:

- renamed as a secondary-context fixture; or
- removed from annual-head tests.

Do not keep a passing test that encodes the wrong coordinate.

## 14. UI changes

Keep the existing six-axis radar/cards/detail UI, but update its data and copy.

Header summary for Nam Phái:

```text
Đầu tàu năm: Lưu Tiểu Hạn tại Dậu · Tử Tức
Khung hạn: Dậu / Mão / Sửu / Tỵ
```

Optional secondary line:

```text
Tiểu Hạn Tam Hợp: ... · Lưu Thái Tuế: ... · Đại Vận: ...
```

Do not combine the coordinates into one label.

Each axis detail must show:

- routing;
- head share;
- local share;
- annual-head evidence;
- local-domain evidence;
- annual transformations;
- secondary context evidence;
- dedup/blend provenance.

Rename the feature flag before merge:

```text
ziweiAnnualAxesV03
VITE_ZIWEI_ANNUAL_AXES_V03
?ziweiAnnualAxesV03=0
```

PR #90 has not been merged, so do not publish V0.2 naming as a permanent public
contract.

## 15. Diagnostics

Add typed diagnostics for:

- missingAnnualHeadPalace;
- duplicateAnnualHeadPalaces;
- annualHeadPointerFlagMismatch;
- invalidAnnualHeadFrame;
- missingSecondarySmallLimit;
- routingOutOfRange;
- duplicatePhysicalFacts;
- missingSourceIds;
- unsupportedSchoolPolicy.

Do not report a missing secondary coordinate as if the annual head were
missing.

## 16. Tests

### Knowledge

- all V0.3 JSON validates;
- six Nam Phái domain weights sum to 1;
- routing coefficients stay in valid ranges;
- no V0.2 convergence bonus remains enabled;
- source/claim references resolve;
- knowledge is deeply frozen.

### Calculation contract

- Nam Phái engine exposes the already-computed annual-head pointer;
- pointer and `isLuuNienDaiVan` agree;
- age 36 / second decade year resolves the opposite palace in the synthetic
  fixture;
- scorer never calls `getAnnualMajorFortuneIndex()` directly.

### Scoring

- load every formula fixture exactly;
- activation-only score equals 50;
- high support and pressure yields high conflict;
- head/local same fact contributes once;
- no previous module score is read;
- disabled interactions produce zero delta.

### School regression

- Trung Châu locked output byte-identical;
- Nam Phái uses V0.3 head-centric profile;
- no cross-school resolver fallback.

### UI

- correct annual-head label and frame;
- secondary small limit shown separately;
- routing visible in detail;
- unavailable values never plotted as zero;
- keyboard detail behavior preserved;
- feature flag V0.3 off shows fallback.

## 17. Changelog and PR body

Update PR title to:

`feat(ziwei): Annual Axes V0.3 head-centric model + chart UI`

Correct the PR summary so it no longer claims `smallLimitPalace` is the Nam
Phái annual focus.

Document that numeric routing weights are experimental calibration seeds.

## Verification

Run in order:

```bash
npm run typecheck

npm test -- \
  src/lib/ziwei/analysis/modules/annual-axes

npm test -- \
  src/lib/ziwei/analysis/knowledge/annual-axes

npm test -- \
  src/components/ziwei/annual-axes

npm test
npm run build
```

Stop at the first failure.

Do not update unrelated snapshots.

Do not report completion without:

- exact files changed;
- annual-head pointer contract;
- Dậu/Tử Tức routing results;
- dedup proof;
- Trung Châu regression result;
- focused/full test totals;
- typecheck result;
- build result;
- final commit SHA.

Suggested commits:

```text
fix(ziwei): separate annual head from Tam Hợp small limit
feat(ziwei): route Nam Phái annual axes from annual head
fix(ziwei): publish Annual Axes V0.3 provenance in UI
test(ziwei): lock annual-head routing regressions
```

## 18. Mandatory dynamic-resolution and no-hardcode gate

Load and enforce:

`annual-dynamic-resolution-guard.v0.3.json`

The implementation is unacceptable if it passes only the supplied Dậu/Tử Tức
fixture through a branch-specific special case.

### Dynamic architecture

All astrology placement facts must come from resolved Calculation Core data:

```text
annualHeadPalace
smallLimitPalace
taiTuePalace
majorFortunePalace
annualMutagens
physical chart palaces and stars
```

Annual Axes may consume these facts but may not recalculate or repair them.

The scorer must work for all twelve physical palace indexes with the same
generic modulo geometry.

No production branch may contain logic such as:

```ts
if (branch === "Dậu") { ... }
if (age === 36) { ... }
if (palace.name === "Tử Tức") { useSpecialWeights(); }
```

The Dậu/Tử Tức case is a regression fixture only.

### No hidden numeric constants

The following must be read from versioned knowledge JSON:

- Nam Phái domain anchors and weights;
- annual-head frame weights;
- local domain frame weights;
- head-share floor and range;
- structural activation coefficients;
- evidence layer weights;
- confidence coefficients;
- diminishing rule;
- normalization scales and coefficients;
- score bands.

TypeScript may contain only generic arithmetic implementing expressions loaded
from knowledge.

Do not duplicate knowledge values as fallback literals.

Missing or invalid knowledge must fail closed with `invalidKnowledge`.

### No hidden school rules

School selection must resolve through a versioned policy profile.

Do not switch behavior by checking which fields happen to be populated.

Do not use Trung Châu behavior as fallback for Nam Phái or vice versa.

### Calculation Core boundary

Annual Axes must not import:

- `getAnnualMajorFortuneIndex`;
- `assignSmallLimits`;
- a concrete Nam Phái engine;
- a concrete Trung Châu engine;
- Tứ Hóa placement tables.

Expose any missing resolved fact through a typed ChartData adapter or additive
Calculation Core field.

### Exact physical targets

Every star and transformation contribution must identify:

```text
physical fact ID
canonical star name
physical palace index
source layer
rule ID
source IDs
```

A transformation target is invalid when the target star does not physically
exist in the resolved palace.

No fuzzy first-match behavior.

### Required dynamic tests

Add a parameterized test over focus indexes `0..11`.

For every index assert:

```ts
focus === index
opposite === (index + 6) % 12
trines === [
  (index + 4) % 12,
  (index + 8) % 12,
]
```

Add tests proving:

1. No branch name is required to build TP4C.
2. Different annual years may dynamically resolve different annual heads.
3. Changing only `smallLimitPalace` never changes the primary annual head.
4. Changing `annualHeadPalace` changes routing through generic geometry.
5. Missing knowledge coefficients do not fall back to hardcoded values.
6. Nam Phái and Trung Châu profiles never fall back to each other.
7. A synthetic chart with reordered palace arrays produces the same result when
   physical palace indexes and facts are unchanged.
8. The Dậu/Tử Tức fixture passes without any Dậu-, age-36-, or Tử-Tức-specific
   production branch.

### Required source scan

Fail the test suite when Annual Axes production source contains imports or reads
from:

```text
getAnnualMajorFortuneIndex
assignSmallLimits
engine-nam-phai
engine-trung-chau
PalaceOverviewResult.score
AnnualAxisResult from another run
MajorFortuneAxisResult.score
MonthlyFlowAxisResult.score
```

Also scan for duplicated coefficient literals where practical.

### Final report addition

Report:

- which facts are Calculation Core inputs;
- which coefficients come from which JSON files;
- proof of all-12-index TP4C tests;
- proof that reordered palace arrays remain deterministic;
- proof that no branch/age/palace-specific production special case exists;
- source-scan result.

