import { describe, expect, it } from "vitest";
import { loadPublicHuyenKhiDataset } from "../load-dataset";
import { validatePublicRecord } from "../validate-public-record";
import { NATAL_PALACE_NAMES } from "../types";

describe("Huyền Khí V0.1 seed dataset", () => {
  const dataset = loadPublicHuyenKhiDataset();

  it("loads exactly 18 seed records under the huyen-khi namespace", () => {
    expect(dataset.metricNamespace).toBe("huyen-khi");
    expect(dataset.records).toHaveLength(18);
    for (const r of dataset.records) {
      expect(r.metricNamespace).toBe("huyen-khi");
    }
  });

  it("18/18 displayed totals equal the sum of twelve palace scores (prompt §4)", () => {
    const mismatches: string[] = [];
    for (const record of dataset.records) {
      const issues = validatePublicRecord(record);
      if (issues.length > 0) {
        mismatches.push(`${record.sampleId}: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
      }
    }
    expect(mismatches).toEqual([]);
    expect(dataset.records.every((r) => r.totalValidation === "exact")).toBe(true);
  });

  it("every record's palaceScores covers exactly the twelve canonical palace names", () => {
    for (const record of dataset.records) {
      expect(Object.keys(record.palaceScores).sort()).toEqual([...NATAL_PALACE_NAMES].sort());
    }
  });

  it("has no duplicate sourceUrl / sampleId across records (duplicate source detection)", () => {
    const urls = dataset.records.map((r) => r.sourceUrl);
    const ids = dataset.records.map((r) => r.sampleId);
    expect(new Set(urls).size).toBe(urls.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a genuinely mismatched record is reported as a mismatch, not silently forced to balance", () => {
    const base = dataset.records[0];
    if (!base) throw new Error("no seed records");
    // displayedTotal bumped by 1 but palaceScores left unchanged — the sum
    // no longer matches, so calculatedTotal/totalDelta/totalValidation must
    // be recomputed to reflect a genuine mismatch, not forced to balance.
    const broken = {
      ...base,
      sampleId: "HK-TEST-BROKEN",
      displayedTotal: base.displayedTotal + 1,
      calculatedTotal: base.calculatedTotal,
      totalDelta: -1,
      totalValidation: "mismatch" as const,
    };
    const issues = validatePublicRecord(broken);
    // A mismatching total makes zero-inference for this record's omitted
    // palaces illegitimate — §4 "otherwise mark the record incomplete".
    expect(issues).toEqual([
      {
        sampleId: "HK-TEST-BROKEN",
        path: "omittedPalacesAssumedZeroForValidation",
        message:
          "zero-inference for omitted palaces requires exact total validation; this record does not validate",
      },
    ]);
    expect(broken.totalValidation).toBe("mismatch");

    // But if someone tried to mislabel that mismatch as "exact", validation must catch it.
    const mislabeled = { ...broken, totalValidation: "exact" as const };
    const mislabeledIssues = validatePublicRecord(mislabeled);
    expect(mislabeledIssues.some((i) => i.path === "totalValidation")).toBe(true);
  });
});
