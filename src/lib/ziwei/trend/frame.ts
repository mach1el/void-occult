/** Chấm một khung hạn = cung hạn + tam phương tứ chính. */

import type {
  ChartData,
  ChartPalace,
  MutagenRecord,
} from "@/types/chart";
import {
  getBranchZone,
  isMaBranch,
  isMoBranch,
  TAM_HOP,
  XUNG_CHIEU,
  zoneLabel,
} from "./zones";
import { detectPairRules } from "./pairs";
import {
  baseStarName,
  isAnnualStar,
  isStrongBrightness,
} from "../star-classification";
import {
  BAC_SI_CAT_SET,
  BAC_SI_HUNG_SET,
  CAT_SET,
  CO_QUA_SET,
  DAO_HONG_HY_SET,
  DUC_SET,
  GIAI_SET,
  HINH_RIEU_SET,
  KINH_DA_SET,
  KHONG_KIEP_SET,
  LONG_PHUONG_SET,
  PHA_TOAI_SET,
  PHU_CAO_SET,
  QUAN_AN_SET,
  QUANG_QUY_SET,
  SAT_SET,
  SONG_HAO_DAC_SET,
  SONG_HAO_SET,
  TAI_TUE_HUNG_SET,
  TAI_TUE_PRESS_SET,
  TAI_TUE_SOFT_SET,
  THAI_TOA_SET,
  THIEN_TAI_THO_SET,
  TRUONG_SINH_CAT_SET,
  TRUONG_SINH_SUY_SET,
} from "./star-sets";
import type { ScoringWeights } from "./weights";
import type { ScoreLine, TrendPoint } from "./types";
import {
  finalizeLayer,
  isMutagenStar,
  mutagenKind,
  voidBranches,
} from "./util";

function scalePoints(points: number, factor: number): number {
  return Math.round(points * factor);
}

function sanFangSiZheng(
  chart: ChartData,
  focus: ChartPalace,
): Array<{ palace: ChartPalace; role: "focus" | "tam-hop" | "xung" }> {
  const hop = new Set(TAM_HOP[focus.branch] ?? [focus.branch]);
  const xung = XUNG_CHIEU[focus.branch];
  const rows: Array<{ palace: ChartPalace; role: "focus" | "tam-hop" | "xung" }> =
    [];

  for (const palace of chart.palaces) {
    if (palace.index === focus.index) {
      rows.push({ palace, role: "focus" });
    } else if (xung && palace.branch === xung) {
      rows.push({ palace, role: "xung" });
    } else if (hop.has(palace.branch)) {
      rows.push({ palace, role: "tam-hop" });
    }
  }
  return rows;
}

function roleFactor(role: "focus" | "tam-hop" | "xung", weights: ScoringWeights): number {
  return role === "focus" ? 1 : weights.sanFangFactor;
}

function roleLabel(role: "focus" | "tam-hop" | "xung", palace: ChartPalace): string {
  if (role === "focus") return `cung hạn ${palace.name}`;
  if (role === "xung") return `xung chiếu ${palace.name}`;
  return `tam hợp ${palace.name}`;
}

/** Hệ số vùng cho Tứ Hóa cát (Lộc/Quyền/Khoa) — hạn chế ở mộ. */
function tuHoaCatZoneFactor(branch: string, weights: ScoringWeights): number {
  return isMoBranch(branch) ? weights.hoaLocMoFactor : 1;
}

/** Hệ số vùng cho Hóa Kỵ — đắc mộ (giảm hung). */
function hoaKyZoneFactor(branch: string, weights: ScoringWeights): number {
  return isMoBranch(branch) ? weights.hoaKyMoFactor : 1;
}

/** Hệ số vùng cho lục sát không brightness (Kình/Đà/Không/Kiếp). */
function satZoneFactor(base: string, branch: string, weights: ScoringWeights): number {
  if (KINH_DA_SET.has(base)) {
    if (isMoBranch(branch)) return weights.kinhDaMoFactor;
    if (isMaBranch(branch)) return weights.kinhDaMaFactor;
  }
  if (KHONG_KIEP_SET.has(base) && isMaBranch(branch)) {
    return weights.khongKiepMaFactor;
  }
  return 1;
}

function zoneNote(branch: string): string {
  const zone = getBranchZone(branch);
  return zone ? ` · ${zoneLabel(zone)}` : "";
}

