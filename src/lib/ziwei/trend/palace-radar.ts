/**
 * Engine radar "vận khí" 12 cung — mô hình định lượng v2 (tất định, không LLM).
 *
 *   E_i = T_i × [ Σ(B_k · M_pos,k · M_nh,k) + P_TrườngSinh + P_ĐịaChi + Combo_i ]
 *   S_i = 0.5·E_i + 0.25·E_(i+6) + 0.125·(E_(i+4) + E_(i+8))
 *
 * Điểm nền B lấy từ `star-scores.ts` (bảng Tier của thầy, đã sửa tên khớp
 * engine). Ngũ hành của sao lấy từ `engine.elementForStar()` — nguồn duy nhất.
 *
 * ── Khác spec v2, đã báo và thầy chốt ──
 * - **Chuẩn hóa**: dùng thang TUYỆT ĐỐI (mốc cố định, calibrate từ phân phối
 *   thật) thay cho min-max. Min-max là thang tương đối (cung yếu nhất luôn =10
 *   dù lá số toàn cung tốt), không so được giữa các lá số, và chia 0 khi 12
 *   cung bằng điểm.
 * - **M_nh phân cực**: spec cho 1.2/0.9/0.7 áp thẳng lên B *có dấu* → với sát
 *   tinh (B<0) bảng chạy ngược ý ("Sao khắc Mệnh → tăng hung" nhưng ×0.7 lại
 *   BỚT hung). Ở đây tách hệ số theo cực tính của sao.
 *
 * ── Chỗ spec chưa phủ, đã chốt luật tất định ──
 * - B chọn theo độ sáng: Miếu/Vượng/Đắc → cột `dac`; Hãm → `ham`; còn lại →
 *   `base`. M_pos chỉ phân biệt tiếp TRONG nhóm (Miếu 1.2 > Vượng 1.1 > Đắc
 *   1.0) — tránh nhân đôi độ sáng.
 * - Kình/Đà/Hỏa/Linh KHÔNG có brightness trong engine → suy ra từ vùng địa chi
 *   (Tứ Mộ = đắc địa, theo Rule III.2 của spec).
 * - T_i khi cung có cả chính tinh sáng lẫn hãm: có bất kỳ chính tinh
 *   Miếu/Vượng/Đắc → 0.6, ngược lại → 0.35.
 */

import type { ChartData, ChartPalace, ChartStar, School } from "@/types/chart";
import { getEngine } from "../chart";
import { baseStarName, isAnnualStar } from "../star-classification";
import { isMaBranch, isMoBranch, TAM_HOP, XUNG_CHIEU } from "./zones";
import { findStarScore, type StarScoreRow } from "./star-scores";
import type { PalaceStrength, ScoreLine } from "./types";
import { isMutagenStar, mutagenKind } from "./util";

type Brightness = "Miếu" | "Vượng" | "Đắc" | "Bình" | "Hãm";

const SAT_TINH = new Set([
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
]);
const TU_CHINH = new Set(["Tý", "Ngọ", "Mão", "Dậu"]);

/**
 * Bảng đắc địa Lục Sát — hard-code theo thầy (Phần 2). Đây là nguồn DUY NHẤT
 * cho đắc/hãm của 6 sát tinh; KHÔNG đọc `star.brightness` của engine nữa.
 *
 * ⚠️ Với Hỏa/Linh, bảng này LỆCH bảng brightness engine đang hiển thị trên lá
 * số (Hỏa: Thìn/Mùi/Dậu/Hợi/Sửu; Linh: Thìn/Mùi/Dậu/Hợi). Radar theo bảng
 * dưới; muốn lá số hiện khớp thì phải sửa BRIGHTNESS trong engine — việc riêng.
 */
const SAT_DAC_BRANCHES: Record<string, ReadonlySet<string>> = {
  // Kim nhập thổ mộ → uy quyền bạo phát.
  "Kình Dương": new Set(["Sửu", "Thìn", "Mùi", "Tuất"]),
  "Đà La": new Set(["Sửu", "Thìn", "Mùi", "Tuất"]),
  // Hỏa phát tại đất Sinh/Mã → hoạch phát hoạch phá.
  "Địa Không": new Set(["Tỵ", "Hợi", "Dần", "Thân"]),
  "Địa Kiếp": new Set(["Tỵ", "Hợi", "Dần", "Thân"]),
  // Tam hợp Hỏa + phương Đông/Nam.
  "Hỏa Tinh": new Set(["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Tuất"]),
  "Linh Tinh": new Set(["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Tuất"]),
};

