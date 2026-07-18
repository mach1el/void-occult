# Changelog

Tất cả những thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Unreleased]

### Thêm Mới (Added)
- **Tử Vi**: Profile chấm điểm Lưu Nguyệt experimental `nam-phai-monthly-v2` (opt-in) — multi-axis benefit/risk/activation/conflict/stability/confidence, soft saturation, dominance chính tinh, mượn đối cung VCD, cộng hưởng Đại vận linked và pattern declarative; mặc định production vẫn `legacy-v1`.
- **Tử Vi**: Radar vận hạn 6 trục theo năm xem (Sức khỏe · Gia đạo · Tài lộc · Công việc · Giao hữu · Tình duyên) đặt cạnh radar Khí vận 12 cung — chồng lớp nền gốc và vận khí năm, tính sao Lưu theo Ngũ Hành/cung đối, kích hoạt Tiểu Hạn–Thái Tuế, guardrails liên trục và breakdown minh bạch.
- **Tử Vi**: Biểu đồ xu hướng Đại vận và Lưu niên (hai lớp Cát / Hung độc lập theo cung hạn + tam phương tứ chính), panel breakdown từng mốc, và radar độ vững 12 cung đặt đầu khối — engine heuristic tất định, không cần LLM để tạo số.
- **Hạ tầng**: Thêm nút trái tim (Support my work) góc dưới màn hình kèm mã QR VietQR và link PayPal để tiện lợi cho việc ủng hộ tác giả.
- **Tử Vi**: Bổ sung Họ tên, tình trạng công việc và tình trạng mối quan hệ vào form lập lá số và context luận giải AI.
- **Bát Tự (Tứ Trụ)**: Hệ thống tính điểm ngũ hành tự động dựa trên Tàng Can, Nguyệt Lệnh và Trụ.
- **Bát Tự (Tứ Trụ)**: Engine phân tích Dụng Thần, Hỷ Thần, Kỵ Thần theo pháp Phù Ức.
- **Bát Tự (Tứ Trụ)**: UI Radar ngũ giác trực quan bằng SVG thể hiện điểm số các hành.
- **Bát Tự (Tứ Trụ)**: Nút Copy text toàn bộ lá số định dạng gọn gàng, phù hợp paste vào Notes/Telegram.

### Sửa Lỗi (Fixed)
- **Tử Vi**: Lưu Nguyệt tách bạch Can Chi lịch tháng khỏi cung Lưu Nguyệt Mệnh — Tứ Hóa/Nguyệt Lộc Tồn/Kình/Đà/Xung Thái Tuế tháng nay dùng đúng Can Chi lịch (Ngũ Hổ Độn theo can năm xem), không còn suy nhầm từ can/chi của cung tháng nhập vào. Điểm Tứ Hóa Lưu Nguyệt sửa đúng 10/8/6/15 (trước đó vô tình lấy nhầm điểm CSV 6/5/4/6); loại bỏ double-count khi một Tứ Hóa vừa có marker trên lá số vừa có record riêng.
- **Tử Vi**: Tam Hóa Liên Châu vẫn thưởng cột Cát khi TP4C có Không/Kiếp — sát tinh chỉ cộng Hung, không hủy combo Cát.
- **Tử Vi**: Đất Nhà mở rộng: mọi cung thuộc tam hợp Mệnh hoặc tam hợp Thân nhận trọng số tam hợp 0.6 (không còn chỉ Mệnh–Tài–Quan khi ĐV là Quan/Thân).
- **Tử Vi**: Tuần và Triệt đồng cung trên lá số compact xếp ngang cạnh nhau, không còn chồng dọc.
- **Tử Vi**: Breakdown xu hướng — làm tròn điểm 1 chữ số thập phân (tránh `6.8999…`); Ngũ Hành Vận hiện là hệ số nhân (ghi chú `×M`, thô → sau) đã nhân vào từng dòng, không còn dòng delta âm trên cột Hung.
- **Tử Vi**: Chuẩn hóa scoring Đại vận theo công thức 6 bước — điểm sao từ CSV × độ sáng × ngũ hành × trọng số TP4C (Đất Nhà nâng Mệnh/Tài/Quan lên 0.6); catalog cách cục mới; Khoa Chế Không / Đại Giải Ách; Cát–Hung độc lập.
- **Tử Vi**: Chuẩn hóa scoring Đại vận theo công thức mới — Sát Phá Tham Hãm vào cột Hung (không thưởng Cát); Ngũ hành nhân toàn cục Cát/Hung (không cộng trừ lắt nhắt); cột Hung chỉ cộng áp lực tuyệt đối (bỏ hóa giải trừ hung); trọng số TP4C 1.0/0.5/0.3; chính tinh Đắc vào Cát; Mộ Trường Sinh vào Hung.
- **Tử Vi**: Mở "Xem cách tính" trên một biểu đồ xu hướng không còn kéo giãn chiều cao biểu đồ bên cạnh.
- **Tử Vi**: Đồng bộ làm tròn giải thích radar vận hạn — điểm nền B_D trên UI bằng đúng tổng các dòng thành phần đã hiện (WYSIWYG), không còn lệch nhẩm mắt so với `round(tổng float)`.

