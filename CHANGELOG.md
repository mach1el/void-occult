# Changelog

Tất cả những thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Unreleased]

### Thêm Mới (Added)
- **Bát Tự (Tứ Trụ)**: Hệ thống tính điểm ngũ hành tự động dựa trên Tàng Can, Nguyệt Lệnh và Trụ.
- **Bát Tự (Tứ Trụ)**: Engine phân tích Dụng Thần, Hỷ Thần, Kỵ Thần theo pháp Phù Ức.
- **Bát Tự (Tứ Trụ)**: UI Radar ngũ giác trực quan bằng SVG thể hiện điểm số các hành.
- **Bát Tự (Tứ Trụ)**: Nút Copy text toàn bộ lá số định dạng gọn gàng, phù hợp paste vào Notes/Telegram.

### Cải Thiện (Changed)
- **Bát Tự (Tứ Trụ)**: Chuyển đổi hiển thị Bảng Lưu Niên và Thẻ Đại Vận sang cấu trúc Lưới (Grid) để đảm bảo đồng bộ chiều cao các ô, loại bỏ hiện tượng lệch hàng do chữ dài/ngắn.
- **Bát Tự (Tứ Trụ)**: Bỏ thanh cuộn ngang ở Thẻ Đại Vận trên màn hình Desktop, tự động chia thành nhiều hàng gọn gàng. Cải thiện thanh cuộn `custom-scrollbar` đẹp mắt hơn cho các bảng hiển thị trên mobile.
- **Bát Tự (Tứ Trụ)**: Tính toán Nhật Chủ Vượng / Nhược / Trung Hòa có cơ chế "minh bạch", hiển thị rõ cách tính điểm và lý luận bên dưới.
- **Bát Tự (Tứ Trụ)**: Cải tiến UI/UX với bố cục 2 cột (Radar - Phân tích), nén thẻ Tứ Trụ, highlight nổi bật Đại Vận hiện tại.
- **Bát Tự (Tứ Trụ)**: Thứ tự Bát Tự chuẩn hóa sang `Năm - Tháng - Ngày - Giờ`.
- **Bát Tự (Tứ Trụ)**: Thay đổi màu ngũ hành Kim thành `--color-metal` (bạc/xám) cho chuẩn phong thủy.
- **Bát Tự (Tứ Trụ)**: Tối ưu hoá hiển thị trên Mobile (cho phép cuộn ngang bảng Tứ Trụ, Đại Vận, Lưu Niên).
- **Bát Tự (Tứ Trụ)**: Mở rộng kích thước ô Bảng Lưu Niên để dễ đọc hơn, thêm hiệu ứng hover và phóng to nổi bật năm hiện tại.

### Sửa Lỗi (Fixed)
- **Bát Tự (Tứ Trụ)**: Sửa lỗi mảng Hỷ Thần bị rỗng trong kết quả luận giải.
- **Bát Tự (Tứ Trụ)**: Sửa hiển thị chữ "t" thành "tháng" (Tuổi khởi vận) và "tuổi" (Lưu niên) để tránh nhầm lẫn.
- **Bát Tự (Tứ Trụ)**: Sửa logic Tuần Không Vong, map và in chính xác các chi rơi vào Tuần Không ở bảng Tứ Trụ.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi Tooltip rườm rà ở thẻ bảng Lưu Niên đè lên các thao tác.
