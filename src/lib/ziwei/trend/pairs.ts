/**
 * Detector cách cục cặp sao trên khung hạn (cung hạn + tam phương tứ chính).
 * Hình học: đồng cung > xung chiếu > tam hợp (theo thầy + Bác Kim Hạc).
 */

import type { ChartPalace, ChartStar } from "@/types/chart";
import { baseStarName, isAnnualStar } from "../star-classification";
import {
  geometryLabel,
  getBranchZone,
  isMoBranch,
  pairGeometry,
  pairGeometryFactor,
  type PairGeometry,
} from "./zones";
import {
  HOA_LINH_NAMES,
  KHONG_KIEP_NAMES,
  SAT_TINH_NAMES,
} from "./star-sets";
import type { ScoringWeights } from "./weights";

export interface FrameRow {
  palace: ChartPalace;
  role: "focus" | "tam-hop" | "xung";
}

export interface PairHit {
  id:
    | "longKy"
    | "longHa"
    | "locMa"
    | "vuThamMo"
    | "maSat"
    | "phiHo"
    | "binhHinh"
    | "daoHong"
    | "daoSat"
    | "thaiToa"
    | "quangQuy"
    | "cuKy"
    | "khocHu"
    | "thamHoa"
    | "tamKy"
    | "xuongKhucCuLiem"
    | "xuongKhucNhatNguyet"
    | "tuPhuVuTuong"
    | "satPhaTham"
    | "coNguyetDongLuong";
  geometry: PairGeometry;
  factor: number;
  label: string;
  catPoints: number;
  hungPoints: number;
  kyReliefRatio: number;
  /** Flat hung relief (âm) ngoài longKy ratio. */
  hungRelief: number;
}

interface StarLoc {
  base: string;
  name: string;
  branch: string;
  palaceName: string;
  role: FrameRow["role"];
  star: ChartStar;
}

function collectStars(frame: FrameRow[], includeAnnual: boolean): StarLoc[] {
  const out: StarLoc[] = [];
  for (const { palace, role } of frame) {
    for (const star of palace.stars ?? []) {
      if (!includeAnnual && isAnnualStar(star)) continue;
      out.push({
        base: baseStarName(star.name),
        name: star.name,
        branch: palace.branch,
        palaceName: palace.name,
        role,
        star,
      });
    }
  }
  return out;
}

function isHoaKyStar(star: ChartStar, base: string): boolean {
  if (base === "Hóa Kỵ" || /Hóa Kỵ|Hoa Ky/.test(star.name)) return true;
  if ((star.source ?? "").endsWith("-mutagen") || star.mutagen) {
    return /Kỵ/.test(`${star.name} ${star.mutagen ?? ""}`);
  }
  return false;
}

function isHoaLocStar(star: ChartStar, base: string): boolean {
  if (base === "Hóa Lộc" || /Hóa Lộc/.test(star.name)) return true;
  if ((star.source ?? "").endsWith("-mutagen") || star.mutagen) {
    return /Lộc/.test(`${star.name} ${star.mutagen ?? ""}`) && !/Kỵ/.test(star.name);
  }
  return false;
}

function bestPair(
  left: StarLoc[],
  right: StarLoc[],
  prefer: PairGeometry[],
): { a: StarLoc; b: StarLoc; geometry: PairGeometry } | null {
  let best: { a: StarLoc; b: StarLoc; geometry: PairGeometry } | null = null;
  let bestRank = 99;
  for (const a of left) {
    for (const b of right) {
      const geo = pairGeometry(a.branch, b.branch);
      if (!geo) continue;
      const rank = prefer.indexOf(geo);
      if (rank < 0) continue;
      if (rank < bestRank) {
        bestRank = rank;
        best = { a, b, geometry: geo };
      }
    }
  }
  return best;
}

const GEO_PREF: PairGeometry[] = ["dong", "xung", "tam-hop"];
const GEO_PREF_STRONG: PairGeometry[] = ["dong", "xung"];

