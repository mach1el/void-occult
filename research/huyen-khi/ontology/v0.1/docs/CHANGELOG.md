# Huyền Khí Ontology V0.1 — research changelog

Research-only scaffold. No fortune scoring, no numeric formula recovery, no
evaluator/analyzer/scorer, no production imports. External Tử Vi Cổ Học scores
are never treated as ground truth.

## V0.1 hardening

Governance and provenance hardening of the initial ontology scaffold.

- **A1** Fixture reviewer status is derived only from the append-only review
  ledger; a hand-written status can never satisfy a promotion gate.
- **A2** Review records are fully validated (reviewer, role, school profile,
  decision, rationale, timestamp; strict enums; unknown fields rejected); the
  review CLI validates its arguments.
- **A3** Conflict detection is school-isolated: a Nam-Phái-only rule and a
  Trung-Châu-only rule never conflict; `shared` may conflict with either.
- **A4** A fully-traceable doctrinal rule requires a resolved claim locator.
- **A5** Malformed or missing registries fail closed with deterministic
  `schema-invalid` issues instead of crashing.
- **B** Release gates use capability/phase language; no hard-coded PR numbers.
- **C** Each of the five dimensions declares an ApexVoid engineered-construct
  epistemic status, non-claims, and deferred aggregation; `tendency` is not the
  old support/pressure axis.
- **D** A dimension/operation compatibility contract rejects invalid pairs in
  schema and at runtime, with no coercion.
- **E** Strict locator schema; source witnesses and transcriptions are separate
  identities; contradiction links are recorded, never auto-resolved.
- **F** Source registry expanded (scan witness, linked transcription,
  unresolved VN reference edition, unavailable Trung Châu bibliography record).
- **G** Fixture maturity levels (planned → research-ready → reviewable, then
  ledger-derived reviewed/approved/disputed); gates renamed so only
  `approvedExpertFixtureCountMin` may unlock the symbolic evaluator phase.
- **H** Added research artifacts: source-witness matrix, dimension-operation
  compatibility, claim-provenance policy, fixture-maturity policy, and
  research-topic coverage.
- **I** Regression tests for every finding and new contract; reports remain
  byte-for-byte deterministic.

The symbolic evaluator phase remains closed: 0 of the required approved expert
fixtures exist.
