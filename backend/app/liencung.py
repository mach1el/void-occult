"""Dựng prompt 'trọng tâm' theo liên cung (rule-based, tất định).

Port từ tu-vi-prompt.js (buildFocus). Thuần stdlib — nhận `chart` là dict đã
serialize từ frontend, không phụ thuộc engine/Pydantic.

Hợp đồng dữ liệu (chart dict):
  chart["palaces"]: list[ {index:int, branch, name, stem, isMenh, isThan,
                           changSheng, majorFortuneActive:bool,
                           stars:[{name, layer, brightness, source, targetStar, element}]} ]
  chart["menhElement"], ["yearStem"], ["yearBranch"], ["annualStem"], ["annualBranch"],
  chart["annualYear"], ["nominalAge"]
  chart["majorFortunePalace"]: {name, branch, start, end} | None
  chart["taiTuePalace"]: {name, branch} | None
  chart["natalMutagens"|"annualMutagens"|"majorMutagens"]:
       list[{mutagen, starName, palaceName}]
"""
from __future__ import annotations
import unicodedata
from typing import Optional

from .constants import (FIVE, SINH, KHAC, INTENTS, TIMING_KW, MONTHLY_KW, CACH_CUC, SAT, KEY_PHU, THAI_TUE_RING)


def norm(s) -> str:
  s = unicodedata.normalize("NFD", str(s or ""))
  s = "".join(c for c in s if unicodedata.category(c) != "Mn")
  return s.replace("đ", "d").replace("Đ", "d").lower()


def element_of(s) -> str:
  n = norm(s)
  for e in FIVE:
    if norm(e) in n:
      return e
  return ""


def classify_intent(question: str) -> dict:
  n = " " + norm(question) + " "
  found = None
  for it in INTENTS:
    if any(k in n for k in it["kw"]):
      found = it
      break
  if not found:
    found = next(i for i in INTENTS if i["key"] == "overview")
  monthly = any(k in n for k in MONTHLY_KW)
  timing = monthly or any(k in n for k in TIMING_KW)   # hỏi theo tháng là một dạng xem hạn
  return {"intent": found, "timing": timing, "monthly": monthly}


def _fix(n: int) -> int:
  return ((n % 12) + 12) % 12


def group_stars(palace: dict) -> dict:
  major, phu, hoa, luu = [], [], [], []
  for s in palace.get("stars", []):
    layer = s.get("layer", "")
    src = s.get("source", "") or ""
    if layer == "major":
      major.append(s)
    elif src.endswith("-mutagen"):
      hoa.append(s)
    elif src == "annual":
      luu.append(s)
    else:
      phu.append(s)
  return {"major": major, "phu": phu, "hoa": hoa, "luu": luu}


def _lbl(s: dict) -> str:
  return s["name"] + (f"({s['brightness']})" if s.get("brightness") else "")


def relate(a: str, b: str) -> str:
  if not a or not b:
    return ""
  if a == b:
    return f"đồng hành ({a})"
  if SINH.get(a) == b:
    return f"{a} sinh {b}"
  if SINH.get(b) == a:
    return f"{b} sinh {a}"
  if KHAC.get(a) == b:
    return f"{a} khắc {b}"
  if KHAC.get(b) == a:
    return f"{b} khắc {a}"
  return ""


def select_palaces(chart: dict, intent: dict) -> list[dict]:
  by_index = {p["index"]: p for p in chart["palaces"]}
  primary = next((p for p in chart["palaces"] if p["name"] == intent["palace"]), None)
  if not primary:
    return []
  i = primary["index"]
  roles = [(i, "chính"), (_fix(i - 4), "tam hợp"), (_fix(i + 4), "tam hợp"),
           (_fix(i + 6), "xung chiếu"), (_fix(i - 1), "giáp"), (_fix(i + 1), "giáp")]
  out = []
  for idx, role in roles:
    p = by_index.get(idx)
    if p:
      out.append({"p": p, "role": role})
  return out


def detect_cach_cuc(subset: list[dict]) -> list[dict]:
  names = set()
  for x in subset:
    for s in x["p"].get("stars", []):
      if s.get("layer") == "major":
        names.add(s["name"])
  return [c for c in CACH_CUC if len([m for m in c["m"] if m in names]) >= c["min"]]


def _hua_into_set(set_names: set, recs, tag: str) -> list[str]:
  out = []
  for r in recs or []:
    if r.get("palaceName") in set_names:
      flag = " ⚠ điểm vướng" if r["mutagen"] == "Kỵ" else (" ✦ điểm thông" if r["mutagen"] == "Lộc" else "")
      out.append(f"{tag} Hóa {r['mutagen']} ({r['starName']}) → {r['palaceName']}{flag}")
  return out


