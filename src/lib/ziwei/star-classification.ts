import type { ChartStar } from "@/types/chart";

const BENEFIC_LAYERS = new Set(["soft", "wealth", "helper", "move", "romance"]);
const MALEFIC_LAYERS = new Set(["tough", "harm", "void"]);

const BENEFIC_NAMES = new Set([
  "Tả Phụ",
  "Tả Phù",
  "Hữu Bật",
  "Thiên Khôi",
  "Thiên Việt",
  "Văn Xương",
  "Văn Khúc",
  "Hóa Lộc",
  "Hóa Quyền",
  "Hóa Khoa",
  "Lộc Tồn",
  "Thiên Mã",
  "Thiên Tài",
  "Thiên Thọ",
  "Ân Quang",
  "Thiên Quý",
  "Thiên Quan",
  "Thiên Phúc",
  "Quốc Ấn",
  "Đường Phù",
  "Thiên Trù",
  "Long Đức",
  "Phúc Đức",
  "Thiên Đức",
  "Nguyệt Đức",
  "Thiên Giải",
  "Địa Giải",
  "Giải Thần",
  "Đào Hoa",
  "Hồng Loan",
  "Thiên Hỷ",
  "Hỷ Thần",
  "Thanh Long",
  "Thai Phụ",
  "Phong Cáo",
  "Thiên Y",
  "Hoa Cái",
  "Thiếu Dương",
  "Thiếu Âm",
  "Bác Sĩ",
  "Lực Sĩ",
  "Tướng Quân",
  "Tấu Thư",
  "Tam Thai",
  "Bát Tọa",
  "Long Trì",
  "Phượng Các",
  "Tướng Tinh",
  "Phàn An",
  "Tuế Dịch",
  "Hàm Trì",
]);

const MALEFIC_NAMES = new Set([
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
  "Đại Hao",
  "Tiểu Hao",
  "Tang Môn",
  "Bạch Hổ",
  "Thiên Khốc",
  "Thiên Hư",
  "Hóa Kỵ",
  "Tuần",
  "Triệt",
  "Tuần Không",
  "Triệt Không",
  "Thiên La",
  "Địa Võng",
  "Thiên Sứ",
  "Thiên Thương",
  "Thiên Riêu",
  "Thái Tuế",
  "Thiên Hình",
  "Cô Thần",
  "Quả Tú",
  "Đẩu Quân",
  "Kiếp Sát",
  "Phá Toái",
  "Phục Binh",
  "Quan Phù",
  "Tử Phù",
  "Tuế Phá",
  "Điếu Khách",
  "Trực Phù",
  "Lưu Hà",
  "Phi Liêm",
  "Bệnh Phù",
  "Quan Phủ",
  "Thiên Sát",
  "Nguyệt Sát",
  "Tai Sát",
  "Tức Thần",
  "Chỉ Bối",
  "Vong Thần",
]);

export function baseStarName(name: string): string {
  if (name === "Lưu Hà") return name;
  return name.replace(/^Lưu\s+/, "");
}

export function isBeneficStar(star: ChartStar): boolean {
  const name = baseStarName(star.name);
  if (BENEFIC_NAMES.has(name)) return true;
  if (MALEFIC_NAMES.has(name)) return false;
  if ((star.source ?? "").endsWith("-mutagen")) {
    return !name.includes("Kỵ");
  }
  if (BENEFIC_LAYERS.has(star.layer ?? "")) return true;
  if (MALEFIC_LAYERS.has(star.layer ?? "")) return false;
  return true;
}

export function isAnnualStar(star: ChartStar): boolean {
  return star.source === "annual" || star.source === "annual-mutagen";
}

export function compareNatalBeforeAnnual(
  first: ChartStar,
  second: ChartStar,
): number {
  return Number(isAnnualStar(first)) - Number(isAnnualStar(second));
}

// Tầng bậc thị giác cho lá số (chỉ ảnh hưởng độ mờ/nổi, KHÔNG đổi dữ liệu lá
// số). 14 chính tinh lấy từ layer === "major" (metadata engine đã có sẵn).
// Tầng 2 là danh sách phụ tinh chính do spec chỉ định rõ tên — không tự suy
// diễn thêm. Lưu sao (tiền tố "Lưu") luôn rơi về tầng 3 dù trùng tên phụ tinh
// chính, vì đây là bản lưu niên/lưu nguyệt, không phải sao nguyên cục.
const TIER2_NAMES = new Set([
  "Tả Phụ",
  "Hữu Bật",
  "Văn Xương",
  "Văn Khúc",
  "Thiên Khôi",
  "Thiên Việt",
  "Lộc Tồn",
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
]);

export type StarTier = 1 | 2 | 3;

export function starTier(star: ChartStar): StarTier {
  if (star.layer === "major") return 1;
  if (isAnnualStar(star)) return 3;
  if (TIER2_NAMES.has(baseStarName(star.name))) return 2;
  return 3;
}

// Nâng thêm 1 bậc sáng cho phụ tinh trên nền void (2: 0.96→0.98, 3: 0.75→0.86)
// — vẫn giữ thứ bậc 1 > 2 > 3 để chính tinh nổi nhất.
const TIER_OPACITY: Record<StarTier, number> = { 1: 1, 2: 0.98, 3: 0.86 };

// Chỉ ĐỌC star.brightness (đã tính sẵn ở engine) để đổi độ mờ — không đụng
// bảng BRIGHTNESS hay cách xác định miếu/hãm. Hãm là sao yếu, cho trông yếu
// hẳn; Miếu/Vượng/Đắc/Bình giữ chói đầy đủ (không mờ thêm).
export function brightnessOpacityFactor(brightness?: string): number {
  return brightness === "Hãm" ? 0.68 : 1;
}

export function isStrongBrightness(brightness?: string): boolean {
  return brightness === "Miếu" || brightness === "Vượng";
}

// Kết hợp tầng bậc với độ sáng miếu/hãm: nhân hai hệ số, sàn 0.5 để không
// bao giờ mờ tới mức mất chữ trên nền tối (với TIER_OPACITY hiện tại, sàn
// này gần như không bao giờ bị chạm tới — chỉ còn là lưới an toàn).
export function starDisplayOpacity(star: ChartStar): number {
  const tierOpacity = TIER_OPACITY[starTier(star)];
  return Math.max(0.5, tierOpacity * brightnessOpacityFactor(star.brightness));
}