export interface RadarWeights {
  /**
   * M_pos — CHỈ áp cho Tier 1 (chính tinh), để phân rã độ mịn 5 cấp từ 3 cột
   * CSV. Phụ tinh (Tier 2/3/4) bỏ qua hoàn toàn (quy tắc vàng của thầy).
   * Đắc/Bình/Hãm đều ×1.0 → điểm CSV không bị thổi phồng.
   */
  mPosMieu: number;
  mPosVuong: number;

  /**
   * Ngũ hành (spec Phần II.2) — áp ĐỒNG NHẤT cho mọi sao, KHÔNG phân biệt
   * cát/hung. Đây là hệ số "sao có phát huy được ở bản mệnh này không", không
   * phải nhãn tốt/xấu. Chính tinh hãm địa (điểm âm) vẫn là chính tinh — không
   * được coi như sát tinh.
   *
   * Chỉ áp cho Tier 1 (chính tinh) + Tier 2 (phụ tinh cấp 1); Tier 3/4 giữ
   * nguyên điểm gốc CSV.
   */
  mThuan: number;
  mMenhKhacSao: number;
  mSaoKhacMenh: number;

  /**
   * Tuần/Triệt (Phần V) — phân loại cung theo độ sáng chính tinh:
   *   Miếu/Vượng/Đắc → tStrongMajor · Bình → tBinhMajor · Hãm → tWeakMajor.
   * Override: ≥ `satHamOverrideCount` lục sát HÃM → ép về tWeakMajor bất kể
   * chính tinh sáng (phản vi kỳ cách).
   */
  tNone: number;
  tStrongMajor: number;
  tBinhMajor: number;
  tWeakMajor: number;
  tBoth: number;
  satHamOverrideCount: number;

  /**
   * Vô chính diệu — 3 tầng, xét TRƯỚC và tách hẳn nhánh Tuần/Triệt của cung
   * thường (cung trống không có chính tinh gốc để xét độ sáng):
   *   ≥2 sao Không (Tuần/Triệt/Địa Không/Thiên Không) → tVcdDacKhong + bonus
   *   đúng 1 Tuần hoặc Triệt án ngữ            → tVcdCovered (nhà có nóc)
   *   không Tuần/Triệt                          → tVcdPlain   (nhà không nóc)
   */
  tVcdDacKhong: number;
  tVcdCovered: number;
  tVcdPlain: number;
  vcdBorrow: number;
  vcdDacKhongCombo: number;

  /** Địa chi (Phần III). */
  locMaGiaoTri: number;
  maChietTuc: number;
  truongSinhTuSinh: number;
  thamVuMo: number;
  thienLaDiaVong: number;
  nhatNguyetTinhMinh: number;
  daoHoaSat: number;

  /** Cách cục (Phần IV). */
  quanThanKhanhHoi: number;
  satPhaLangDac: number;
  coNguyetDongLuong: number;
  binhHinhTuongAn: number;
  tamHoaLienChau: number;
  duongLuongXuongLoc: number;
  deNgoHungDo: number;
  catXuTangHungRatio: number;
  linhXuongDaVu: number;
  khocHuTangHo: number;
  thuongSuGiaoXam: number;

  /** Tam phương tứ chính. */
  wSelf: number;
  wXung: number;
  wTamHop: number;

  /** Chuẩn hóa tuyệt đối. */
  normMin: number;
  normMax: number;
}

