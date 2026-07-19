import { describe, expect, it } from "vitest";
import { loadPublicHuyenKhiDataset } from "../load-dataset";
import { parsePublicSummaryTitle } from "../parse-public-summary";

describe("parsePublicSummaryTitle", () => {
  it("parses every one of the 18 real seed titles without falling back to null", () => {
    const dataset = loadPublicHuyenKhiDataset();
    for (const record of dataset.records) {
      const parsed = parsePublicSummaryTitle(record.displayTitle);
      expect(parsed, `failed to parse: ${record.displayTitle}`).not.toBeNull();
    }
  });

  it("parses a representative title into its exact structured fields", () => {
    const parsed = parsePublicSummaryTitle("DƯƠNG NỮ GIÁP TUẤT, tháng 4 ngày 11, giờ MÃO");
    expect(parsed).toEqual({
      yinYang: "dương",
      gender: "female",
      yearStem: "Giáp",
      yearBranch: "Tuất",
      lunarMonth: 4,
      lunarDay: 11,
      hourBranch: "Mão",
    });
  });

  it("parses male/âm variants correctly", () => {
    const parsed = parsePublicSummaryTitle("ÂM NAM ĐINH SỬU, tháng 11 ngày 19, giờ DẬU");
    expect(parsed).toEqual({
      yinYang: "âm",
      gender: "male",
      yearStem: "Đinh",
      yearBranch: "Sửu",
      lunarMonth: 11,
      lunarDay: 19,
      hourBranch: "Dậu",
    });
  });

  it("returns null for malformed or unrecognized titles rather than guessing", () => {
    expect(parsePublicSummaryTitle("not a valid title")).toBeNull();
    expect(parsePublicSummaryTitle("DƯƠNG NỮ XYZ ABC, tháng 4 ngày 11, giờ MÃO")).toBeNull();
    expect(parsePublicSummaryTitle("DƯƠNG NỮ GIÁP TUẤT, tháng 13 ngày 11, giờ MÃO")).toBeNull();
  });
});
