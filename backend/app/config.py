"""Cấu hình từ môi trường + .env (stdlib loader, không cần python-dotenv)."""
import os
from pathlib import Path


def _load_env():
  p = Path(__file__).resolve().parent.parent / ".env"
  if not p.exists():
    return
  for line in p.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    k, v = line.split("=", 1)
    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env()

ALLOW_ORIGINS = [o.strip() for o in os.getenv("ALLOW_ORIGINS", "*").split(",") if o.strip()]
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
