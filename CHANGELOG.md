# Changelog

Tất cả những thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Unreleased]

### Thêm Mới (Added)
- **Tử Vi**: Bổ sung Họ tên, tình trạng công việc và tình trạng mối quan hệ vào form lập lá số và context luận giải AI.
- **Bát Tự (Tứ Trụ)**: Hệ thống tính điểm ngũ hành tự động dựa trên Tàng Can, Nguyệt Lệnh và Trụ.
- **Bát Tự (Tứ Trụ)**: Engine phân tích Dụng Thần, Hỷ Thần, Kỵ Thần theo pháp Phù Ức.
- **Bát Tự (Tứ Trụ)**: UI Radar ngũ giác trực quan bằng SVG thể hiện điểm số các hành.
- **Bát Tự (Tứ Trụ)**: Nút Copy text toàn bộ lá số định dạng gọn gàng, phù hợp paste vào Notes/Telegram.

### Cải Thiện (Changed)
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

### Sửa Lỗi (Fixed)
- **Tử Vi**: Đưa tùy chọn vào cùng thanh nhập liệu và tách workspace lá số/chat để việc chỉnh form không làm thay đổi bố cục luận giải.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi khối Dụng Thần bị bỏ trống khi Nhật Chủ Trung Hòa — nay tự động tham chiếu Pháp Điều Hậu, có ghi rõ đang dùng pháp nào.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi mảng Hỷ Thần bị rỗng trong kết quả luận giải.
- **Bát Tự (Tứ Trụ)**: Sửa hiển thị chữ "t" thành "tháng" (Tuổi khởi vận) và "tuổi" (Lưu niên) để tránh nhầm lẫn.
- **Bát Tự (Tứ Trụ)**: Sửa logic Tuần Không Vong, map và in chính xác các chi rơi vào Tuần Không ở bảng Tứ Trụ.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi Tooltip rườm rà ở thẻ bảng Lưu Niên đè lên các thao tác.