def _month_calendar(chart: dict) -> list[str]:
  """Lịch 12 tháng (lưu nguyệt) ĐẶT TRÊN NỀN LƯU NIÊN: mỗi tháng -> cung lưu-mệnh +
  sao gốc + sao lưu + TỨ HÓA LƯU NIÊN rọi vào cung đó (yếu tố quyết định cát/hung của tháng)."""
  m2p = {}
  for p in chart.get("palaces", []):
    for m in (p.get("flowMonths") or []):
      m2p[m] = p
  if not m2p:
    return []
  # Tứ hóa lưu niên theo tên cung — khung quyết định tháng đó cát hay hung.
  ann_by_pal: dict[str, list[str]] = {}
  for r in (chart.get("annualMutagens") or []):
    nm = r.get("palaceName")
    if not nm:
      continue
    flag = " ⚠vướng" if r["mutagen"] == "Kỵ" else (" ✦thông" if r["mutagen"] == "Lộc" else "")
    ann_by_pal.setdefault(nm, []).append(f"Lưu Hóa {r['mutagen']}({r['starName']}){flag}")
  out = ["[LỊCH LƯU NGUYỆT 12 THÁNG — CHÚ TRỌNG LƯU NIÊN: cát/hung mỗi tháng do tứ hóa "
         "lưu niên (Lưu Lộc/Quyền/Khoa/Kỵ) & lưu Thái Tuế rọi vào cung lưu-mệnh tháng đó quyết định, "
         "không chỉ đọc sao gốc của cung]"]
  for m in range(1, 13):
    p = m2p.get(m)
    if not p:
      continue
    g = group_stars(p)
    seg = ", ".join(_lbl(s) for s in g["major"]) or "vô chính diệu"
    kp = [s["name"] for s in g["phu"] if s["name"] in KEY_PHU]
    if kp:
      seg += " · " + ", ".join(kp)
    if g["hoa"]:
      seg += " · Hóa gốc " + ", ".join(s["name"] for s in g["hoa"])
    if g["luu"]:
      seg += " · sao lưu: " + ", ".join(s["name"] for s in g["luu"])
    ann = ann_by_pal.get(p["name"])
    if ann:
      seg += " · LƯU NIÊN: " + ", ".join(ann)
    out.append(f"• Tháng {m}: {p['name']} ({p['branch']}) — {seg}")
  return out


