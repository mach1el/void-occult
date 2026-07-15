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

export function App() {
  const rawPath = normalizePath(window.location.pathname);
  const path = LEGACY_PATH_REDIRECTS[rawPath] ?? rawPath;

  if (path === "/tu-vi") {
    return (
      <>
        {loading(<ChartPage />)}
        <SupportButton />
      </>
    );
  }
  if (path === "/kinh-dich/luc-hao-co-ban") {
    return (
      <>
        {loading(<BasicArticlePage />)}
        <SupportButton />
      </>
    );
  }
  if (path === "/kinh-dich/luc-hao-nang-cao") {
    return (
      <>
        {loading(<AdvancedArticlePage />)}
        <SupportButton />
      </>
    );
  }
  if (path === "/bat-tu" || path === "/bazi") {
    return (
      <>
        {loading(<BaziPage />)}
        <SupportButton />
      </>
    );
  }
  return (
    <>
      <HomePage />
      <SupportButton />
    </>
  );
}
