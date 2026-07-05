const modulo = (value: number, base = 12) =>
  ((value % base) + base) % base;

export const PALACE_BRANCHES = [
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
  "Tý",
  "Sửu",
] as const;

export const CYCLE_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

type Gender = "male" | "female";
export type AnnualViewMode = "luu-nien" | "tieu-han" | "dai-van";

function smallLimitStartIndex(birthYearBranch: string): number {
  if (["Dần", "Ngọ", "Tuất"].includes(birthYearBranch)) {
    return PALACE_BRANCHES.indexOf("Thìn");
  }
  if (["Thân", "Tý", "Thìn"].includes(birthYearBranch)) {
    return PALACE_BRANCHES.indexOf("Tuất");
  }
  if (["Tỵ", "Dậu", "Sửu"].includes(birthYearBranch)) {
    return PALACE_BRANCHES.indexOf("Mùi");
  }
  return PALACE_BRANCHES.indexOf("Sửu");
}

/**
 * Cung Tiểu Hạn Tam Hợp phái của năm xem.
 *
 * Chi năm sinh được đặt tại cung khởi của tam hợp năm sinh. Các chi kế tiếp
 * chạy thuận cung với Nam và nghịch cung với Nữ.
 */
export function getSmallLimitIndex(
  birthYearBranch: string,
  gender: Gender,
  currentYearBranch: string,
): number {
  const birthBranchIndex = CYCLE_BRANCHES.indexOf(
    birthYearBranch as (typeof CYCLE_BRANCHES)[number],
  );
  const currentBranchIndex = CYCLE_BRANCHES.indexOf(
    currentYearBranch as (typeof CYCLE_BRANCHES)[number],
  );
  if (birthBranchIndex < 0 || currentBranchIndex < 0) {
    throw new Error("Địa chi năm sinh/năm xem không hợp lệ");
  }

  const yearOffset = modulo(currentBranchIndex - birthBranchIndex);
  const direction = gender === "male" ? 1 : -1;
  return modulo(smallLimitStartIndex(birthYearBranch) + yearOffset * direction);
}

/**
 * Vòng địa chi Tiểu Hạn ghi ở chân 12 cung.
 * Kết quả được đánh index theo PALACE_BRANCHES (Dần = 0).
 */
export function getSmallLimitBranchRing(
  birthYearBranch: string,
  gender: Gender,
): string[] {
  const birthBranchIndex = CYCLE_BRANCHES.indexOf(
    birthYearBranch as (typeof CYCLE_BRANCHES)[number],
  );
  if (birthBranchIndex < 0) {
    throw new Error("Địa chi năm sinh không hợp lệ");
  }

  const ring = Array<string>(12);
  const startIndex = smallLimitStartIndex(birthYearBranch);
  const direction = gender === "male" ? 1 : -1;
  for (let offset = 0; offset < 12; offset += 1) {
    const palaceIndex = modulo(startIndex + offset * direction);
    ring[palaceIndex] =
      CYCLE_BRANCHES[modulo(birthBranchIndex + offset)]!;
  }
  return ring;
}

/**
 * Lưu Niên Đại Vận theo nhịp truyền thống trong một đại vận:
 * năm 1 ở cung gốc, năm 2 ở cung xung, năm 3 lùi khỏi cung xung một bước,
 * năm 4 trở lại cung xung, từ năm 5 mới đi tiếp theo chiều đại vận.
 */
export function getAnnualMajorFortuneIndex(
  majorFortuneIndex: number,
  majorFortuneStartAge: number,
  nominalAge: number,
  direction: 1 | -1,
): number {
  const yearInFortune = nominalAge - majorFortuneStartAge + 1;
  if (yearInFortune <= 1) return modulo(majorFortuneIndex);

  const oppositeIndex = modulo(majorFortuneIndex + 6);
  if (yearInFortune === 2) return oppositeIndex;
  return modulo(oppositeIndex + (yearInFortune - 4) * direction);
}

/**
 * Từ cung hạn năm: đếm nghịch đến tháng sinh, rồi thuận đến giờ sinh.
 * hourIndex dùng Tý = 0; adjustedBirthMonth dùng tháng âm 1..12.
 */
export function getFirstFlowMonthIndex(
  annualLimitIndex: number,
  adjustedBirthMonth: number,
  hourIndex: number,
): number {
  return modulo(annualLimitIndex - adjustedBirthMonth + hourIndex + 1);
}

/**
 * Gốc an T1 theo lựa chọn "Xem vận năm theo" của Tử Vi Cổ Học.
 *
 * - Lưu Niên lấy cung mang địa chi năm hạn.
 * - Tiểu Hạn và Lưu Niên Đại Vận cùng lấy cung Tiểu Hạn Tam Hợp phái.
 *
 * Lưu Niên Đại Vận vẫn được tính riêng để luận vận năm; nó không thay cung
 * khởi lưu nguyệt bằng cung zigzag của đại vận.
 */
export function getFlowMonthBaseIndex(
  mode: AnnualViewMode,
  birthYearBranch: string,
  gender: Gender,
  currentYearBranch: string,
): number {
  if (mode === "luu-nien") {
    const index = PALACE_BRANCHES.indexOf(
      currentYearBranch as (typeof PALACE_BRANCHES)[number],
    );
    if (index < 0) throw new Error("Địa chi năm hạn không hợp lệ");
    return index;
  }
  return getSmallLimitIndex(birthYearBranch, gender, currentYearBranch);
}
