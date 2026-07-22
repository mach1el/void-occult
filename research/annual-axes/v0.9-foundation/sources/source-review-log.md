# Source Review Log — Annual Axes V0.9 Foundation

## Sourcing constraint (stated up front)

This pack was built without access to a verified library of classical Tử Vi
Đẩu Số texts (no checked page/edition/locator for any classical or
school-manual source). Per explicit direction for this task, claims may still
draw on general domain knowledge of Zi Wei Dou Shu / Tử Vi doctrine, but every
such claim is tagged `sourceType: "unverified-summary"` and `confidence: "low"`
in `source-registry.v0.9.json` / `claim-registry.v0.9.json`, and flagged as
needing human verification before being used for anything beyond
research-only status.

**Consequence:** `source-registry.v0.9.json` contains **zero** sources of type
`classical-text`, `school-manual`, or `published-reference`. It follows that
`claim-registry.v0.9.json` contains **zero** claims with `status: "classical"`
— there is no compatible source to back one. This is the single biggest driver
of the `RESEARCH_INCOMPLETE` verdict for doctrine-dependent topics in
`V0.9-FOUNDATION-DECISION.md`.

## Deliberate divergence from `research/major-fortune/`

`research/major-fortune/sources/source-registry.json` (`SRC-MF-001`) cites
*Tử Vi Đẩu Số Tân Biên* (Vân Đằng Thái Thứ Lang) at `sourceType: classical_text`
with `locator: "Unknown"`. This pack cites the same title
(`SRC-AA-V09-UNVERIFIED-001`) at `sourceType: unverified-summary` instead —
deliberately lower confidence than the existing in-repo precedent, because no
copy was independently checked for this task. This is a conscious choice, not
an oversight: it is more conservative than an existing accepted pattern in this
repository, and a future pass with a verified copy should reconcile the two.

## Sources reviewed

| Source | Type | Access | Disposition |
|---|---|---|---|
| SRC-AA-ENG-008 | internal-engineering-policy | verified | Reused verbatim from production V0.8 knowledge; carries forward its existing engineering-hypothesis claims. |
| SRC-AA-CORE-001 | internal-calculation-contract | verified | Reused verbatim; cross-checked directly against this audit's own star-emission scan (capability-coverage.v0.8.json) rather than taken on faith. |
| SRC-AA-V09-UNVERIFIED-001 | unverified-summary | unavailable | Named for traceability; no locator claims made. |
| SRC-AA-V09-UNVERIFIED-002 | unverified-summary | unavailable | General annual auxiliary-star doctrine; backs only `disputed`/`engineering-hypothesis` star-domain claims. |
| SRC-AA-V09-UNVERIFIED-003 | unverified-summary | unavailable | Confirms the *natal* Bác Sĩ cycle is well-established; does not supply the missing *annual* placement formula for Đại Hao/Tiểu Hao/Phục Binh. |
| SRC-AA-V09-UNVERIFIED-004 | unverified-summary | unavailable | Same pattern for Tuần/Triệt. |
| SRC-AA-V09-XREF-MAJOR-FORTUNE | internal-engineering-policy | verified | Structural convention reference only. |

## What would unblock a stronger verdict

A future pass that adds at least one `classical-text` or `school-manual`
source with a genuinely checked locator (specific edition, page/chapter) for
Nam Phái annual-star doctrine would let some of the `engineering-hypothesis`/
`disputed` claims in `claim-registry.v0.9.json` (especially CLM-AAV09-005/006
on Lưu Đào Hoa polarity, and CLM-AAV09-007's 11 candidate stars) move toward
`classical` or `derived` status, which is a precondition for
`READY_FOR_V0_9_CANDIDATE` on those specific rules.
