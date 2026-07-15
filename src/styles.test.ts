import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalStylesCss = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);

function readVar(name: string): string | undefined {
  const match = globalStylesCss.match(
    new RegExp(`--${name}:\\s*([^;]+);`),
  );
  return match?.[1]?.trim();
}

describe("page-level scheme tokens (src/styles.css :root)", () => {
  it("defines surface/border/text/state/accent role tokens", () => {
    const required = [
      "surface-1",
      "surface-2",
      "surface-3",
      "border-subtle",
      "border-strong",
      "text-primary",
      "text-muted",
      "text-dim",
      "accent",
      "accent-hover",
      "state-hover",
      "state-active",
      "state-selected",
      "paper-light",
    ];
    for (const token of required) {
      expect(readVar(token), `--${token} phải được định nghĩa trong src/styles.css`).toBeDefined();
    }
  });

  it("keeps surface tiers distinct and progressively brighter", () => {
    const s1 = readVar("surface-1");
    const s2 = readVar("surface-2");
    const s3 = readVar("surface-3");
    expect(s1).not.toBe(s2);
    expect(s2).not.toBe(s3);
    expect(s1).not.toBe(s3);
  });

  it("does not repurpose ngũ hành/tứ hóa tokens as context colors", () => {
    // Token khung cảnh (context) phải tách biệt khỏi token dữ liệu ngũ hành —
    // không token nào ở nhóm surface/border/text/state trỏ lại var(--element-*)
    // hay var(--mutagen-*).
    const contextBlockMatch = globalStylesCss.match(
      /--surface-1:[\s\S]*?--paper-light:[^;]+;/,
    );
    expect(contextBlockMatch).not.toBeNull();
    expect(contextBlockMatch![0]).not.toMatch(/var\(--element-/);
    expect(contextBlockMatch![0]).not.toMatch(/var\(--mutagen-/);
  });
});
