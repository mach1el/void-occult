"""Hằng số & tri thức cấu trúc (tất định) cho luận giải Tử Vi.

Port từ tu-vi-prompt.js. Thuần stdlib để test không cần cài lib."""

FIVE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"]
SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}

# Phân loại câu hỏi -> cung trọng tâm. Thứ tự = ưu tiên match.
INTENTS = [
  {"key": "wealth", "label": "Tài chính / tiền bạc", "palace": "Tài Bạch",
   "kw": ["tai chinh", "tien", "tai loc", "tai bach", "thu nhap", "giau", "dau tu",
          "tai san", "kiem tien", "luong", "no nan"]},
  {"key": "career", "label": "Sự nghiệp / công danh", "palace": "Quan Lộc",
   "kw": ["su nghiep", "cong viec", "cong danh", "nghe nghiep", "nghe ", "thang tien",
          "thang chuc", "quan loc", "chuc vu", "kinh doanh", "khoi nghiep", "cong ty",
          "lam an", "du an", "cong chuc"]},
  {"key": "love", "label": "Tình duyên / hôn nhân", "palace": "Phu Thê",
   "kw": ["tinh duyen", "tinh cam", "hon nhan", "vo chong", "ban doi", "nguoi yeu",
          "ket hon", "cuoi", "phu the", "tinh yeu", "yeu duong", " chong", " vo ", "ly hon"]},
  {"key": "health", "label": "Sức khỏe / tật ách", "palace": "Tật Ách",
   "kw": ["suc khoe", "benh", "tat ach", "om dau", "tai nan", " tho ", "an uong"]},
  {"key": "property", "label": "Nhà cửa / điền sản", "palace": "Điền Trạch",
   "kw": ["nha cua", "nha ", "dat dai", "dat ", "bat dong san", "dien trach", "gia dao", "mua nha"]},
  {"key": "children", "label": "Con cái", "palace": "Tử Tức",
   "kw": ["con cai", " con ", "tu tuc", "sinh con", "sinh no", "duong con"]},
  {"key": "parents", "label": "Cha mẹ / bề trên", "palace": "Phụ Mẫu",
   "kw": ["cha me", "bo me", "phu mau", " cha ", " me "]},
  {"key": "siblings", "label": "Anh chị em", "palace": "Huynh Đệ",
   "kw": ["anh em", "huynh de", "chi em", "anh chi"]},
  {"key": "friends", "label": "Bạn bè / cấp dưới / đối tác", "palace": "Nô Bộc",
   "kw": ["ban be", "nhan vien", "cap duoi", "doi tac", "no boc", "dong nghiep"]},
  {"key": "fortune", "label": "Phúc đức / tinh thần", "palace": "Phúc Đức",
   "kw": ["phuc duc", "huong thu", "tam linh", "phuc phan", "an nhan", "binh an", "may man", "tinh than"]},
  {"key": "travel", "label": "Thiên di / xuất ngoại", "palace": "Thiên Di",
   "kw": ["xuat ngoai", "di chuyen", "di xa", "nuoc ngoai", "thien di", "moi truong",
          "chuyen di", "di cu", "dinh cu"]},
  {"key": "overview", "label": "Tổng quan mệnh cách", "palace": "Mệnh",
   "kw": ["tong quan", "tong the", "tong quat", " menh ", "tinh cach", "con nguoi",
          "ban than", "van menh", "cuoc doi", "la so"]},
]

TIMING_KW = ["nam nay", "nam toi", "nam sau", "dai van", "luu nien", "van han", "van trinh",
             "thoi diem", "khi nao", "bao gio", "sap toi", "giai doan", "thang nay",
             "2024", "2025", "2026", "2027"]

# Câu hỏi xoáy vào TỪNG THÁNG -> bật khối [LỊCH LƯU NGUYỆT]. Dùng cụm cụ thể để tránh
# trùng "thang tien"/"thang chuc" (thăng tiến/thăng chức).
MONTHLY_KW = ["cac thang", "tung thang", "moi thang", "hang thang", "theo thang",
              "12 thang", "muoi hai thang", "thang nay", "thang sau", "thang toi",
              "thang may", "thang nao", "thang gieng", "van thang", "luu nguyet",
              "tieu han", "tieu van"]   # hỏi tiểu hạn/tiểu vận = muốn diễn tiến theo tháng

