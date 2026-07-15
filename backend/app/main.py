"""FastAPI app — backend luận giải Tử Vi (local dev).

Chạy:  uvicorn app.main:app --reload --port 8000  (từ thư mục backend/)
"""
import os
import re
import time
import json
import logging
import asyncio
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from . import config
from . import store
from .event_parse import parse_event
from .schemas import InterpretRequest
from .liencung import build_focus, classify_intent, select_palaces, detect_cach_cuc
from .prompt import build_system, build_user_turn
from .kb.retriever import get_retriever
from .llm import get_client, LLMError

@asynccontextmanager
async def lifespan(app: FastAPI):
  await store.init_db()
  yield

app = FastAPI(title="Void Occult — Tử Vi luận giải", version="0.1.0", lifespan=lifespan)
app.add_middleware(
  CORSMiddleware,
  allow_origins=config.ALLOW_ORIGINS,
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)

logging.basicConfig(level=logging.WARNING, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# --- Rate limiting (In-process sliding window) ---
# TODO: Dùng Redis nếu scale nhiều worker
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
RATE_LIMIT_BURST = int(os.getenv("RATE_LIMIT_BURST", "3"))

_ip_history = defaultdict(list)

def check_rate_limit(request: Request):
  ip = request.headers.get("X-Forwarded-For")
  if ip:
    ip = ip.split(",")[-1].strip()
  else:
    ip = request.client.host if request.client else "unknown"
        
  now = time.time()
  _ip_history[ip] = [t for t in _ip_history[ip] if now - t < 60]
    
  if len(_ip_history[ip]) >= RATE_LIMIT_PER_MIN + RATE_LIMIT_BURST:
    return False
  _ip_history[ip].append(now)
  return True

_retriever = get_retriever()


@app.get("/health")
async def health():
  return {"ok": True, "model": config.GEMINI_MODEL}


if config.DEBUG:
  @app.post("/api/debug/focus")
  def debug_focus(req: InterpretRequest):
    """Soi khối 'trọng tâm' + tài liệu KB được chọn (không gọi LLM) — tiện kiểm thử."""
    chart = req.chart.model_dump() if req.chart else None
    ci = classify_intent(req.question)
    return {
      "intent": ci["intent"]["key"],
      "timing": ci["timing"],
      "kb_docs": _retriever.docs_for(chart, ci),
      "focus": build_focus(chart, req.question, ci),
    }


@app.post("/api/interpret")
async def interpret(req: InterpretRequest, request: Request):
  if not check_rate_limit(request):
    return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"}, headers={"Retry-After": "60"})

  chart = req.chart.model_dump() if req.chart else None
  ci = classify_intent(req.question)
  focus = build_focus(chart, req.question, ci)
  
  # Base-rate Phase 1: Bắt sự kiện tự thuật từ user
  event_info = None
  if chart:
    current_year = chart.get("annualYear") or datetime.now(timezone.utc).year
    event_info = parse_event(req.question, current_year)
    if event_info:
      asyncio.create_task(store.record_event(
        req.chart, event_info["year"], event_info["palace"],
        event_info["valence"], event_info["domain"], event_info["note"]
      ))
      # Kéo cách cục gốc của cung xảy ra biến cố để lưu observation
      for p in chart.get("palaces", []):
        if p["name"] == event_info["palace"]:
          cc_dicts = detect_cach_cuc([{"role": "chính", "p": p}])
          cc_ids = [c["id"] for c in cc_dicts]
          asyncio.create_task(store.record_observation(req.chart, event_info["year"], p["name"], cc_ids))
          break
          
    # Base-rate Phase 1: Âm thầm ghi nhận mẫu số (observations) cho năm hiện tại
    if chart.get("annualYear"):
      sset = select_palaces(chart, ci["intent"])
      for x in sset:
        if x["role"] == "chính":
          cc_dicts = detect_cach_cuc([x])
          cc_ids = [c["id"] for c in cc_dicts]
          asyncio.create_task(store.record_observation(req.chart, chart["annualYear"], x["p"]["name"], cc_ids))

  kb_ctx = _retriever.retrieve(chart, ci)
  system = build_system()
  user_turn = build_user_turn(
    req.question,
    focus,
    kb_ctx,
    req.chartText,
    req.profile.model_dump(),
  )

  contents = [{"role": m.role, "parts": [{"text": m.text}]} for m in req.history]
  contents.append({"role": "user", "parts": [{"text": user_turn}]})

  try:
    client = get_client()
  except LLMError as e:
    return JSONResponse(status_code=400, content={"error": str(e)})

  async def gen():
    full_response = []
    
    if event_info:
      confirm_msg = f"[Đã ghi nhận: biến cố {event_info['domain']} năm {event_info['year']}]\n\n"
      yield f"event: delta\ndata: {json.dumps(confirm_msg)}\n\n"
      
    try:
      async def _run():
        async for chunk in client.stream_async(system, contents):
          full_response.append(chunk)
          yield f"event: delta\ndata: {json.dumps(chunk)}\n\n"
      
      generator = _run()
      LLM_TIMEOUT_S = float(os.getenv("LLM_TIMEOUT_S", "120"))
      while True:
        try:
          chunk = await asyncio.wait_for(generator.__anext__(), timeout=LLM_TIMEOUT_S)
          yield chunk
        except StopAsyncIteration:
          yield "event: done\ndata: {}\n\n"
          break


    except Exception:
      logger.exception("Error during LLM stream")
      yield f"event: error\ndata: {json.dumps({'message': 'Hệ thống đang quá tải hoặc gặp sự cố nội bộ. Vui lòng thử lại sau.'})}\n\n"

  return StreamingResponse(gen(), media_type="text/event-stream")
