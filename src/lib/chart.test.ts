import { describe, expect, it } from "vitest";
import { buildChartText } from "./chart";
import type { ChartData } from "../types/chart";

const chart: ChartData = {
  solar: { day: 21, month: 9, year: 1991 },
  lunar: { day: 14, month: 8, year: 1991 },
  timeZone: 7,
  birthHourBranch: "Dần",
  yearStem: "Tân",
  yearBranch: "Mùi",
  birthMonthStem: "Đinh",
  birthMonthBranch: "Dậu",
  birthDayStem: "Giáp",
  birthDayBranch: "Ngọ",
  birthHourStem: "Bính",
  yearPolarity: "Âm",
  direction: "thuận",
  directionSign: 1,
  menhBranch: "Mùi",
  menhElement: "Thổ",
  menhIndex: 0,
  thanIndex: 1,
  month: 8,
  day: 14,
  cuc: { name: "Kim Tứ Cục", number: 4 },
  cucMenhRelation: { label: "Mệnh sinh Cục" },
  starts: { ziweiIndex: 0, tianfuIndex: 0, borrowed: 0, quotient: 1 },
  annualYear: 2026,
  annualStem: "Bính",
  annualBranch: "Ngọ",
  nominalAge: 36,
  palaces: [
    {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      isMenh: true,
      stars: [
        { name: "Tử Vi", layer: "major", brightness: "Miếu" },
        { name: "Hóa Lộc", source: "natal-mutagen", targetStar: "Tử Vi" },
      ],
    },
    {
      index: 1,
      branch: "Ngọ",
      name: "Phụ Mẫu",
      isThan: true,
      stars: [{ name: "Thiên Cơ", layer: "major" }],
    },
  ],
  natalMutagens: [
    {
      mutagen: "Lộc",
      starName: "Tử Vi",
      palace: { index: 0, branch: "Mùi", name: "Mệnh" },
    },
  ],
  annualMutagens: [],
  majorMutagens: [],
};

describe("buildChartText", () => {
  it("xuất đúng thông tin lõi và sao của lá số", () => {
    const result = buildChartText(chart, "nam-phai", "male");

    expect(result).toContain("LÁ SỐ TỬ VI — Nam phái");
    expect(result).toContain("Dương lịch: 21/09/1991 · giờ Dần");
    expect(result).toContain(
      "Can Chi sinh: năm Tân Mùi · tháng Đinh Dậu · ngày Giáp Ngọ · giờ Bính Dần",
    );
    expect(result).toContain("[Mệnh] Mùi");
    expect(result).toContain("Chính tinh: Tử Vi(Miếu)");
    expect(result).toContain("Tứ hóa: Hóa Lộc→Tử Vi");
  });
});
