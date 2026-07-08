import unittest
import pathlib
import re

from backend.app.constants import KEY_PHU

class TestKBVocab(unittest.TestCase):
    def setUp(self):
        self.kb_dir = pathlib.Path(__file__).parent.parent / "app" / "kb" / "data" / "nam_phai"
        
        self.chinh_tinh = {
            "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
            "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
            "Thất Sát", "Phá Quân"
        }
        self.phu_tinh = set(KEY_PHU)
        self.tu_hoa = {"Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"}
        self.khac = {"Tuần", "Triệt", "Tuần Không", "Triệt Không"}
        self.valid_stars = self.chinh_tinh | self.phu_tinh | self.tu_hoa | self.khac
        self.valid_stars = self.valid_stars.union({"Lưu " + x for x in self.valid_stars})
        
        # Danh sách ALL stars từ star-classification.ts (approx)
        self.all_engine_stars = self.chinh_tinh | self.tu_hoa | self.khac | {
            "Tả Phụ", "Tả Phù", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc",
            "Lộc Tồn", "Thiên Mã", "Thiên Tài", "Thiên Thọ", "Ân Quang", "Thiên Quý", "Thiên Quan",
            "Thiên Phúc", "Quốc Ấn", "Đường Phù", "Thiên Trù", "Long Đức", "Phúc Đức", "Thiên Đức",
            "Nguyệt Đức", "Thiên Giải", "Địa Giải", "Giải Thần", "Đào Hoa", "Hồng Loan", "Thiên Hỷ",
            "Hỷ Thần", "Thanh Long", "Thai Phụ", "Phong Cáo", "Thiên Y", "Hoa Cái", "Thiếu Dương",
            "Thiếu Âm", "Bác Sĩ", "Lực Sĩ", "Tướng Quân", "Tấu Thư", "Tam Thai", "Bát Tọa", "Long Trì",
            "Phượng Các", "Tướng Tinh", "Phàn An", "Tuế Dịch", "Hàm Trì",
            "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Thiên Không",
            "Đại Hao", "Tiểu Hao", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư", "Tuần Không",
            "Triệt Không", "Thiên La", "Địa Võng", "Thiên Sứ", "Thiên Thương", "Thiên Riêu", "Thiên Diêu",
            "Thái Tuế", "Thiên Hình", "Cô Thần", "Quả Tú", "Đẩu Quân", "Kiếp Sát", "Phá Toái", "Phục Binh",
            "Quan Phù", "Tử Phù", "Tuế Phá", "Điếu Khách", "Trực Phù", "Lưu Hà", "Phi Liêm", "Bệnh Phù",
            "Quan Phủ", "Thiên Sát", "Nguyệt Sát", "Tai Sát", "Tức Thần", "Chỉ Bối", "Vong Thần",
            "Mộc Dục"
        }
        self.all_engine_stars = self.all_engine_stars.union({"Lưu " + x for x in self.all_engine_stars})

    def test_vocab_is_valid(self):
        pattern = re.compile(r'\*\*([^*]+)\*\*')
        errors = []
        for fp in self.kb_dir.glob("*.md"):
            content = fp.read_text(encoding="utf-8")
            
            if fp.name != "phong_cach_luan_giai.md" and ".md" in content:
                errors.append(f"{fp.name}: Contains '.md'")
                
            for match in pattern.finditer(content):
                terms = match.group(1).split(",")
                for t in terms:
                    t = t.strip()
                    if " / " in t:
                        t_parts = t.split(" / ")
                    elif "/" in t:
                        t_parts = t.split("/")
                    elif " (" in t:
                        t_parts = [t.split(" (")[0]]
                    elif " +" in t:
                        t_parts = t.split(" + ")
                    else:
                        t_parts = [t]
                        
                    for part in t_parts:
                        part = part.strip()
                        # Clean further
                        if part.startswith("Sao "):
                            part = part[4:]
                        
                        # Only flag if it's an engine star BUT NOT in valid_stars
                        if part in self.all_engine_stars and part not in self.valid_stars:
                            errors.append(f"{fp.name}: Invisible star used: '{part}'")

        if errors:
            self.fail("\n" + "\n".join(errors))

if __name__ == '__main__':
    unittest.main()
