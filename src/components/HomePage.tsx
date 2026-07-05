import type { CSSProperties } from "react";

interface Feature {
  eyebrow: string;
  han: string;
  title: string;
  description: string;
  href: string;
  accent: "cinnabar" | "gold" | "jade";
  wide?: boolean;
}

const features: Feature[] = [
  {
    eyebrow: "Tầng 1 · Nền tảng",
    han: "基",
    title: "Luận Giải Căn Bản",
    description:
      "Ngũ Hành sinh khắc, Lục Thân, Thế–Ứng, Dụng Thần và cách đo Vượng–Suy qua một quẻ hoàn chỉnh.",
    href: "/kinh-dich/luc-hao-co-ban",
    accent: "cinnabar",
  },
  {
    eyebrow: "Tầng 2 · Nâng cao",
    han: "進",
    title: "Luận Giải Nâng Cao",
    description:
      "Hào động, biến quái, Tuần Không, Phục–Phi thần, Nhật–Nguyệt và các quan hệ Hợp–Xung–Hội cục.",
    href: "/kinh-dich/luc-hao-nang-cao",
    accent: "gold",
  },
  {
    eyebrow: "Công cụ · Tử Vi Đẩu Số",
    han: "紫微",
    title: "Lập Lá Số Tử Vi",
    description:
      "Hai trường phái Nam Phái và Trung Châu, Tứ Hóa, đại vận, lưu niên, xuất dữ liệu và luận giải AI qua backend riêng.",
    href: "/tu-vi",
    accent: "jade",
    wide: true,
  },
];

const accentClasses = {
  cinnabar: {
    text: "text-cinnabar",
    border: "hover:border-cinnabar/60",
    glow: "#d55342",
  },
  gold: {
    text: "text-gold",
    border: "hover:border-gold/60",
    glow: "#dfbd6d",
  },
  jade: {
    text: "text-jade",
    border: "hover:border-jade/60",
    glow: "#75b697",
  },
};

export function HomePage() {
  return (
    <div className="home-noise min-h-screen overflow-hidden bg-void text-paper">
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <header className="flex min-h-[58vh] flex-col items-center justify-center py-20 text-center">
          <div className="mb-8 grid size-24 -rotate-3 place-items-center rounded-2xl border-2 border-cinnabar/85 bg-cinnabar/5 font-han text-5xl font-black text-cinnabar shadow-[inset_0_0_28px_rgba(213,83,66,.12),0_0_45px_rgba(213,83,66,.08)] sm:size-28 sm:text-6xl">
            玄
          </div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-gold/80">
            Kinh Dịch · Lục Hào · Tử Vi
          </p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl lg:text-8xl">
            Void <span className="italic text-gold">Occult</span>
          </h1>
        </header>

        <section aria-labelledby="explore-heading">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Khám phá
              </p>
              <h2
                id="explore-heading"
                className="font-display text-2xl font-semibold sm:text-3xl"
              >
                Chọn một lộ trình
              </h2>
            </div>
            <span className="hidden font-han text-sm text-muted sm:block">
              易 · 六爻 · 紫微斗數
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const accent = accentClasses[feature.accent];
              return (
                <a
                  key={feature.href}
                  href={feature.href}
                  className={`feature-card group relative isolate min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-7 text-inherit shadow-2xl shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] sm:p-9 ${accent.border} ${feature.wide ? "md:col-span-2 md:min-h-64" : ""}`}
                  style={
                    {
                      "--card-glow": accent.glow,
                    } as CSSProperties
                  }
                >
                  <div className="relative z-10 flex h-full flex-col">
                    <div
                      className={`mb-8 font-han text-5xl font-bold ${accent.text}`}
                    >
                      {feature.han}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 max-w-3xl flex-1 font-serif leading-7 text-muted">
                      {feature.description}
                    </p>
                    <span
                      className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${accent.text}`}
                    >
                      Mở nội dung
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-7 text-center text-xs text-muted">
          © 2026 ApexVoid. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
