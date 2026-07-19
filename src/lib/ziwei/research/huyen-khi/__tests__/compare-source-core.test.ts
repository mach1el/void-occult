import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR } from "../load-dataset";
import { compareSourceAndCore } from "../compare-source-core";
import type { HuyenKhiCalendarMenhPanel } from "../types-v02-1";

const V02_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2");

function loadPanel(fileName: string): HuyenKhiCalendarMenhPanel {
  return JSON.parse(readFileSync(path.join(V02_DIR, "calendar-panels", fileName), "utf-8")) as HuyenKhiCalendarMenhPanel;
}

describe("compareSourceAndCore · real captured panel data", () => {
  it("agrees on Mệnh branch/stem, Cục, Thân cư and the major star for 1950-01-15 hour Tý", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const tyHour = panel.hours.find((h) => h.hourBranch === "Tý");
    if (!tyHour) throw new Error("fixture missing hour Tý");
    const report = compareSourceAndCore("test-1950-01-15-Ty", panel.solarDate, "Tý", panel.sex, tyHour);
    expect(report.structuralAgreement.menhBranch).toBe(true);
    expect(report.structuralAgreement.menhStem).toBe(true);
    expect(report.structuralAgreement.cuc).toBe(true);
    expect(report.structuralAgreement.thanCu).toBe(true);
    expect(report.structuralAgreement.majorStars.onlyInSource).toEqual([]);
    expect(report.structuralAgreement.majorStars.onlyInCore).toEqual([]);
    expect(report.disagreements).toEqual([]);
  });

  it("agrees across every one of the 12 real hours of both captured panels (genuine finding, not asserted a priori)", () => {
    for (const file of ["calendar-panel-1950-01-15.json", "calendar-panel-1955-02-15.json"]) {
      const panel = loadPanel(file);
      for (const h of panel.hours) {
        const report = compareSourceAndCore(`${panel.solarDate}-${h.hourBranch}`, panel.solarDate, h.hourBranch, panel.sex, h);
        expect(report.disagreements, `${file} hour ${h.hourBranch}`).toEqual([]);
      }
    }
  });

  it("does not conflate minor stars sitting in the palace with the major-star comparison", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const tyHour = panel.hours.find((h) => h.hourBranch === "Tý");
    if (!tyHour) throw new Error("fixture missing hour Tý");
    // The real fixture's toaThu for hour Tý includes minor stars (Hữu bật,
    // Thiên khôi) and context markers (Trực phù, Phi liêm) alongside the
    // one major star (Phá quân) — none of the minor/context names should
    // leak into the major-star agreement as a spurious "onlyInSource".
    expect(tyHour.toaThu).toContain("Hữu bật");
    const report = compareSourceAndCore("test-1950-01-15-Ty-minor-check", panel.solarDate, "Tý", panel.sex, tyHour);
    expect(report.structuralAgreement.majorStars.onlyInSource).not.toContain("hữu bật");
  });

  it("flags a genuine field mismatch rather than silently favoring either side", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const tyHour = panel.hours.find((h) => h.hourBranch === "Tý");
    if (!tyHour) throw new Error("fixture missing hour Tý");
    const corrupted = { ...tyHour, menhPalaceStemBranch: "Giáp Dần" };
    const report = compareSourceAndCore("test-corrupted-menh", panel.solarDate, "Tý", panel.sex, corrupted);
    expect(report.structuralAgreement.menhBranch).toBe(false);
    expect(report.structuralAgreement.menhStem).toBe(false);
    const branchDisagreement = report.disagreements.find((d) => d.field === "menhBranch");
    expect(branchDisagreement?.status).toBe("unresolved");
    expect(branchDisagreement?.sourceValue).toBe("Dần");
    expect(branchDisagreement?.coreValue).toBe("Tý");
  });
});
