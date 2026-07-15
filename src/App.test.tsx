import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { atmosphereClassFor } from "./App";

const globalStylesCss = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);

describe("atmosphereClassFor", () => {
  it("gives the home page full-intensity atmosphere", () => {
    expect(atmosphereClassFor("/")).toBe("app-atmosphere");
  });

  it("gives dense content pages (bát tự) the soft variant", () => {
    expect(atmosphereClassFor("/bat-tu")).toBe("app-atmosphere app-atmosphere--soft");
    expect(atmosphereClassFor("/bazi")).toBe("app-atmosphere app-atmosphere--soft");
  });

  it("skips tử vi — it keeps its own galaxy atmosphere", () => {
    expect(atmosphereClassFor("/tu-vi")).toBeNull();
  });

  it("skips kinh dịch — legacy content already ships its own body background", () => {
    expect(atmosphereClassFor("/kinh-dich/luc-hao-co-ban")).toBeNull();
    expect(atmosphereClassFor("/kinh-dich/luc-hao-nang-cao")).toBeNull();
  });
});

describe(".app-atmosphere (src/styles.css)", () => {
  it("is viewport-fixed with a negative z-index so it never scrolls with content", () => {
    const block = globalStylesCss.match(/\.app-atmosphere\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/position:\s*fixed/);
    expect(block![1]).toMatch(/z-index:\s*-1/);
  });

  it("keeps the original tím/son/ngọc radial values untouched", () => {
    expect(globalStylesCss).toContain("rgb(126 77 151 / 24%)");
    expect(globalStylesCss).toContain("rgb(213 83 66 / 12%)");
    expect(globalStylesCss).toContain("rgb(117 182 151 / 10%)");
  });

  it("defines a soft modifier that lowers intensity for dense pages", () => {
    const block = globalStylesCss.match(/\.app-atmosphere--soft\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/--atmosphere-intensity:\s*0\.45/);
  });
});