/**
 * Phụ tinh / tạp diệu "rời rạc" (phase 2/3), cả hai lớp Cát và Hung — Thai
 * Tọa, Quang Quý, Phụ Cáo, Quốc Ấn, Giải tinh, Long Phượng, Thiên Tài/Thọ,
 * Bác Sĩ cát, Đào/Hồng/Hỷ, Đức, Hoa Cái, Thái Tuế mềm, Trường Sinh cát;
 * Bác Sĩ hung, Song Hao, Phi Liêm, Thái Tuế áp, Thái Tuế hung, Trường Sinh
 * suy/Mộc Dục, Đẩu Quân, Lưu Hà, Hình/Riêu, Cô Quả, Phá/La Võng/Kiếp. Một
 * sao lẻ ở tam hợp xa KHÔNG tự cộng điểm nữa — chỉ tính khi nằm đúng cung
 * hạn chính, hoặc khi ≥2 sao cùng nhóm cùng hội trong khung tam phương tứ
 * chính. Trước đây mỗi sao cộng điểm vô điều kiện nên cả Cát lẫn Hung gần
 * như luôn kịch trần 100 (đo thực tế trên ~2700 khung: Cát 60%, Hung 67%
 * số mốc dính trần).
 *
 * Bác Sĩ / Thái Tuế (áp + mềm + hung) / Trường Sinh / Song Hao / Phi Liêm
 * là các vòng 12 vị trí phủ TẤT CẢ 12 cung; Thiên La·Địa Võng (trong
 * PHA_TOAI_SET) và Đẩu Quân/Lưu Hà cố định theo chi năm, không phụ thuộc
 * lá số. Khung 4 cung nào cũng gần như chắc chắn dính các vị trí này dù
 * không có tín hiệu thật (nhiễu cấu trúc, không phải hội tụ) — đo thực tế
 * trung bình 1 lượt/khung dù lá số nào cũng vậy. Ngoại lệ cluster không áp
 * dụng cho các nhóm này — chỉ tính khi đúng cung hạn chính.
 */
type LooseLayer = "cat" | "hung";

type LooseCategory =
  | "bacSiCat"
  | "daoHongHyCat"
  | "ducCat"
  | "hoaCaiCat"
  | "thaiToaCat"
  | "quangQuyCat"
  | "phuCaoCat"
  | "quanAnCat"
  | "giaiCat"
  | "longPhuongCat"
  | "thienTaiThoCat"
  | "taiTueSoftCat"
  | "truongSinhCat"
  | "bacSiHung"
  | "songHaoHung"
  | "phiLiemHung"
  | "taiTuePressHung"
  | "taiTueHung"
  | "truongSinhSuyHung"
  | "mocDucHung"
  | "dauQuanHung"
  | "luuHaHung"
  | "phaToaiHung"
  | "hinhRieuHung"
  | "coQuaHung"
  | "thienSuHung"
  | "thienThuongHung";

/**
 * Ngưỡng cluster mặc định là 2. `Infinity` = chỉ tính khi đúng cung hạn
 * chính, không có ngoại lệ cluster (dùng cho các vòng 12 vị trí, và cho
 * ducCat/daoHongHyCat — 2 sao trong mỗi nhóm này luôn đi cùng nhau theo
 * quy tắc an sao cổ điển: Long Đức·Phúc Đức là 2 vị trí của vòng Thái Tuế;
 * Hồng Loan·Thiên Hỷ luôn xung chiếu nhau nên hễ 1 sao vào khung thì sao
 * kia gần như chắc chắn cũng vào — "cluster ≥2" bị vô hiệu hóa vì luôn
 * đúng, không phải tín hiệu hội tụ thật). quanAnCat có 5 sao thay vì 2 nên
 * ngưỡng 2 quá dễ đạt do hiệu ứng birthday-paradox — nâng lên 3.
 *
 * thienSuHung/thienThuongHung: Thiên Sứ cố định tại Tật Ách, Thiên Thương cố
 * định tại Nô Bộc trong MỌI lá số (không đổi theo giờ/ngày sinh) — mỗi sao
 * chỉ có đúng 1 vị trí trong cả lá số, giống Đẩu Quân/Lưu Hà, nên cũng
 * focus-only thay vì cluster.
 */