/**
 * Phát hiện các cách cục pair trên frame. Mỗi rule tối đa một hit (hình học mạnh nhất).
 */
export function detectPairRules(
  frame: FrameRow[],
  weights: ScoringWeights,
  includeAnnual: boolean,
): PairHit[] {
  const stars = collectStars(frame, includeAnnual);
  const hits: PairHit[] = [];

  const longs = stars.filter((s) => s.base === "Thanh Long");
  const kys = stars.filter((s) => isHoaKyStar(s.star, s.base));
  const luuHas = stars.filter(
    (s) => s.base === "Lưu Hà" || /^Lưu\s+Hà$/.test(s.name) || s.name.includes("Lưu Hà"),
  );
  const locStars = stars.filter(
    (s) => s.base === "Lộc Tồn" || isHoaLocStar(s.star, s.base),
  );
  const mas = stars.filter((s) => s.base === "Thiên Mã" || s.name.includes("Thiên Mã"));
  const vu = stars.filter((s) => s.base === "Vũ Khúc");
  const tham = stars.filter((s) => s.base === "Tham Lang");

  const hoaLinh = stars.filter((s) => s.base === "Hỏa Tinh" || s.base === "Linh Tinh");
  const thamHoa = bestPair(tham, hoaLinh, GEO_PREF);
  if (thamHoa) {
    const factor = pairGeometryFactor(thamHoa.geometry, weights.sanFangFactor);
    hits.push({
      id: "thamHoa",
      geometry: thamHoa.geometry,
      factor,
      label: `Tham Hỏa/Linh ${geometryLabel(thamHoa.geometry)} (${thamHoa.a.palaceName}↔${thamHoa.b.palaceName})`,
      catPoints: Math.round(weights.thamHoaCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: Math.round(weights.lucSat * weights.thamHoaHungReliefRatio * factor),
    });
  }

  const xuongKhuc = stars.filter((s) => s.base === "Văn Xương" || s.base === "Văn Khúc");
  const cuLiem = stars.filter((s) => s.base === "Cự Môn" || s.base === "Liêm Trinh");
  const xuongKhucCuLiem = bestPair(xuongKhuc, cuLiem, GEO_PREF);
  if (xuongKhucCuLiem) {
    const factor = pairGeometryFactor(xuongKhucCuLiem.geometry, weights.sanFangFactor);
    hits.push({
      id: "xuongKhucCuLiem",
      geometry: xuongKhucCuLiem.geometry,
      factor,
      label: `Xương Khúc + Cự/Liêm ${geometryLabel(xuongKhucCuLiem.geometry)} (${xuongKhucCuLiem.a.palaceName}↔${xuongKhucCuLiem.b.palaceName})`,
      catPoints: 0,
      hungPoints: Math.round(weights.xuongKhucCuLiemHung * factor),
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const nhatNguyet = stars.filter((s) => s.base === "Thái Dương" || s.base === "Thái Âm");
  const xuongKhucNhatNguyet = bestPair(xuongKhuc, nhatNguyet, GEO_PREF);
  if (xuongKhucNhatNguyet) {
    const factor = pairGeometryFactor(xuongKhucNhatNguyet.geometry, weights.sanFangFactor);
    hits.push({
      id: "xuongKhucNhatNguyet",
      geometry: xuongKhucNhatNguyet.geometry,
      factor,
      label: `Xương Khúc + Nhật/Nguyệt ${geometryLabel(xuongKhucNhatNguyet.geometry)} (${xuongKhucNhatNguyet.a.palaceName}↔${xuongKhucNhatNguyet.b.palaceName})`,
      catPoints: Math.round(weights.xuongKhucNhatNguyetCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const quyens = stars.filter((s) => s.base === "Hóa Quyền" || (s.star.mutagen && s.star.mutagen.includes("Quyền")));
  const khoas = stars.filter((s) => s.base === "Hóa Khoa" || (s.star.mutagen && s.star.mutagen.includes("Khoa")));
  if (locStars.length > 0 && quyens.length > 0 && khoas.length > 0) {
    hits.push({
      id: "tamKy",
      geometry: "tam-hop",
      factor: 1,
      label: `Tam Kỳ Gia Hội (Lộc Quyền Khoa)`,
      catPoints: weights.tamKyCat,
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Tử Phủ Vũ Tướng
  const tuVi = stars.filter((s) => s.base === "Tử Vi");
  const thienPhu = stars.filter((s) => s.base === "Thiên Phủ");
  const thienTuong = stars.filter((s) => s.base === "Thiên Tướng");
  if (tuVi.length && thienPhu.length && vu.length && thienTuong.length) {
    hits.push({
      id: "tuPhuVuTuong",
      geometry: "tam-hop",
      factor: 1,
      label: `Tử Phủ Vũ Tướng hội tụ`,
      catPoints: weights.tuPhuVuTuongCat,
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Sát Phá Tham
  const thatSat = stars.filter((s) => s.base === "Thất Sát");
  const phaQuan = stars.filter((s) => s.base === "Phá Quân");
  if (thatSat.length && phaQuan.length && tham.length) {
    hits.push({
      id: "satPhaTham",
      geometry: "tam-hop",
      factor: 1,
      label: `Sát Phá Tham hội tụ`,
      catPoints: weights.satPhaThamCat,
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Cơ Nguyệt Đồng Lương
  const thienCo = stars.filter((s) => s.base === "Thiên Cơ");
  const thaiAm = stars.filter((s) => s.base === "Thái Âm");
  const thienDong = stars.filter((s) => s.base === "Thiên Đồng");
  const thienLuong = stars.filter((s) => s.base === "Thiên Lương");
  if (thienCo.length && thaiAm.length && thienDong.length && thienLuong.length) {
    hits.push({
      id: "coNguyetDongLuong",
      geometry: "tam-hop",
      factor: 1,
      label: `Cơ Nguyệt Đồng Lương hội tụ`,
      catPoints: weights.coNguyetDongLuongCat,
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const longKy = bestPair(longs, kys, GEO_PREF);
  if (longKy) {
    const factor = pairGeometryFactor(longKy.geometry, weights.sanFangFactor);
    hits.push({
      id: "longKy",
      geometry: longKy.geometry,
      factor,
      label: `Thanh Long–Hóa Kỵ ${geometryLabel(longKy.geometry)} (${longKy.a.palaceName}↔${longKy.b.palaceName})`,
      catPoints: Math.round(weights.longKyCat * factor),
      hungPoints: 0,
      kyReliefRatio: weights.longKyHungRelief * factor,
      hungRelief: 0,
    });
  }

  // Cự Kỵ: Cự Môn (ám tinh chủ) + Hóa Kỵ — "ám thượng gia ám", tăng thị phi/khẩu thiệt.
  const cuMon = stars.filter((s) => s.base === "Cự Môn");
  const cuKy = bestPair(cuMon, kys, GEO_PREF);
  if (cuKy) {
    const factor = pairGeometryFactor(cuKy.geometry, weights.sanFangFactor);
    hits.push({
      id: "cuKy",
      geometry: cuKy.geometry,
      factor,
      label: `Cự Môn–Hóa Kỵ ${geometryLabel(cuKy.geometry)} (${cuKy.a.palaceName}↔${cuKy.b.palaceName}) — ám thượng gia ám`,
      catPoints: 0,
      hungPoints: Math.round(weights.cuKyHung * factor),
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const longHa = bestPair(longs, luuHas, GEO_PREF_STRONG);
  if (longHa) {
    const factor = pairGeometryFactor(longHa.geometry, weights.sanFangFactor);
    hits.push({
      id: "longHa",
      geometry: longHa.geometry,
      factor,
      label: `Thanh Long–Lưu Hà ${geometryLabel(longHa.geometry)} (${longHa.a.palaceName}↔${longHa.b.palaceName})`,
      catPoints: Math.round(weights.longHaCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const locMa = bestPair(locStars, mas, GEO_PREF);
  if (locMa) {
    const factor = pairGeometryFactor(locMa.geometry, weights.sanFangFactor);
    hits.push({
      id: "locMa",
      geometry: locMa.geometry,
      factor,
      label: `Lộc Mã ${geometryLabel(locMa.geometry)} (${locMa.a.palaceName}↔${locMa.b.palaceName})`,
      catPoints: Math.round(weights.locMaCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Vũ + Tham trong khung, ít nhất một trên chi mộ
  const vuTham = bestPair(vu, tham, GEO_PREF);
  if (
    vuTham &&
    (isMoBranch(vuTham.a.branch) || isMoBranch(vuTham.b.branch))
  ) {
    const factor = pairGeometryFactor(vuTham.geometry, weights.sanFangFactor);
    const bothMo =
      isMoBranch(vuTham.a.branch) && isMoBranch(vuTham.b.branch);
    const boost = bothMo && vuTham.geometry === "dong" ? 1 : 0.85;
    hits.push({
      id: "vuThamMo",
      geometry: vuTham.geometry,
      factor,
      label: `Vũ Tham mộ ${geometryLabel(vuTham.geometry)} (${vuTham.a.palaceName}↔${vuTham.b.palaceName})`,
      catPoints: Math.round(weights.vuThamMoCat * factor * boost),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const phi = stars.filter((s) => s.base === "Phi Liêm");
  const bachHo = stars.filter((s) => s.base === "Bạch Hổ");
  const phiHo = bestPair(phi, bachHo, GEO_PREF_STRONG);
  if (phiHo) {
    const factor = pairGeometryFactor(phiHo.geometry, weights.sanFangFactor);
    hits.push({
      id: "phiHo",
      geometry: phiHo.geometry,
      factor,
      label: `Phi Liêm–Bạch Hổ ${geometryLabel(phiHo.geometry)} (${phiHo.a.palaceName}↔${phiHo.b.palaceName})`,
      catPoints: Math.round(weights.phiHoCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: -Math.round(weights.phiHoHungRelief * factor),
    });
  }

  const phucBinh = stars.filter((s) => s.base === "Phục Binh");
  const hinh = stars.filter((s) => s.base === "Thiên Hình");
  const binhHinh = bestPair(phucBinh, hinh, GEO_PREF_STRONG);
  if (binhHinh) {
    const factor = pairGeometryFactor(binhHinh.geometry, weights.sanFangFactor);
    hits.push({
      id: "binhHinh",
      geometry: binhHinh.geometry,
      factor,
      label: `Phục Binh–Thiên Hình ${geometryLabel(binhHinh.geometry)} (${binhHinh.a.palaceName}↔${binhHinh.b.palaceName})`,
      catPoints: Math.round(weights.binhHinhCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: -Math.round(weights.binhHinhHungRelief * factor),
    });
  }

  const dao = stars.filter((s) => s.base === "Đào Hoa");
  const hong = stars.filter((s) => s.base === "Hồng Loan");
  const hy = stars.filter(
    (s) => s.base === "Thiên Hỷ" || s.base === "Thiên Hỉ",
  );
  const daoHong = bestPair(dao, hong, GEO_PREF_STRONG);
  const daoHy = bestPair(dao, hy, GEO_PREF_STRONG);
  const daoPair = daoHong ?? daoHy;
  if (daoPair) {
    const factor = pairGeometryFactor(daoPair.geometry, weights.sanFangFactor);
    hits.push({
      id: "daoHong",
      geometry: daoPair.geometry,
      factor,
      label: `Đào–Hồng/Hỷ ${geometryLabel(daoPair.geometry)} (${daoPair.a.palaceName}↔${daoPair.b.palaceName})`,
      catPoints: Math.round(weights.daoHongCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Khốc–Hư: cặp cố định xung chiếu nhau — giao hội nhấn thêm mất mát/u uất.
  const khoc = stars.filter((s) => s.base === "Thiên Khốc");
  const hu = stars.filter((s) => s.base === "Thiên Hư");
  const khocHu = bestPair(khoc, hu, GEO_PREF_STRONG);
  if (khocHu) {
    const factor = pairGeometryFactor(khocHu.geometry, weights.sanFangFactor);
    hits.push({
      id: "khocHu",
      geometry: khocHu.geometry,
      factor,
      label: `Thiên Khốc–Thiên Hư ${geometryLabel(khocHu.geometry)} (${khocHu.a.palaceName}↔${khocHu.b.palaceName})`,
      catPoints: 0,
      hungPoints: Math.round(weights.khocHuHung * factor),
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Đào sát: Đào Hoa đồng cung lục sát
  const satSet = new Set<string>(SAT_TINH_NAMES);
  for (const d of dao) {
    const samePalaceSats = stars.filter(
      (s) => s.branch === d.branch && satSet.has(s.base),
    );
    if (samePalaceSats.length) {
      hits.push({
        id: "daoSat",
        geometry: "dong",
        factor: 1,
        label: `Đào sát đồng cung ${d.palaceName} (${d.branch})`,
        catPoints: 0,
        hungPoints: weights.daoSatHung,
        kyReliefRatio: 0,
        hungRelief: 0,
      });
      break;
    }
  }

  const tamThai = stars.filter((s) => s.base === "Tam Thai");
  const batToa = stars.filter((s) => s.base === "Bát Tọa");
  const thaiToa = bestPair(tamThai, batToa, GEO_PREF);
  if (thaiToa) {
    const factor = pairGeometryFactor(thaiToa.geometry, weights.sanFangFactor);
    hits.push({
      id: "thaiToa",
      geometry: thaiToa.geometry,
      factor,
      label: `Thai Tọa ${geometryLabel(thaiToa.geometry)} (${thaiToa.a.palaceName}↔${thaiToa.b.palaceName})`,
      catPoints: Math.round(weights.thaiToaPairCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  const anQuang = stars.filter((s) => s.base === "Ân Quang");
  const thienQuy = stars.filter((s) => s.base === "Thiên Quý");
  const quangQuy = bestPair(anQuang, thienQuy, GEO_PREF);
  if (quangQuy) {
    const factor = pairGeometryFactor(quangQuy.geometry, weights.sanFangFactor);
    hits.push({
      id: "quangQuy",
      geometry: quangQuy.geometry,
      factor,
      label: `Quang Quý ${geometryLabel(quangQuy.geometry)} (${quangQuy.a.palaceName}↔${quangQuy.b.palaceName})`,
      catPoints: Math.round(weights.quangQuyPairCat * factor),
      hungPoints: 0,
      kyReliefRatio: 0,
      hungRelief: 0,
    });
  }

  // Chiết mã: Thiên Mã + sát (Hỏa/Linh/Không/Kiếp) đồng cung hạn
  const focus = frame.find((row) => row.role === "focus");
  if (focus) {
    const focusStars = focus.palace.stars ?? [];
    const hasMa = focusStars.some(
      (s) => baseStarName(s.name) === "Thiên Mã" || s.name.includes("Thiên Mã"),
    );
    const satNames = new Set<string>([
      ...HOA_LINH_NAMES,
      ...KHONG_KIEP_NAMES,
    ]);
    const hasSat = focusStars.some((s) => satNames.has(baseStarName(s.name)));
    if (hasMa && hasSat && getBranchZone(focus.palace.branch) === "ma") {
      hits.push({
        id: "maSat",
        geometry: "dong",
        factor: 1,
        label: `Chiết mã tại cung hạn ${focus.palace.name} (${focus.palace.branch})`,
        catPoints: 0,
        hungPoints: weights.maSatHung,
        kyReliefRatio: 0,
        hungRelief: 0,
      });
    }
  }

  return hits;
}
