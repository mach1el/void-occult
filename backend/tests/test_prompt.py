import unittest

from pydantic import ValidationError

from app.prompt import build_user_turn
from app.schemas import InterpretRequest


class TestUserContextPrompt(unittest.TestCase):
    def test_profile_is_added_as_context_not_astrological_evidence(self):
        turn = build_user_turn(
            "Công việc năm nay thế nào?",
            chart_text="Lá số",
            profile={
                "name": "An",
                "occupationStatus": "Đang làm việc",
                "relationshipStatus": "Độc thân",
            },
        )

        self.assertIn("[BỐI CẢNH ĐƯƠNG SỐ]", turn)
        self.assertIn("- Tên gọi: An", turn)
        self.assertIn("- Công việc hiện tại: Đang làm việc", turn)
        self.assertIn("- Tình trạng mối quan hệ: Độc thân", turn)
        self.assertIn("không phải luận cứ Tử Vi", turn)

    def test_empty_profile_does_not_add_context_block(self):
        turn = build_user_turn("Luận tổng quan", profile={})
        self.assertNotIn("[BỐI CẢNH ĐƯƠNG SỐ]", turn)

    def test_profile_fields_are_length_limited(self):
        with self.assertRaises(ValidationError):
            InterpretRequest(question="Luận giải", profile={"name": "a" * 81})


if __name__ == "__main__":
    unittest.main()
