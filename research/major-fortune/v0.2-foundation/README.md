# Major Fortune V0.2 Foundation

Research-only four-pillar scoring foundation for one already-resolved 10-year Đại Vận.

**Decision (expected):** `RESEARCH_INCOMPLETE` — see `V0.2-FOUNDATION-DECISION.md`.

## Scope

- Candidate formula + pillar caps + bands as data
- Source/claim graded policies
- Isolated candidate engine `analyzeMajorFortuneV02` (not production)
- Audit corpus + gates

## Out of scope

- UI / `getAnalysisStatus` / feature flags
- Replacing Major Fortune V0.1
- Inventing per-rule numeric deltas without sources
- Annual/monthly facts in the decade score

## Layout

| Path | Role |
| --- | --- |
| `sources/` | Source registry |
| `claims/` | Atomic claims |
| `contradictions/` | Contradiction log |
| `policies/` | Doctrine policies |
| `schema/` | JSON schemas |
| `prompts/` | Handoff prompts |
| `audit/` | Corpus + gate contracts |

Runtime knowledge: `src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.2/`
Candidate engine: `src/lib/ziwei/analysis/modules/major-fortune/v0.2/`
