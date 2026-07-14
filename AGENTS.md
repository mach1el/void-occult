# AGENTS.md

Luật bắt buộc cho mọi AI agent làm việc trên repo `apexvoid-occult`. Đọc hết trước khi chạm vào code.

## 0. Quy trình

- **MỌI thay đổi đi qua Pull Request.** Cấm push thẳng `master`. Không ngoại lệ, kể cả fix một dòng.
- **Xuất implementation plan trước, chờ duyệt, rồi mới ghi file.** Không tự commit.
- Mỗi đầu việc = **một commit riêng**, đúng thứ tự spec yêu cầu. Không gộp, không đảo.
- **Cập nhật `CHANGELOG.md` trong CÙNG PR** (xem mục 1). PR không có changelog = PR chưa xong.

## 1. CHANGELOG — bắt buộc

Mọi PR có thay đổi người dùng thấy được **phải** ghi vào `CHANGELOG.md`, mục `## [Unreleased]`, đúng phân mục:

- `### Thêm Mới (Added)` — tính năng mới.
- `### Cải Thiện (Changed)` — thay đổi hành vi/UI đã có.
- `### Sửa Lỗi (Fixed)` — sửa bug.
- `### Gỡ Bỏ (Removed)` — xóa tính năng.

Quy tắc viết:
- Mở đầu bằng **module in đậm**: `**Bát Tự (Tứ Trụ)**:`, `**Tử Vi**:`, `**Backend**:`, `**Hạ tầng**:`
- Viết theo **góc nhìn người dùng**, không phải góc nhìn code. Không viết *"refactor `luck-pillars.ts`"* → viết *"Hiển thị đúng tuổi khởi vận kèm số tháng lẻ"*.
- Một dòng một thay đổi. Không nhồi.
- **Refactor thuần / dọn rác / đổi cấu trúc thư mục**: ghi ngắn vào `Cải Thiện`, hoặc bỏ qua nếu người dùng không thấy gì khác. Đừng làm loãng changelog bằng chi tiết nội bộ.

## 2. Luật Cấm Nới Ngưỡng ⚖️

Ngưỡng trong spec (sai số tiết khí `<2 phút`, ngân sách token, cỡ mẫu...) là **đề bài, không phải biến số**.

Không đạt thì:
1. **DỪNG.** Không sửa assert cho khớp kết quả.
2. Báo trong PR: đạt bao nhiêu, thiếu gì, phương án đề xuất.
3. Chỉ đổi ngưỡng khi người review **chấp thuận bằng chữ**.

*(Đã từng vi phạm: nới `toBeLessThan(2)` thành `(6)` để test xanh. Tái phạm = bác PR toàn bộ, không review tiếp.)*

## 3. Golden snapshot là chân lý

`tests/golden/*.json` sinh từ engine gốc, là **định nghĩa của đúng**.

- Bản mới lệch snapshot dù **một field** = **bug của bản mới**, không phải "snapshot cần cập nhật".
- **CẤM sửa snapshot.** Dừng, báo cáo.
- Nếu tin engine cũ có bug: viết **bug-for-bug compatible** (giữ nguyên hành vi sai), ghi vào PR mục `## Nghi vấn bug engine cũ`, chờ quyết. **Lá số của người dùng không được đổi trong im lặng.**

## 4. Chống bịa (quan trọng nhất với tri thức huyền học)

- **Không thêm tri thức Tử Vi / Bát Tự từ trí nhớ.** Bảng nào spec đã nhúng → dùng đúng. Tin bảng sai? **Dừng, nêu nguồn đối chứng**, chờ duyệt — đừng lặng lẽ sửa.
- Bảng/công thức spec không nhúng → **bắt buộc ghi nguồn** trong comment.
- Không thêm sao/cách cục/thần sát ngoài danh sách được giao.
- **Thà thiếu còn hơn bịa.** Không chắc → đưa vào PR mục `## Cần thầy duyệt`, không viết vào file.

## 5. Ranh giới kiến trúc

- **Tính toán = tất định (code). Luận giải = xác suất (KB + LLM).** Không trộn.
- Dụng Thần / vượng nhược / cách cục **được phép tính**, nhưng phải: khai báo phương pháp, hiện bài làm (`breakdown`, `reasoning`), ngôn ngữ có mức độ (*"theo pháp X, thiên về..."* — không phải *"là..."*), và cấu hình được qua `conventions.ts`.
- **Mọi lựa chọn đa phái sống trong `conventions.ts`**, không rải if/else, không hard-code một phái.
- Engine **không đưa lời khuyên đời sống** (màu hợp, nghề hợp, hướng nhà) — đó là luận giải, thuộc KB/LLM.

## 6. Phạm vi

- **Không scope creep.** Làm đúng việc được giao. Thấy lỗi khác → ghi `## Phát hiện thêm` trong PR, chờ chỉ thị, **không tự vá**.
- **Không "tiện tay"**: không refactor kèm, không DRY kèm, không "sửa cho đúng hơn" kèm.
- PR refactor **không được đổi hành vi**. PR tính năng **không được refactor**.

## 7. Test

- Test là **người gác**, không phải thủ tục. Test không chạy được (import lỗi) = **test không tồn tại**.
- **Cấm test tự khớp chính mình**: không sinh giá trị kỳ vọng từ chính code đang test rồi assert nó bằng chính nó. Không tìm được nguồn đối chiếu đáng tin → **bỏ ca đó**, đừng bịa số kỳ vọng.
- CI phải xanh **thật**: `npm run typecheck && npm test && npm run build` + `python -m unittest discover -s tests`.

## 8. Vùng cấm mặc định

Trừ khi spec cho phép rõ ràng:
- `backend/app/kb/data/**/*.md` — KB, có branch riêng.
- `src/lib/calendar/`, `src/lib/bazi/`, `src/lib/ziwei/` — engine, chỉ đụng khi spec nói.
- `backend/app/store.py` — dữ liệu người dùng.
- Health / Tật Ách trong mọi hệ — **tuyệt đối không phán bệnh, không tiên lượng, không nói tuổi thọ.**

## 9. Deliverable của mỗi PR

1. Code + test.
2. **`CHANGELOG.md` đã cập nhật.**
3. Output các lệnh verify trong spec (chạy thật, dán vào PR).
4. Mục `## Cần thầy duyệt` — mọi quyết định chuyên môn huyền học, mọi convention đã chọn, mọi thứ không chắc. **Mục này rỗng là dấu hiệu đáng ngờ.**
5. Mục `## Nghi vấn bug engine cũ` / `## Phát hiện thêm` nếu có.
6. Ảnh chụp màn hình (desktop + mobile) nếu đụng UI.
