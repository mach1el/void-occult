/**
 * Hệ Can Chi (Sexagenary cycle) dùng chung cho Tử Vi và Bát Tự.
 */

export const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const STEM_ELEMENTS: Record<string, string> = {
  Giáp: "Mộc", Ất: "Mộc",
  Bính: "Hoả", Đinh: "Hoả",
  Mậu: "Thổ", Kỷ: "Thổ",
  Canh: "Kim", Tân: "Kim",
  Nhâm: "Thuỷ", Quý: "Thuỷ"
};

export const BRANCH_ELEMENTS: Record<string, string> = {
  Dần: "Mộc", Mão: "Mộc", Thìn: "Thổ",
  Tị: "Hoả", Ngọ: "Hoả", Mùi: "Thổ",
  Thân: "Kim", Dậu: "Kim", Tuất: "Thổ",
  Hợi: "Thuỷ", Tý: "Thuỷ", Sửu: "Thổ"
};

/**
 * Âm dương của Can/Chi. Dương = 1, Âm = -1
 */
export const STEM_POLARITY: Record<string, number> = {
  Giáp: 1, Ất: -1, Bính: 1, Đinh: -1, Mậu: 1, Kỷ: -1, Canh: 1, Tân: -1, Nhâm: 1, Quý: -1
};

export const BRANCH_POLARITY: Record<string, number> = {
  Tý: 1, Sửu: -1, Dần: 1, Mão: -1, Thìn: 1, Tị: -1, Ngọ: 1, Mùi: -1, Thân: 1, Dậu: -1, Tuất: 1, Hợi: -1
};

export interface Pillar {
  stem: string;
  branch: string;
}

/**
 * Ngũ Hổ Độn - Tìm can tháng từ can năm.
 * Tháng Dần luôn là tháng khởi đầu của năm (Bát Tự).
 */
export function getMonthStem(yearStemIndex: number, monthBranchIndex: number): number {
  // Can tháng Dần (branch index 2):
  // Giáp/Kỷ -> Bính Dần (stem 2)
  // Ất/Canh -> Mậu Dần (stem 4)
  // Bính/Tân -> Canh Dần (stem 6)
  // Đinh/Nhâm -> Nhâm Dần (stem 8)
  // Mậu/Quý -> Giáp Dần (stem 0)
  const offset = [2, 4, 6, 8, 0][yearStemIndex % 5] ?? 0;
  // Từ tháng Dần tới tháng cần tìm
  const diff = (monthBranchIndex - 2 + 12) % 12;
  return (offset + diff) % 10;
}

/**
 * Ngũ Thử Độn - Tìm can giờ từ can ngày.
 * Giờ Tý luôn là giờ khởi đầu của ngày.
 */
export function getHourStem(dayStemIndex: number, hourBranchIndex: number): number {
  // Can giờ Tý (branch index 0):
  // Giáp/Kỷ -> Giáp Tý (stem 0)
  // Ất/Canh -> Bính Tý (stem 2)
  // Bính/Tân -> Mậu Tý (stem 4)
  // Đinh/Nhâm -> Canh Tý (stem 6)
  // Mậu/Quý -> Nhâm Tý (stem 8)
  const offset = [0, 2, 4, 6, 8][dayStemIndex % 5] ?? 0;
  return (offset + hourBranchIndex) % 10;
}

/**
 * Lấy can chi của ngày từ số Julian Day Number (JDN lúc 12h trưa).
 * Mốc: 1/1/1900 là JD 2415021, ngày Giáp Tuất (Can 0, Chi 10).
 */
export function getDayPillar(jd: number): Pillar {
  const diff = Math.floor(jd) - 2415021;
  let stemIndex = diff % 10;
  if (stemIndex < 0) stemIndex += 10;
  
  let branchIndex = (10 + diff) % 12; // 10 vì Giáp Tuất (Tuất là 10)
  if (branchIndex < 0) branchIndex += 12;
  
  return {
    stem: STEMS[stemIndex] ?? "",
    branch: BRANCHES[branchIndex] ?? ""
  };
}