def build_focus(chart: Optional[dict], question: str, ci: Optional[dict] = None) -> str:
  if not chart or not chart.get("palaces"):
    return ""
  ci = ci or classify_intent(question)
  intent, timing = ci["intent"], ci["timing"]
  sset = select_palaces(chart, intent)
  if not sset:
    return ""
  set_names = {x["p"]["name"] for x in sset}
  menh_el = element_of(chart.get("menhElement"))
  L = [f"[TRỌNG TÂM] Câu hỏi thuộc nhóm: {intent['label']}. Bắt buộc luận theo liên cung dưới đây (không đọc cung đơn lẻ):"]
  if timing:
    L.append("[NHIỆM VỤ] Đây là câu hỏi diễn biến hạn (thời điểm). TRỤC CHÍNH là các cung/sao có đuôi 'lưu niên' hoặc 'Lưu Thái Tuế' của năm hiện tại; đại vận chỉ đóng vai trò nền.")
  else:
    L.append("[NHIỆM VỤ] Đây là câu hỏi TỔNG QUAN / mệnh cách (không có yếu tố năm tháng). TẬP TRUNG CAO ĐỘ vào [CÁCH CỤC] tĩnh và các tín hiệu Năm sinh. Tuyệt đối KHÔNG nhắc đến các sao lưu hay tứ hóa lưu niên.")
  if chart.get("birthMonthStem") and chart.get("birthDayStem"):
    L.append(
      f"[CAN CHI SINH] Năm {chart.get('yearStem', '')} {chart.get('yearBranch', '')}"
      f" · Tháng {chart.get('birthMonthStem', '')} {chart.get('birthMonthBranch', '')}"
      f" · Ngày {chart.get('birthDayStem', '')} {chart.get('birthDayBranch', '')}"
      f" · Giờ {chart.get('birthHourStem', '')} {chart.get('birthHourBranch', '')}"
    )

  for x in sset:
    g = group_stars(x["p"])
    parts = []
    if g["major"]:
      parts.append("Chính tinh: " + ", ".join(_lbl(s) for s in g["major"]))
    kp = []
    for s in g["phu"]:
      if s["name"] in KEY_PHU:
        if not timing and s["name"] in THAI_TUE_RING:
          continue
        kp.append(s)
    if kp:
      parts.append("Phụ tinh: " + ", ".join(_lbl(s) for s in kp))
    if g["hoa"]:
      parts.append("Tứ Hóa: " + ", ".join(s["name"] + (f"→{s['targetStar']}" if s.get("targetStar") else "") for s in g["hoa"]))
    if timing and g["luu"]:
      parts.append("Sao lưu: " + ", ".join(s["name"] for s in g["luu"]))
    if timing and x["p"].get("flowMonths"):
      parts.append(f"Lưu Nguyệt: Tháng {', '.join(str(m) for m in x['p']['flowMonths'])}")
    empty = " — trống (không tạo thế giáp)" if x["role"] == "giáp" else " — vô chính diệu (mượn sao cung xung chiếu để luận)"
    L.append(f"• [{x['role']}] {x['p']['name']} ({x['p']['branch']})" + (" — " + " | ".join(parts) if parts else empty))

  cc = detect_cach_cuc([x for x in sset if x["role"] != "giáp"])
  if cc:
    L.append("[CÁCH CỤC] " + "; ".join(f"{c['id']} ({c['note']})" for c in cc))

  sk = []
  if menh_el:
    for x in (x for x in sset if x["role"] in ("chính", "tam hợp")):
      g = group_stars(x["p"])
      chinh = g["major"][0] if g["major"] else None
      chinh_el = chinh.get("element") if chinh else ""
      for s in g["major"]:
        r = relate(s.get("element", ""), menh_el)
        if r:
          sk.append(f"{s['name']}({s.get('element','')}) ↔ Bản mệnh {menh_el}: {r}")
      for s in (s for s in g["phu"] if s["name"] in SAT):
        e = s.get("element", "")
        r1 = relate(e, menh_el)
        r2 = relate(e, chinh_el) if chinh_el else ""
        line = f"Sát tinh {s['name']}({e}) tại {x['p']['name']} ↔ Bản mệnh {menh_el}: {r1 or '—'}"
        if chinh:
          line += f"; ↔ {chinh['name']}({chinh_el}) tọa thủ: {r2 or '—'}"
        sk.append(line)
  if sk:
    L.append("[NGŨ HÀNH SINH-KHẮC — đã tính sẵn, dùng đúng kết quả này]")
    L.extend("• " + s for s in sk[:12])

  hua = _hua_into_set(set_names, chart.get("natalMutagens"), "Năm sinh:")
  if timing:
    hua += _hua_into_set(set_names, chart.get("annualMutagens"), f"Lưu niên {chart.get('annualStem','')}:")
    hua += _hua_into_set(set_names, chart.get("majorMutagens"), "Đại vận:")
  if hua:
    L.append("[TỨ HÓA PHI TINH vào nhóm cung đang xét]")
    L.extend("• " + h for h in hua)

  if timing:
    mf = chart.get("majorFortunePalace")
    if mf:
      L.append(f"[ĐẠI VẬN hiện hành] {mf.get('start')}–{mf.get('end')} tuổi tại {mf.get('name')} ({mf.get('branch')}).")
    tt = chart.get("taiTuePalace")
    L.append(f"[LƯU NIÊN] {chart.get('annualYear')} {chart.get('annualStem')} {chart.get('annualBranch')} ({chart.get('nominalAge')} tuổi)"
             + (f" · Thái Tuế tại {tt['name']} ({tt['branch']})" if tt else "") + ".")
    L.append("[LƯU Ý TẦNG] Hỏi về năm thì LƯU NIÊN là trục chính (đại vận chỉ là nền). Tứ hóa nhãn 'Lưu niên' là của RIÊNG năm này, KHÔNG được gọi là tứ hóa đại vận dù trùng cung đại vận.")
    sl = chart.get("smallLimitPalace")
    if sl and sl.get("name"):
      full = next((p for p in chart["palaces"] if p["name"] == sl["name"]), None)
      seg = ""
      if full:
        g = group_stars(full)
        seg = ", ".join(_lbl(s) for s in g["major"]) or "vô chính diệu"
        kp = [s["name"] for s in g["phu"] if s["name"] in KEY_PHU]
        if kp:
          seg += " · " + ", ".join(kp)
      ann = [f"Lưu Hóa {r['mutagen']}({r['starName']})"
             for r in (chart.get("annualMutagens") or []) if r.get("palaceName") == sl["name"]]
      line = f"[TIỂU HẠN năm nay] cung {sl['name']} ({sl.get('branch','')})" + (f" — {seg}" if seg else "")
      if ann:
        line += " · LƯU NIÊN rọi: " + ", ".join(ann)
      L.append(line)

  if ci.get("monthly"):
    L.extend(_month_calendar(chart))
    L.append("[YÊU CẦU THÁNG] BẮT BUỘC trình bày diễn tiến theo trình tự 12 tháng "
             "(gộp các tháng cùng cung/cùng tính chất cho gọn), mỗi mốc nêu rõ tháng đó cát hay hung "
             "dựa trên cung lưu-mệnh + tứ hóa lưu niên rọi vào — KHÔNG được chỉ luận tổng quan cả năm.")

  L.append("[YÊU CẦU] Chỉ luận trên cung/sao đã liệt kê; mỗi nhận định nêu căn cứ (cung + cách cục + sinh-khắc + Tứ Hóa). Tuyệt đối không thêm sao/cung không có ở trên.")
  return "\n".join(L)
