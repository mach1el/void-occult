import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function copyChartAssets(): Plugin {
  const root = dirname(fileURLToPath(import.meta.url));
  return {
    name: "copy-chart-assets",
    closeBundle() {
      const target = resolve(root, "dist/assets/zodiac");
      mkdirSync(target, { recursive: true });
      cpSync(
        resolve(root, "pages/purple-star/assets/zodiac"),
        target,
        { recursive: true },
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyChartAssets()],
  build: {
    target: "es2022",
    sourcemap: false,
    cssMinify: "lightningcss",
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
