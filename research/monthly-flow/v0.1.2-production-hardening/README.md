# Monthly Flow V0.1.2 production hardening

Semantic tests + audit hard gates for anchor fidelity, health UI exclusion,
and current-month identity.

Pipeline:

```
ChartData → Calculation Core provider → school-aware annual-domain adapter
→ analyzeMonthlyFlow(resolvedDomainContext) → 5-domain UI projection
```

Scripts: `research:monthly-flow-v012:*`

Decision: see `V0.1.2-PRODUCTION-HARDENING-DECISION.md` (`PROMOTE_MONTHLY_FLOW_V01_TO_PRODUCTION`).
