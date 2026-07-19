# Research Memo — Huyền Khí Reverse-Spec V0.1

## Kết luận hiện tại

Huyền Khí phải được nghiên cứu như một **điểm khí lực của từng cung**, không phải một phép cộng cát tinh trừ sát tinh chung chung. Nguồn công khai mô tả điểm mạnh là điều kiện để sát tinh được chế hóa; điểm yếu không đủ lực nuôi thì sát tinh phá cung chức. Nguồn hướng dẫn khác dùng dấu dương/âm để nghiêng cách luận về ưu điểm hoặc nhược điểm.

Tuy nhiên, nguồn công khai cũng nói phần lý thuyết thực sự không được công khai đầy đủ và cảnh báo việc bắt chước điểm số. Vì vậy pack này không tuyên bố tái tạo công thức gốc. Mục tiêu là xây **reverse-spec có provenance**, phân biệt rõ điều đã xác nhận, điều suy ra từ output và điều còn là giả thuyết.

## Phát hiện dữ liệu chắc nhất

Bộ mẫu ban đầu gồm **18 lá số Huyền Khí công khai**. Cả 18/18 trường hợp đều thỏa:

```text
Điểm Huyền Khí toàn lá số
= tổng điểm Huyền Khí của 12 cung
```

Khi một cung không xuất hiện trong danh sách “cung tốt/cung xấu”, giá trị 0 chỉ được chấp nhận nếu phép cộng khớp tổng công khai.

Trong 207 giá trị cung khác 0 đã ghi nhận, 170 giá trị (82.1%) là bội số chính xác của 0.25. Các giá trị như 0.18, 0.23, 0.31, -0.34 và -0.87 cho thấy output không phải bảng tra thuần túy theo bước 0.25. Giả thuyết hợp lý để kiểm tra là **base score thô + modifier nhỏ**, nhưng chưa được phép đưa vào production.

## Phân biệt bốn namespace

- `huyen-khi`: điểm từng cung và tổng lá số trên trang phổ biến; liên quan khả năng chế hóa và mức thụ hưởng tính chất tốt của cung.
- `xi-hoa`: chỉ số riêng trên trang Bắc Phái, xuất hiện cùng Phi Hóa và Thất Tinh; chưa chứng minh bằng Huyền Khí.
- `dau-minh`: điểm riêng của cung/sao trên trang tổng hợp; chưa chứng minh bằng Huyền Khí.
- `cung-khi`: cấu trúc Ngũ hành công khai 20% Can cung, 50% Chi cung, 30% Nạp Âm Can-Chi, sau đó gắn Hỉ/Kị/Nhàn.

Không được nhập nhằng bốn namespace này trong code hoặc dataset.

## Kiến trúc nghiên cứu đề xuất

```text
Public numeric outputs
+ Calculation Core chart facts
→ controlled corpus
→ atomic feature ledger
→ hypothesis tests / matched pairs
→ versioned symbolic rule candidate
→ unseen exactness benchmark
```

Không dùng output của Tử Vi Cổ Học ở runtime. Không sao chép phần luận giải dài. Không tự động thu thập quy mô lớn trước khi kiểm tra robots/điều khoản và áp dụng rate limit.

## Thứ tự tìm công thức

1. Khóa additivity của 12 cung.
2. Tìm base score theo Cục, vị trí cung, Mệnh/Thân và cấu trúc chính tinh.
3. Tách modifier của trạng thái sao, VCD, Tuần/Triệt, Tứ Hóa.
4. Chỉ thêm tam hợp/xung/giáp khi controlled pairs chứng minh.
5. Dùng symbolic regression chỉ để đề xuất giả thuyết; mọi rule production phải có diễn giải và provenance.
6. Giữ bộ test unseen theo nhóm năm sinh/ngày sinh để tránh memorization.

## Điều chưa biết

- Bảng điểm nguyên tử của từng sao và trạng thái.
- Quan hệ chính xác giữa Mệnh, Cục, Nạp Âm và điểm cung.
- Vai trò của tam hợp, xung chiếu, nhị hợp, giáp cung.
- Quy tắc Tuần/Triệt và Tứ Hóa.
- Quan hệ Huyền Khí với Xí Hoa, Đẩu Minh và Cung Khí.
- Quy tắc làm tròn và giới hạn điểm.

## Quyết định kỹ thuật

Phase này chỉ tạo research data, extractor, audit và candidate rules. Không thay thế scorer sáu trục đã merge. Annual Axes phải tiếp tục được xem là experimental cho tới khi có Huyền Khí engine được benchmark riêng.
