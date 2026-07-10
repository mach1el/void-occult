import unittest
from app.annual_stars import get_annual_stars

class TestAnnualStars(unittest.TestCase):
    def test_2025(self):
        ann = get_annual_stars(2025)
        self.assertEqual(ann["stem"], "Ất")
        self.assertEqual(ann["branch"], "Tỵ")
        self.assertEqual(ann["stars"]["Lưu Thái Tuế"], "Tỵ")
        self.assertEqual(ann["stars"]["Lưu Lộc Tồn"], "Mão")
        self.assertEqual(ann["stars"]["Lưu Kình Dương"], "Thìn")
        self.assertEqual(ann["stars"]["Lưu Đà La"], "Dần")
        self.assertEqual(ann["stars"]["Lưu Thiên Mã"], "Hợi")
        self.assertEqual(ann["mutagens"]["Lộc"], "Thiên Cơ")
        self.assertEqual(ann["mutagens"]["Kỵ"], "Thái Âm")

if __name__ == '__main__':
    unittest.main()
