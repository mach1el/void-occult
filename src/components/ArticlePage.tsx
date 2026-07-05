import { useEffect, useMemo } from "react";

interface ArticlePageProps {
  source: string;
  title: string;
}

function extract(source: string, tag: "style" | "body"): string {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ?? "";
}

export function ArticlePage({ source, title }: ArticlePageProps) {
  const style = useMemo(() => extract(source, "style"), [source]);
  const body = useMemo(() => extract(source, "body"), [source]);

  useEffect(() => {
    document.title = `${title} · Void Occult`;
  }, [title]);

  return (
    <>
      <style>{style}</style>
      <a
        href="/"
        aria-label="Về trang chủ Void Occult"
        style={{
          position: "fixed",
          zIndex: 50,
          top: 18,
          left: 18,
          padding: "9px 14px",
          border: "1px solid rgba(224,193,120,.38)",
          borderRadius: 999,
          color: "#e0c178",
          background: "rgba(22,17,13,.86)",
          backdropFilter: "blur(12px)",
          font: "600 13px 'Noto Serif', serif",
          textDecoration: "none",
        }}
      >
        ← Void Occult
      </a>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}
