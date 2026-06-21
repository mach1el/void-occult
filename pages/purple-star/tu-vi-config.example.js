/* CẤU HÌNH FRONTEND — MẪU.
 *
 * Cách dùng:
 *   1. Sao chép file này thành "tu-vi-config.js" (đặt cạnh nó).
 *   2. Điền BACKEND_URL trỏ tới backend Python (FastAPI).
 *   3. tu-vi-config.js đã được .gitignore -> KHÔNG bị commit.
 *
 * Luận giải AI giờ chạy ở BACKEND Python (build prompt + RAG + gọi LLM).
 * API key Gemini đặt ở backend/.env (KHÔNG để trong frontend nữa -> không lộ key).
 */
window.VOIDOCC_CONFIG = {
  // Backend luận giải. Local dev mặc định:
  BACKEND_URL: "http://localhost:8000"
};
