/**
 * Trọng số chấm điểm xu hướng Tử Vi — lớp Cát / Hung (heuristic theo phái).
 *
 * KHÔNG phải chân lý. Scorer chỉ đọc bảng này. Toàn bộ đưa vào PR
 * `## Cần thầy duyệt`.
 *
 * Nguồn tham chiếu (không copy nguyên văn một giáo trình):
 * - Quan hệ Mệnh cục · Đại hạn · Lưu niên:
 *   sonchu.vn — “Mệnh cục, đại hạn, tiểu hạn lưu niên”
 * - Lục cát / lục sát + Tứ Hóa; Kỵ–sát trùng kích:
 *   sǹg-miā — Advanced analysis / Da Xian & Liu Nian
 * - Tam phương tứ chính:
 *   sǹg-miā — San Fang Si Zheng; starnum — San Fang Si Zheng
 * - Vùng địa chi (tứ mộ / tứ mã / tứ bại):
 *   zhycw.com, ziweicn — 四墓 / 四生四马 / 四败
 * - Hóa Kỵ đắc mộ; Lộc/Quyền/Khoa hạn chế ở mộ:
 *   Kabala / AlexPhong — Kình Đà hiệp Kỵ
 * - Kình/Đà đắc mộ, Đà hãm mã:
 *   Trần Nhật Thành; tuvi.vn; Học viện lý số
 * - Thanh Long–Hóa Kỵ (đồng / xung); Thanh Long–Lưu Hà; Long đắc mộ:
 *   Kabala Thanh Long; Bác Kim Hạc (đồng > xung > tam hợp)
 * - Lộc Mã giao trì:
 *   KB nam_phai/luu_nien_tai_bach.md; HOROS; Tử Vi Hiện Đại
 * - Vũ Tham mộ thượng cách:
 *   SoiMenh cách cục; 4T Human
 * - Vòng Bác Sĩ (cát/hung + Song Hao đắc Dần/Thân/Mão/Dậu; Long–Phi–Phục):
 *   Sơn Chu; Trần Nhật Thành; Tử Vi Bình Giải
 * - Đào/Hồng/Hỷ; Cô Thần (mã) / Quả Tú (mộ):
 *   Kabala Đào Hoa / Cô Quả
 * - Song Hao đắc / Chúng Thủy Triều Đông:
 *   Kabala Tiểu Hao Đại Hao; tuvicaimenh
 * - Thai Tọa / Quang Quý / Phụ Cáo:
 *   GiaiThan Tam Thai Bát Tọa; Kabala Quang Quý Phụ Cáo Thai Tọa
 * - Vòng Trường Sinh (Sinh–Vượng–Mộ vs Suy–Bệnh–Tử–Tuyệt):
 *   tuvicaimenh; TuviGLOBAL luận Tràng Sinh
 * - Cự Môn (ám tinh chủ) + Hóa Kỵ đồng cung "ám thượng gia ám":
 *   cohoc.vn "Sao Cự Môn — Minh Tranh Ám Đấu"; horos.vn "Sao Cự Môn — Ám
 *   Tinh Trong Tử Vi"; hocvienlyso.org "Hoá Kỵ – Cự Môn"
 * - Khốc–Hư giao hội (cặp cố định xung chiếu nhau, mất mát/u uất):
 *   tracuutuvi.com "Sao Lưu Thiên Hư"; lyso.vn bộ sao cách cục đồng cung
 * - Thiên Sứ (cố định Tật Ách) / Thiên Thương (cố định Nô Bộc): 2 sao hung
 *   engine đã an sẵn (addFixedPalaceStars) nhưng chưa từng được scorer đọc
 *   tới — rà lại toàn bộ sao do engine sinh ra đối chiếu với star-sets.ts
 *   mới phát hiện, không phải nghiên cứu nguồn ngoài.
 *
 * 14 chính + Xương/Khúc + Hỏa/Linh: KHÔNG nhân zoneFactor thêm (đã có
 * brightness theo chi trong engine). Chỉ pair/bonus cách cục.
 *
 * Thang thô cộng rồi clamp 0–100 ở `trend-score.ts`. Hai lớp Cát/Hung độc lập.
 */

