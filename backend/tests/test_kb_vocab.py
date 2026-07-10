import sys
import unittest
import pathlib
import re

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from app.constants import KEY_PHU  # noqa: E402
from app.kb.retriever import CORE_DOCS, INTENT_DOCS, TIMING_DOCS, MONTHLY_DOCS, TIMING_BY_INTENT  # noqa: E402

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

        # === Test: Formatting ===
        for fp in self.kb_dir.glob("*.md"):
            content = fp.read_text(encoding="utf-8")
            
            # Format checks only on the newly updated / created docs
            new_docs = {
                "cung_tat_ach.md", "cung_phu_mau.md", "cung_huynh_de.md", "cung_tu_tuc.md", 
                "cung_no_boc.md", "cung_thien_di.md", "cung_tai_bach.md", "cung_phu_the.md", 
                "tu_hoa_tam_phap.md"
            }
            if fp.name in new_docs:
                # Ensure exactly one H1
                h1_count = len([line for line in content.split('\n') if line.startswith("# ")])
                if h1_count != 1:
                    errors.append(f"{fp.name}: Expected exactly 1 '# ' H1, found {h1_count}")
                
                # Ensure KẾT LUẬN CHO AI
                if "KẾT LUẬN CHO AI" not in content:
                    errors.append(f"{fp.name}: Missing 'KẾT LUẬN CHO AI'")
            
            # Health guardrail
            if fp.name == "cung_tat_ach.md":
                blacklist = ["sẽ bị", "mắc bệnh", "tử vong", "chết", "tuổi thọ", "mổ"]
                lower_content = content.lower()
                for bad in blacklist:
                    if bad in lower_content:
                        errors.append(f"cung_tat_ach.md: Found forbidden medical term '{bad}'")
                        
        if errors:
            self.fail("\n" + "\n".join(errors))

    def test_retriever_coverage(self):
        # Collect all referenced docs
        referenced = set(CORE_DOCS + TIMING_DOCS + MONTHLY_DOCS)
        for docs in INTENT_DOCS.values():
            referenced.update(docs)
        for docs in TIMING_BY_INTENT.values():
            referenced.update(docs)
            
        # Collect all actual files
        actual_files = {fp.name for fp in self.kb_dir.glob("*.md")}
        
        errors = []
        # Dangling
        for ref in referenced:
            if ref not in actual_files and ref != "cach_cuc_kinh_dien.md" and ref != "tuan_triet.md": # Some might be dynamic or not implemented yet
                if ref != "tuan_triet.md" and ref != "cach_cuc_kinh_dien.md": 
                    errors.append(f"Dangling reference in retriever: {ref}")
        
        # Orphan
        for fp in actual_files:
            if fp not in referenced and fp not in ["cach_cuc_kinh_dien.md", "tuan_triet.md"]:
                errors.append(f"Orphan file not used in retriever: {fp}")
                
        if errors:
            self.fail("\n" + "\n".join(errors))

if __name__ == '__main__':
    unittest.main()
