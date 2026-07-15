import { lazy, Suspense, type ReactNode } from "react";
import { HomePage } from "./components/shared/HomePage";
import { SupportButton } from "./components/shared/SupportButton";

const ChartPage = lazy(() =>
  import("./components/ziwei/ChartPage").then((module) => ({
    default: module.ChartPage,
  })),
);
const BasicArticlePage = lazy(
  () => import("./components/iching/BasicArticlePage"),
);
const AdvancedArticlePage = lazy(
  () => import("./components/iching/AdvancedArticlePage"),
);
const BaziPage = lazy(() =>
  import("./components/bazi/BaziPage").then((module) => ({
    default: module.BaziPage,
  })),
);

function loading(content: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-void text-sm text-muted">
          Đang nạp nội dung…
        </div>
      }
    >
      {content}
    </Suspense>
  );
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

// Đường dẫn /pages/... cũ (trước khi thư mục pages/ bị xoá ở restructure) có thể
// đã được chia sẻ/bookmark — ánh xạ về path hiện hành để không vỡ link cũ.
const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  "/pages/purple-star/tu-vi-dau-so.html": "/tu-vi",
  "/pages/i-ching/luc-hao-co-ban.html": "/kinh-dich/luc-hao-co-ban",
  "/pages/i-ching/luc-hao-nang-cao.html": "/kinh-dich/luc-hao-nang-cao",
};

// Quầng khí phủ toàn app (xem .app-atmosphere trong src/styles.css).
// - Tử Vi: có "galaxy" atmosphere riêng (body radial trong tu-vi.css) — KHÔNG
//   nhận class này để tránh chồng lớp hai hệ quầng khí khác palette.
// - Kinh Dịch (/kinh-dich/*): nội dung là HTML tĩnh legacy tự mang <style> với
//   body{background:...} riêng (cinnabar/gold) — cũng KHÔNG nhận class này,
//   vì .app-atmosphere (tím/son/ngọc, fixed, z-index âm) vẫn nằm TRÊN nền
//   body thật của legacy content trong stacking order, nên sẽ chồng hai quầng
//   khí khác palette lên nhau. Xem PR mục "Phát hiện thêm".
// - Bát Tự: chưa có quầng khí nào → dùng bản mờ (--soft) để không đua với lá số.
// - Trang chủ: giữ cường độ đậm như thiết kế gốc.
export function atmosphereClassFor(path: string): string | null {
  if (path === "/tu-vi") return null;
  if (path === "/kinh-dich/luc-hao-co-ban" || path === "/kinh-dich/luc-hao-nang-cao") return null;
  if (path === "/") return "app-atmosphere";
  return "app-atmosphere app-atmosphere--soft";
}

export function App() {
  const rawPath = normalizePath(window.location.pathname);
  const path = LEGACY_PATH_REDIRECTS[rawPath] ?? rawPath;
  const atmosphereClass = atmosphereClassFor(path);

  let content: ReactNode;
  if (path === "/tu-vi") {
    content = loading(<ChartPage />);
  } else if (path === "/kinh-dich/luc-hao-co-ban") {
    content = loading(<BasicArticlePage />);
  } else if (path === "/kinh-dich/luc-hao-nang-cao") {
    content = loading(<AdvancedArticlePage />);
  } else if (path === "/bat-tu" || path === "/bazi") {
    content = loading(<BaziPage />);
  } else {
    content = <HomePage />;
  }

  return (
    <>
      {atmosphereClass && <div className={atmosphereClass} aria-hidden="true" />}
      {content}
      <SupportButton />
    </>
  );
}
