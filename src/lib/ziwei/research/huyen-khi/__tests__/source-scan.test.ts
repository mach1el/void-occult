import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUYEN_KHI_DIR = path.resolve(__dirname, "..");
const ANALYSIS_MODULES_DIR = path.resolve(__dirname, "../../../analysis/modules");

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

describe("Huyền Khí V0.1 · source scans", () => {
  it("no production analysis module imports research/huyen-khi tooling or data (§13 — no production engine yet)", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(ANALYSIS_MODULES_DIR)) {
      const source = readFileSync(file, "utf-8");
      if (/research\/huyen-khi|research\.huyen-khi|from ["'].*huyen-khi/i.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("`src/lib/ziwei/analysis/modules/huyen-khi/` does not exist (§13 explicit prohibition)", () => {
    const forbiddenDir = path.resolve(__dirname, "../../../analysis/modules/huyen-khi");
    expect(() => readdirSync(forbiddenDir)).toThrow();
  });

  it("no huyen-khi research tooling file performs a network fetch (V0.1 has no live collector)", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(HUYEN_KHI_DIR)) {
      const source = readFileSync(file, "utf-8");
      if (/\bfetch\s*\(|node-fetch|axios|http\.get\(|https\.get\(|XMLHttpRequest/i.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no huyen-khi tooling file imports another analysis module's score (§7 leakage guard)", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(HUYEN_KHI_DIR)) {
      const source = readFileSync(file, "utf-8");
      if (/from ["'].*modules\/(annual-axes|major-fortune|monthly-flow|palace-overview)["']/i.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
