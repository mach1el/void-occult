/**
 * Trọng số chấm điểm xu hướng Tử Vi (heuristic theo phái — KHÔNG phải chân lý).
 *
 * Mọi hệ số cộng/trừ điểm sống ở đây để cấu hình được. Scorer chỉ đọc bảng này.
 * Toàn bộ bảng phải đưa vào PR mục `## Cần thầy duyệt` trước khi coi là chuẩn nội bộ.
 *
 * Thang điểm thô được cộng rồi clamp về 0–100 ở `trend-score.ts`.
 */

export interface ScoringWeights {
  /** Lưu/ĐV Hóa Lộc vào cung trọng yếu (Mệnh, Tài, Quan, Thiên Di). */
  mutagenLocKeyPalace: number;
  /** Lưu/ĐV Hóa Quyền vào cung trọng yếu. */
  mutagenQuyenKeyPalace: number;
  /** Lưu/ĐV Hóa Khoa vào cung trọng yếu. */
  mutagenKhoaKeyPalace: number;
  /** Mỗi cát tinh hội (Tả/Hữu/Xương/Khúc/Khôi/Việt/Lộc Tồn) tại cung trọng / mệnh vận. */
  beneficMeet: number;
  /** Chính tinh miếu hoặc vượng thủ cung mệnh vận. */
  majorMieuVuong: number;
  /** Bonus khi cung tam hợp (cùng bộ với mệnh vận) có cát tinh. */
  tamHopCat: number;

  /** Lưu/ĐV Hóa Kỵ vào hoặc xung cung trọng yếu. */
  mutagenKyKeyOrXung: number;
  /** Mỗi sát tinh hội (Kình, Đà, Hỏa, Linh, Không, Kiếp). */
  maleficMeet: number;
  /** Bonus khi ≥2 sát tinh cùng cung (trùng phùng). */
  maleficClusterBonus: number;
  /** Chính tinh hãm địa tại cung mệnh vận. */
  majorHam: number;
  /** Tuần hoặc Triệt án ngữ cung mệnh vận. */
  voidOnFocus: number;
  /** Thái Tuế hung (Tang Môn, Bạch Hổ, Điếu Khách…). */
  taiTueHung: number;

  /** Hệ số ngữ cảnh cung tĩnh (radar) — cộng khi có chính tinh thủ cung. */
  palaceHasMajor: number;
  /** Radar: phạt vô chính diệu. */
  palaceEmptyMajor: number;
  /** Radar: nền điểm trước khi cộng/trừ (để lá “trung bình” nằm giữa thang). */
  palaceBase: number;
}

/**
 * Draft mặc định — giá trị tham khảo nội bộ, chờ thầy duyệt.
 * Nguồn ý: tổng hợp heuristic phổ biến (Lộc/cát = cơ hội; Kỵ/sát/hãm = rủi ro),
 * không gắn một giáo trình cụ thể. Có thể chỉnh từng khóa mà không đụng scorer.
 */
export const SCORING_WEIGHTS: ScoringWeights = {
  mutagenLocKeyPalace: 18,
  mutagenQuyenKeyPalace: 14,
  mutagenKhoaKeyPalace: 12,
  beneficMeet: 6,
  majorMieuVuong: 10,
  tamHopCat: 5,

  mutagenKyKeyOrXung: 20,
  maleficMeet: 8,
  maleficClusterBonus: 10,
  majorHam: 12,
  voidOnFocus: 10,
  taiTueHung: 7,

  palaceHasMajor: 8,
  palaceEmptyMajor: 15,
  palaceBase: 42,
};

/** Tên cung trọng yếu khi chấm Tài lộc / Thách thức theo vận. */
export const KEY_PALACE_NAMES = [
  "Mệnh",
  "Tài Bạch",
  "Quan Lộc",
  "Thiên Di",
] as const;

/** Cát tinh được tính trong lớp Tài lộc (danh sách hẹp theo spec). */
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

/** Sát tinh được tính trong lớp Thách thức (danh sách hẹp theo spec). */
export const SAT_TINH_NAMES = [
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
] as const;

/** Hung tinh vòng Thái Tuế (một phần) — dùng cho thách thức. */
export const TAI_TUE_HUNG_NAMES = [
  "Tang Môn",
  "Bạch Hổ",
  "Điếu Khách",
  "Tuế Phá",
  "Quan Phù",
  "Thiên Khốc",
  "Thiên Hư",
] as const;