export const RADAR_WEIGHTS: RadarWeights = {
  mPosMieu: 1.2,
  mPosVuong: 1.1,

  mThuan: 1.2,
  mMenhKhacSao: 0.9,
  mSaoKhacMenh: 0.7,

  tNone: 1,
  tStrongMajor: 0.6,
  tBinhMajor: 0.5,
  tWeakMajor: 0.35,
  tBoth: 0.85,
  satHamOverrideCount: 3,
  tVcdDacKhong: 1.3,
  tVcdCovered: 1.0,
  tVcdPlain: 0.7,
  vcdBorrow: 0.8,
  vcdDacKhongCombo: 10,

  locMaGiaoTri: 8,
  maChietTuc: -6,
  truongSinhTuSinh: 4,
  thamVuMo: 10,
  thienLaDiaVong: -4,
  nhatNguyetTinhMinh: 8,
  daoHoaSat: -8,

  quanThanKhanhHoi: 12,
  satPhaLangDac: 12,
  coNguyetDongLuong: 8,
  binhHinhTuongAn: 10,
  tamHoaLienChau: 15,
  duongLuongXuongLoc: 10,
  deNgoHungDo: -10,
  catXuTangHungRatio: -0.5,
  linhXuongDaVu: -15,
  khocHuTangHo: -10,
  thuongSuGiaoXam: -8,

  wSelf: 0.5,
  wXung: 0.25,
  wTamHop: 0.125,

  // Calibrate từ phân phối RAW thật của CHÍNH công thức này: 792 lá số × 2
  // phái × 12 cung = 9504 mẫu → raw ∈ [-21.7, 45.5], median 5.6, p80 11.4.
  // Mốc -12…27 giải ngược để: median ≈ 45 ("trung bình"), score > 60 ⇔ raw >
  // p80 (top ~20% = "rất tốt"). Đổi công thức/CSV thì phải đo & chỉnh lại.
  //
  // Đây là thang TUYỆT ĐỐI: mốc cố định, KHÔNG phụ thuộc từng lá số (khác
  // min-max) → so sánh chéo được giữa các lá số, và không chia 0.
  normMin: -12,
  normMax: 27,
};

/** Vòng sinh/khắc ngũ hành — phổ quát, không phụ thuộc phái. */
const GENERATES: Record<string, string> = {
  Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc",
};
const CONTROLS: Record<string, string> = {
  Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc",
};

function brightnessOf(star: ChartStar, branch: string): Brightness | null {
  const base = baseStarName(star.name);
  // Lục sát: bảng hard-code của thầy là nguồn DUY NHẤT (không đọc engine).
  const dacSet = SAT_DAC_BRANCHES[base];
  if (dacSet) return dacSet.has(branch) ? "Đắc" : "Hãm";

  const b = star.brightness;
  if (b === "Miếu" || b === "Vượng" || b === "Đắc" || b === "Bình" || b === "Hãm") {
    return b;
  }
  return null;
}

/**
 * B_final — decouple điểm neo CSV khỏi M_pos (luật thầy, Phần 1):
 *
 *   Tier 1 (chính tinh)   Miếu → dac ×1.2 · Vượng → dac ×1.1 · Đắc → dac ×1.0
 *                         Bình → base ×1.0 · Hãm → ham ×1.0
 *   Tier 2/3/4 (phụ tinh) BỎ QUA M_pos — lấy thẳng dac / ham / base.
 *
 * → Điểm CSV không bao giờ bị thổi phồng; M_pos chỉ phân rã độ mịn Miếu/Vượng
 *   cho chính tinh (vì CSV chỉ có 3 cột trạng thái).
 */
function baseFinal(
  row: StarScoreRow,
  bright: Brightness | null,
  w: RadarWeights,
): { value: number; mPos: number; anchor: string } {
  const dacLike = bright === "Miếu" || bright === "Vượng" || bright === "Đắc";
  const anchorValue = dacLike ? row.dac : bright === "Hãm" ? row.ham : row.base;
  const anchor = dacLike ? "dac" : bright === "Hãm" ? "ham" : "base";

  if (row.tier !== 1) return { value: anchorValue, mPos: 1, anchor };

  const mPos =
    bright === "Miếu" ? w.mPosMieu : bright === "Vượng" ? w.mPosVuong : 1;
  return { value: anchorValue * mPos, mPos, anchor };
}

function isSatTinh(base: string): boolean {
  return SAT_TINH.has(base);
}

/**
 * Hệ số Ngũ Hành M_nh — spec Phần II.2, áp ĐỒNG NHẤT cho mọi sao.
 *
 * KHÔNG key theo dấu điểm: chính tinh hãm địa có điểm âm nhưng vẫn là chính
 * tinh (Thái Âm hãm = mất ánh sáng, KHÔNG phải sát tinh) — key theo dấu sẽ
 * cho cùng một quan hệ ngũ hành hai hệ số khác nhau.
 */