### Cải Thiện (Changed)
- **Tử Vi**: Panel Lưu Nguyệt hiện rõ Tháng + Can Chi + cung Lưu Nguyệt Mệnh; breakdown nhóm chính tinh chủ tháng / hội chiếu, Tứ Hóa (layer + target) và Vô chính diệu TP4C — không đổi điểm Cát/Hung.
- **Tử Vi**: Bỏ hệ số Ngũ Hành Bản Mệnh khỏi công thức tính điểm từng sao (Đại vận, Lưu niên, Lưu nguyệt, radar 12 cung và radar 6 trục) — điểm sao nay tính thuần theo CSV × độ sáng (Miếu/Vượng/Đắc/Hãm) và cách cục, không còn chiết khấu theo quan hệ Ngũ Hành sao–Mệnh. Breakdown gọn lại: chỉ còn tên sao, độ sáng và nguồn kích hoạt, bỏ các ghi chú "mệnh khắc sao / sao khắc mệnh / thuận mệnh".
- **Tử Vi**: Lưu nguyệt (12 tháng trong năm) tính thêm Nguyệt Lộc Tồn/Kình Dương/Đà La theo can tháng riêng, và phát hiện các cách cục trùng lặp Lộc/Kỵ giữa tháng–năm–gốc (Kỵ Trùng Kỵ, Lộc Trùng Lộc), Xung Thái Tuế, Khoa Chế Nguyệt Kỵ — thay vì âm thầm bỏ qua tín hiệu trùng như trước.
- **Tử Vi**: Biểu đồ xu hướng Đại vận/Lưu niên chồng Cát và Hung trên cùng một cột (opacity + viền), vẫn bật/tắt từng lớp và đọc rõ bên mạnh/yếu.
- **Tử Vi**: Hai radar mở breakdown độc lập không kéo cao chart bên cạnh, bấm lại điểm đang chọn để đóng; trường Mệnh trên lá số hiển thị đầy đủ Nạp Âm Lục Thập Hoa Giáp.
- **Tử Vi**: Nâng radar Khí vận 12 cung lên mô hình v2 dùng bảng điểm sao riêng, Tam Phương Tứ Chính, Ngũ Hành theo phái, Tuần/Triệt, Vô chính diệu và breakdown điểm minh bạch theo thang tuyệt đối 0–100.
- **Tử Vi**: Tách stylesheet layout desktop/mobile — page shell chỉ sống trong `tu-vi.css`; CSS lá số compact và dạng đọc không còn đè layout trang.
- **Tử Vi**: Sắp xếp lại form lập lá số theo trình tự nhập tự nhiên, đồng thời tăng chiều cao lá số và khung luận giải trên desktop để dễ theo dõi hơn.
- **Tử Vi**: Giảm chiều cao mặc định của lá số (CompactChart) từ tỉ lệ cũ giúp lá số trở nên vuông vắn hơn, đồng thời làm cho khối Chat AI cũng gọn lại trên màn hình desktop lớn.
- **Tử Vi**: Nâng cấp toàn diện hệ thống chấm điểm Đại vận và Lưu niên (Chart Weight Engine). Bổ sung luật Môi trường Địa bàn (Tứ Sinh, Tứ Mộ, Tứ Mã), tự động mượn sao đối cung khi Vô chính diệu, quét 4 cách cục lớn (Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Tam Kỳ Gia Hội), và tương tác Ngũ hành tương sinh/tương khắc giữa cung hạn và Mệnh chủ.
- **Tử Vi**: Áp dụng cách cục đặc biệt: Hỏa/Linh Tham có phá cách (vỡ cách khi gặp Kỵ/Kình/Đà), tinh chỉnh Tam Kỳ Gia Hội (chỉ dùng Hóa Lộc, loại Lộc Tồn) và điều chỉnh weight Thanh Long - Hóa Kỵ.
- **Tử Vi**: Đổi mặc định công cụ xem hạn trên giao diện sang Lưu niên.
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
- **Tử Vi**: Sửa dấu giảm hung của cách Hỏa/Linh Tham và bỏ tooltip tên radar che biểu đồ khi rê chuột.
- **Tử Vi**: Mobile dùng font Việt rõ hơn cho Phi Hóa và tăng độ sáng vàng kim ở trạng thái chọn Nam Phái / Lá số cùng các điểm nhấn trên lá số compact.
- **Tử Vi**: Tách geometry CompactChart — desktop giữ 220×248 (880×992); mobile/stack ≤1200 dùng ô cao 300 (880×1200) để lá số không bị vuông thấp khi `width:100%`.
- **Tử Vi**: Khôi phục tỉ lệ cao của lá số compact (ô cung 248px) — hết bị rút ngắn gần vuông trên mobile khi scale theo chiều rộng màn hình.
- **Tử Vi**: Khôi phục đầy đủ chiều dài lá số và khung luận giải trên mobile, tránh cắt đáy lá số hoặc làm chatbox co mất khi giao diện chuyển sang một cột.
- **Tử Vi**: Đổi chỗ góc phải hàng nhập liệu — Nam Phái / Trung Châu, Tiểu Hạn và múi giờ thay vị trí giờ sinh / giới tính / năm xem; ba ô kia xuống hàng hoàn cảnh.
- **Tử Vi**: Chữ Phi Hóa ở đáy cung to hơn, dùng font sans đậm và viền nền nhẹ — dễ đọc hơn bản serif nhỏ trước đó.
- **Tử Vi**: Làm gọn thanh nhập liệu — tách 2 hàng (dữ liệu sinh / hoàn cảnh + phái + xuất), rút nhãn chọn ngắn hơn, bớt cắt chữ và bầy hây trên desktop.
- **Tử Vi**: Bỏ header "Lá số 12 cung" trên khối chart; chuyển Copy / TXT / Ảnh lên thanh nhập liệu để chart và chatbox cùng chiều cao, đồng đều hơn.
- **Tử Vi**: Desktop — lá số gọn fit view (trần ~1280px, sized theo chiều cao viewport), rộng/cao hơn bản trước; chatbox cùng hàng kéo dài theo; SVG giữ `width`/`height` attribute để không collapse mất lưới 12 cung.
- **Tử Vi**: Sửa lệch đáy giữa lá số và chatbox — panel chat kéo full chiều cao hàng grid cùng lá số.
- **Tử Vi**: Giữ lá số trần 1280px canh trái (không dùng max-content — bị thu về intrinsic 880px của SVG).
- **Tử Vi**: Chatbox giãn full phần còn lại sát lá số — cột chart sized theo fit viewport, hết khoảng trống giữa hai khối.
- **Tử Vi**: Đồng bộ nền kính giữa input/select và buộc menu lựa chọn native dùng màu tối tương phản.
- **Tử Vi**: Sửa hồi quy co nhỏ lá số/chat, đồng thời bố trí thông tin theo grid 2 cột và giữ tùy chọn compact bên cạnh.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi khối Dụng Thần bị bỏ trống khi Nhật Chủ Trung Hòa — nay tự động tham chiếu Pháp Điều Hậu, có ghi rõ đang dùng pháp nào.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi mảng Hỷ Thần bị rỗng trong kết quả luận giải.
- **Bát Tự (Tứ Trụ)**: Sửa hiển thị chữ "t" thành "tháng" (Tuổi khởi vận) và "tuổi" (Lưu niên) để tránh nhầm lẫn.
- **Bát Tự (Tứ Trụ)**: Sửa logic Tuần Không Vong, map và in chính xác các chi rơi vào Tuần Không ở bảng Tứ Trụ.
- **Bát Tự (Tứ Trụ)**: Sửa lỗi Tooltip rườm rà ở thẻ bảng Lưu Niên đè lên các thao tác.
- **Tử Vi**: Sửa điểm lưu nguyệt trên biểu đồ Lưu niên — engine xu hướng luôn an Tháng Giêng tại cung Lưu Đẩu Quân và can Tứ Hóa theo cung an vị, không phụ thuộc cách an lưu nguyệt trên lá số (Tiểu Hạn).
- **Tử Vi**: Phụ tinh (tầng 2 và tầng 3) sáng lên 1 tông so với lần chia tầng thị giác trước — tầng 3 (tạp diệu, sao lưu) từng trông quá tối, nay vẫn phân biệt được với chính tinh nhưng dễ đọc hơn.
