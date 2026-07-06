# Void Occult

Frontend cho thư viện Kinh Dịch / Lục Hào, công cụ lập lá số Tử Vi Đẩu Số và
backend luận giải Gemini.

## Tech stack

- React 19 + TypeScript strict
- Vite 8
- Tailwind CSS 4
- FastAPI + Gemini
- Docker Compose
- Nginx chỉ phục vụ bundle frontend bên trong container; ingress và TLS do repo
  `../routing` quản lý

Frontend được build thành artifact `dist/`. Container không còn mount hoặc public
toàn bộ source repository, và không còn cấu hình/phụ thuộc Netlify.

## Cấu trúc

```text
src/
  components/          React UI: homepage, bài viết, lá số, AI chat
  lib/                 adapter typed cho domain engine và export
  types/               DTO/hợp đồng TypeScript với backend
pages/
  i-ching/             nội dung bài viết gốc, Vite import lúc build
  purple-star/         domain engine Tử Vi và CSS lá số
backend/               FastAPI, RAG và Gemini streaming
deploy/
  frontend.Dockerfile  multi-stage build
  nginx.conf           static server nội bộ + SPA fallback
```

Hai engine Tử Vi hiện hữu được giữ nguyên làm domain layer để tránh thay đổi thuật
toán an sao. React giao tiếp với engine qua adapter typed trong `src/lib/chart.ts`.

## Phát triển frontend

Yêu cầu Node.js 22.12 trở lên.

```bash
npm ci
npm run dev
```

Vite chạy tại `http://localhost:5173` và proxy `/api`, `/health` sang FastAPI tại
`http://localhost:8000`.

Các lệnh kiểm tra:

```bash
npm run typecheck
npm test
npm run build
```

Backend dùng test thuần stdlib:

```bash
cd backend
python -m unittest discover -s tests
```

## Chạy đầy đủ bằng Docker

Tạo `backend/.env` và điền `GEMINI_API_KEY`, sau đó bảo đảm network của project
`routing` đã tồn tại:

```bash
docker compose up --build -d
```

Services chỉ `expose` trong Docker network `routing`:

- `voidocc-frontend:80`
- `voidocc-backend:8000`

Repo này không publish host port và không sửa cấu hình ingress của
`Projects/routing`.

## Routes

Public qua central ingress (`../routing`): `apexvoid.net`, `fate.apexvoid.net`,
và `void-occult.localhost` (HTTP-only cho dev) đều trỏ vào stack này.

- `/` — trang chủ (`voidocc-frontend`)
- `/kinh-dich/luc-hao-co-ban`
- `/kinh-dich/luc-hao-nang-cao`
- `/tu-vi` — lá số Tử Vi (lazy-load engine)
- `/api/interpret` — Gemini streaming qua FastAPI (`voidocc-backend`)
- `/health` — backend health (`voidocc-backend`)
- `/api/debug/*` — bị ingress chặn (404) ở production

Các URL `.html` cũ vẫn được frontend map tương thích để bookmark hiện hữu không
bị gãy.

## Ghi chú kiến trúc

- Gemini API key chỉ tồn tại ở backend; frontend không còn UI lưu API key trong
  `localStorage`.
- Engine Tử Vi được tách khỏi initial bundle và chỉ lazy-load khi mở `/tu-vi`.
- Export ảnh dùng trực tiếp package `html-to-image`.
- Nginx container dùng SPA fallback; central routing, hostname và TLS thuộc repo
  `../routing`.