export interface ScoringWeights {
  /** Hóa Lộc (gốc/ĐV/lưu) vào cung hạn hoặc tam phương tứ chính. */
  hoaLoc: number;
  /** Hóa Quyền. */
  hoaQuyen: number;
  /** Hóa Khoa. */
  hoaKhoa: number;
  /** Mỗi cát tinh lục cát / Lộc Tồn hội tại khung nhìn. */
  lucCat: number;
  /** Chính tinh miếu hoặc vượng tại cung hạn (trọng tâm). */
  majorMieuVuong: number;
  /** Hệ số nhân khi tín hiệu nằm ở tam hợp / xung (không phải cung hạn chính). */
  sanFangFactor: number;

  /** Hóa Kỵ vào cung hạn hoặc xung chiếu. */
  hoaKy: number;
  /** Mỗi sát tinh lục sát hội. */
  lucSat: number;
  /** Bonus khi Hóa Kỵ + ≥1 sát đồng khung (Kỵ–sát trùng kích). */
  kySatCluster: number;
  /** Bonus khi ≥2 sát đồng cung hạn. */
  satCluster: number;
  /** Chính tinh hãm tại cung hạn. */
  majorHam: number;
  /** Tuần / Triệt án ngữ cung hạn. */
  tuanTriet: number;
  /** Hung tinh vòng Thái Tuế (Tang Môn, Bạch Hổ, Điếu Khách…). */
  taiTueHung: number;

  /** Radar — điểm nền độ vững cung. */
  palaceBase: number;
  /** Radar — có chính tinh thủ cung. */
  palaceHasMajor: number;
  /** Radar — vô chính diệu (trừ). */
  palaceEmptyMajor: number;

  // ── Zone factors (sao không brightness) — draft ──
  /** Nhân hung Hóa Kỵ khi sao/record ở vùng mộ (đắc = kìm hung). */
  hoaKyMoFactor: number;
  /** Nhân cát Lộc/Quyền/Khoa khi ở vùng mộ (hạn chế vì Lộc Tồn không cư mộ). */
  hoaLocMoFactor: number;
  /** Nhân hung Kình/Đà ở vùng mộ (đắc = giảm hung). */
  kinhDaMoFactor: number;
  /** Nhân hung Kình/Đà ở vùng mã (hãm hơn). */
  kinhDaMaFactor: number;
  /** Nhân hung Không/Kiếp ở vùng mã. */
  khongKiepMaFactor: number;
  /** Bonus Cát khi Thanh Long ở vùng mộ. */
  thanhLongMoBonus: number;
  /** Nhân nhẹ hung Thái Tuế hung ở vùng mã. */
  taiTueHungMaFactor: number;

  // ── Pair rules — draft ──
  /** Cát từ cách Thanh Long ↔ Hóa Kỵ (đồng/xung; tam hợp × sanFang). */
  longKyCat: number;
  /** Phần hung Kỵ được trừ khi thành cách Long–Kỵ (0–1 của điểm Kỵ đã cộng). */
  longKyHungRelief: number;
  /** Cát Thanh Long ↔ Lưu Hà. */
  longHaCat: number;
  /** Cát Lộc Mã giao trì. */
  locMaCat: number;
  /** Cát Vũ + Tham trên khung có chi mộ. */
  vuThamMoCat: number;
  /** Hung chiết mã: Thiên Mã + sát đồng cung hạn. */
  maSatHung: number;

  // ── Phase 2 — phụ tinh / tạp (draft) ──
  /** Cát sao tốt vòng Bác Sĩ (Bác Sĩ, Lực Sĩ, Tướng Quân, Tấu Thư, Hỷ Thần). */
  bacSiCat: number;
  /** Hung Song Hao (Đại/Tiểu Hao). */
  songHaoHung: number;
  /** Nhân hung Song Hao khi đắc (Dần/Thân/Mão/Dậu) — giảm hung. */
  songHaoDacFactor: number;
  /** Bonus Cát nhẹ khi Song Hao đắc (luân chuyển / Chúng Thủy). */
  songHaoDacCat: number;
  /** Hung Phục Binh / Bệnh Phù / Quan Phủ. */
  bacSiHung: number;
  /** Hung nhẹ Phi Liêm (động / thị phi lẫn lộn). */
  phiLiemHung: number;
  /** Cát Đào Hoa / Hồng Loan / Thiên Hỷ (hỷ khí). */
  daoHongHyCat: number;
  /** Hung Cô Thần / Quả Tú. */
  coQuaHung: number;
  /** Cát sao Đức (Thiên/Nguyệt/Long/Phúc Đức). */
  ducCat: number;
  /** Hung Thiên Hình / Thiên Riêu. */
  hinhRieuHung: number;
  /** Cát Hoa Cái. */
  hoaCaiCat: number;
  /** Hung Phá Toái / Kiếp Sát / Thiên La / Địa Võng. */
  phaToaiHung: number;

