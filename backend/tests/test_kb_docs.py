import sys
import unittest
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from app.kb.retriever import (
    CORE_DOCS, INTENT_DOCS, TIMING_DOCS, TIMING_BY_INTENT, MONTHLY_DOCS
)

def get_all_referenced_docs():
    refs = set(CORE_DOCS)
    refs.add("cach_cuc_kinh_dien.md")
    refs.add("tuan_triet.md")
    for docs in INTENT_DOCS.values():
        refs.update(docs)
    refs.update(TIMING_DOCS)
    for docs in TIMING_BY_INTENT.values():
        refs.update(docs)
    refs.update(MONTHLY_DOCS)
    return refs

def get_all_kb_files():
    kb_dir = pathlib.Path(__file__).parent.parent / "app" / "kb" / "data" / "nam_phai"
    return list(kb_dir.glob("*.md"))

class TestKBDocs(unittest.TestCase):
    def test_no_orphan_files(self):
        refs = get_all_referenced_docs()
        kb_files = get_all_kb_files()
        for f in kb_files:
            self.assertIn(f.name, refs, f"Orphan file found: {f.name}")

    def test_no_dangling_references(self):
        kb_files = {f.name for f in get_all_kb_files()}
        refs = get_all_referenced_docs()
        for r in refs:
            self.assertIn(r, kb_files, f"Dangling reference found: {r}")

    def test_file_format_and_budget(self):
        kb_files = get_all_kb_files()
        for f in kb_files:
            content = f.read_text(encoding="utf-8")
            lines = content.splitlines()
            
            # 3. Đúng khuôn: mỗi doc có đúng một dòng bắt đầu bằng `# `
            h1_count = sum(1 for line in lines if line.startswith("# "))
            self.assertEqual(h1_count, 1, f"File {f.name} has {h1_count} H1 headers, expected exactly 1.")
            
            # có chứa chuỗi KẾT LUẬN CHO AI (chỉ áp dụng cho các file mới theo yêu cầu)
            new_files = ["he_thong_dao_hoa_tinh.md", "phu_the_ket_hon_va_ung_ky.md", "tai_loc_nguon_tien_chinh_thien.md", "tai_loc_kho_tai_va_hao_tan.md", "tieu_han_va_tang_thoi_gian.md", "luu_sao_va_kich_hoat_cach_cuc.md"]
            if f.name in new_files:
                self.assertIn("KẾT LUẬN CHO AI", content, f"File {f.name} missing 'KẾT LUẬN CHO AI'")
            
            # 4. Không lộ nguồn: không doc nào chứa chuỗi `.md` trong phần thân.
            if f.name != "phong_cach_luan_giai.md":
                self.assertNotIn(".md", content, f"File {f.name} contains '.md' in content, which exposes source.")
            
            # 5. Ngân sách: không doc nào vượt 60 dòng.
            self.assertLessEqual(len(lines), 60, f"File {f.name} exceeds 60 lines (has {len(lines)} lines)")

if __name__ == "__main__":
    unittest.main()

