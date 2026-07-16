import type { BirthInput, ChartData, ChartPalace } from "@/types/chart";

export function palace(
  partial: Partial<ChartPalace> & Pick<ChartPalace, "index" | "branch" | "name">,
): ChartPalace {
  return partial;
}

export function makeChart(overrides: Partial<ChartData> = {}): ChartData {
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
      { mutagen: "Lộc", starName: "Tử Vi", palace: menh },
      { mutagen: "Kỵ", starName: "Thiên Cơ", palace: hung },
    ],
    majorMutagens: [],
    voidMarkers: [{ type: "Tuần", branches: ["Sửu"] }],
    ...overrides,
  };
}

export const birthInput: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "dai-van",
};

/** Một đại vận active trên cung `branch` + sao tùy chọn. */
export function minimalFortune(
  branch: string,
  stars: ChartPalace["stars"],
  extras: ChartPalace[] = [],
): ChartData {
  const focus = palace({
    index: 0,
    branch,
    name: "Mệnh",
    isMenh: true,
    majorFortune: { order: 1, active: true, start: 10, end: 19 },
    stars,
  });
  return makeChart({
    palaces: [focus, ...extras],
    menhBranch: branch,
    menhIndex: 0,
    majorFortunePalace: focus,
    annualPalace: focus,
    voidMarkers: [],
    annualMutagens: [],
    natalMutagens: [],
  });
}
