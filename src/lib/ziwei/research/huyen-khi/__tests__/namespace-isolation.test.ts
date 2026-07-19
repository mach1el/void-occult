import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR, loadPublicHuyenKhiDataset } from "../load-dataset";
import { NATAL_PALACE_NAMES } from "../types";

/**
 * §2 namespace isolation — Huyền Khí, Xí Hoa, Đẩu Minh and Cung Khí are
 * four distinct public metrics. Fail if any file/field/ID aliases one to
 * another.
 */
describe("Huyền Khí V0.1 · namespace isolation", () => {
  it("every seed record and the dataset itself declare metricNamespace exactly 'huyen-khi'", () => {
    const dataset = loadPublicHuyenKhiDataset();
    expect(dataset.metricNamespace).toBe("huyen-khi");
    for (const record of dataset.records) {
      expect(record.metricNamespace).toBe("huyen-khi");
    }
  });

  it("the terminology matrix declares mutual non-aliasing for all four namespaces", () => {
    const matrix = JSON.parse(
      readFileSync(path.join(HUYEN_KHI_DATA_DIR, "terminology-matrix.v0.1.json"), "utf-8"),
    ) as { terms: Array<{ term: string; namespace: string; mustNotAliasTo: string[] }> };

    const namespaces = new Set(matrix.terms.map((t) => t.namespace));
    expect(namespaces).toEqual(new Set(["huyen-khi", "xi-hoa", "dau-minh", "cung-khi"]));

    for (const term of matrix.terms) {
      expect(term.mustNotAliasTo.length).toBeGreaterThan(0);
      // A term must never list its own namespace as something to avoid
      // aliasing to (that would be a no-op) and must not alias to itself.
      expect(term.mustNotAliasTo).not.toContain(term.namespace);
    }
  });

  it("no Huyền Khí sample ID or dataset ID contains 'xi-hoa', 'dau-minh' or 'cung-khi' tokens", () => {
    const dataset = loadPublicHuyenKhiDataset();
    const forbidden = ["xi-hoa", "xí hoa", "dau-minh", "đẩu minh", "cung-khi", "cung khí"];
    const haystacks = [dataset.datasetId, ...dataset.records.map((r) => r.sampleId)];
    for (const haystack of haystacks) {
      const lower = haystack.toLocaleLowerCase("vi");
      for (const token of forbidden) {
        expect(lower.includes(token)).toBe(false);
      }
    }
  });

  it("palace names used in Huyền Khí records are the canonical twelve, never a Cung Khí element label", () => {
    const dataset = loadPublicHuyenKhiDataset();
    const cungKhiElementLabels = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ", "Hỉ", "Kị", "Nhàn"];
    for (const record of dataset.records) {
      for (const key of Object.keys(record.palaceScores)) {
        expect(NATAL_PALACE_NAMES).toContain(key);
        expect(cungKhiElementLabels).not.toContain(key);
      }
    }
  });
});