const LOOSE_CLUSTER_THRESHOLD: Partial<Record<LooseCategory, number>> = {
  bacSiCat: Infinity,
  taiTueSoftCat: Infinity,
  truongSinhCat: Infinity,
  ducCat: Infinity,
  daoHongHyCat: Infinity,
  bacSiHung: Infinity,
  songHaoHung: Infinity,
  phiLiemHung: Infinity,
  taiTuePressHung: Infinity,
  taiTueHung: Infinity,
  truongSinhSuyHung: Infinity,
  mocDucHung: Infinity,
  dauQuanHung: Infinity,
  luuHaHung: Infinity,
  phaToaiHung: Infinity,
  thienSuHung: Infinity,
  thienThuongHung: Infinity,
  quanAnCat: 3,
};

interface LooseCandidate {
  category: LooseCategory;
  layer: LooseLayer;
  isFocus: boolean;
  line: ScoreLine;
}

function resolveLoose(candidates: LooseCandidate[], layer: LooseLayer): ScoreLine[] {
  const layerCandidates = candidates.filter((candidate) => candidate.layer === layer);
  const counts = new Map<LooseCategory, number>();
  for (const candidate of layerCandidates) {
    counts.set(candidate.category, (counts.get(candidate.category) ?? 0) + 1);
  }
  return layerCandidates
    .filter((candidate) => {
      if (candidate.isFocus) return true;
      const threshold = LOOSE_CLUSTER_THRESHOLD[candidate.category] ?? 2;
      return (counts.get(candidate.category) ?? 0) >= threshold;
    })
    .map((candidate) => candidate.line);
}

export interface FrameScoreOptions {
  /**
   * Có tính sao lưu niên (source "annual" / "annual-mutagen") không.
   * - Lưu niên tháng: true — sao lưu chính là tín hiệu của năm/tháng xem.
   * - Đại vận: false — đại hạn đo bằng chính tinh + Tứ Hóa gốc/ĐV trên tam
   *   phương tứ chính, KHÔNG lấy sao lưu niên (sao lưu chỉ thuộc về lưu niên).
   */
  includeAnnual: boolean;
}