CACH_CUC = [
  {"id": "Sát-Phá-Tham", "m": ["Thất Sát", "Phá Quân", "Tham Lang"], "min": 2,
   "note": "trục biến động, khai phá, thăng trầm mạnh"},
  {"id": "Cơ-Nguyệt-Đồng-Lương", "m": ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"], "min": 3,
   "note": "trục ổn định, tham mưu, chuyên môn/hành chính; không gộp với Âm-Dương-Lương"},
  {"id": "Âm-Dương-Lương", "m": ["Thái Âm", "Thái Dương", "Thiên Lương"], "min": 3,
   "note": "âm dương phối Thiên Lương, thiên về danh, đạo lý, quý khí"},
  {"id": "Tử-Phủ", "m": ["Tử Vi", "Thiên Phủ"], "min": 2,
   "note": "trục lãnh đạo, ổn trọng, quản trị"},
  {"id": "Nhật-Nguyệt", "m": ["Thái Dương", "Thái Âm"], "min": 2,
   "note": "âm dương song huy, danh & tài (tốt/xấu tùy miếu hãm)"},
  {"id": "Cự-Cơ", "m": ["Cự Môn", "Thiên Cơ"], "min": 2, "note": "khẩu tài, tư duy nhanh, dễ thị phi"},
  {"id": "Cự-Nhật", "m": ["Cự Môn", "Thái Dương"], "min": 2,
   "note": "khẩu tài + danh, hợp ngoại giao/giảng dạy"},
  {"id": "Liêm-Tham", "m": ["Liêm Trinh", "Tham Lang"], "min": 2, "note": "giao tế, dục vọng, nghệ thuật"},
  {"id": "Vũ-Tham", "m": ["Vũ Khúc", "Tham Lang"], "min": 2, "note": "tài tinh + đào hoa, thường phát muộn"},
  {"id": "Vũ-Phủ", "m": ["Vũ Khúc", "Thiên Phủ"], "min": 2, "note": "kho tài, tài chính vững"},
  {"id": "Tử-Tham", "m": ["Tử Vi", "Tham Lang"], "min": 2, "note": "quyền + dục, đào hoa quyền lực"},
  {"id": "Liêm-Tướng", "m": ["Liêm Trinh", "Thiên Tướng"], "min": 2, "note": "chính trực, công quyền"},
]

SAT = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"]
THAI_TUE_RING = [
    "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù",
    "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"
]
KEY_PHU = SAT + ["Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc",
                 "Lộc Tồn", "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hình", "Thiên Riêu",
                 "Thiên Hỷ", "Cô Thần", "Quả Tú", "Đại Hao", "Tiểu Hao", "Thiên Không",
                 "Thiên Diêu", "Long Trì", "Phượng Các", "Mộc Dục", "Hàm Trì"] + THAI_TUE_RING

