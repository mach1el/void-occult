"""Lắp ráp prompt cuối: system (grounding) + lượt user (KB → trọng tâm → câu hỏi).

Thứ tự lượt user có chủ đích:
  1) [KIẾN THỨC NỀN] — nền lý thuyết (nguyên tắc, ý nghĩa sao/cách cục) để model có khung.
  2) [TRỌNG TÂM]     — dữ liệu liên cung CỦA LÁ SỐ NÀY (đã tính sẵn, là chân lý của ca).
  3) [CÂU HỎI]       — đặt cuối cùng (gần model nhất) để bám đúng yêu cầu.
"""
from .constants import SYSTEM_PROMPT


def build_system(chart_text: str) -> str:
  if chart_text:
    return SYSTEM_PROMPT + "\n\n=== LÁ SỐ ĐANG XEM (dữ liệu chuẩn của ca này) ===\n" + chart_text
  return SYSTEM_PROMPT


def build_user_turn(question: str, focus: str = "", kb_ctx: str = "") -> str:
  blocks = []
  if kb_ctx:
    blocks.append(
      "[KIẾN THỨC NỀN — đây là tri thức của CHÍNH BẠN. Áp vào DỮ LIỆU lá số ở [TRỌNG TÂM]; "
      "khi xung đột thì dữ liệu lá số thắng. TUYỆT ĐỐI không nhắc tới 'tài liệu'/'nguồn'/tên file, "
      "không dạy lại lý thuyết suông, không bịa sao/cung ngoài lá số.]\n" + kb_ctx
    )
  if focus:
    blocks.append(focus)
  blocks.append("[CÂU HỎI]\n" + question)
  return "\n\n".join(blocks)