  /** Cát Phi Liêm ↔ Bạch Hổ. */
  phiHoCat: number;
  /** Giảm hung flat khi Phi–Hổ. */
  phiHoHungRelief: number;
  /** Cát Phục Binh ↔ Thiên Hình. */
  binhHinhCat: number;
  /** Giảm hung flat khi Binh–Hình. */
  binhHinhHungRelief: number;
  /** Cát Đào ↔ Hồng hoặc Đào ↔ Hỷ. */
  daoHongCat: number;
  /** Hung Đào đồng cung sát. */
  daoSatHung: number;

  // ── Phase 3 — Thai Tọa / Quang Quý / Trường Sinh / … (draft) ──
  /** Tam Thai / Bát Tọa. */
  thaiToaCat: number;
  /** Ân Quang / Thiên Quý. */
  quangQuyCat: number;
  /** Thai Phụ / Phong Cáo. */
  phuCaoCat: number;
  /** Quốc Ấn / Đường Phù / Thiên Quan / Thiên Phúc / Thiên Trù. */
  quanAnCat: number;
  /** Thiên Y / Thiên Giải / Địa Giải / Giải Thần. */
  giaiCat: number;
  /** Long Trì / Phượng Các. */
  longPhuongCat: number;
  /** Thiên Tài / Thiên Thọ. */
  thienTaiThoCat: number;
  /** Lưu Hà đơn (bại; cặp Long–Hà xử riêng). */
  luuHaHung: number;
  /** Đẩu Quân. */
  dauQuanHung: number;
  /** Thiên Sứ (cố định tại Tật Ách). */
  thienSuHung: number;
  /** Thiên Thương (cố định tại Nô Bộc). */
  thienThuongHung: number;
  /** Thái Tuế / Tử Phù (áp lực vòng tuổi). */
  taiTuePressHung: number;
  /** Thiếu Dương / Thiếu Âm / Trực Phù (nhẹ cát). */
  taiTueSoftCat: number;
  /** Trường Sinh: Tràng Sinh / Quan Đới / Lâm Quan / Đế Vượng / Thai / Dưỡng. */
  truongSinhCat: number;
  /** Trường Sinh: Mộc Dục (bại địa / dục). */
  mocDucHung: number;
  /** Trường Sinh: Suy / Bệnh / Tử / Tuyệt. */
  truongSinhSuyHung: number;
  /** Trường Sinh: Mộ (tụ — nhẹ cát tại cung hạn). */
  moChangSinhCat: number;

  /** Cát Tam Thai ↔ Bát Tọa. */
  thaiToaPairCat: number;
  /** Cát Ân Quang ↔ Thiên Quý. */
  quangQuyPairCat: number;

  /** Hung Cự Môn (ám tinh chủ) ↔ Hóa Kỵ — "ám thượng gia ám". */
  cuKyHung: number;
  /** Hung Thiên Khốc ↔ Thiên Hư giao hội (cặp cố định xung chiếu). */
  khocHuHung: number;

  /** Cát Tham Hỏa/Linh tương phùng. */
  thamHoaCat: number;
  /** Giảm hung của Hỏa/Linh khi thành cách Tham Hỏa/Linh. */
  thamHoaHungReliefRatio: number;

  /** Cát Tam Kỳ Gia Hội (Lộc Quyền Khoa). */
  tamKyCat: number;

  /** Hung Xương Khúc + Cự Môn / Liêm Trinh. */
  xuongKhucCuLiemHung: number;

  /** Cát Xương Khúc + Thái Dương / Thái Âm. */
  xuongKhucNhatNguyetCat: number;

  /** Bonus khi sao động ở Tứ Mã (Dần, Thân, Tỵ, Hợi). */
  majorDongMaBonus: number;
  /** Bonus khi tài tinh ở Tứ Mộ (Thìn, Tuất, Sửu, Mùi). */
  majorTaiMoBonus: number;

