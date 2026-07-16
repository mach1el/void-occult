# Changelog

Tất cả những thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Unreleased]

### Thêm Mới (Added)
- **Tử Vi**: Biểu đồ xu hướng Đại vận và Lưu niên (hai lớp Cát / Hung độc lập theo cung hạn + tam phương tứ chính), panel breakdown từng mốc, và radar độ vững 12 cung đặt đầu khối — engine heuristic tất định, không cần LLM để tạo số.
- **Hạ tầng**: Thêm nút trái tim (Support my work) góc dưới màn hình kèm mã QR VietQR và link PayPal để tiện lợi cho việc ủng hộ tác giả.
- **Tử Vi**: Bổ sung Họ tên, tình trạng công việc và tình trạng mối quan hệ vào form lập lá số và context luận giải AI.
- **Bát Tự (Tứ Trụ)**: Hệ thống tính điểm ngũ hành tự động dựa trên Tàng Can, Nguyệt Lệnh và Trụ.
- **Bát Tự (Tứ Trụ)**: Engine phân tích Dụng Thần, Hỷ Thần, Kỵ Thần theo pháp Phù Ức.
- **Bát Tự (Tứ Trụ)**: UI Radar ngũ giác trực quan bằng SVG thể hiện điểm số các hành.
- **Bát Tự (Tứ Trụ)**: Nút Copy text toàn bộ lá số định dạng gọn gàng, phù hợp paste vào Notes/Telegram.

