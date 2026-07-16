import { describe, expect, it } from "vitest";
import type { BirthInput, ChartData, ChartPalace } from "@/types/chart";
import { calculate as calculateNamPhai } from "./engine-nam-phai";
import { SCORING_WEIGHTS, type ScoringWeights } from "./scoring-weights";
import { getDaiVanTrend, getLuuNienTrend, getPalaceStrengths } from "./trend-score";

function palace(partial: Partial<ChartPalace> & Pick<ChartPalace, "index" | "branch" | "name">): ChartPalace {
  return partial;
}

function makeChart(overrides: Partial<ChartData> = {}): ChartData {
  const menh = palace({
    index: 0,
    branch: "Mùi",
    name: "Mệnh",
    isMenh: true,
    majorFortune: { order: 3, active: true, start: 25, end: 34 },
    stars: [
      { name: "Tử Vi", layer: "major", brightness: "Miếu" },
      { name: "Tả Phụ", layer: "helper" },
      { name: "Hóa Lộc", source: "annual-mutagen", mutagen: "Lộc" },
    ],
  });
  const tai = palace({
    index: 8,
    branch: "Mão",
    name: "Tài Bạch",
    majorFortune: { order: 1, active: false, start: 5, end: 14 },
    stars: [{ name: "Văn Khúc", layer: "soft" }],
  });
  const quan = palace({
    index: 4,
    branch: "Hợi",
    name: "Quan Lộc",
    majorFortune: { order: 2, active: false, start: 15, end: 24 },
    stars: [],
  });
  const hung = palace({
    index: 6,
    branch: "Sửu",
    name: "Thiên Di",
    majorFortune: { order: 4, active: false, start: 35, end: 44 },
    stars: [
      { name: "Kình Dương", layer: "tough" },
      { name: "Đà La", layer: "tough" },
      { name: "Hóa Kỵ", source: "annual-mutagen", mutagen: "Kỵ" },
      { name: "Thiên Cơ", layer: "major", brightness: "Hãm" },
    ],
  });

  return {
    solar: { day: 21, month: 9, year: 1991 },
    lunar: { day: 14, month: 8, year: 1991 },
    timeZone: 7,
    birthHourBranch: "Dậu",
    yearStem: "Tân",
    yearBranch: "Mùi",
    birthMonthStem: "Đinh",
    birthMonthBranch: "Dậu",
    birthDayStem: "Giáp",
    birthDayBranch: "Ngọ",
    birthHourStem: "Ất",
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
    palaces: [menh, tai, quan, hung],
    majorFortunePalace: menh,
    annualPalace: menh,
    taiTuePalace: hung,
    natalMutagens: [],
    annualMutagens: [
      {
        mutagen: "Lộc",
        starName: "Tử Vi",
        palace: menh,
      },
      {
        mutagen: "Kỵ",
        starName: "Thiên Cơ",
        palace: hung,
      },
    ],
    majorMutagens: [],
    voidMarkers: [{ type: "Tuần", branches: ["Sửu"] }],
    ...overrides,
  };
}

const birthInput: BirthInput = {
  solarDate: "1991-09-21",
    birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "dai-van",
};

describe("getDaiVanTrend", () => {
  it("tất định: gọi 2 lần cùng lá số ra cùng mảng", () => {
    const chart = makeChart();
    const first = getDaiVanTrend(chart);
    const second = getDaiVanTrend(chart);
    expect(first).toEqual(second);
  });

  it("tổng breakdown khớp điểm hiển thị; đúng một isCurrent", () => {
    const points = getDaiVanTrend(makeChart());
    expect(points.length).toBeGreaterThan(0);
    expect(points.filter((point) => point.isCurrent)).toHaveLength(1);

    for (const point of points) {
      const taiSum = point.breakdown.taiLoc.reduce((sum, line) => sum + line.points, 0);
      const thachSum = point.breakdown.thachThuc.reduce(
        (sum, line) => sum + line.points,
        0,
      );
      expect(taiSum).toBe(point.taiLoc);
      expect(thachSum).toBe(point.thachThuc);
      expect(point.taiLoc).toBeGreaterThanOrEqual(0);
      expect(point.taiLoc).toBeLessThanOrEqual(100);
      expect(point.thachThuc).toBeGreaterThanOrEqual(0);
      expect(point.thachThuc).toBeLessThanOrEqual(100);
    }
  });

  it("mốc Lộc + cát có taiLoc cao; mốc Kỵ + sát có thachThuc cao", () => {
    const points = getDaiVanTrend(makeChart());
    const current = points.find((point) => point.isCurrent);
    const risky = points.find((point) => point.label === "35-44");

    expect(current).toBeDefined();
    expect(risky).toBeDefined();
    expect(current!.taiLoc).toBeGreaterThan(risky!.taiLoc);
    expect(risky!.thachThuc).toBeGreaterThan(current!.thachThuc);
  });

  it("đổi trọng số trong bảng → điểm đổi (không hard-code)", () => {
    const chart = makeChart();
    const baseline = getDaiVanTrend(chart);
    const boosted: ScoringWeights = {
      ...SCORING_WEIGHTS,
      mutagenLocKeyPalace: SCORING_WEIGHTS.mutagenLocKeyPalace + 40,
    };
    const next = getDaiVanTrend(chart, boosted);
    expect(next[0]?.breakdown).not.toEqual(baseline[0]?.breakdown);
    expect(
      next.some(
        (point, index) =>
          point.taiLoc !== baseline[index]?.taiLoc ||
          point.thachThuc !== baseline[index]?.thachThuc,
      ),
    ).toBe(true);
  });
});

