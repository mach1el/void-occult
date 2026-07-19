import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR } from "../load-dataset";
import { buildCorpusManifestV02 } from "../build-controlled-corpus-v02";

const V02_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2");

/**
 * §"Output-scope isolation" — Tier 1 (calendar-panel, `menh-and-total`
 * scope) and Tiers 2/3 (`full-palace` scope) must never be merged into
 * one target/table. Checked structurally against the real files this
 * program has produced, not just against the type declarations.
 */
describe("Huyền Khí V0.2.1 · output-scope isolation", () => {
  it("calendar-panel files (Tier 1, menh-and-total) live under a different name/directory than the full-palace calendar-day cross-check files", () => {
    const topLevelFiles = readdirSync(V02_DIR, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
    const panelDirFiles = readdirSync(path.join(V02_DIR, "calendar-panels"));

    for (const f of topLevelFiles) {
      expect(f.startsWith("calendar-panel-")).toBe(false);
    }
    for (const f of panelDirFiles) {
      expect(f.startsWith("calendar-day-")).toBe(false);
    }
  });

  it("every real calendar-panel record is menh-and-total shaped (hours + menhHuyenKhi/wholeChartTotal), never carrying a full 12-palace `palaceScores` field", () => {
    const panelDirFiles = readdirSync(path.join(V02_DIR, "calendar-panels")).filter((f) => f.endsWith(".json"));
    expect(panelDirFiles.length).toBeGreaterThan(0);
    for (const f of panelDirFiles) {
      const panel = JSON.parse(readFileSync(path.join(V02_DIR, "calendar-panels", f), "utf-8")) as Record<string, unknown>;
      expect(panel).not.toHaveProperty("palaceScores");
      expect(Array.isArray(panel.hours)).toBe(true);
      for (const hour of panel.hours as Array<Record<string, unknown>>) {
        expect(typeof hour.menhHuyenKhi).toBe("number");
        expect(typeof hour.wholeChartTotal).toBe("number");
        expect(hour).not.toHaveProperty("palaceScores");
      }
    }
  });

  it("Tier 1 (calendar-panel) capture activity never inflates the full-palace gold/target count computed by buildCorpusManifestV02", () => {
    // Real calendar-panel hours have been captured this pass (24 across
    // the two real panels) — proving the isolation is structural
    // (different files/tier), not just an accidental zero.
    const panelDirFiles = readdirSync(path.join(V02_DIR, "calendar-panels")).filter((f) => f.endsWith(".json"));
    const capturedHours = panelDirFiles.reduce((sum, f) => {
      const panel = JSON.parse(readFileSync(path.join(V02_DIR, "calendar-panels", f), "utf-8")) as { hours: unknown[] };
      return sum + panel.hours.length;
    }, 0);
    expect(capturedHours).toBeGreaterThan(0);

    const manifest = buildCorpusManifestV02();
    expect(manifest.goldRecordCount).toBe(0);
    expect(manifest.goldTargetCompletionRate).toBe(0);
  });
});
