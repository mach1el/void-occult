"""FastAPI app — backend luận giải Tử Vi (local dev).

Chạy:  uvicorn app.main:app --reload --port 8000  (từ thư mục backend/)
"""
from fastapi import FastAPI
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

_retriever = get_retriever()


@app.get("/health")
def health():
  return {"ok": True, "model": config.GEMINI_MODEL}


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
def interpret(req: InterpretRequest):
  chart = req.chart.model_dump() if req.chart else None
  ci = classify_intent(req.question)
  focus = build_focus(chart, req.question, ci)
  kb_ctx = _retriever.retrieve(chart, ci)
  system = build_system(req.chartText)
  user_turn = build_user_turn(req.question, focus, kb_ctx)

  contents = [{"role": m.role, "parts": [{"text": m.text}]} for m in req.history]
  contents.append({"role": "user", "parts": [{"text": user_turn}]})

  try:
    client = get_client()
  except LLMError as e:
    return JSONResponse(status_code=400, content={"error": str(e)})

  def gen():
    try:
      for delta in client.stream(system, contents):
        yield delta
    except LLMError as e:
      yield "\n\n⚠ " + str(e)
    except Exception as e:  # noqa: BLE001
      yield "\n\n⚠ Lỗi: " + str(e)

  return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")
