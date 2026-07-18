# Zi Wei Analysis

Phase 0 skeleton — **no scoring implementation**.

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
- có data governance;
- chưa được triển khai trong Phase 0.
```

## Bốn module độc lập

```text
palace-overview   — Khí vận tổng thể 12 cung
annual-axes       — 6 trục khí vận theo năm xem
major-fortune     — Đại vận
monthly-flow      — Lưu nguyệt từng tháng
```

## Quy tắc không chia sẻ tùy tiện

Các module **có thể** chia sẻ:

```text
- typed facts;
- frame geometry;
- source registry;
- school profile;
- explanation primitives.
```

Các module **không được** chia sẻ trực tiếp:

```text
- weights;
- normalization scale;
- final score formula;
- acceptance ranges;
- domain projection.
```

## Status

Mọi module hiện trả `status: "unavailable"`, `reason: "rebuilding"` qua
`getAnalysisStatus()` trong `contracts/common.ts`.
