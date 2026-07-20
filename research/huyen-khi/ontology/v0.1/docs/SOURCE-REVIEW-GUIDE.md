# Source Review Guide

Every doctrinal claim must resolve `rule → claim → source → locator` before a
rule may become effective. No numeric coefficient is ever "recovered" here.

## Extraction

1. Record a `SourceExtractionRecord` (offline; no scraping, no network).
2. Store a **concise paraphrase** and a stable locator (edition / volume /
   page / section, or a stable digital URL) — never long copied passages.
3. Set an explicit `schoolProfile`, or `unresolved` if not yet decided.

## Review

- A `source-reviewer` or `school-expert` confirms the locator and paraphrase.
- Contradictions between sources are recorded, not silently reconciled.
- External Tử Vi Cổ Học score observations are **benchmark-only**; they never
  become doctrinal claims and never fit coefficients.

## Promotion

A claim reaches `primary-source-reviewed` / `expert-consensus` only with a
resolved locator and review. Schema validity is **not** approval.

## Witness vs transcription

A physical scan witness and a searchable transcription are **separate source
IDs**. A transcription declares `derivedFromSourceId` pointing at the scan and
must be cross-checked against it before promotion. Claim locators use the strict
`locator.schema.v0.1.json` (`locatorKind`, `sourceId`, edition/witness, volume,
chapter/section, page/folio, stable URL, transcription anchor, verification
status). Contradictions are linked (`supports` / `contradicts` / `qualifies`)
and never auto-resolved.
