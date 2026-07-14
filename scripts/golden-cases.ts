/**
 * Ma trận input cho golden snapshot của 2 engine Tử Vi (nam-phai, trung-chau).
 * Đây là NGUỒN DUY NHẤT của bộ ca kiểm thử — dùng chung bởi:
 *  - scripts/gen-tuvi-golden.ts (sinh/`--verify` snapshot)
 *  - src/lib/ziwei/golden.test.ts (Task 4, golden test trong CI)
 *
 * Kiểu dữ liệu ở đây cố ý khai riêng (không import từ src/types/chart.ts) vì
 * `BirthInput` chỉ được thêm vào chart.ts ở Task 2 — Task 1 không được đụng
 * bất cứ thứ gì ngoài các file trong scripts/ và tests/golden/.
 */
export interface GoldenBirthInput {
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  timezone: string;
  annualYear: string;
  flowBase: string;
}

export interface GoldenCase {
  id: string;
  label: string;
  input: GoldenBirthInput;
}

const HOUR_BRANCHES = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
];

function altGender(i: number): "male" | "female" {
  return i % 2 === 0 ? "male" : "female";
}

const cases: GoldenCase[] = [];

// Nhóm A — phủ đủ 12 chi năm sinh (ngày giữa năm, tránh ranh giới Tết).
for (let i = 0; i < 12; i++) {
  const year = 2013 + i;
  cases.push({
    id: `year-branch-${year}`,
    label: `Chi năm sinh ${year} (giữa năm, tránh ranh Tết)`,
    input: {
      solarDate: `15/06/${year}`,
      birthHour: "Ngọ",
      gender: altGender(i),
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  });
}

// Nhóm B — phủ đủ 12 canh giờ (cùng 1 ngày sinh, đổi birthHour).
HOUR_BRANCHES.forEach((hour, i) => {
  cases.push({
    id: `hour-branch-${hour}`,
    label: `Canh giờ ${hour}`,
    input: {
      solarDate: "10/03/1995",
      birthHour: hour,
      gender: altGender(i),
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  });
});

// Nhóm C — ứng viên tháng nhuận âm lịch (năm nhuận đã biết trong lịch sử).
const leapCandidates: Array<{ id: string; date: string; note: string }> = [
  { id: "leap-2023-t2", date: "01/04/2023", note: "2023 nhuận tháng 2 âm lịch" },
  { id: "leap-2020-t4", date: "05/06/2020", note: "2020 nhuận tháng 4 âm lịch" },
  { id: "leap-2017-t6", date: "05/08/2017", note: "2017 nhuận tháng 6 âm lịch" },
  { id: "leap-2014-t9", date: "05/11/2014", note: "2014 nhuận tháng 9 âm lịch" },
  { id: "leap-2012-t4", date: "01/06/2012", note: "2012 nhuận tháng 4 âm lịch" },
];
leapCandidates.forEach((c, i) => {
  cases.push({
    id: c.id,
    label: `Ứng viên tháng nhuận: ${c.note}`,
    input: {
      solarDate: c.date,
      birthHour: "Tý",
      gender: altGender(i),
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  });
});

// Nhóm D — ranh giới Tết Nguyên Đán (ngày trước/đúng/sau Tết đã biết).
const tetBoundaries: Array<{ id: string; date: string; note: string }> = [
  { id: "tet-2024-before", date: "09/02/2024", note: "1 ngày trước Tết Giáp Thìn (10/02/2024)" },
  { id: "tet-2024-day", date: "10/02/2024", note: "Đúng ngày Tết Giáp Thìn" },
  { id: "tet-2024-after", date: "11/02/2024", note: "1 ngày sau Tết Giáp Thìn" },
  { id: "tet-2020-before", date: "24/01/2020", note: "1 ngày trước Tết Canh Tý (25/01/2020)" },
  { id: "tet-2020-day", date: "25/01/2020", note: "Đúng ngày Tết Canh Tý" },
  { id: "tet-2020-after", date: "26/01/2020", note: "1 ngày sau Tết Canh Tý" },
];
tetBoundaries.forEach((c, i) => {
  cases.push({
    id: c.id,
    label: `Ranh giới Tết: ${c.note}`,
    input: {
      solarDate: c.date,
      birthHour: "Dần",
      gender: altGender(i),
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  });
});

// Nhóm E — ranh giới năm dương lịch.
cases.push({
  id: "gregorian-boundary-jan1",
  label: "01/01 (đầu năm dương lịch)",
  input: { solarDate: "01/01/2001", birthHour: "Mão", gender: "male", timezone: "7", annualYear: "2026", flowBase: "luu-nien" },
});
cases.push({
  id: "gregorian-boundary-dec31",
  label: "31/12 (cuối năm dương lịch)",
  input: { solarDate: "31/12/2001", birthHour: "Mão", gender: "female", timezone: "7", annualYear: "2026", flowBase: "luu-nien" },
});

// Nhóm F — chiều annualYear: quá khứ / hiện tại / tương lai (luôn hợp lệ 1900-2100,
// KHÔNG bao giờ để trống/ngoài khoảng — tránh nhánh fallback new Date() phi-tất-định, xem H3).
(["1950", "2026", "2080"] as const).forEach((annualYear, i) => {
  cases.push({
    id: `annual-year-${annualYear}`,
    label: `annualYear=${annualYear}`,
    input: {
      solarDate: "20/05/1988",
      birthHour: "Mão",
      gender: altGender(i),
      timezone: "7",
      annualYear,
      flowBase: "luu-nien",
    },
  });
});

// Nhóm G — chiều flowBase.
(["luu-nien", "tieu-han", "dai-van"] as const).forEach((flowBase, i) => {
  cases.push({
    id: `flow-base-${flowBase}`,
    label: `flowBase=${flowBase}`,
    input: {
      solarDate: "12/09/1992",
      birthHour: "Dậu",
      gender: altGender(i),
      timezone: "7",
      annualYear: "2026",
      flowBase,
    },
  });
});

// Nhóm H — chiều timezone (bao gồm "0" để khoá lại hành vi H4: Number("0")||7 -> 7).
(["7", "8", "0"] as const).forEach((timezone, i) => {
  cases.push({
    id: `timezone-${timezone}`,
    label: `timezone=${timezone}${timezone === "0" ? " (khoá hành vi bug H4: sập về 7)" : ""}`,
    input: {
      solarDate: "03/03/1980",
      birthHour: "Sửu",
      gender: altGender(i),
      timezone,
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  });
});

// Nhóm I — solarDate không hợp lệ (khoá lại hành vi H2: parseDate fallback {1990,6,15}).
cases.push({
  id: "malformed-solar-date",
  label: "solarDate không parse được -> fallback {1990,6,15} (H2)",
  input: {
    solarDate: "not-a-date",
    birthHour: "Thìn",
    gender: "female",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  },
});

export const GOLDEN_CASES: GoldenCase[] = cases;