function elementMultiplier(
  starElement: string,
  menhElement: string,
  w: RadarWeights,
): { m: number; note: string } {
  if (!starElement || !menhElement) return { m: 1, note: "" };
  const thuan =
    starElement === menhElement ||
    GENERATES[starElement] === menhElement ||
    GENERATES[menhElement] === starElement;
  if (thuan) return { m: w.mThuan, note: "thuận mệnh" };
  if (CONTROLS[menhElement] === starElement) {
    return { m: w.mMenhKhacSao, note: "mệnh khắc sao (khắc xuất)" };
  }
  if (CONTROLS[starElement] === menhElement) {
    return { m: w.mSaoKhacMenh, note: "sao khắc mệnh (khắc nhập)" };
  }
  return { m: 1, note: "" };
}

function voidTypesByBranch(chart: ChartData): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const marker of chart.voidMarkers ?? []) {
    for (const branch of marker.branches) {
      if (!map.has(branch)) map.set(branch, new Set());
      map.get(branch)!.add(marker.type);
    }
  }
  return map;
}

interface StarCtx {
  star: ChartStar;
  base: string;
  scale: number;
  from?: string;
}

const has = (ctx: StarCtx[], ...names: string[]) =>
  names.every((n) => ctx.some((c) => c.base === n));
const hasAny = (ctx: StarCtx[], ...names: string[]) =>
  names.some((n) => ctx.some((c) => c.base === n));
const isKy = (c: StarCtx) => isMutagenStar(c.star) && mutagenKind(c.star) === "Kỵ";
const isLoc = (c: StarCtx) =>
  c.base === "Lộc Tồn" || (isMutagenStar(c.star) && mutagenKind(c.star) === "Lộc");

/** Phần III — điểm đặc thù địa chi. */
function diaChiPoints(
  ctx: StarCtx[],
  branch: string,
  w: RadarWeights,
): ScoreLine[] {
  const lines: ScoreLine[] = [];
  const hasKy = ctx.some(isKy);
  const hasLoc = ctx.some(isLoc);

  // 1. Tứ Sinh / Tứ Mã
  if (isMaBranch(branch)) {
    if (has(ctx, "Thiên Mã")) {
      if (hasLoc) {
        lines.push({ source: "Lộc Mã giao trì", points: w.locMaGiaoTri,
          reason: `Thiên Mã + Lộc tại tứ sinh (${branch})` });
      }
      if (hasKy || has(ctx, "Đà La")) {
        lines.push({ source: "Mã chiết túc", points: w.maChietTuc,
          reason: `Thiên Mã gặp Đà La/Hóa Kỵ tại ${branch}` });
      }
    }
    if (has(ctx, "Tràng Sinh")) {
      lines.push({ source: "Trường Sinh cư tứ sinh", points: w.truongSinhTuSinh,
        reason: `Tràng Sinh tại tứ sinh (${branch})` });
    }
  }

  // 2. Tứ Mộ
  if (isMoBranch(branch)) {
    if ((branch === "Sửu" || branch === "Mùi") && has(ctx, "Tham Lang", "Vũ Khúc")) {
      lines.push({ source: "Vũ Tham đồng hành", points: w.thamVuMo,
        reason: `Tham Lang + Vũ Khúc đồng cung ${branch}` });
    }
    // Thiên La (Thìn) / Địa Võng (Tuất)
    if (branch === "Thìn" || branch === "Tuất") {
      const strongMajor = ctx.some(
        (c) =>
          c.star.layer === "major" &&
          ["Tử Vi", "Thiên Phủ", "Thất Sát"].includes(c.base),
      );
      const satDac = ctx.some(
        (c) => isSatTinh(c.base) && brightnessOf(c.star, branch) === "Đắc",
      );
      if (!strongMajor && !satDac) {
        lines.push({
          source: branch === "Thìn" ? "Thiên La" : "Địa Võng",
          points: w.thienLaDiaVong,
          reason: `${branch} không có chính tinh mạnh / sát tinh đắc phá lưới`,
        });
      }
    }
  }

  // 3. Tứ Chính / Tứ Đào
  if (TU_CHINH.has(branch)) {
    const nhatNguyet =
      (branch === "Ngọ" && has(ctx, "Thái Dương")) ||
      (branch === "Tý" && has(ctx, "Thái Âm"));
    if (nhatNguyet) {
      lines.push({ source: "Nhật Nguyệt tịnh minh", points: w.nhatNguyetTinhMinh,
        reason: branch === "Ngọ" ? "Thái Dương cư Ngọ" : "Thái Âm cư Tý" });
    }
    const daoHoa = hasAny(ctx, "Đào Hoa", "Hồng Loan", "Mộc Dục");
    const satBreak = hasKy || hasAny(ctx, "Địa Kiếp", "Thiên Riêu");
    if (daoHoa && satBreak) {
      lines.push({ source: "Đào hoa sát", points: w.daoHoaSat,
        reason: `Đào/Hồng/Mộc Dục gặp Kiếp/Kỵ/Riêu tại ${branch}` });
    }
  }

  return lines;
}

