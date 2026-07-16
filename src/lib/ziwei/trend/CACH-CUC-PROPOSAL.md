# Đề xuất cách cục + weight cho Đại vận — chờ thầy duyệt

> Deep research các cách cục kinh điển và hành vi khi rơi vào Đại vận. **Chưa
> áp vào `weights.ts`** — thầy duyệt từng dòng rồi em mới đổi. Hình học theo
> quy ước sẵn có của engine: đồng cung > xung chiếu > tam hợp (nhân
> `sanFangFactor` cho tam hợp/xung).

## A. Cách cục engine đang tính SAI dấu (ưu tiên sửa)

### A1. Hỏa Tham / Linh Tham cách (Tham Hỏa/Linh tương phùng) — CÁT
- **Hiện trạng:** Hỏa Tinh / Linh Tinh luôn bị tính thuần **hung** (lục sát).
  Khi đi cùng Tham Lang, đây là cách **phát tài/thăng tiến đột ngột**, rất
  mạnh **đúng ở Đại vận** ("vận đến phát rất nhanh"). Engine đang chấm ngược.
- **Đề xuất:** thêm pair `thamHoa` — Tham Lang + (Hỏa **hoặc** Linh) đồng
  cung hoặc tam hợp trong khung → cộng **Cát** và **giảm** phần hung của
  chính sao Hỏa/Linh đó (relief), vì trong cách này sát tinh đổi vai.
  - Đề xuất weight: `thamHoaCat: 16` (đồng cung), ×`sanFangFactor` nếu tam hợp.
  - Relief: trừ ~60% điểm hung của Hỏa/Linh khi thành cách (giống cơ chế
    `longKyHungRelief`).
  - ⚠️ Phá cách: nếu đồng thời gặp Hóa Kỵ / Kình Đà giao hội → cách vỡ,
    KHÔNG cộng cát (theo tuvilyso: "Đà La giao hội phá cách"). Cần chốt.
- Nguồn: cohoc.vn "Tham Hỏa tương phùng — Phú Ông Chi Cách"; tuvi.cohoc.net
  "Tham Linh triều viên"; tuvilyso.org (phá cách Đà La).

## B. Cách cục engine ĐANG THIẾU

### B1. Tam Kỳ Gia Hội (Lộc + Quyền + Khoa hội đủ) — CÁT lớn
- **Hiện trạng:** engine cộng từng Hóa riêng lẻ, KHÔNG có bonus khi **cả ba**
  Lộc·Quyền·Khoa cùng hội tam phương tứ chính. Đây là quý cách hàng đầu.
- **Đề xuất:** khi trong khung có đủ 3 loại Hóa cát (gốc **hoặc** ĐV, không
  tính lưu vì Đại vận không lấy sao lưu) → bonus `tamKyCat: 18`.
  Có thể tăng nếu cả 3 đều ở cung hạn chính.
- Nguồn: hocvienlyso.org "Những Quý Cục"; huyenthiencac.vn "Tam Kỳ Gia Hội";
  Kabala "Tam Kỳ Gia Hội Cách".

### B2. Giáp cách (kẹp cung) — cần logic mới (cung lân cận ±1)
- **Hiện trạng:** engine chỉ xét đồng cung / tam hợp / xung — **không có khái
  niệm "giáp"** (cung bị 2 sao ở 2 cung liền kề kẹp). Cổ quyết: *"chính không
  bằng chiếu, chiếu không bằng giáp"* → giáp rất nặng.
- **Đề xuất (đợt sau, vì cần thêm hàm adjacency):**
  | Cách | Loại | Weight đề xuất |
  |---|---|---|
  | Kình Đà giáp Kỵ (chính tinh Hóa Kỵ bị Kình+Đà kẹp) | Hung nặng | `kinhDaGiapKyHung: 16` |
  | Khôi Việt giáp mệnh/cung hạn | Cát | `khoiVietGiapCat: 10` |
  | Tả Hữu giáp | Cát | `taHuuGiapCat: 8` |
  | Nhật Nguyệt giáp | Cát | `nhatNguyetGiapCat: 8` |
- Nguồn: tuvi.cohoc.net "chính không bằng chiếu…"; lyso.vn (Kình Đà giáp Kỵ);
  luantuvi.vn "Khôi Việt".

## C. Rà lại weight cách cục ĐÃ CÓ (đề xuất tinh chỉnh)

| Cách (id) | Weight hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `locMaCat` (Lộc Mã giao trì) | 14 | giữ | Chuẩn, quý cách động tài. |
| `vuThamMoCat` (Vũ Tham mộ) | 16 | giữ | Thượng cách, đã có boost mộ. |
| `longKyCat` (Thanh Long–Kỵ) | 12 | → 10 | Hơi cao so với vai trò. |
| `daoHongCat` (Đào–Hồng/Hỷ) | 7 | giữ | Đào hoa, mức vừa. |
| `daoSatHung` (Đào + sát) | 8 | giữ | Hợp lý. |
| `cuKyHung` (Cự Môn–Kỵ ám) | 12 | giữ | Vừa thêm, đúng mức. |
| `khocHuHung` (Khốc–Hư) | 6 | giữ | Cặp cố định, mức nhẹ đúng. |

## D. Nguyên tắc riêng cho Đại vận (đã áp / cần lưu ý)
- ✅ Đại vận **không** lấy sao lưu niên (đã sửa: `includeAnnual:false`) — chỉ
  chính tinh + Tứ Hóa gốc/ĐV + phụ tinh gốc trên tam phương tứ chính.
- Chính tinh miếu/vượng ở Đại vận nặng hơn ở lá số tĩnh — có thể cân nhắc
  hệ số `daiVanMajorFactor` nếu thầy muốn phân biệt ĐV vs radar.
- Cách cục cát ở Đại vận "phát nhanh nhưng tàn nhanh nếu gặp sát trùng" →
  cơ chế phá cách (A1) quan trọng để tránh chấm cát ảo.

## Thứ tự đề xuất triển khai (khi thầy duyệt)
1. **A1 Hỏa/Linh Tham** — sửa dấu sai, tác động lớn nhất.
2. **B1 Tam Kỳ Gia Hội** — thêm bonus hội tụ, dễ làm.
3. **C** tinh chỉnh vài weight nhỏ.
4. **B2 Giáp cách** — đợt sau, cần thêm hàm cung lân cận.

---
### Nguồn tham chiếu
- Hỏa/Linh Tham: cohoc.vn/sao-tham-lang; tuvi.cohoc.net/cach-cuc-tham-linh-trieu-vien; tuvilyso.org (phá cách Đà La)
- Tam Kỳ Gia Hội: hocvienlyso.org/nhung-quy-cuc; huyenthiencac.vn/tam-ky-gia-hoi-cach; hoc.kabala.vn/tam-ky-gia-hoi-cach
- Giáp cách: tuvi.cohoc.net/chinh-khong-bang-chieu-chieu-khong-bang-giap; lyso.vn (Kình Đà giáp Kỵ); luantuvi.vn (Khôi Việt)
