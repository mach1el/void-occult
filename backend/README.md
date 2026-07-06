# 🔮 Void Occult — Backend luận giải Tử Vi

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?style=flat-square&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-2094F3?style=flat-square&logo=gunicorn&logoColor=white)](https://www.uvicorn.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-behind%20ingress-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

Frontend an sao & vẽ lá số → gửi `ChartDTO` sang backend → backend chọn lọc tài
liệu KB (rule-based), dựng prompt **liên cung** (tam hợp / xung / giáp + cách cục
+ sinh-khắc + Tứ Hóa) → gọi **Gemini** (key ẩn server-side) → **stream** kết quả
về từng đoạn.

> 🔑 Gemini API key chỉ tồn tại ở backend. Frontend không bao giờ chạm tới key.

---

## 🔄 Pipeline

```text
ChartDTO (frontend)
   │
   ▼
classify_intent ──▶ build_focus (liencung.py)   # tam hợp/xung/giáp · cách cục · sinh-khắc · Tứ Hóa
   │                      │
   │                      ▼
   │              retriever.get_retriever()      # chọn lọc KB: CORE_DOCS + intent + dấu hiệu lá số + timing
   │                      │
   ▼                      ▼
build_system + build_user_turn (prompt.py)
   │
   ▼
GeminiClient.stream (llm.py) ──▶ StreamingResponse  # plain-text, từng chunk
```

## ⚙️ Cài đặt (local dev)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Tạo `backend/.env` với ít nhất `GEMINI_API_KEY` (xem bảng [Biến môi trường](#-biến-môi-trường)).

## ▶️ Chạy

```bash
uvicorn app.main:app --reload --port 8000
```

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/health` | Health + model đang dùng → `{ "ok": true, "model": "…" }` |
| `POST` | `/api/interpret` | Luận giải, **stream** plain-text từ Gemini |
| `POST` | `/api/debug/focus` | Soi prompt/focus (không gọi LLM) — 🔒 bị central ingress chặn (404) ở production |

Frontend React proxy `/api` và `/health` sang `http://localhost:8000` (xem
`vite.config.ts` ở repo gốc), nên không cần cấu hình URL thủ công khi dev.

## 🔐 Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `GEMINI_API_KEY` | *(bắt buộc)* | API key Google Gemini — chỉ ở backend |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model dùng để luận giải (thinking model) |
| `GEMINI_THINKING_BUDGET` | *(xem `llm.py`)* | Ngân sách suy luận: `0` tắt · `-1` động · `>0` giới hạn |
| `GEMINI_MAX_OUTPUT_TOKENS` | *(xem `llm.py`)* | Giới hạn token đầu ra |
| `ALLOW_ORIGINS` | `*` | CORS origins (phân tách bằng dấu phẩy) |

## 🧪 Test (không cần cài lib)

```bash
python3 -m unittest tests.test_liencung -v
```

## 📂 Cấu trúc

```text
app/
  main.py        FastAPI: /health, /api/interpret (stream), /api/debug/focus + CORS
  config.py      loader .env thuần stdlib → ALLOW_ORIGINS, GEMINI_MODEL
  schemas.py     Pydantic v2 — ChartDTO / PalaceDTO / StarDTO / MutagenDTO (hợp đồng với frontend)
  constants.py   INTENTS, CACH_CUC, ngũ hành, SYSTEM_PROMPT  (thuần stdlib)
  liencung.py    build_focus + classify_intent: intent + tam hợp/xung/giáp + cách cục + sinh-khắc + Tứ Hóa
  prompt.py      build_system + build_user_turn
  llm.py         GeminiClient (provider-agnostic, stream, thinking model)
  kb/
    retriever.py       retriever rule-based: CORE_DOCS + tài liệu theo intent/dấu hiệu lá số/timing
    data/nam_phai/     📚 corpus KB (20 tài liệu .md: phong cách, nguyên tắc, cung vị, Tứ Hóa, trạng thái sao, 14 chính tinh…)
tests/
  test_liencung.py
```

## 🐳 Docker

Backend không chạy độc lập ở production — nó là service `apexvoid-occult-backend` trong
`docker-compose.yml` ở repo gốc, chỉ `expose` cổng `8000` trong Docker network
`routing`. Central ingress (`../routing`) proxy `apexvoid.net/api/*` và
`/health` vào đây. Xem [README gốc](../README.md) để chạy full stack.

## 🗺️ Lộ trình

- [x] **Giai đoạn 1** — rule-based prompt liên cung + Gemini server-side (stream).
- [x] **Giai đoạn 2a** — corpus KB `nam_phai` + retriever rule-based chọn lọc tài
      liệu theo intent/dấu hiệu lá số (đã hoạt động trong `kb/retriever.py`).
- [ ] **Giai đoạn 2b** — nâng retriever lên **embeddings** khi corpus lớn dần
      (`sentence-transformers` / `faiss`, xem phần comment trong `requirements.txt`).