describe("getLuuNienTrend", () => {
  it("tất định quanh năm xem; đúng một isCurrent; breakdown khớp", () => {
    const chart = calculateNamPhai(birthInput);
    const first = getLuuNienTrend(chart, chart.annualYear, 2, {
      school: "nam-phai",
      birthInput,
    });
    const second = getLuuNienTrend(chart, chart.annualYear, 2, {
      school: "nam-phai",
      birthInput,
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(5);
    expect(first.filter((point) => point.isCurrent)).toHaveLength(1);
    expect(first.find((point) => point.isCurrent)?.label).toContain(
      String(chart.annualYear),
    );

    for (const point of first) {
      const taiSum = point.breakdown.taiLoc.reduce((sum, line) => sum + line.points, 0);
      const thachSum = point.breakdown.thachThuc.reduce(
        (sum, line) => sum + line.points,
        0,
      );
      expect(taiSum).toBe(point.taiLoc);
      expect(thachSum).toBe(point.thachThuc);
    }
  });
});

describe("getPalaceStrengths", () => {
  it("trả đúng 12 cung, tất định, breakdown khớp điểm", () => {
    const chart = calculateNamPhai(birthInput);
    const first = getPalaceStrengths(chart);
    const second = getPalaceStrengths(chart);

    expect(first).toEqual(second);
    expect(first).toHaveLength(12);
    expect(first[0]?.palace).toBe("Mệnh");

    for (const item of first) {
      const sum = item.breakdown.reduce((total, line) => total + line.points, 0);
      expect(sum).toBe(item.score);
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
    }
  });

  it("cung miếu + cát vững hơn cung sát/hãm; đổi weight đổi cả radar lẫn trend", () => {
    const chart = makeChart({
      palaces: [
        palace({
          index: 0,
          branch: "Mùi",
          name: "Mệnh",
          isMenh: true,
          majorFortune: { active: true, start: 25, end: 34 },
          stars: [
            { name: "Tử Vi", layer: "major", brightness: "Miếu" },
            { name: "Tả Phụ", layer: "helper" },
            { name: "Hữu Bật", layer: "helper" },
          ],
        }),
        palace({
          index: 1,
          branch: "Ngọ",
          name: "Phụ Mẫu",
          stars: [
            { name: "Kình Dương", layer: "tough" },
            { name: "Đà La", layer: "tough" },
          ],
        }),
        ...Array.from({ length: 10 }, (_, offset) =>
          palace({
            index: offset + 2,
            branch: ["Tỵ", "Thìn", "Mão", "Dần", "Sửu", "Tý", "Hợi", "Tuất", "Dậu", "Thân"][
              offset
            ]!,
            name: [
              "Phúc Đức",
              "Điền Trạch",
              "Quan Lộc",
              "Nô Bộc",
              "Thiên Di",
              "Tật Ách",
              "Tài Bạch",
              "Tử Tức",
              "Phu Thê",
              "Huynh Đệ",
            ][offset]!,
            stars: [],
          }),
        ),
      ],
      menhIndex: 0,
      thanIndex: 1,
      voidMarkers: [],
    });

    const strengths = getPalaceStrengths(chart);
    const menh = strengths.find((item) => item.palace === "Mệnh");
    const weak = strengths.find((item) => item.palace === "Phụ Mẫu");
    expect(menh!.score).toBeGreaterThan(weak!.score);

    const baselineTrend = getDaiVanTrend(chart);
    const baselineRadar = getPalaceStrengths(chart);
    const boosted: ScoringWeights = {
      ...SCORING_WEIGHTS,
      beneficMeet: SCORING_WEIGHTS.beneficMeet + 20,
    };
    const nextTrend = getDaiVanTrend(chart, boosted);
    const nextRadar = getPalaceStrengths(chart, boosted);
    expect(nextTrend).not.toEqual(baselineTrend);
    expect(nextRadar).not.toEqual(baselineRadar);
  });
});
