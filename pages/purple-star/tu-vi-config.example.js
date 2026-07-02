/* CẤU HÌNH FRONTEND — MẪU.
 *
 * Cách dùng:
 *   1. Sao chép file này thành "tu-vi-config.js" (đặt cạnh nó).
 *   2. Để trống BACKEND_URL nếu frontend/API dùng cùng central routing origin.
 *   3. tu-vi-config.js đã được .gitignore -> KHÔNG bị commit.
 *
 * Luận giải AI giờ chạy ở BACKEND Python (build prompt + RAG + gọi LLM).
 * API key Gemini đặt ở backend/.env (KHÔNG để trong frontend nữa -> không lộ key).
 */
window.VOIDOCC_CONFIG = {
  // Điền URL đầy đủ chỉ khi backend chạy trên origin khác.
  BACKEND_URL: ""
};
