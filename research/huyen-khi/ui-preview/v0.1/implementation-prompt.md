# IMPLEMENTATION PROMPT — PR #96 HUYỀN KHÍ RESEARCH PREVIEW V0.1

## Context

```text
Repository: st-mich43l/apexvoid-occult
Base: latest master
Branch: feat/ziwei-huyen-khi-research-preview-v0-1
PR title: feat(ziwei): publish Huyền Khí research preview V0.1
```

Create one focused PR. Keep it open for owner review.

## Mission

Put Huyền Khí on the chart UI now, honestly, as a feature-flagged natal
**Research Preview**. Do not implement the promoted symbolic evaluator.

The committed ontology gate still requires 30 approved expert fixtures. This PR
must not fabricate Huyền Khí states while that gate is unmet.

## Hard boundaries

Never import scores/evidence from:

```text
palace-overview
annual-axes
major-fortune
monthly-flow
legacy trend scoring
external public-site output
```

Never create a Huyền Khí `score`, `weight`, `factor`, `delta`, `multiplier`,
percentage or good/bad band.

No network. No annual, major-fortune or monthly facts. No runtime import from
`research/`.

## Research artifacts

Commit the supplied files under:

```text
research/huyen-khi/ui-preview/v0.1/
```

Runtime code must not import them.

## Neutral fact SSOT

Use only:

```ts
normalizeNatalFacts(chart, { school })
factsForPalace(...)
canonicalStarName(...)
```

from `src/lib/ziwei/analysis/facts`.

The normalized fact layer is natal-only and already exposes palace identity,
star class, brightness, Tứ Hóa, Tuần/Triệt and Trường Sinh.

Do not parse rendered text or raw CSS.

## Module

Create:

```text
src/lib/ziwei/analysis/modules/huyen-khi-preview/
  types.ts
  geometry.ts
  build-preview.ts
  diagnostics.ts
  index.ts
  __tests__/
```

Public result:

```ts
interface HuyenKhiPreviewResult {
  module: "huyen-khi";
  mode: "research-preview";
  evaluatorStatus: "not-promoted";
  status: "available" | "partial" | "unavailable";
  school: School;
  palaces: HuyenKhiPreviewPalace[];
  diagnostics: HuyenKhiPreviewDiagnostic[];
  versions: {
    contractVersion: "0.1.0";
    adapterVersion: "0.1.0";
    copyVersion: "0.1.0";
  };
}
```

Each palace contains:

```text
palaceIndex, palaceName, branch, stem
isMenh, isThan, changShengStage
isVoChinhDieu
oppositePalaceIndex, trinePalaceIndexes
majorStars, minorStars
natalTransformations
voidMarkers
borrowedMajorStars
dimensionStates where all five values are null
dimensionStateReason = symbolic-evaluator-not-promoted
```

No optional numeric score field.

## Geometry

```ts
opposite = (index + 6) % 12
trineA = (index + 4) % 12
trineB = (index + 8) % 12
```

Vô Chính Diệu means no resident natal `starClass === "major"`.

`borrowedMajorStars` is only a factual list of major stars resident in the
opposite palace. Do not apply the Palace Overview VCD coefficient.

## Validation

Require:

```text
12 unique palace indexes
exactly one Mệnh
exactly one Thân
no duplicate natal fact IDs
all facts are natal
fact school matches requested school
```

Diagnostics may include:

```text
invalid-chart
duplicate-natal-fact-id
missing-palace
missing-menh
multiple-menh
missing-than
multiple-than
school-mismatch
unsupported-natal-fact
```

Ordering must be deterministic.

## Feature flag

Add:

```text
ziweiHuyenKhiPreviewV01
VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01
```

Behavior:

```text
default OFF
?ziweiHuyenKhiPreviewV01=1 enables for session
?ziweiHuyenKhiPreviewV01=0 disables for session
SSR false
```

## UI

Create:

```text
src/components/ziwei/huyen-khi/
  HuyenKhiResearchPreview.tsx
  huyen-khi-research-preview.css
  __tests__/
```

Place a full-width section after `palace-overview-section` and before
`trend-section`.

Header copy:

```text
Huyền Khí
Research Preview
Bản xem trước cấu trúc khí của 12 cung
```

Mandatory disclaimer:

```text
Đây là bản xem trước dữ liệu cấu trúc, chưa phải kết luận Huyền Khí
và không phải dự đoán sự kiện.
```

Also show:

```text
Module này chỉ đọc nguyên cục; thay đổi năm xem không làm thay đổi kết quả.
```

Interaction:

- 12 compact palace buttons;
- select Mệnh by default;
- state stores only `selectedPalaceIndex`;
- derive selected result from current preview;
- keyboard Enter/Space;
- no stale object after chart/school change.

Default visible detail:

```text
Nền cung
Chính tinh
Tứ Hóa gốc
Tuần/Triệt
Tham chiếu đối cung when VCD
```

Collapsed:

```text
Phụ tinh tại cung
Khung đánh giá Huyền Khí
Thông tin nghiên cứu
```

Show first 8 minor stars, then expand.

The five dimensions may display their definitions, but every state must say:

```text
Chưa đánh giá
```

with explanation:

```text
Bộ đánh giá biểu tượng chưa được kích hoạt vì chưa đạt cổng kiểm chứng chuyên gia.
```

## Tests

Adapter tests:

```text
12 palaces
one Mệnh and one Thân
VCD detection
opposite major references
brightness, natal Tứ Hóa, void and Trường Sinh preservation
deterministic output
all dimension states null
```

Isolation tests:

```text
changing annualYear produces deep-equal preview
no annual/major/monthly facts
no cross-school fallback
no imports from other analysis modules
no runtime research JSON import
no network
```

No-numeric scan must reject keys matching:

```text
score weight factor coefficient delta multiplier percentage
support pressure stability activation
```

UI tests:

```text
flag default OFF
query opt-in/out
Mệnh selected by default
12 accessible controls
minor stars collapsed
disclaimer visible
five dimensions show Chưa đánh giá
no numeric score label
```

## Manual review

Check both schools at:

```text
1440, 1024, 390, 360
```

Review Mệnh with majors, VCD, Tuần, Triệt, Tứ Hóa and many minor stars.

Change annual year and confirm preview remains identical.

## Verification

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Attach desktop/mobile screenshots.

## Definition of Done

```text
Huyền Khí is visible through explicit feature opt-in
natal-only deterministic factual preview
one palace detail at a time
all five dimension states remain null / Chưa đánh giá
no numeric score or good/bad band
no prior-module score import
no research JSON in browser runtime
no network
annual and school isolation tests pass
mobile and accessibility pass
typecheck, tests and build pass
PR remains open
```