/** Phần IV — engine cách cục. */
function comboPoints(ctx: StarCtx[], branch: string, w: RadarWeights): ScoreLine[] {
  const lines: ScoreLine[] = [];
  const kind = (k: string) =>
    ctx.some((c) => isMutagenStar(c.star) && mutagenKind(c.star) === k);

  if (hasAny(ctx, "Tử Vi", "Thiên Phủ") && has(ctx, "Tả Phụ", "Hữu Bật")) {
    lines.push({ source: "Quân Thần Khánh Hội", points: w.quanThanKhanhHoi,
      reason: "Tử Vi/Thiên Phủ + Tả Phụ + Hữu Bật" });
  }
  const satPhaLang = hasAny(ctx, "Thất Sát", "Phá Quân", "Tham Lang");
  const satDac = ctx.some(
    (c) => isSatTinh(c.base) && brightnessOf(c.star, branch) === "Đắc",
  );
  if (satPhaLang && satDac) {
    lines.push({ source: "Sát Phá Lang + sát đắc", points: w.satPhaLangDac,
      reason: "Sát/Phá/Tham gặp lục sát đắc địa — phát dã như lôi" });
  }
  if (
    has(ctx, "Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương") &&
    hasAny(ctx, "Văn Xương", "Văn Khúc")
  ) {
    lines.push({ source: "Cơ Nguyệt Đồng Lương", points: w.coNguyetDongLuong,
      reason: "Cơ + Nguyệt + Đồng + Lương + Xương/Khúc" });
  }
  if (has(ctx, "Phục Binh", "Thiên Hình", "Tướng Quân", "Quốc Ấn")) {
    lines.push({ source: "Binh Hình Tướng Ấn", points: w.binhHinhTuongAn,
      reason: "Phục Binh + Thiên Hình + Tướng Quân + Quốc Ấn" });
  }
  if (kind("Lộc") && kind("Quyền") && kind("Khoa")) {
    lines.push({ source: "Tam Hóa Liên Châu", points: w.tamHoaLienChau,
      reason: "Hội đủ Hóa Lộc + Hóa Quyền + Hóa Khoa" });
  }
  if (has(ctx, "Thái Dương", "Thiên Lương", "Văn Xương", "Lộc Tồn")) {
    lines.push({ source: "Dương Lương Xương Lộc", points: w.duongLuongXuongLoc,
      reason: "Thái Dương + Thiên Lương + Văn Xương + Lộc Tồn" });
  }

  // Hung cục
  if (
    (branch === "Mão" || branch === "Dậu") &&
    has(ctx, "Tử Vi", "Tham Lang") &&
    hasAny(ctx, "Địa Không", "Địa Kiếp")
  ) {
    lines.push({ source: "Đế ngộ hung đồ", points: w.deNgoHungDo,
      reason: `Tử Vi ${branch} + Tham Lang + Không/Kiếp` });
  }
  // Cát xứ tàng hung: chính tinh Miếu/Vượng + Không & Kiếp
  if (has(ctx, "Địa Không", "Địa Kiếp")) {
    const strong = ctx.filter((c) => {
      const b = brightnessOf(c.star, branch);
      return c.star.layer === "major" && (b === "Miếu" || b === "Vượng");
    });
    if (strong.length) {
      const majorBase = strong.reduce((sum, c) => {
        const row = findStarScore(c.star.name);
        return (
          sum +
          (row ? baseFinal(row, brightnessOf(c.star, branch), w).value : 0)
        );
      }, 0);
      lines.push({
        source: "Cát xứ tàng hung",
        points: Math.round(w.catXuTangHungRatio * majorBase * 10) / 10,
        reason: "Chính tinh Miếu/Vượng gặp Địa Không + Địa Kiếp",
      });
    }
  }
  if (has(ctx, "Vũ Khúc", "Văn Xương", "Linh Tinh", "Đà La")) {
    lines.push({ source: "Linh Xương Đà Vũ", points: w.linhXuongDaVu,
      reason: "Vũ Khúc + Văn Xương + Linh Tinh + Đà La" });
  }
  if (has(ctx, "Thiên Khốc", "Thiên Hư", "Tang Môn", "Bạch Hổ")) {
    lines.push({ source: "Khốc Hư Tang Hổ", points: w.khocHuTangHo,
      reason: "Thiên Khốc + Thiên Hư + Tang Môn + Bạch Hổ" });
  }
  if (
    hasAny(ctx, "Thiên Thương", "Thiên Sứ") &&
    (ctx.some(isKy) || hasAny(ctx, "Kình Dương", "Đà La"))
  ) {
    lines.push({ source: "Thương Sứ giao xâm", points: w.thuongSuGiaoXam,
      reason: "Thiên Thương/Thiên Sứ gặp Hóa Kỵ / Kình Đà" });
  }

  return lines;
}

