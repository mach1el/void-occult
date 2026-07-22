# Annual Axes V0.9 Candidates

Research-only package for candidate evaluation and production decision.

## Production safety

- Nam Phái production remains **Engine 0.8.0**.
- Trung Châu remains **Engine 0.2.0**.
- This package is **not** imported by the public analysis barrel or UI.

## Foundation gate

Experimental candidates may be added only when
`research/annual-axes/v0.9-foundation/` reports:

```text
READY_FOR_V0_9_CANDIDATE
```

Current foundation state at pack creation: **RESEARCH_INCOMPLETE**.

Therefore this pack contains **CONTROL-V08 only** and emits:

```text
RESEARCH_REVISION_REQUIRED
selectedCandidateId: null
```

## Commands

```bash
npm run research:annual-axes-v09:validate
npm run research:annual-axes-v09-candidates:validate
npm run research:annual-axes-v09-candidates:control
npm run research:annual-axes-v09-candidates:training
npm run research:annual-axes-v09-candidates:freeze
npm run research:annual-axes-v09-candidates:holdout
npm run research:annual-axes-v09-candidates:product
npm run research:annual-axes-v09-candidates:decision
npm run research:annual-axes-v09-candidates:all
```

## Artifacts

- `V0.9-CANDIDATE-DECISION.md`
- `reports/production-decision.json`
- `prompts/blocked-next-step-handoff.md`
