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

from . import config
from .schemas import InterpretRequest
from .liencung import build_focus, classify_intent
from .prompt import build_system, build_user_turn
from .kb.retriever import get_retriever
from .llm import get_client, LLMError

app = FastAPI(title="Void Occult — Tử Vi luận giải", version="0.1.0")
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
  kb_ctx = _retriever.retrieve(chart, ci)
  system = build_system()
  user_turn = build_user_turn(req.question, focus, kb_ctx, req.chartText)

  contents = [{"role": m.role, "parts": [{"text": m.text}]} for m in req.history]
  contents.append({"role": "user", "parts": [{"text": user_turn}]})

  try:
    client = get_client()
  except LLMError as e:
    return JSONResponse(status_code=400, content={"error": str(e)})

  async def gen():
    full_response = []
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

      # Sau khi stream xong, kiểm tra lưu trữ memory
      final_text = "".join(full_response)
      match = re.search(r'\[MEMORY_STORE\]\s*Năm:\s*(.*?)\s*Tổ hợp sao:\s*(.*?)\s*Biến cố:\s*(.*?)\s*\[/MEMORY_STORE\]', final_text, re.DOTALL | re.IGNORECASE)
      if match:
        mem = {
          "year": match.group(1).strip(),
          "pattern": match.group(2).strip(),
          "outcome": match.group(3).strip()
        }
        mem_path = os.path.join(os.path.dirname(__file__), "memories.json")
        memories = []
        if os.path.exists(mem_path):
          with open(mem_path, "r", encoding="utf-8") as f:
            try: memories = json.load(f)
            except Exception: pass
        memories.append(mem)
        with open(mem_path, "w", encoding="utf-8") as f:
          json.dump(memories, f, ensure_ascii=False, indent=2)

    except Exception:
      logger.exception("Error during LLM stream")
      yield f"event: error\ndata: {json.dumps({'message': 'Hệ thống đang quá tải hoặc gặp sự cố nội bộ. Vui lòng thử lại sau.'})}\n\n"

  return StreamingResponse(gen(), media_type="text/event-stream")