interface EnergyResult {
  energy: number;
  lines: ScoreLine[];
}

function palaceEnergy(
  chart: ChartData,
  palace: ChartPalace,
  byBranch: Map<string, ChartPalace>,
  voids: Map<string, Set<string>>,
  elementForStar: (name: string) => string,
  w: RadarWeights,
): EnergyResult {
  const lines: ScoreLine[] = [];
  const menhElement = chart.menhElement ?? "";
  const branch = palace.branch;
  // Radar = đánh giá tổng thể tĩnh → chỉ sao gốc, bỏ sao lưu niên.
  const own = (palace.stars ?? []).filter((s) => !isAnnualStar(s));
  const ownMajors = own.filter((s) => s.layer === "major");
  const isVCD = ownMajors.length === 0;

  const ctx: StarCtx[] = own.map((star) => ({
    star,
    base: baseStarName(star.name),
    scale: 1,
  }));
  if (isVCD) {
    const opposite = byBranch.get(XUNG_CHIEU[branch] ?? "");
    for (const star of (opposite?.stars ?? []).filter(
      (s) => !isAnnualStar(s) && s.layer === "major",
    )) {
      ctx.push({
        star,
        base: baseStarName(star.name),
        scale: w.vcdBorrow,
        from: opposite?.name,
      });
    }
  }

  // Σ (B_final · M_nh) — `points` là đóng góp NGUYÊN BẢN vào nội lực cung,
  // KHÔNG nhân trọng số tam phương tứ chính (dòng rollup lo việc đó).
  let sum = 0;
  for (const c of ctx) {
    const row = findStarScore(c.star.name);
    if (!row) continue;
    const bright = brightnessOf(c.star, branch);
    const { value: b, mPos } = baseFinal(row, bright, w);
    if (b === 0) continue;
    // Ngũ hành CHỈ áp cho Tier 1 (chính tinh) và Tier 2 (phụ tinh cấp 1);
    // Tier 3/4 giữ nguyên điểm gốc CSV.
    const useNguHanh = row.tier <= 2;
    const element = useNguHanh ? elementForStar(c.base) || "" : "";
    const { m: mNh, note } = useNguHanh
      ? elementMultiplier(element, menhElement, w)
      : { m: 1, note: "" };
    const value = b * mNh * c.scale;
    sum += value;
    lines.push({
      source: c.star.name,
      points: round1(value),
      reason:
        `B${b >= 0 ? "+" : ""}${round1(b)}` +
        `${bright ? ` ${bright}${mPos !== 1 ? `×${mPos}` : ""}` : ""}` +
        `${element ? ` · ${element}` : ""}${note ? ` ${note}×${mNh}` : ""}` +
        `${c.from ? ` (mượn ${c.from}×${w.vcdBorrow})` : ""}`,
    });
  }

  // P_TrườngSinh
  const cs = palace.changSheng;
  if (cs) {
    const row = findStarScore(cs);
    if (row && row.base !== 0) {
      sum += row.base;
      lines.push({
        source: `Trường Sinh·${cs}`,
        points: row.base,
        reason: `Vòng Trường Sinh: ${cs}`,
      });
    }
  }

  // P_ĐịaChi + ComboBonus
  for (const line of diaChiPoints(ctx, branch, w)) {
    sum += line.points;
    lines.push(line);
  }
  for (const line of comboPoints(ctx, branch, w)) {
    sum += line.points;
    lines.push(line);
  }

  // T_i — hệ số Tuần/Triệt (Phần V)
  const types = voids.get(branch);
  const hasTuan = types?.has("Tuần") ?? false;
  const hasTriet = types?.has("Triệt") ?? false;
  const khongCount =
    (hasTuan ? 1 : 0) +
    (hasTriet ? 1 : 0) +
    (ctx.some((c) => c.base === "Địa Không") ? 1 : 0) +
    (ctx.some((c) => c.base === "Thiên Không") ? 1 : 0);

  let t = w.tNone;
  let tNote = "";
  if (isVCD) {
    // VCD phân 3 tầng — KHÔNG rơi vào nhánh Tuần/Triệt của cung thường, vì
    // cung trống không có chính tinh gốc để xét độ sáng.
    if (khongCount >= 2) {
      // Tier 1 — Đắc Tam Không / Nhị Không: bùng nổ đại quý.
      t = w.tVcdDacKhong;
      tNote = `VCD đắc ${khongCount} Không → Đắc Tam Không`;
      sum += w.vcdDacKhongCombo;
      lines.push({
        source: "VCD Đắc Tam Không",
        points: w.vcdDacKhongCombo,
        reason: `Cung trống gặp ${khongCount} sao Không → bùng nổ`,
      });
    } else if (hasTuan || hasTriet) {
      // Tier 2 — nhà có nóc: giữ trọn nội lực đã mượn (×0.8) từ đối cung.
      t = w.tVcdCovered;
      tNote = `VCD có ${hasTuan ? "Tuần" : "Triệt"} án ngữ → nhà có nóc, giữ trọn khí mượn`;
    } else {
      // Tier 3 — nhà không nóc: khí mượn bị tán xạ.
      t = w.tVcdPlain;
      tNote = "VCD không Tuần/Triệt án ngữ → nhà không nóc, tán xạ 30%";
    }
  } else if (hasTuan && hasTriet) {
    t = w.tBoth;
    tNote = "Tuần+Triệt đồng cung tự tháo";
  } else if (hasTuan || hasTriet) {
    const label = hasTuan ? "Tuần" : "Triệt";
    // Override: ≥3 lục sát HÃM → coi là cung hung bất kể chính tinh sáng.
    const satHam = ctx.filter(
      (c) => SAT_TINH.has(c.base) && brightnessOf(c.star, branch) === "Hãm",
    ).length;
    if (satHam >= w.satHamOverrideCount) {
      t = w.tWeakMajor;
      tNote = `${satHam} lục sát hãm gặp ${label} → override cung hung, phản vi kỳ cách`;
    } else {
      const bright = ownMajors.map((s) => brightnessOf(s, branch));
      const strong = bright.some(
        (b) => b === "Miếu" || b === "Vượng" || b === "Đắc",
      );
      const binh = bright.some((b) => b === "Bình");
      if (strong) {
        t = w.tStrongMajor;
        tNote = `Chính tinh Miếu/Vượng/Đắc gặp ${label} → giảm tốt`;
      } else if (binh) {
        t = w.tBinhMajor;
        tNote = `Chính tinh bình hòa gặp ${label}`;
      } else {
        t = w.tWeakMajor;
        tNote = `Chính tinh hãm gặp ${label} → phản vi kỳ cách`;
      }
    }
  } else if (isVCD) {
    t = w.tVcdPlain;
    tNote = "VCD không Tuần/Triệt án ngữ → nhà không nóc";
  }

  const energy = sum * t;
  if (t !== 1) {
    lines.push({
      source: "Hệ số môi trường",
      points: Math.round((energy - sum) * 10) / 10,
      reason: `${tNote} (×${t})`,
    });
  }

  return { energy, lines };
}

