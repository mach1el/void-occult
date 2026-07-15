import { useState } from "react";
import donateQr from "../../assets/donate-qr.jpg";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-ink border border-white/20 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:border-gold/50 transition-all z-50 group"
        aria-label="Support My Work"
      >
        <span className="text-2xl text-gold group-hover:animate-pulse">❤️</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-ink border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-gold/5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-paper transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-gold">Support My Work</h2>
                <p className="text-sm text-muted">
                  Nếu bạn thấy các công cụ này hữu ích, hãy ủng hộ để giúp duy trì và phát triển thêm các tính năng mới nhé! ❤️
                </p>
              </div>

              {/* VietQR Image */}
              <div className="mx-auto border border-white/10 rounded-xl overflow-hidden bg-white/5 p-2 w-full max-w-[240px]">
                <img
                  src={donateQr}
                  alt="VietQR Donate"
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* PayPal Button */}
              <a
                href="https://paypal.me/stmichael01"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#00457C] hover:bg-[#0079C1] text-white font-medium rounded-lg transition-colors border border-transparent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM6.357 2.062 3.655 19.274h2.247l1.096-6.953a1.921 1.921 0 0 1 1.897-1.624h2.19c3.277 0 5.864-1.128 6.55-4.66.024-.121.045-.24.062-.358.17-1.144-.01-2.003-.547-2.612C16.4 2.228 14.862 2.062 12.87 2.062H6.357z" />
                  <path d="M20.434 7.234c-1.043 5.37-4.634 7.218-9.213 7.218h-2.19a1.921 1.921 0 0 0-1.897 1.624l-1.282 8.136h-4.04l1.28-8.125h3.018c4.896 0 8.625-1.935 9.774-7.854.067-.344.116-.694.15-1.048z" />
                </svg>
                Donate via PayPal
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
