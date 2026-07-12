/**
 * Chuyển đổi ngày dương lịch sang Julian Day (JDN) và ngược lại.
 * Dùng chung cho Tử Vi và Bát Tự.
 */

/**
 * Tính số nguyên Julian Day Number (JDN) từ ngày dương lịch (lúc 12h trưa UTC).
 * Giữ nguyên logic của tu-vi-engine cũ để không đổi output.
 */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      32083;
  }
  return jd;
}

/**
 * Tính ngày dương lịch từ số nguyên Julian Day Number.
 * Thuật toán Fliegel & Van Flandern (1968) / Meeus.
 */
export function dateFromJd(jd: number): { day: number; month: number; year: number } {
  let Z = Math.floor(jd + 0.5);
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = Math.floor(B - D - Math.floor(30.6001 * E));
  let month = E < 14 ? E - 1 : E - 13;
  let year = month > 2 ? C - 4716 : C - 4715;
  return { day, month, year };
}