  /** Cát Tử Phủ Vũ Tướng (Cách cục lớn). */
  tuPhuVuTuongCat: number;
  /** Cát Sát Phá Tham. */
  satPhaThamCat: number;
  /** Cát Cơ Nguyệt Đồng Lương. */
  coNguyetDongLuongCat: number;
}

/**
 * Draft mặc định — chờ thầy duyệt.
 * Cát ≈ lục cát + Lộc/Quyền/Khoa + miếu/vượng + pair quý.
 * Hung ≈ lục sát + Kỵ + hãm + Tuần/Triệt + Thái Tuế hung − relief Long–Kỵ.
 *
 * hoaLoc/hoaQuyen/hoaKhoa/lucCat/majorMieuVuong đã hạ ×0.65 (từ
 * 18/14/12/7/11) so với bản gốc — đo trên 2736 khung (96 lá số × 12 mốc
 * Đại vận): raw của riêng 3 nhóm "core" này (Tứ Hóa + lục cát + miếu/vượng)
 * đã đủ đẩy Cát dính trần 100 ở 44.6% số mốc kể cả sau khi phase 2/3 (phụ
 * tinh/tạp) đã siết theo focus-cung-hạn/cluster ở trên. Hệ số 0.65 chọn vì
 * đưa phân phối Cát khớp với Hung (đã fix): mean 77.6 so với 76.0, median
 * 79 so với 78, trần 17.6% so với 18.6% — không phải số tròn đoán bừa.
 */
export const SCORING_WEIGHTS: ScoringWeights = {
  hoaLoc: 12,
  hoaQuyen: 9,
  hoaKhoa: 8,
  lucCat: 5,
  majorMieuVuong: 7,
  sanFangFactor: 0.55,

  hoaKy: 20,
  lucSat: 9,
  kySatCluster: 12,
  satCluster: 10,
  majorHam: 12,
  tuanTriet: 10,
  taiTueHung: 7,

  palaceBase: 42,
  palaceHasMajor: 8,
  palaceEmptyMajor: 15,

  hoaKyMoFactor: 0.45,
  hoaLocMoFactor: 0.7,
  kinhDaMoFactor: 0.55,
  kinhDaMaFactor: 1.25,
  khongKiepMaFactor: 1.2,
  thanhLongMoBonus: 8,
  taiTueHungMaFactor: 1.15,

  longKyCat: 10,
  longKyHungRelief: 0.55,
  longHaCat: 8,
  locMaCat: 14,
  vuThamMoCat: 16,
  maSatHung: 10,

  bacSiCat: 6,
  songHaoHung: 8,
  songHaoDacFactor: 0.4,
  songHaoDacCat: 6,
  bacSiHung: 7,
  phiLiemHung: 5,
  daoHongHyCat: 5,
  coQuaHung: 6,
  ducCat: 6,
  hinhRieuHung: 7,
  hoaCaiCat: 5,
  phaToaiHung: 7,

  phiHoCat: 6,
  phiHoHungRelief: 5,
  binhHinhCat: 5,
  binhHinhHungRelief: 5,
  daoHongCat: 7,
  daoSatHung: 8,

  thaiToaCat: 5,
  quangQuyCat: 5,
  phuCaoCat: 4,
  quanAnCat: 5,
  giaiCat: 4,
  longPhuongCat: 4,
  thienTaiThoCat: 4,
  luuHaHung: 5,
  dauQuanHung: 5,
  thienSuHung: 5,
  thienThuongHung: 5,
  taiTuePressHung: 5,
  taiTueSoftCat: 4,
  truongSinhCat: 7,
  mocDucHung: 4,
  truongSinhSuyHung: 6,
  moChangSinhCat: 4,

  thaiToaPairCat: 6,
  quangQuyPairCat: 6,

  cuKyHung: 12,
  khocHuHung: 6,

  thamHoaCat: 16,
  thamHoaHungReliefRatio: 0.6,

  tamKyCat: 18,

  xuongKhucCuLiemHung: 12,

  xuongKhucNhatNguyetCat: 12,

  majorDongMaBonus: 5,
  majorTaiMoBonus: 8,

  tuPhuVuTuongCat: 20,
  satPhaThamCat: 18,
  coNguyetDongLuongCat: 16,
};
