# Void Occult — Backend luận giải Tử Vi (Python / FastAPI)

Frontend (JS) an sao & vẽ lá số → gửi chart sang backend này → backend dựng prompt
liên cung (rule-based) + (sau này) truy KB embeddings → gọi LLM (Gemini, key ẩn) →
stream kết quả về.

## Cài đặt (local dev)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # rồi điền GEMINI_API_KEY
```

## Chạy

```bash
uvicorn app.main:app --reload --port 8000
```

- Health: `GET  http://localhost:8000/health`
- Luận giải (stream): `POST http://localhost:8000/api/interpret`
- Soi prompt (không gọi LLM): `POST http://localhost:8000/api/debug/focus`

Frontend: copy `pages/purple-star/tu-vi-config.example.js` → `tu-vi-config.js`,
đặt `BACKEND_URL: "http://localhost:8000"`.

## Test (không cần cài lib)

```bash
python3 -m unittest tests.test_liencung -v
```

## Cấu trúc

```
app/
  main.py        FastAPI: /api/interpret (stream), /api/debug/focus, /health
  schemas.py     Pydantic — hợp đồng chart JSON với frontend
  constants.py   INTENTS, CACH_CUC, ngũ hành, SYSTEM_PROMPT  (thuần stdlib)
  liencung.py    build_focus: intent + tam hợp/xung/giáp + cách cục + sinh-khắc + Tứ Hóa
  prompt.py      lắp system + lượt user
  llm.py         GeminiClient (provider-agnostic, stream)
  kb/retriever.py  scaffold RAG (NullRetriever bây giờ; EmbeddingRetriever sau)
tests/
  test_liencung.py
```

## Lộ trình

- [x] Giai đoạn 1: rule-based prompt + Gemini server-side (stream).
- [ ] Giai đoạn 2: KB corpus (do người dùng biên soạn) + embeddings retriever
      → điền vào `kb/retriever.py`, chèn `[KB THAM CHIẾU]` qua `build_user_turn`.
