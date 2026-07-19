import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PublicHuyenKhiDataset } from "./types";

/**
 * Research data lives under `research/huyen-khi/v0.1/` (repo root), not
 * under `src/` — plain `fs` reads, not TS JSON imports, matching the
 * existing `research/annual-axes/` audit-report convention (`fs.writeFileSync`
 * with relative paths) rather than importing across the `src/` tsconfig
 * boundary.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../../..");
export const HUYEN_KHI_DATA_DIR = path.join(REPO_ROOT, "research/huyen-khi/v0.1");

export function loadPublicHuyenKhiDataset(): PublicHuyenKhiDataset {
  const raw = readFileSync(path.join(HUYEN_KHI_DATA_DIR, "public-output-samples.v0.1.json"), "utf-8");
  return JSON.parse(raw) as PublicHuyenKhiDataset;
}
