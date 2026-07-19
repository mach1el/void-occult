# Huyền Khí V0.2.1 — Limitations

Continuation of PR #93 (`research/ziwei-huyen-khi-gold-corpus-v0-2`) per
`PROMPT-HUYEN-KHI-V0.2.1-CALENDAR-MENH-RESEARCH.md`. Same rate-limit
policy as V0.2 (`source-access-policy.v0.2.json`: 1 request/20s, 1
concurrent — unchanged, never loosened).

## A. V0.1 date recovery — honest tally

Of 18 total V0.1 seed records:

| Outcome | Count | Sample IDs |
|---|---|---|
| Recovered (machine-diff-verified) | 3 | HK-PUB-002, HK-PUB-005, HK-PUB-006 |
| Mismatch | 1 | HK-PUB-001 |
| Partial-match-inconclusive | 1 | HK-PUB-003 |
| Not attempted this pass | 13 | HK-PUB-004, 007–018 |

Full detail in `reports/v01-date-recovery-report.v0.2.1.json`. Recovery
requires a live, rate-limited fetch per candidate year, so 13/18 remain
open for a future pass — the method is proven and reusable, not blocked.

## B. Calendar Mệnh panel corpus — honest tally

- **2 of 20** manifest dates captured (1950-01-15, 1955-02-15) = **24 of
  240** target records (10%).
- The 20-date sampling manifest (`reports/calendar-sampling-manifest.v0.2.1.json`)
  was generated and committed *before* any of its dates were fetched —
  deterministic arithmetic rule (step-5-year spacing for 12-branch
  coverage, +3-year offset for stem coverage, 2 dates chosen for a known
  lunar-boundary near Tết by checking the calendar position only, never a
  Huyền Khí score) — so the 18 remaining dates are not cherry-picked
  after the fact; the manifest already names them.
- **Mệnh baselines (M0–M3) and whole-chart-total baseline: correctly
  withheld.** The spec's own gate requires ≥20 complete panels; this pass
  has 2. No baseline report was generated rather than generating one from
  an underpowered sample.

## C. Genuine findings this pass

1. **Calendar day pages expose full Mệnh relation geometry**, not just
   the Mệnh score and whole-chart total assumed in V0.2 — tọa thủ, xung
   chiếu, tam hợp (2 groups), nhị hợp (2 groups), each with star name,
   brightness, Hóa markers, and Tuần/Triệt. This made the calendar Mệnh
   corpus (Tier 1) far richer than V0.2 expected, without needing the
   JS-blocked detail pages at all.

2. **Source/Core agreement is a genuine, notable finding: 24/24 (100%)**
   of captured hours across both real panels agree with the Calculation
   Core on Mệnh branch, Mệnh stem, Cục, Thân cư, and the major star
   sitting in Mệnh — zero disagreements (`reports/source-core-agreement-report.v0.2.1.json`).
   This is early, small-sample evidence (24 records, 2 dates, both male,
   both Nam Phái school) — not a proof of correctness at scale.

3. **5 of 6 lunar-date cross-checks agree exactly** between the source
   calendar and this repo's own `solarToLunar` (`reports/lunar-date-adjudication-report.v0.2.1.json`).
   The one disagreement (1994-05-20: site says lunar 4/10, Core computes
   4/11) is the same one found in V0.2 — still `unresolved`, still not
   attributed to either side without a tie-breaking independent
   reference. Possible factors recorded: `new-moon-boundary`, `timezone`,
   `ephemeris-version`.

4. **Zero unknown stars/markers across all 474 canonical + 863
   known-context-only facts parsed** from the two real panels'
   relation-geometry lists (`reports/menh-geometry-parse-report.v0.2.1.json`).
   The star/context-marker catalog built for this parser (major/minor
   stars via the existing `canonicalStarName`, plus ~50 recognized flying
   stars, life-cycle-stage and Thái Tuế-cycle markers) covered everything
   seen — encouraging, but only tested against 2 dates so far.

5. **WebFetch's inline "(Year)/(Month)/(Day)" labels on the raw
   Can-Chi triple are unreliable and should be discounted.** The exact
   same three-part string ("Giáp Tuất (Year) - Tân Sửu (Month) - Bính Tí
   (Day)") was returned by WebFetch for two different, unrelated real
   solar dates (1994-05-20 and 1997-02-01) — numerically impossible if
   genuinely computed per-date. Manually verifying against this repo's
   own stem/branch arithmetic (`(year−4) mod 10` / `(year−4) mod 12`)
   confirmed the **last** of the three values is the lunar Year, matching
   the original V0.1 `parsePublicSummaryTitle` assumption. The trustworthy
   cross-check signal is the plain numeric "ngày D/M/YYYY" string and the
   numeric fields (month/day/Mệnh score/total) — not WebFetch's own inline
   English labels on the Can-Chi triple.

6. **A single WebFetch pass can contain a transient transcription
   error.** Recovering HK-PUB-006, one of three independent passes gave
   Mệnh 1 / total 6.75 while the other two (including one with a
   verbatim source quote) gave Mệnh 2 / total 6.76, matching HK-PUB-006
   exactly. Treated as an isolated extraction error via 2-of-3 majority +
   verbatim-quote corroboration, not silently trusted either way. Mitigated
   going forward by using 2–3 independent passes per fetch rather than one.

7. **HK-PUB-003 is neither cleanly recovered nor cleanly rejected.**
   3 of 4 identity/numeric fields matched exactly (lunar month, lunar day,
   gender, Mệnh score); the whole-chart total disagreed (−3.19 confirmed
   twice vs. −3.27 expected). Rather than forcing this into either bucket,
   it's recorded as a new explicit outcome, `partial-match-inconclusive`,
   pending a follow-up pass.

## D. Explicitly not done this pass (flagged, not faked)

- Full 16/16 remaining V0.1 recovery — 3/16 done, 13 open.
- Full 20-date / 240-record calendar panel corpus — 2/20 done, 18 open
  (manifest pre-committed for all 20).
- Mệnh baselines M0–M3 and whole-total baseline — correctly gated off,
  below the ≥20-complete-panel threshold.
- Real human rendered-detail captures (`ManualRenderedDetailCapture`) —
  the contract type exists but zero real captures were made; that needs
  a human opening a page in an actual browser, not something this tool
  can do.
- Full-palace Gold Corpus (Tier 3, `full-palace` scope) — still blocked
  for *new* records by the same JS-rendering wall on detail pages found
  in V0.2; only V0.1-recovery-sourced full-palace facts exist, and those
  don't have relation-geometry data to compare (the calendar-day format
  used in that recovery only captured Mệnh score + total, not geometry).

## E. Access-policy compliance

No change to `source-access-policy.v0.2.json` — every fetch this pass
stayed within 1 request/20s, 1 concurrent. No 403/429/CAPTCHA encountered.
No page's raw HTML retained, only extracted numeric/structural facts.
