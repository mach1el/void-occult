import { Pillar } from "../calendar/sexagenary";

/**
 * Lục thập hoa giáp Nạp Âm (60 mệnh)
 */
export const NAYIN_MAP: Record<string, string> = {
  "Giáp Tý": "Hải Trung Kim", "Ất Sửu": "Hải Trung Kim",
  "Bính Dần": "Lư Trung Hoả", "Đinh Mão": "Lư Trung Hoả",
  "Mậu Thìn": "Đại Lâm Mộc", "Kỷ Tị": "Đại Lâm Mộc",
  "Canh Ngọ": "Lộ Bàng Thổ", "Tân Mùi": "Lộ Bàng Thổ",
  "Nhâm Thân": "Kiếm Phong Kim", "Quý Dậu": "Kiếm Phong Kim",
  
  "Giáp Tuất": "Sơn Đầu Hoả", "Ất Hợi": "Sơn Đầu Hoả",
  "Bính Tý": "Giản Hạ Thuỷ", "Đinh Sửu": "Giản Hạ Thuỷ",
  "Mậu Dần": "Thành Đầu Thổ", "Kỷ Mão": "Thành Đầu Thổ",
  "Canh Thìn": "Bạch Lạp Kim", "Tân Tị": "Bạch Lạp Kim",
  "Nhâm Ngọ": "Dương Liễu Mộc", "Quý Mùi": "Dương Liễu Mộc",
  
  "Giáp Thân": "Tuyền Trung Thuỷ", "Ất Dậu": "Tuyền Trung Thuỷ",
  "Bính Tuất": "Ốc Thượng Thổ", "Đinh Hợi": "Ốc Thượng Thổ",
  "Mậu Tý": "Tích Lịch Hoả", "Kỷ Sửu": "Tích Lịch Hoả",
  "Canh Dần": "Tùng Bách Mộc", "Tân Mão": "Tùng Bách Mộc",
  "Nhâm Thìn": "Trường Lưu Thuỷ", "Quý Tị": "Trường Lưu Thuỷ",
  
  "Giáp Ngọ": "Sa Trung Kim", "Ất Mùi": "Sa Trung Kim",
  "Bính Thân": "Sơn Hạ Hoả", "Đinh Dậu": "Sơn Hạ Hoả",
  "Mậu Tuất": "Bình Địa Mộc", "Kỷ Hợi": "Bình Địa Mộc",
  "Canh Tý": "Bích Thượng Thổ", "Tân Sửu": "Bích Thượng Thổ",
  "Nhâm Dần": "Kim Bạch Kim", "Quý Mão": "Kim Bạch Kim",
  
  "Giáp Thìn": "Phú Đăng Hoả", "Ất Tị": "Phú Đăng Hoả",
  "Bính Ngọ": "Thiên Hà Thuỷ", "Đinh Mùi": "Thiên Hà Thuỷ",
  "Mậu Thân": "Đại Trạch Thổ", "Kỷ Dậu": "Đại Trạch Thổ",
  "Canh Tuất": "Thoa Xuyến Kim", "Tân Hợi": "Thoa Xuyến Kim",
  "Nhâm Tý": "Tang Đố Mộc", "Quý Sửu": "Tang Đố Mộc",
  
  "Giáp Dần": "Đại Khê Thuỷ", "Ất Mão": "Đại Khê Thuỷ",
  "Bính Thìn": "Sa Trung Thổ", "Đinh Tị": "Sa Trung Thổ",
  "Mậu Ngọ": "Thiên Thượng Hoả", "Kỷ Mùi": "Thiên Thượng Hoả",
  "Canh Thân": "Thạch Lựu Mộc", "Tân Dậu": "Thạch Lựu Mộc",
  "Nhâm Tuất": "Đại Hải Thuỷ", "Quý Hợi": "Đại Hải Thuỷ"
};

/**
 * Tử Vi dùng chính tả địa chi "Tỵ", còn module Can Chi dùng "Tị".
 * Chuẩn hóa tại biên để toàn bộ app dùng chung một bảng Nạp Âm.
 */
export function getNayinByStemBranch(stem: string, branch: string): string {
  const normalizedBranch = branch === "Tỵ" ? "Tị" : branch;
  return NAYIN_MAP[`${stem} ${normalizedBranch}`] ?? "Unknown";
}

export function getNayin(pillar: Pillar): string {
  return getNayinByStemBranch(pillar.stem, pillar.branch);
}