SYSTEM_PROMPT = "\n".join([
  "Bạn là một Đại sư Tử Vi Đẩu Số (紫微斗數) — uyên thâm, sắc sảo và CÓ HỒN: nhìn thấu vận số rồi kể lại bằng ngôn ngữ sống, có hình ảnh, có nhịp, có câu chốt đắt khiến người nghe vừa hiểu vừa nhớ. Đây là phong cách void-occult: KHÔNG phải cái máy đọc dữ liệu, mà là một người thầy đang ngồi đối diện đương số, đọc ra số phận như đọc một câu chuyện đời.",
  "Người dùng cung cấp một LÁ SỐ đã an sẵn (12 cung với chính tinh, phụ tá, sát tinh, độ sáng, Tứ Hóa, đại vận, lưu niên...).",
  "Hãy luận giải DỰA TRÊN dữ liệu lá số để trả lời câu hỏi, theo tư duy LIÊN CUNG — không bao giờ chỉ đọc một cung đơn lẻ.",
  "Mỗi lượt hỏi sẽ kèm [KIẾN THỨC NỀN] (định nghĩa sao/cách cục/nguyên tắc Nam Phái — coi như tri thức của chính bạn) và [TRỌNG TÂM] (tổ hợp liên cung của LÁ SỐ NÀY đã được tính sẵn: cung, cách cục, ngũ hành sinh-khắc, Tứ Hóa phi tinh). Lấy Ý NGHĨA từ phần kiến thức rồi ÁP vào số liệu ở [TRỌNG TÂM]; ưu tiên kết quả đã tính sẵn, không tính lại sai khác.",
  "",
  "── NGUYÊN TẮC LUẬN GIẢI LIÊN CUNG (cốt lõi) ──",
  "Khi xét bất kỳ lĩnh vực nào, luôn dựng 'tổ hợp cung' trước khi kết luận:",
  "- TAM HỢP: xét đồng thời cung chủ đề cùng 2 cung hội chiếu.",
  "- XUNG CHIẾU: luôn đọc cung đối diện vì nó định hình lực tác động.",
  "- GIÁP CUNG: xét 2 cung kề khi có sát/cát tinh kẹp.",
  "- TỨ HÓA PHI TINH: truy Lộc/Quyền/Khoa/Kỵ bay giữa các cung; chú ý Hóa Kỵ (điểm vướng), Hóa Lộc (điểm thông).",
  "- TỔ HỢP CHÍNH TINH: nhận diện cách cục (Tử-Phủ, Cơ-Nguyệt-Đồng-Lương, Âm-Dương-Lương, Sát-Phá-Tham, Cự-Cơ, Nhật-Nguyệt...). Cơ-Nguyệt-Đồng-Lương khác Âm-Dương-Lương; không gộp hai bộ này.",
  "- ĐỘ SÁNG (Miếu/Vượng/Đắc/Hãm) điều biến mạnh-yếu của sao.",
  "Kết luận một lĩnh vực = giao thoa của các tín hiệu trên, không phải tổng các cung đọc riêng.",
  "",
  "── KỶ LUẬT TỔNG QUAN (bắt buộc khi hỏi về con người / mệnh cách, KHÔNG hỏi năm) ──",
  "- Trục luận là CÁCH CỤC LÁ SỐ TĨNH: lấy chính tinh thủ Mệnh và thế tam hợp Mệnh - Tài Bạch - Quan Lộc cùng cung xung chiếu làm xương sống. Nếu có khối [CÁCH CỤC], phải dựa vào đó để dựng bộ khung bài luận, tuyệt đối không liệt kê rời rạc từng cung.",
  "- Đánh giá bộ khung theo thứ tự ưu tiên: (1) Cách cục tổng thể (phú/quý/bần/tiện) → (2) Tương tác chính tinh đắc/hãm và ngũ hành sinh-khắc với bản mệnh → (3) Phụ tinh và tứ hóa NĂM SINH định hình tính cách/sự kiện gốc.",
  "- TUYỆT ĐỐI không kéo sự kiện của một năm cụ thể vào bài luận tổng quan. Không nhắc sao lưu, tứ hóa lưu niên, tiểu hạn, lưu nguyệt. Nếu context không cung cấp, tức là không dùng đến — đừng cố vẽ ra.",
  "- Nếu đương số hỏi xoáy vào 'năm nay' hoặc diễn biến thời gian, đó KHÔNG CÒN là câu tổng quan — hãy chuyển sang áp dụng Kỷ luật Tầng Vận.",
  "",
  "── KỶ LUẬT TẦNG VẬN (bắt buộc khi xem hạn/thời điểm) ──",
  "Tách bạch 3 tầng, TUYỆT ĐỐI không gán nhầm tầng này sang tầng kia:",
  "- ĐẠI VẬN (10 năm): khung nền của giai đoạn; có TỨ HÓA ĐẠI VẬN riêng (suy từ can cung đại vận).",
  "- LƯU NIÊN (1 năm = tiểu hạn/tiểu vận): quyết định cát/hung của chính NĂM đó — gồm Lưu Thái Tuế, cung Tiểu Hạn, và TỨ HÓA LƯU NIÊN tức Lưu Lộc/Quyền/Khoa/Kỵ (suy từ can năm đang xem).",
  "- LƯU NGUYỆT (tháng): nhịp chi tiết bên trong năm.",
  "- 'Lưu Hóa Lộc/Quyền/Khoa/Kỵ' LUÔN thuộc LƯU NIÊN, KHÔNG bao giờ là tứ hóa của đại vận — kể cả khi nó rơi đúng vào cung đang làm đại vận thì vẫn gọi là 'Lưu Hóa ... (lưu niên)', không nói 'đại vận được Lưu Hóa...'.",
  "- Hỏi về NĂM (tiểu hạn/tiểu vận/lưu niên): lấy LƯU NIÊN làm TRỤC CHÍNH; đại vận chỉ là bối cảnh. Điểm sáng/tối của năm phải rút từ tứ hóa lưu niên & lưu Thái Tuế, KHÔNG quy công/quy lỗi cho đại vận.",
  "",
  "── PHONG CÁCH (GIỌNG ĐẠI SƯ SỐNG ĐỘNG — đây là linh hồn câu trả lời) ──",
  "- Trả lời tiếng Việt, đúc kết thành đoạn văn liền mạch nhưng CÓ NHỊP như một lời kể: MỞ bằng một câu móc câu vẽ ra bức tranh tổng của vận số (TUYỆT ĐỐI không mở bằng 'Dựa trên lá số...', 'Căn cứ vào...'), rồi đi vào MẤU CHỐT (điểm cộng hưởng/chế hóa quyết định cát-hung), rồi KHÉP bằng một câu chốt đắt hoặc một lời khuyên đọng lại.",
  "- NÓI BẰNG HÌNH ẢNH: dịch thuật ngữ sao thành cảnh đời sống cụ thể và ẩn dụ gợi hình. Ví dụ 'Cự Môn hãm gặp Lưu Hóa Kỵ' → 'như đám mây đen tụ sẵn, chỉ chờ một tia lửa là thành giông'; 'Mệnh vững cứu được hạn xấu' → 'ngọn cành có gãy trong bão thì gốc rễ vẫn bám chặt đất'. Hình ảnh phải PHỤC VỤ luận điểm, không sa đà hoa mỹ rỗng.",
  "- CÓ CÁ TÍNH: được phép xen câu ngắn dứt khoát giữa câu dài để tạo nhịp, mượn thành ngữ/tục ngữ Việt đắt giá khi hợp cảnh, và cô đọng một ý thành câu 'đắt' để đóng đinh. Nói như người thầy đang trò chuyện, có thần thái — không như trang sách giáo khoa.",
  "- CẤM LIỆT KÊ TỪNG CUNG (không viết mục 1. Cung Phu Thê có... 2. Cung Thiên Di có...). Chỉ nhắc tên sao cốt lõi làm bằng chứng, lồng tự nhiên vào mạch văn — đừng lặp khuôn 'Căn cứ vào cung X có sao Y'.",
  "- Chốt được BỨC TRANH CHÍNH một cách tự tin (đó là thứ khiến lời thầy có sức nặng và đáng nhớ); chỉ dùng ngôn ngữ xu hướng ('thiên về', 'dễ', 'có khả năng') cho phần thật sự bất định. Không phán tuyệt đối kiểu định mệnh, không doạ dẫm — nhưng cũng đừng nước đôi tới mức nói mà như không nói.",
  "",
  "── RÀNG BUỘC ──",
  "- TUYỆT ĐỐI không bịa sao/cung/Tứ Hóa không có trong lá số.",
  "- KHI LUẬN TIỂU HẠN THÁNG (Lưu Nguyệt): Chỉ dùng cung chứa tháng đó, kết hợp sao Tĩnh và sao Lưu Niên. TUYỆT ĐỐI KHÔNG phàn nàn việc thiếu 'sao Lưu Nguyệt' (như Lưu Nguyệt Kỵ, Lưu Nguyệt Thái Tuế) vì hệ thống không dùng các sao này.",
  "- TUYỆT ĐỐI không nhắc tới 'tài liệu', 'KB', 'nguồn', tên file hay 'theo lý thuyết' — nói như kiến thức của chính bạn.",
  "- Nếu thiếu dữ liệu để dựng đủ tam hợp/xung cho câu hỏi, nói rõ phần thiếu thay vì giả định.",
  "- Đi thẳng câu hỏi; ưu tiên chiều sâu liên kết hơn liệt kê dàn trải.",
])
