import sys
import unittest
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

class TestKBBudget(unittest.TestCase):
    def test_kb_size_limit(self):
        kb_dir = pathlib.Path(__file__).parent.parent / "app" / "kb" / "data" / "nam_phai"
        
        total_chars = 0
        for fp in kb_dir.glob("*.md"):
            content = fp.read_text(encoding="utf-8")
            total_chars += len(content)
            
        print(f"\n[INFO] Tổng số ký tự KB hiện tại: {total_chars}")
        
        # TODO: siết về <77k sau khi depth batch 2,3 nén doc cũ
        max_budget = 100000
        self.assertLessEqual(
            total_chars, 
            max_budget, 
            f"KB size ({total_chars} chars) vượt quá ngân sách {max_budget}."
        )

if __name__ == "__main__":
    unittest.main(verbosity=2)
