"""Pydantic schemas — hợp đồng dữ liệu giữa frontend (JS) và backend (Python).

Frontend serialize chart từ engine.getData() thành ChartDTO rồi POST."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class StarDTO(BaseModel):
  name: str
  layer: str = ""        # "major" | "minor" | ...
  brightness: str = ""   # Miếu/Vượng/Đắc/Hãm | ""
  source: str = ""       # "natal" | "annual" | "natal-mutagen" | "annual-mutagen" | ...
  targetStar: Optional[str] = None
  element: str = ""      # ngũ hành đã tính từ engine.elementForStar


class PalaceDTO(BaseModel):
  index: int             # chỉ số chi (0-11) — để tính tam hợp/xung/giáp
  branch: str
  name: str
  stem: str = ""
  isMenh: bool = False
  isThan: bool = False
  changSheng: str = ""
  majorFortuneActive: bool = False
  flowMonths: list[int] = []   # lưu nguyệt: các tháng (1-12) có lưu-mệnh rơi vào cung này
  stars: list[StarDTO] = []


class MutagenDTO(BaseModel):
  mutagen: str           # Lộc/Quyền/Khoa/Kỵ
  starName: str
  palaceName: Optional[str] = None


class PalaceRef(BaseModel):
  name: str
  branch: str
  start: Optional[int] = None
  end: Optional[int] = None


class ChartDTO(BaseModel):
  school: str = "nam-phai"
  menhElement: str = ""
  menhBranch: str = ""
  yearStem: str = ""
  yearBranch: str = ""
  annualStem: str = ""
  annualBranch: str = ""
  annualYear: Optional[int] = None
  nominalAge: Optional[int] = None
  majorFortunePalace: Optional[PalaceRef] = None
  taiTuePalace: Optional[PalaceRef] = None
  smallLimitPalace: Optional[PalaceRef] = None   # cung Tiểu Hạn của năm xem
  palaces: list[PalaceDTO] = []
  natalMutagens: list[MutagenDTO] = []
  annualMutagens: list[MutagenDTO] = []
  majorMutagens: list[MutagenDTO] = []


class HistoryTurn(BaseModel):
  role: str              # "user" | "model"
  text: str


class InterpretRequest(BaseModel):
  question: str
  chartText: str = ""    # lá số dạng text (grounding cho system)
  chart: Optional[ChartDTO] = None  # lá số có cấu trúc (để dựng liên cung)
  history: list[HistoryTurn] = []
