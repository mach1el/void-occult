import { lazy, Suspense, type ReactNode } from "react";
import { HomePage } from "./components/HomePage";

const ChartPage = lazy(() =>
  import("./components/chart/ChartPage").then((module) => ({
    default: module.ChartPage,
  })),
);
const BasicArticlePage = lazy(
  () => import("./components/articles/BasicArticlePage"),
);
const AdvancedArticlePage = lazy(
  () => import("./components/articles/AdvancedArticlePage"),
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

export function App() {
  const path = normalizePath(window.location.pathname);

  if (
    path === "/tu-vi" ||
    path === "/pages/purple-star/tu-vi-dau-so.html"
  ) {
    return loading(<ChartPage />);
  }
  if (
    path === "/kinh-dich/luc-hao-co-ban" ||
    path === "/pages/i-ching/luc-hao-co-ban.html"
  ) {
    return loading(<BasicArticlePage />);
  }
  if (
    path === "/kinh-dich/luc-hao-nang-cao" ||
    path === "/pages/i-ching/luc-hao-nang-cao.html"
  ) {
    return loading(<AdvancedArticlePage />);
  }
  return <HomePage />;
}
