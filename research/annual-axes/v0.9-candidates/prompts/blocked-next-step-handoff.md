# Blocked Next-Step Handoff — Annual Axes V0.9

## Decision from candidate evaluation

```
RESEARCH_REVISION_REQUIRED
selectedCandidateId: null
```

Production routing must remain **Nam Phái V0.8** / Engine **0.8.0**.
Do not implement or enable a V0.9 production route from this handoff.

## Why candidate evaluation was blocked

Foundation readiness is `RESEARCH_INCOMPLETE` (validated
`research/annual-axes/v0.9-foundation/`). Per evaluation contract:

- zero classical / school-manual / published-reference sources
- zero `classical`-status claims
- `CONTRA-AAV09-001` (Lưu Đào Hoa polarity) remains unadjudicated
- best-evidenced candidate shape (wire 12 emitted-but-unreferenced annual
  stars) cannot be scoped without source-backed polarity/domain assignments

Inventing experimental candidates under this state would violate the
mission constraints (no unsupported doctrine as classical truth; no
radar-only cosmetics).

## Required next task

**Focused research completion / source & claim adjudication** — not
candidate scoring, not production rollout.

Reuse:

- `research/annual-axes/v0.9-foundation/prompts/source-extraction-prompt.md`
- `research/annual-axes/v0.9-foundation/prompts/claim-adjudication-prompt.md`
- `research/annual-axes/v0.9-foundation/prompts/v0.9-candidate-handoff-prompt.md`

Branch suggestion:

```
research/ziwei-annual-axes-v0-9-research-completion
```

Success criteria for reopening candidate evaluation:

1. At least one verified classical or school-manual Nam Phái source with
   checkable locators.
2. Per-star source-backed polarity/domain/point-class for the 12
   unreferenced-but-emitted stars (or explicit school-specific adjudication).
3. `CONTRA-AAV09-001` resolved or explicitly remain-disputed with evidence.
4. Foundation readiness upgraded to `READY_FOR_V0_9_CANDIDATE` with
   `npm run research:annual-axes-v09:validate` still green.
5. Then reopen `research/ziwei-annual-axes-v0-9-candidate-evaluation` with
   real experimental candidates.

## Separate optional engineering fix (not this handoff)

Finding 6 (`scoreState` float epsilon) may proceed as an independent
production PR if product owners approve touching V0.8 label semantics.
It does not unlock doctrine-backed V0.9 candidates by itself.

## Calculation Core (narrow)

Do **not** treat the five unsupported stars (Lưu Đại Hao / Tiểu Hao /
Phục Binh / Tuần / Triệt) as a doctrine research question. Any work there
starts with Calculation Core producers.

## Do not execute

- production routing changes
- deleting V0.8
- inventing annual identities by renaming natal stars
- calibrating on product fixtures