### Cải Thiện (Changed)
- **Tử Vi**: Gom engine xu hướng vào `src/lib/ziwei/trend/` (types · util · frame · score · zones · pairs · weights · star-sets); test nằm trong `trend/__tests__/`; bỏ shim path cũ.
- **Tử Vi**: Đại vận chấm đủ tam phương tứ chính (chính tinh miếu/hãm + Tứ Hóa gốc ở xung/tam hợp, không chỉ cung hạn).
- **Tử Vi**: Engine xu hướng Cát/Hung nhận vùng địa chi (tứ mộ / tứ mã / tứ bại) và cách cục cặp sao đồng cung hoặc xung chiếu — áp dụng chung Đại vận và Lưu niên; phase 2 bổ sung vòng Bác Sĩ, Song Hao đắc, Đào/Hồng/Hỷ, Cô Quả, Đức, Hình/Riêu và các cặp Phi–Hổ / Binh–Hình; phase 3 thêm Thai Tọa/Quang Quý/Phụ Cáo, Quốc Ấn·Đường Phù, giải tinh, Long Phượng và vòng Trường Sinh trên cung hạn.
- **Tử Vi**: Desktop — chat không còn kéo theo chiều cao lá số; khối xu hướng full-width dưới cả hai cột, la bàn 12 cung lên đầu.
- **Tử Vi**: Sáng thêm một bậc cho phụ tinh (opacity tầng 2/3 và màu Ngũ Hành), làm vàng Huyền Tử Kim sáng/kim loại hơn trên desktop lẫn mobile.
- **Hạ tầng**: Icon ủng hộ trên mobile dùng blur + opacity thấp khi idle, rõ lại khi hover/tap để bớt che trải nghiệm đọc lá số.
- **Tử Vi**: Đồng bộ toàn trang theo scheme Huyền Tử Kim, giữ màu Ngũ Hành làm ngôn ngữ chính cho sao và nâng tương phản trên desktop, mobile, AI chat lẫn ảnh xuất.
- **Tử Vi**: Hiển thị tên đương số trên lá số (Compact và Mobile). Nếu không nhập tên sẽ hiển thị "VÔ DANH" và AI sẽ tự động xưng hô là Nam mệnh/Nữ mệnh.
- **Tử Vi**: Sửa lỗi giao diện dropdown chọn Múi giờ và Cách xem vận bị cắt chữ trên màn hình mobile.
- **Tử Vi**: Tăng một cấp cỡ chữ phụ tinh trên lá số compact để dễ đọc hơn.
- **Tử Vi**: Thiết kế lại trải nghiệm lập lá số theo phong cách glassmorphism, tối ưu bố cục responsive và gom các thiết lập chuyên môn vào mục tùy chọn nâng cao.
- **Tử Vi**: Cá nhân hóa prompt AI bằng hoàn cảnh hiện tại của đương số mà không lưu các thông tin này vào MongoDB hoặc `localStorage`.
- **Bát Tự (Tứ Trụ)**: Hiển thị Tứ Trụ dạng lưới 2×2 trên mobile (Năm-Tháng-Ngày-Giờ), bỏ cuộn ngang để xem được toàn bộ lá số cùng lúc. Desktop vẫn 1 hàng 4 cột như cũ.
- **Bát Tự (Tứ Trụ)**: Nén form nhập ngày sinh trên mobile (Giới tính + Múi giờ chung một hàng), vừa gọn trong một màn hình thay vì phải cuộn.
- **Bát Tự (Tứ Trụ)**: Hỗ trợ kéo-để-cuộn (drag to scroll) mượt mà bằng chuột và lăn chuột ngang cho các bảng Tứ Trụ, Đại Vận, Lưu Niên trên màn hình hẹp. Tính năng không gây xung đột với bôi đen chữ hay click chọn ô.
- **Bát Tự (Tứ Trụ)**: Chuyển đổi hiển thị Bảng Lưu Niên và Thẻ Đại Vận sang cấu trúc Lưới (Grid) để đảm bảo đồng bộ chiều cao các ô, loại bỏ hiện tượng lệch hàng do chữ dài/ngắn.
- **Bát Tự (Tứ Trụ)**: Bỏ thanh cuộn ngang ở Thẻ Đại Vận trên màn hình Desktop, tự động chia thành nhiều hàng gọn gàng. Cải thiện thanh cuộn `custom-scrollbar` đẹp mắt hơn cho các bảng hiển thị trên mobile.
- **Bát Tự (Tứ Trụ)**: Tính toán Nhật Chủ Vượng / Nhược / Trung Hòa có cơ chế "minh bạch", hiển thị rõ cách tính điểm và lý luận bên dưới.
- **Bát Tự (Tứ Trụ)**: Cải tiến UI/UX với bố cục 2 cột (Radar - Phân tích), nén thẻ Tứ Trụ, highlight nổi bật Đại Vận hiện tại.
- **Bát Tự (Tứ Trụ)**: Thứ tự Bát Tự chuẩn hóa sang `Năm - Tháng - Ngày - Giờ`.
- **Bát Tự (Tứ Trụ)**: Thay đổi màu ngũ hành Kim thành `--color-metal` (bạc/xám) cho chuẩn phong thủy.
- **Bát Tự (Tứ Trụ)**: Tối ưu hoá hiển thị trên Mobile (cho phép cuộn ngang bảng Tứ Trụ, Đại Vận, Lưu Niên).
- **Bát Tự (Tứ Trụ)**: Mở rộng kích thước ô Bảng Lưu Niên để dễ đọc hơn, thêm hiệu ứng hover và phóng to nổi bật năm hiện tại.
- **Tử Vi**: Hợp nhất bảng màu Ngũ Hành và Tứ Hóa của lá số về một nguồn duy nhất, xóa các bảng màu trùng lặp từng gây lệch màu giữa các nơi hiển thị.
- **Tử Vi**: Lá số 12 cung phân 3 tầng thị giác — chính tinh nổi bật rõ, phụ tinh chính vừa phải, tạp diệu và sao lưu lùi nhẹ xuống nền — giúp mắt có điểm tựa hơn khi nhìn lá số dày sao.
- **Tử Vi**: Sao ở cung hãm hiển thị mờ/yếu hơn rõ rệt so với sao miếu/vượng (ngoài nhãn chữ M/V/Đ/B/H đã có), áp dụng cho cả lá số dạng compact và dạng đọc trên mobile.
- **Bát Tự (Tứ Trụ)**: Đồng bộ màu ngũ hành của can/chi, tàng can và Radar theo đúng bảng dùng chung với Tử Vi — Kim (bạc) không còn dễ nhầm với Thổ (vàng đất) như trước.
- **Hạ tầng**: Quầng khí tím/son/ngọc của trang chủ nay phủ mọi trang (trước chỉ có ở trang chủ) — Bát Tự có thêm chiều sâu thay vì nền trơn phẳng, giữ mờ hơn để không đua với lá số.
- **Hạ tầng**: Bề mặt thẻ/khung/viền của trang chủ, Bát Tự và nút ủng hộ dùng chung một hệ màu (bề mặt, viền, chữ mờ, trạng thái hover) thay vì mỗi nơi tự chế một sắc xám riêng.

### Sửa Lỗi (Fixed)
- **Tử Vi**: Đồng bộ nền kính giữa input/select và buộc menu lựa chọn native dùng màu tối tương phản.
- **Tử Vi**: Sửa hồi quy co nhỏ lá số/chat, đồng thời bố trí thông tin theo grid 2 cột và giữ tùy chọn compact bên cạnh.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi khối Dụng Thần bị bỏ trống khi Nhật Chủ Trung Hòa — nay tự động tham chiếu Pháp Điều Hậu, có ghi rõ đang dùng pháp nào.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi mảng Hỷ Thần bị rỗng trong kết quả luận giải.
- **Bát Tự (Tứ Trụ)**: Sửa hiển thị chữ "t" thành "tháng" (Tuổi khởi vận) và "tuổi" (Lưu niên) để tránh nhầm lẫn.
- **Bát Tự (Tứ Trụ)**: Sửa logic Tuần Không Vong, map và in chính xác các chi rơi vào Tuần Không ở bảng Tứ Trụ.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi Tooltip rườm rà ở thẻ bảng Lưu Niên đè lên các thao tác.
- **Tử Vi**: Phụ tinh (tầng 2 và tầng 3) sáng lên 1 tông so với lần chia tầng thị giác trước — tầng 3 (tạp diệu, sao lưu) từng trông quá tối, nay vẫn phân biệt được với chính tinh nhưng dễ đọc hơn.
