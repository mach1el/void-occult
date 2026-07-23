# Zi Wei Analysis

Analysis modules interpret facts from Calculation Core. They do **not** an sao.

## Calculation vs Analysis

```text
Calculation Core:
- an lá số;
- an cung;
- an sao;
- lịch pháp;
- lưu hạn;
- không đưa ra điểm vận khí.

Analysis Modules:
- diễn giải facts từ Calculation Core;
- độc lập theo từng scope;
- có version;
- có school policy;
- có data governance.
```

## Modules

| Module | Status |
|--------|--------|
| palace-overview | V1 experimental (`ziweiPalaceOverviewV1`, default OFF) |
| annual-axes | available |
| major-fortune | available V0.3.1 (`ziweiMajorFortuneV03Ordinal`, default ON) |
| monthly-flow | rebuilding |

## Share rules

May share: typed facts, frame geometry, source registry, school profile, explanation primitives.

Must not share directly: weights, normalization scale, final score formula, acceptance ranges, domain projection.
