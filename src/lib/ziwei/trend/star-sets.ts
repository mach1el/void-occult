/**
 * Tập tên sao dùng cho engine xu hướng — không chứa trọng số.
 */

/** Lục cát + Lộc Tồn — lớp Cát. */
export const CAT_TINH_NAMES = [
  "Tả Phụ",
  "Tả Phù",
  "Hữu Bật",
  "Văn Xương",
  "Văn Khúc",
  "Thiên Khôi",
  "Thiên Việt",
  "Lộc Tồn",
] as const;

/** Lục sát (+ Thiên Không) — lớp Hung. */
export const SAT_TINH_NAMES = [
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
] as const;

/** Hung tinh vòng Thái Tuế thường dùng khi luận hạn. */
export const TAI_TUE_HUNG_NAMES = [
  "Tang Môn",
  "Bạch Hổ",
  "Điếu Khách",
  "Tuế Phá",
  "Quan Phù",
  "Thiên Khốc",
  "Thiên Hư",
] as const;

export const KINH_DA_NAMES = ["Kình Dương", "Đà La"] as const;
export const KHONG_KIEP_NAMES = ["Địa Không", "Địa Kiếp", "Thiên Không"] as const;
export const HOA_LINH_NAMES = ["Hỏa Tinh", "Linh Tinh"] as const;

/** Cát trong vòng Bác Sĩ (không gồm Thanh Long — đã có bonus mộ riêng). */
export const BAC_SI_CAT_NAMES = [
  "Bác Sĩ",
  "Lực Sĩ",
  "Tướng Quân",
  "Tấu Thư",
  "Hỷ Thần",
  "Hỉ Thần",
] as const;

/** Hung nặng vòng Bác Sĩ (không gồm Song Hao — xử lý riêng). */
export const BAC_SI_HUNG_NAMES = ["Phục Binh", "Bệnh Phù", "Quan Phủ"] as const;

export const SONG_HAO_NAMES = ["Đại Hao", "Tiểu Hao"] as const;

/** Song Hao đắc: Dần/Thân (mã) + Mão/Dậu (bại) — Chúng Thủy Triều Đông. */
export const SONG_HAO_DAC_BRANCHES = ["Dần", "Thân", "Mão", "Dậu"] as const;

export const DAO_HONG_HY_NAMES = [
  "Đào Hoa",
  "Hồng Loan",
  "Thiên Hỷ",
  "Thiên Hỉ",
] as const;

export const CO_QUA_NAMES = ["Cô Thần", "Quả Tú"] as const;

export const DUC_TINH_NAMES = [
  "Thiên Đức",
  "Nguyệt Đức",
  "Long Đức",
  "Phúc Đức",
] as const;

export const HINH_RIEU_NAMES = ["Thiên Hình", "Thiên Riêu"] as const;

export const PHA_TOAI_LA_VONG_NAMES = [
  "Phá Toái",
  "Kiếp Sát",
  "Thiên La",
  "Địa Võng",
] as const;

export const THAI_TOA_NAMES = ["Tam Thai", "Bát Tọa"] as const;
export const QUANG_QUY_NAMES = ["Ân Quang", "Thiên Quý"] as const;
export const PHU_CAO_NAMES = ["Thai Phụ", "Phong Cáo"] as const;
export const QUAN_AN_NAMES = [
  "Quốc Ấn",
  "Đường Phù",
  "Thiên Quan",
  "Thiên Phúc",
  "Thiên Trù",
] as const;
export const GIAI_TINH_NAMES = [
  "Thiên Y",
  "Thiên Giải",
  "Địa Giải",
  "Giải Thần",
] as const;
export const LONG_PHUONG_NAMES = ["Long Trì", "Phượng Các"] as const;
export const THIEN_TAI_THO_NAMES = ["Thiên Tài", "Thiên Thọ"] as const;
export const TAI_TUE_PRESS_NAMES = ["Thái Tuế", "Tử Phù"] as const;
export const TAI_TUE_SOFT_NAMES = ["Thiếu Dương", "Thiếu Âm", "Trực Phù"] as const;

/** Trường Sinh — khí vượng / khởi. */
export const TRUONG_SINH_CAT = [
  "Tràng Sinh",
  "Quan Đới",
  "Lâm Quan",
  "Đế Vượng",
  "Thai",
  "Dưỡng",
] as const;
export const TRUONG_SINH_SUY = ["Suy", "Bệnh", "Tử", "Tuyệt"] as const;

/** Lookup sets — dựng từ các mảng tên sao phía trên. */
export const CAT_SET = new Set<string>(CAT_TINH_NAMES);
export const SAT_SET = new Set<string>(SAT_TINH_NAMES);
export const TAI_TUE_HUNG_SET = new Set<string>(TAI_TUE_HUNG_NAMES);
export const KINH_DA_SET = new Set<string>(KINH_DA_NAMES);
export const KHONG_KIEP_SET = new Set<string>(KHONG_KIEP_NAMES);
export const BAC_SI_CAT_SET = new Set<string>(BAC_SI_CAT_NAMES);
export const BAC_SI_HUNG_SET = new Set<string>(BAC_SI_HUNG_NAMES);
export const SONG_HAO_SET = new Set<string>(SONG_HAO_NAMES);
export const SONG_HAO_DAC_SET = new Set<string>(SONG_HAO_DAC_BRANCHES);
export const DAO_HONG_HY_SET = new Set<string>(DAO_HONG_HY_NAMES);
export const CO_QUA_SET = new Set<string>(CO_QUA_NAMES);
export const DUC_SET = new Set<string>(DUC_TINH_NAMES);
export const HINH_RIEU_SET = new Set<string>(HINH_RIEU_NAMES);
export const PHA_TOAI_SET = new Set<string>(PHA_TOAI_LA_VONG_NAMES);
export const THAI_TOA_SET = new Set<string>(THAI_TOA_NAMES);
export const QUANG_QUY_SET = new Set<string>(QUANG_QUY_NAMES);
export const PHU_CAO_SET = new Set<string>(PHU_CAO_NAMES);
export const QUAN_AN_SET = new Set<string>(QUAN_AN_NAMES);
export const GIAI_SET = new Set<string>(GIAI_TINH_NAMES);
export const LONG_PHUONG_SET = new Set<string>(LONG_PHUONG_NAMES);
export const THIEN_TAI_THO_SET = new Set<string>(THIEN_TAI_THO_NAMES);
export const TAI_TUE_PRESS_SET = new Set<string>(TAI_TUE_PRESS_NAMES);
export const TAI_TUE_SOFT_SET = new Set<string>(TAI_TUE_SOFT_NAMES);
export const TRUONG_SINH_CAT_SET = new Set<string>(TRUONG_SINH_CAT);
export const TRUONG_SINH_SUY_SET = new Set<string>(TRUONG_SINH_SUY);