export function scoreFortuneFrame(
  chart: ChartData,
  focus: ChartPalace,
  weights: ScoringWeights,
  mutagenSources: Array<{ label: string; records: MutagenRecord[] | undefined }>,
  options: FrameScoreOptions,
): Pick<TrendPoint, "cat" | "hung" | "breakdown"> {
  const { includeAnnual } = options;
  const cat: ScoreLine[] = [];
  const hung: ScoreLine[] = [];
  const loose: LooseCandidate[] = [];
  const voids = voidBranches(chart);
  const frame = sanFangSiZheng(chart, focus);
  let kyInFrame = false;
  let satInFrame = 0;
  let satOnFocus = 0;
  let kyHungPoints = 0;

  for (const { palace, role } of frame) {
    const factor = roleFactor(role, weights);
    const where = roleLabel(role, palace);
    const stars = (palace.stars ?? []).filter(
      (star) => includeAnnual || !isAnnualStar(star),
    );

    for (const star of stars) {
      const base = baseStarName(star.name);

      if (isMutagenStar(star)) {
        const kind = mutagenKind(star);
        if (kind === "Lộc") {
          const z = tuHoaCatZoneFactor(palace.branch, weights);
          cat.push({
            source: star.name,
            points: scalePoints(weights.hoaLoc, factor * z),
            reason: `${star.name} tại ${where}${zoneNote(palace.branch)}`,
          });
        } else if (kind === "Quyền") {
          const z = tuHoaCatZoneFactor(palace.branch, weights);
          cat.push({
            source: star.name,
            points: scalePoints(weights.hoaQuyen, factor * z),
            reason: `${star.name} tại ${where}${zoneNote(palace.branch)}`,
          });
        } else if (kind === "Khoa") {
          const z = tuHoaCatZoneFactor(palace.branch, weights);
          cat.push({
            source: star.name,
            points: scalePoints(weights.hoaKhoa, factor * z),
            reason: `${star.name} tại ${where}${zoneNote(palace.branch)}`,
          });
        } else if (kind === "Kỵ") {
          kyInFrame = true;
          const z = hoaKyZoneFactor(palace.branch, weights);
          const points = scalePoints(weights.hoaKy, factor * z);
          kyHungPoints += points;
          hung.push({
            source: star.name,
            points,
            reason: `${star.name} tại ${where}${zoneNote(palace.branch)}`,
          });
        }
      }

      if (CAT_SET.has(base)) {
        cat.push({
          source: star.name,
          points: scalePoints(weights.lucCat, factor),
          reason: `Cát tinh ${star.name} hội ${where}`,
        });
      }

      if (base === "Thanh Long" && isMoBranch(palace.branch)) {
        cat.push({
          source: star.name,
          points: scalePoints(weights.thanhLongMoBonus, factor),
          reason: `Thanh Long đắc ${zoneLabel("mo")} tại ${where}`,
        });
      }

      if (BAC_SI_CAT_SET.has(base)) {
        loose.push({
          category: "bacSiCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.bacSiCat, factor),
            reason: `Bác Sĩ cát ${star.name} tại ${where}`,
          },
        });
      }

      if (base === "Phi Liêm") {
        loose.push({
          category: "phiLiemHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.phiLiemHung, factor),
            reason: `Phi Liêm (động/thị phi) tại ${where}`,
          },
        });
      }

      if (BAC_SI_HUNG_SET.has(base)) {
        loose.push({
          category: "bacSiHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.bacSiHung, factor),
            reason: `Bác Sĩ hung ${star.name} tại ${where}`,
          },
        });
      }

      if (SONG_HAO_SET.has(base)) {
        const dac = SONG_HAO_DAC_SET.has(palace.branch);
        const z = dac ? weights.songHaoDacFactor : 1;
        loose.push({
          category: "songHaoHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.songHaoHung, factor * z),
            reason: `Song Hao ${star.name} tại ${where}${dac ? " · đắc (giảm hung)" : ""}`,
          },
        });
        if (dac) {
          cat.push({
            source: star.name,
            points: scalePoints(weights.songHaoDacCat, factor),
            reason: `Song Hao đắc ${palace.branch} (Chúng Thủy / luân chuyển) tại ${where}`,
          });
        }
      }

      if (DAO_HONG_HY_SET.has(base)) {
        loose.push({
          category: "daoHongHyCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.daoHongHyCat, factor),
            reason: `Đào/Hồng/Hỷ ${star.name} tại ${where}`,
          },
        });
      }

      if (CO_QUA_SET.has(base)) {
        loose.push({
          category: "coQuaHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.coQuaHung, factor),
            reason: `Cô Quả ${star.name} tại ${where}${zoneNote(palace.branch)}`,
          },
        });
      }

      if (DUC_SET.has(base)) {
        loose.push({
          category: "ducCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.ducCat, factor),
            reason: `Đức tinh ${star.name} tại ${where}`,
          },
        });
      }

      if (HINH_RIEU_SET.has(base)) {
        const z = isMaBranch(palace.branch) ? 1.15 : 1;
        loose.push({
          category: "hinhRieuHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.hinhRieuHung, factor * z),
            reason: `Hình/Riêu ${star.name} tại ${where}${zoneNote(palace.branch)}`,
          },
        });
      }

      if (base === "Hoa Cái") {
        const z = isMoBranch(palace.branch) ? 1.15 : 1;
        loose.push({
          category: "hoaCaiCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.hoaCaiCat, factor * z),
            reason: `Hoa Cái tại ${where}${zoneNote(palace.branch)}`,
          },
        });
      }

      if (PHA_TOAI_SET.has(base)) {
        loose.push({
          category: "phaToaiHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.phaToaiHung, factor),
            reason: `Phá/La Võng/Kiếp ${star.name} tại ${where}`,
          },
        });
      }

      if (THAI_TOA_SET.has(base)) {
        loose.push({
          category: "thaiToaCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.thaiToaCat, factor),
            reason: `Thai Tọa ${star.name} tại ${where}`,
          },
        });
      }

      if (QUANG_QUY_SET.has(base)) {
        loose.push({
          category: "quangQuyCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.quangQuyCat, factor),
            reason: `Quang Quý ${star.name} tại ${where}`,
          },
        });
      }

      if (PHU_CAO_SET.has(base)) {
        loose.push({
          category: "phuCaoCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.phuCaoCat, factor),
            reason: `Phụ Cáo ${star.name} tại ${where}`,
          },
        });
      }

      if (QUAN_AN_SET.has(base)) {
        loose.push({
          category: "quanAnCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.quanAnCat, factor),
            reason: `Quan Ấn/Phù/Trù ${star.name} tại ${where}`,
          },
        });
      }

      if (GIAI_SET.has(base)) {
        loose.push({
          category: "giaiCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.giaiCat, factor),
            reason: `Giải tinh ${star.name} tại ${where}`,
          },
        });
      }

      if (LONG_PHUONG_SET.has(base)) {
        loose.push({
          category: "longPhuongCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.longPhuongCat, factor),
            reason: `Long Phượng ${star.name} tại ${where}`,
          },
        });
      }

      if (THIEN_TAI_THO_SET.has(base)) {
        loose.push({
          category: "thienTaiThoCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.thienTaiThoCat, factor),
            reason: `${star.name} tại ${where}`,
          },
        });
      }

      if (base === "Lưu Hà") {
        loose.push({
          category: "luuHaHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.luuHaHung, factor),
            reason: `Lưu Hà tại ${where}`,
          },
        });
      }

      if (base === "Đẩu Quân") {
        loose.push({
          category: "dauQuanHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.dauQuanHung, factor),
            reason: `Đẩu Quân tại ${where}`,
          },
        });
      }

      if (base === "Thiên Sứ") {
        loose.push({
          category: "thienSuHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.thienSuHung, factor),
            reason: `Thiên Sứ (bệnh tật) tại ${where}`,
          },
        });
      }

      if (base === "Thiên Thương") {
        loose.push({
          category: "thienThuongHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.thienThuongHung, factor),
            reason: `Thiên Thương (tổn hại) tại ${where}`,
          },
        });
      }

      if (TAI_TUE_PRESS_SET.has(base)) {
        loose.push({
          category: "taiTuePressHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.taiTuePressHung, factor),
            reason: `Thái Tuế áp ${star.name} tại ${where}`,
          },
        });
      }

      if (TAI_TUE_SOFT_SET.has(base)) {
        loose.push({
          category: "taiTueSoftCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.taiTueSoftCat, factor),
            reason: `Thái Tuế mềm ${star.name} tại ${where}`,
          },
        });
      }

      if (SAT_SET.has(base)) {
        satInFrame += 1;
        if (role === "focus") satOnFocus += 1;
        const z = satZoneFactor(base, palace.branch, weights);
        hung.push({
          source: star.name,
          points: scalePoints(weights.lucSat, factor * z),
          reason: `Sát tinh ${star.name} hội ${where}${zoneNote(palace.branch)}`,
        });
      }

      if (TAI_TUE_HUNG_SET.has(base)) {
        const z = isMaBranch(palace.branch) ? weights.taiTueHungMaFactor : 1;
        loose.push({
          category: "taiTueHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: star.name,
            points: scalePoints(weights.taiTueHung, factor * z),
            reason: `Thái Tuế hung ${star.name} tại ${where}${zoneNote(palace.branch)}`,
          },
        });
      }

      if (star.layer === "major") {
        if (isStrongBrightness(star.brightness)) {
          cat.push({
            source: star.name,
            points: scalePoints(weights.majorMieuVuong, factor),
            reason: `Chính tinh ${star.name} ${star.brightness} tại ${where}`,
          });
        } else if (star.brightness === "Hãm") {
          hung.push({
            source: star.name,
            points: scalePoints(weights.majorHam, factor),
            reason: `Chính tinh ${star.name} Hãm tại ${where}`,
          });
        }
      }
    }

    if (voids.has(palace.branch)) {
      hung.push({
        source: "Tuần/Triệt",
        points: scalePoints(weights.tuanTriet, factor),
        reason: `Tuần/Triệt án ngữ ${where} (${palace.branch})`,
      });
    }

    const cs = palace.changSheng;
    if (cs) {
      if (TRUONG_SINH_CAT_SET.has(cs)) {
        loose.push({
          category: "truongSinhCat",
          layer: "cat",
          isFocus: role === "focus",
          line: {
            source: `Trường Sinh·${cs}`,
            points: scalePoints(weights.truongSinhCat, factor),
            reason: `${cs} tại ${where}`,
          },
        });
      } else if (cs === "Mộc Dục") {
        loose.push({
          category: "mocDucHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: `Trường Sinh·${cs}`,
            points: scalePoints(weights.mocDucHung, factor),
            reason: `Mộc Dục (bại địa) tại ${where}`,
          },
        });
      } else if (TRUONG_SINH_SUY_SET.has(cs)) {
        loose.push({
          category: "truongSinhSuyHung",
          layer: "hung",
          isFocus: role === "focus",
          line: {
            source: `Trường Sinh·${cs}`,
            points: scalePoints(weights.truongSinhSuyHung, factor),
            reason: `${cs} tại ${where}`,
          },
        });
      } else if (cs === "Mộ" && role === "focus") {
        cat.push({
          source: `Trường Sinh·${cs}`,
          points: weights.moChangSinhCat,
          reason: `Mộ (tụ khí) tại cung hạn ${palace.name}`,
        });
      }
    }
  }

  if (satOnFocus >= 2) {
    hung.push({
      source: "Trùng sát",
      points: weights.satCluster,
      reason: `${satOnFocus} sát tinh đồng cung hạn`,
    });
  }

  if (kyInFrame && satInFrame >= 1) {
    hung.push({
      source: "Kỵ–sát kích",
      points: weights.kySatCluster,
      reason: "Hóa Kỵ gặp sát trong tam phương tứ chính",
    });
  }

  for (const { label, records } of mutagenSources) {
    for (const record of records ?? []) {
      const palace = record.palace;
      if (!palace) continue;
      const hit = frame.find((row) => row.palace.index === palace.index);
      if (!hit) continue;
      const factor = roleFactor(hit.role, weights);
      const where = roleLabel(hit.role, palace);
      const kind = record.mutagen.includes("Kỵ")
        ? "Kỵ"
        : record.mutagen.includes("Lộc")
          ? "Lộc"
          : record.mutagen.includes("Quyền")
            ? "Quyền"
            : record.mutagen.includes("Khoa")
              ? "Khoa"
              : null;
      if (!kind) continue;

      const already =
        kind === "Kỵ"
          ? hung.some((line) => line.source.includes("Kỵ") && line.reason.includes(palace.name))
          : cat.some((line) => line.source.includes(kind) && line.reason.includes(palace.name));
      if (already) continue;

      if (kind === "Kỵ") {
        kyInFrame = true;
        const z = hoaKyZoneFactor(palace.branch, weights);
        const points = scalePoints(weights.hoaKy, factor * z);
        kyHungPoints += points;
        hung.push({
          source: `${label} Hóa Kỵ`,
          points,
          reason: `${label} Hóa Kỵ→${record.starName} tại ${where}${zoneNote(palace.branch)}`,
        });
      } else if (kind === "Lộc") {
        const z = tuHoaCatZoneFactor(palace.branch, weights);
        cat.push({
          source: `${label} Hóa Lộc`,
          points: scalePoints(weights.hoaLoc, factor * z),
          reason: `${label} Hóa Lộc→${record.starName} tại ${where}${zoneNote(palace.branch)}`,
        });
      } else if (kind === "Quyền") {
        const z = tuHoaCatZoneFactor(palace.branch, weights);
        cat.push({
          source: `${label} Hóa Quyền`,
          points: scalePoints(weights.hoaQuyen, factor * z),
          reason: `${label} Hóa Quyền→${record.starName} tại ${where}${zoneNote(palace.branch)}`,
        });
      } else {
        const z = tuHoaCatZoneFactor(palace.branch, weights);
        cat.push({
          source: `${label} Hóa Khoa`,
          points: scalePoints(weights.hoaKhoa, factor * z),
          reason: `${label} Hóa Khoa→${record.starName} tại ${where}${zoneNote(palace.branch)}`,
        });
      }
    }
  }

  const pairs = detectPairRules(frame, weights, includeAnnual);
  for (const pair of pairs) {
    if (pair.catPoints) {
      cat.push({
        source: `Cách ${pair.id}`,
        points: pair.catPoints,
        reason: pair.label,
      });
    }
    if (pair.hungPoints) {
      hung.push({
        source: `Cách ${pair.id}`,
        points: pair.hungPoints,
        reason: pair.label,
      });
    }
    if (pair.hungRelief) {
      hung.push({
        source: `Hóa giải ${pair.id}`,
        points: pair.hungRelief,
        reason: `Giảm hung nhờ ${pair.label}`,
      });
    }
    if (pair.id === "longKy" && pair.kyReliefRatio > 0 && kyHungPoints > 0) {
      const relief = -Math.round(kyHungPoints * pair.kyReliefRatio);
      hung.push({
        source: "Long–Kỵ hóa giải",
        points: relief,
        reason: `Giảm hung Kỵ nhờ ${pair.label}`,
      });
    }
  }

  const catLayer = finalizeLayer([...cat, ...resolveLoose(loose, "cat")]);
  const hungLayer = finalizeLayer([...hung, ...resolveLoose(loose, "hung")]);
  return {
    cat: catLayer.score,
    hung: hungLayer.score,
    breakdown: { cat: catLayer.lines, hung: hungLayer.lines },
  };
}

/**
 * Xu hướng Đại Vận: một điểm / cung có majorFortune.
 * Cung hạn = cung mang đại vận đó; chấm theo **tam phương tứ chính**
 * (cung hạn + 2 tam hợp + xung chiếu) qua `scoreFortuneFrame`.
 */

