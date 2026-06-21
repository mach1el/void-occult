"""KB retriever — CHỌN LỌC tài liệu KB liên quan (không nhồi toàn bộ).

Chiến lược (rule-based, tất định; sẽ nâng lên embeddings khi corpus lớn):
  KB trả về = tài liệu CỐT LÕI (phong cách + nguyên tắc + cấu trúc cung + Tứ Hóa
              + trạng thái sao + 14 chính tinh)
            + tài liệu theo CHỦ ĐỀ câu hỏi (intent.key)
            + tài liệu theo DẤU HIỆU lá số (cách cục, Tuần/Triệt)
            + tài liệu XEM HẠN khi câu hỏi có yếu tố thời điểm (timing).

KHÔNG gắn tên file vào nội dung (phong_cach_luan_giai.md cấm trích nguồn): mỗi doc
đã có tiêu đề "# H1" riêng nên ghép thẳng nội dung là đủ ngữ cảnh, không lộ filename.
"""
from __future__ import annotations
from typing import Optional
import pathlib

from ..liencung import select_palaces, detect_cach_cuc, norm

# Luôn kèm: nền tảng & phương pháp cho MỌI luận giải.
CORE_DOCS = [
  "phong_cach_luan_giai.md",          # cách trả lời (đi thẳng, không liệt kê cung, không lộ nguồn)
  "nguyen_tac_luan_giai.md",          # nguyên tắc liên cung + đại vận/lưu niên
  "cung_vi_va_tam_hop.md",            # 4 bộ tam hợp + 6 cặp xung + giáp cung
  "tu_hoa_tam_phap.md",               # Lộc/Quyền/Khoa/Kỵ — luôn có mặt trong mọi lá số
  "trang_thai_va_tuong_tac_sao.md",   # miếu/hãm + chính×phụ
  "cung_menh_than.md",                # từ điển 14 chính tinh + lục sát/lục cát
]

# intent.key -> tài liệu chủ đề (chỉ nạp file tồn tại; thiếu thì bỏ qua êm).
INTENT_DOCS = {
  "overview": ["tong_quan.md", "vong_thai_tue_tinh_cach.md", "cung_phuc_duc.md"],
  "wealth":   ["cung_tai_bach.md", "cung_phuc_duc.md"],
  "career":   ["cung_quan_loc.md", "cung_phu_the.md"],   # Quan Lộc ↔ Phu Thê xung chiếu
  "love":     ["cung_phu_the.md", "cung_phuc_duc.md"],
  "fortune":  ["cung_phuc_duc.md", "vong_thai_tue_tinh_cach.md", "tong_quan.md"],
  "property": ["cung_tai_bach.md", "cung_gia_dao.md"],
  "parents":  ["cung_gia_dao.md"],
  "siblings": ["cung_gia_dao.md"],
  "children": ["cung_gia_dao.md"],
  "friends":  ["cung_gia_dao.md"],
  "travel":   ["tong_quan.md"],
  "health":   [],
}

# Khi câu hỏi có yếu tố thời điểm (timing=True): nguyên tắc xem hạn chung...
TIMING_DOCS = ["han_hy_su_sao_luu.md", "vai_tro_luu_thai_tue.md"]
# Khi hỏi theo THÁNG (monthly=True): cách luận lưu nguyệt từng tháng.
MONTHLY_DOCS = ["luu_nguyet_nguyet_han.md"]
# ...và tài liệu hạn năm theo chủ đề.
TIMING_BY_INTENT = {
  "wealth":   ["luu_nien_tai_bach.md"],
  "property": ["luu_nien_tai_bach.md"],
  "love":     ["luu_nien_tinh_cung.md"],
}


class SimpleKBRetriever:
  """Nạp file Markdown KB vào RAM, trả về tập tài liệu liên quan theo intent + lá số."""

  def __init__(self):
    self.kb_dir = pathlib.Path(__file__).parent / "data" / "nam_phai"
    self.docs: dict[str, str] = {}
    self._load()

  def _load(self):
    if not self.kb_dir.exists():
      return
    for fp in sorted(self.kb_dir.glob("*.md")):
      self.docs[fp.name] = fp.read_text(encoding="utf-8").strip()

  def _focus_subset(self, chart: Optional[dict], intent: dict) -> list[dict]:
    if not chart or not chart.get("palaces"):
      return []
    try:
      return select_palaces(chart, intent)
    except Exception:
      return []

  @staticmethod
  def _has_tuan_triet(pals: list[dict]) -> bool:
    for p in pals:
      for s in p.get("stars", []):
        nm = norm(s.get("name", ""))
        if "tuan" in nm or "triet" in nm:
          return True
    return False

  def _ordered_docs(self, chart: Optional[dict], ci: dict) -> list[str]:
    intent = (ci or {}).get("intent", {}) or {}
    key = intent.get("key", "overview")
    timing = bool((ci or {}).get("timing"))

    subset = self._focus_subset(chart, intent)
    focus_pals = [x["p"] for x in subset]

    wanted = list(CORE_DOCS)
    # cách cục: chỉ kéo KB cách cục khi lá thực sự thành cách (theo cung trọng tâm, bỏ giáp)
    if detect_cach_cuc([x for x in subset if x["role"] != "giáp"]):
      wanted.append("cach_cuc_kinh_dien.md")
    wanted += INTENT_DOCS.get(key, [])
    # Tuần/Triệt rơi vào nhóm cung đang xét (fallback: bất kỳ cung nào)
    if self._has_tuan_triet(focus_pals or (chart.get("palaces", []) if chart else [])):
      wanted.append("tuan_triet.md")
    if timing:
      wanted += TIMING_DOCS
      wanted += TIMING_BY_INTENT.get(key, [])
    if (ci or {}).get("monthly"):
      wanted += MONTHLY_DOCS

    seen, ordered = set(), []
    for d in wanted:
      if d in self.docs and d not in seen:
        seen.add(d)
        ordered.append(d)
    return ordered

  def retrieve(self, chart: Optional[dict], ci: dict) -> str:
    """Trả về các đoạn KB liên quan (ghép thẳng, mỗi doc tự có tiêu đề # H1). '' nếu không có."""
    ordered = self._ordered_docs(chart, ci)
    if not ordered:
      return ""
    return "\n\n".join(self.docs[name] for name in ordered)

  def docs_for(self, chart: Optional[dict], ci: dict) -> list[str]:
    """Tên các tài liệu được chọn (cho endpoint debug)."""
    return self._ordered_docs(chart, ci)


def get_retriever() -> SimpleKBRetriever:
  return SimpleKBRetriever()
