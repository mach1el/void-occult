# Claim Adjudication Prompt — Annual Axes V0.9

Use this prompt once one or more new sources have been added via
`source-extraction-prompt.md`, to turn extracted material into claims and
resolve any contradictions with the existing registry.

---

You are adjudicating claims for `sources/claim-registry.v0.9.json`. You have:

- The new source(s) just extracted (with real locators).
- The existing `sources/claim-registry.v0.9.json` (18 claims, `CLM-AAV09-001`
  through `CLM-AAV09-018` as of this writing — check the file for the current
  max ID before assigning new ones).
- The existing `sources/contradiction-log.md` (currently one entry,
  `CONTRA-AAV09-001`, on Lưu Đào Hoa polarity).

For each new claim, produce:

```ts
interface AnnualAxesResearchClaimV09 {
  claimId: string;             // next unused "CLM-AAV09-NNN"
  topic:
    | "domain-palace" | "cooperating-palace" | "annual-star-placement"
    | "star-domain" | "temporal-identity" | "dignity" | "thai-tue"
    | "tieu-han" | "tu-hoa" | "scoring-policy";
  statement: string;
  school: "nam-phai" | "trung-chau" | "mixed" | "unspecified";
  status: "classical" | "derived" | "engineering-hypothesis" | "disputed" | "unsupported";
  confidence: "high" | "medium" | "low";
  sourceIds: string[];
  locators: string[];
  contradictingClaimIds: string[];
  runtimeImplication: string;
  notes?: string;
}
```

Adjudication rules (enforced by
`research/annual-axes/v0.9-foundation/__tests__/schema-validation.test.ts` —
run `npm run research:annual-axes-v09:validate` after editing):

1. `status: "classical"` requires **both** a locator in `locators` **and** at
   least one `sourceIds` entry whose `sourceType` is `classical-text`,
   `school-manual`, or `published-reference`. If your new source is
   `unverified-summary`, the claim cannot be `classical` — use
   `engineering-hypothesis` or `disputed` instead.
2. `status: "derived"` requires a locator too — but it may point to this
   audit's own generated JSON (e.g.
   `research/annual-axes/v0.9-foundation/audit/contribution-mass.v0.8.json#perTemporalLayer`)
   when the claim is a measured fact rather than a doctrinal position.
3. If your new claim **disagrees** with an existing claim on the same topic,
   both claims become (or remain) `status: "disputed"`, each listing the
   other's `claimId` in `contradictingClaimIds`, and you must add a new entry
   to `sources/contradiction-log.md` with an `adjudication` of
   `prefer-source-a`, `prefer-source-b`, `school-specific`,
   `remain-disputed`, or `insufficient-evidence`. Never resolve a
   disagreement by averaging or silently picking one side without logging it.
4. If your new claim recommends against enabling a currently-unsupported
   star, keep `status: "unsupported"` and make sure `runtimeImplication`
   contains an explicit "must not enable" / "no production" statement — the
   validator checks for this literally.
5. After editing the registry, run:
   ```bash
   npm run research:annual-axes-v09:validate
   ```
   and fix anything it flags before considering the adjudication complete.
