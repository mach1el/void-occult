# monthly-flow

Lưu nguyệt từng tháng — Monthly Flow Scoring V0.1.

Invariant: `focusPalace` ≠ calendar stem/branch (two independent coordinate systems).
Calendar identity comes from the injected `MonthlyCalculationProvider`
(`stemBranchForLunarMonth`), never from `palace.stem` / `palace.branch`.

No UI in V0 — module API only.
