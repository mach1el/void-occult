# Source Extraction Prompt — Annual Axes V0.9

Use this prompt (with a human reviewer who has access to an actual physical or
scanned classical/school-manual Tử Vi Đẩu Số text) to extract new,
independently-verifiable sources for `sources/source-registry.v0.9.json`.

---

You are extracting source metadata for a Nam Phái Annual Axes (Lưu Niên)
scoring research pack. You have been given a specific text or manual to
review. Do not use general knowledge or memory of Tử Vi doctrine — only what
is physically present in the material you were given.

For the text, produce one entry conforming to this exact TypeScript shape:

```ts
interface AnnualAxesResearchSourceV09 {
  sourceId: string;           // "SRC-AA-V09-<SHORT-SLUG>"
  title: string;
  author?: string;
  edition?: string;
  publicationYear?: number;
  language: string;
  sourceType:
    | "classical-text" | "school-manual" | "published-reference"
    | "modern-commentary" | "internal-calculation-contract"
    | "internal-engineering-policy" | "unverified-summary";
  schoolScope: "nam-phai" | "trung-chau" | "mixed" | "unspecified";
  locator: string;            // MUST be a real, checkable page/chapter/section reference
  accessStatus: "verified" | "partial" | "unavailable";
  allowedUsage: string[];
  prohibitedUsage: string[];
  notes?: string;
}
```

Rules:

1. **Do not classify as `classical-text` or `school-manual` unless you
   physically checked the locator you are citing.** If you are recalling the
   title from general familiarity rather than the specific edition in hand,
   use `sourceType: "unverified-summary"` instead — this is exactly the
   distinction this pack already makes explicit in
   `sources/source-review-log.md`.
2. `locator` must be specific enough that a second reviewer could find the
   same passage (e.g. "Chương 4, Lưu Niên Đại Hạn, tr. 112–115" not just
   "somewhere in the annual chapter").
3. If the text disagrees with an existing claim in
   `sources/claim-registry.v0.9.json`, do not silently pick a side — produce a
   new claim and flag it as `disputed`, then add an entry to
   `sources/contradiction-log.md` (see `claim-adjudication-prompt.md`).
4. Extract claims about the **five unsupported annual stars**
   (Lưu Đại Hao, Lưu Tiểu Hao, Lưu Phục Binh, Lưu Tuần, Lưu Triệt) and the
   **twelve unreferenced-but-emitted stars**
   (Lưu Đào Hoa, Lưu Hồng Loan, Lưu Hỷ Thần, Lưu Kiếp Sát, Lưu Long Đức,
   Lưu Nguyệt Đức, Lưu Phúc Đức, Lưu Thiên Đức, Lưu Thiên Hỷ, Lưu Thiên Mã,
   Lưu Văn Khúc, Lưu Văn Xương) with the highest priority — these are exactly
   the stars this pack could not source-back (see
   `policy/unsupported-star-policy.v0.9.json` and
   `policy/star-domain-policy.v0.9.json`).
5. Output the new source entry as JSON, plus one or more matching claim
   entries (see `claim-adjudication-prompt.md` for the claim shape), ready to
   be appended to the registries. Do not modify any existing entry's
   `sourceId`/`claimId`.
