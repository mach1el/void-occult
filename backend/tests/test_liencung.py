"""Test thuần stdlib cho build_focus — chạy: python -m unittest (từ backend/)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.liencung import build_focus, classify_intent  # noqa: E402

BRANCHES = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
PAL = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
       "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"]
ELEM = {"Thái Dương": "Hỏa", "Thái Âm": "Thủy", "Hỏa Tinh": "Hỏa", "Thiên Lương": "Thổ", "Cự Môn": "Thủy"}
MENH = 5  # Mùi


def _fix(n):
  return ((n % 12) + 12) % 12


def _star(name, major=False, b="", src="natal", t=None):
  return {"name": name, "layer": "major" if major else "minor", "brightness": b,
          "source": src, "targetStar": t, "element": ELEM.get(name, "")}


def _mock_chart():
  stars_at = {
    "Hợi": [_star("Thái Dương", major=True, b="Hãm")],            # Quan Lộc
    "Mùi": [_star("Thiên Lương", major=True, b="Đắc")],           # Mệnh
    "Mão": [_star("Thái Âm", major=True, b="Hãm"), _star("Hỏa Tinh", b="Đắc")],  # Tài Bạch
    "Tỵ":  [_star("Cự Môn", major=True, b="Hãm")],                # Phu Thê (xung)
  }
  palaces = []
  for i, br in enumerate(BRANCHES):
    palaces.append({
      "index": i, "branch": br, "name": PAL[_fix(i - MENH)], "stem": "Giáp",
      "isMenh": i == MENH, "isThan": False, "changSheng": "Đế Vượng",
      "majorFortuneActive": False, "stars": stars_at.get(br, []),
    })
  return {
    "palaces": palaces, "menhElement": "Thổ", "menhBranch": "Mùi",
    "yearStem": "Mậu", "yearBranch": "Dần",
    "annualStem": "Bính", "annualBranch": "Ngọ", "annualYear": 2026, "nominalAge": 29,
    "majorFortunePalace": {"name": "Quan Lộc", "branch": "Hợi", "start": 26, "end": 35},
    "taiTuePalace": {"name": "Huynh Đệ", "branch": "Ngọ"},
    "natalMutagens": [{"mutagen": "Lộc", "starName": "Thái Âm", "palaceName": "Tài Bạch"},
                      {"mutagen": "Kỵ", "starName": "Thiên Cơ", "palaceName": "Quan Lộc"}],
    "annualMutagens": [{"mutagen": "Kỵ", "starName": "Liêm Trinh", "palaceName": "Phu Thê"}],
    "majorMutagens": [],
  }


class TestBuildFocus(unittest.TestCase):
  def test_intent(self):
    self.assertEqual(classify_intent("Sự nghiệp năm nay thế nào?")["intent"]["key"], "career")
    self.assertTrue(classify_intent("Sự nghiệp năm nay thế nào?")["timing"])
    self.assertEqual(classify_intent("Tình duyên hôn nhân ra sao?")["intent"]["key"], "love")
    self.assertFalse(classify_intent("Tình duyên hôn nhân ra sao?")["timing"])

  def test_career_focus(self):
    f = build_focus(_mock_chart(), "Sự nghiệp năm nay thế nào?")
    # liên cung Mệnh-Tài-Quan + xung Phu Thê
    self.assertIn("[chính] Quan Lộc", f)
    self.assertIn("[tam hợp] Tài Bạch", f)
    self.assertIn("[xung chiếu] Phu Thê", f)
    # cách cục
    self.assertIn("Nhật-Nguyệt", f)
    self.assertIn("Âm-Dương-Lương", f)
    self.assertNotIn("Cơ-Nguyệt-Đồng-Lương", f)
    # sinh-khắc tính sẵn
    self.assertIn("Hỏa sinh Thổ", f)
    self.assertIn("Thổ khắc Thủy", f)
    # Tứ Hóa phi tinh + flag
    self.assertIn("⚠ điểm vướng", f)
    self.assertIn("✦ điểm thông", f)
    # timing overlay
    self.assertIn("[ĐẠI VẬN hiện hành]", f)
    self.assertIn("[LƯU NIÊN]", f)

  def test_love_no_timing(self):
    f = build_focus(_mock_chart(), "Chuyện tình duyên hôn nhân?")
    self.assertIn("[chính] Phu Thê", f)
    self.assertNotIn("[ĐẠI VẬN hiện hành]", f)


if __name__ == "__main__":
  unittest.main(verbosity=2)
