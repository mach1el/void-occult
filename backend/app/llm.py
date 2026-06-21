"""LLM client — provider-agnostic. Hiện dùng Google Gemini (server-side, key ẩn).

Đổi provider sau: thêm class mới cùng interface stream(system, contents)."""
import os
from typing import Iterator


class LLMError(RuntimeError):
  pass


# gemini-2.5-flash là model "thinking". BẬT thinking để luận giải sâu hơn, nhưng phải
# chừa đủ token cho câu trả lời: max_output_tokens >= thinking_budget + độ dài đáp án.
#   thinking_budget:  0 = tắt | -1 = động (model tự quyết, cần max_output cao) | >0 = giới hạn
# Mặc định: suy luận tối đa 8192 token, tổng output 24576 -> luôn dư ~16k cho đáp án (không cụt).
DEFAULT_THINKING_BUDGET = 8192
DEFAULT_MAX_OUTPUT_TOKENS = 24576
DEFAULT_TEMPERATURE = 0.75


class GeminiClient:
  def __init__(self, api_key: str, model: str,
               thinking_budget: int = DEFAULT_THINKING_BUDGET,
               max_output_tokens: int = DEFAULT_MAX_OUTPUT_TOKENS,
               temperature: float = DEFAULT_TEMPERATURE):
    self.api_key = api_key
    self.model = model
    self.thinking_budget = thinking_budget
    self.max_output_tokens = max_output_tokens
    self.temperature = temperature

  def stream(self, system: str, contents: list[dict]) -> Iterator[str]:
    try:
      from google import genai
      from google.genai import types
    except ImportError as e:
      raise LLMError("Chưa cài google-genai (pip install google-genai).") from e

    client = genai.Client(api_key=self.api_key)
    cfg = types.GenerateContentConfig(
      system_instruction=system,
      temperature=self.temperature,
      max_output_tokens=self.max_output_tokens,
      thinking_config=types.ThinkingConfig(
        thinking_budget=self.thinking_budget,
        include_thoughts=False,   # model suy luận nội bộ; chỉ stream câu trả lời
      ),
    )
    stream = client.models.generate_content_stream(
      model=self.model, contents=contents, config=cfg
    )
    for chunk in stream:
      yield from _answer_text(chunk)


def _answer_text(chunk) -> Iterator[str]:
  """Trích phần TRẢ LỜI từ 1 chunk, bỏ qua phần suy luận (part.thought=True) nếu có."""
  cands = getattr(chunk, "candidates", None) or []
  if cands:
    content = getattr(cands[0], "content", None)
    parts = getattr(content, "parts", None) if content else None
    if parts:
      for p in parts:
        if getattr(p, "thought", False):
          continue
        t = getattr(p, "text", None)
        if t:
          yield t
      return
  # fallback khi SDK không phơi parts
  t = getattr(chunk, "text", None)
  if t:
    yield t


def _int_env(name: str, default: int) -> int:
  v = os.getenv(name, "").strip()
  if not v:
    return default
  try:
    return int(v)
  except ValueError:
    return default


def get_client() -> GeminiClient:
  key = os.getenv("GEMINI_API_KEY", "").strip()
  if not key:
    raise LLMError("Thiếu GEMINI_API_KEY (đặt trong backend/.env).")
  model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
  return GeminiClient(
    key, model,
    thinking_budget=_int_env("GEMINI_THINKING_BUDGET", DEFAULT_THINKING_BUDGET),
    max_output_tokens=_int_env("GEMINI_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS),
  )
