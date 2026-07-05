import type { ChartStar } from "../types/chart";

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