export interface PalaceRadarOptions {
  weights?: RadarWeights;
  school?: School;
}

/**
 * Làm tròn 1 chữ số — helper DUY NHẤT của engine radar.
 * Đối xứng quanh 0: `Math.round` đẩy nửa về +∞ nên -1.75 → -1.7 còn +1.75 →
 * +1.8 (bất đối xứng). Ở đây làm tròn theo trị tuyệt đối rồi trả dấu.
 * Chỉ dùng để HIỂN THỊ — mọi phép cộng dồn đều chạy trên số chưa làm tròn.
 */
const round1 = (v: number) =>
  (v < 0 ? -1 : 1) * (Math.round(Math.abs(v) * 10) / 10);

/** Thang tuyệt đối, mốc cố định — so sánh được giữa các lá số. */
function normalize(raw: number, w: RadarWeights): number {
  const span = w.normMax - w.normMin;
  if (span <= 0) return 50;
  return Math.max(0, Math.min(100, Math.round(((raw - w.normMin) / span) * 100)));
}

/**
 * Vận khí 12 cung cho radar — thang tuyệt đối 0–100 (~45 trung bình, >60 tốt).
 * Sắp từ Mệnh đi thuận.
 */
export function getPalaceStrengths(
  chart: ChartData,
  options: PalaceRadarOptions = {},
): PalaceStrength[] {
  const w = options.weights ?? RADAR_WEIGHTS;
  const elementForStar =
    (options.school ? getEngine(options.school)?.elementForStar : undefined) ??
    (() => "");

  const byBranch = new Map<string, ChartPalace>();
  for (const palace of chart.palaces) byBranch.set(palace.branch, palace);
  const voids = voidTypesByBranch(chart);

  const energies = new Map<string, EnergyResult>();
  for (const palace of chart.palaces) {
    energies.set(
      palace.branch,
      palaceEnergy(chart, palace, byBranch, voids, elementForStar, w),
    );
  }
  const energyOf = (branch: string | undefined) =>
    (branch && energies.get(branch)?.energy) || 0;

  const menhIndex = chart.menhIndex;
  const ordered = [...chart.palaces].sort(
    (a, b) =>
      ((a.index - menhIndex + 12) % 12) - ((b.index - menhIndex + 12) % 12),
  );

  return ordered.map((palace) => {
    const self = energies.get(palace.branch)!;
    const xungBranch = XUNG_CHIEU[palace.branch];
    const hopBranches = (TAM_HOP[palace.branch] ?? []).filter(
      (b) => b !== palace.branch,
    );

    const raw =
      w.wSelf * self.energy +
      w.wXung * energyOf(xungBranch) +
      w.wTamHop * hopBranches.reduce((sum, b) => sum + energyOf(b), 0);
    const score = normalize(raw, w);

    // Rollup tam phương tứ chính — mỗi dòng tính từ nội lực CHƯA làm tròn nên
    // tổng khớp `raw` tuyệt đối, không trôi dạt do cộng dồn số đã làm tròn.
    const breakdown: ScoreLine[] = [
      {
        source: `Bản cung ${palace.name}`,
        points: round1(w.wSelf * self.energy),
        reason: `Bản cung ×${w.wSelf} (nội lực ${round1(self.energy)})`,
      },
    ];
    if (xungBranch) {
      breakdown.push({
        source: `Đối cung ${byBranch.get(xungBranch)?.name ?? xungBranch}`,
        points: round1(w.wXung * energyOf(xungBranch)),
        reason: `Xung chiếu ×${w.wXung} (nội lực ${round1(energyOf(xungBranch))})`,
      });
    }
    for (const b of hopBranches) {
      breakdown.push({
        source: `Tam hợp ${byBranch.get(b)?.name ?? b}`,
        points: round1(w.wTamHop * energyOf(b)),
        reason: `Tam hợp ×${w.wTamHop} (nội lực ${round1(energyOf(b))})`,
      });
    }

    return {
      palace: palace.name,
      score,
      raw: round1(raw),
      detail: self.lines,
      breakdown,
    };
  });
}
