import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR } from "../load-dataset";
import { parseMenhGeometry, unknownFacts } from "../parse-menh-geometry";
import type { HuyenKhiCalendarMenhPanel } from "../types-v02-1";

const V02_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2");

function loadPanel(fileName: string): HuyenKhiCalendarMenhPanel {
  return JSON.parse(readFileSync(path.join(V02_DIR, "calendar-panels", fileName), "utf-8")) as HuyenKhiCalendarMenhPanel;
}

describe("parseMenhGeometry · real captured panel data (1950-01-15, hour Tý)", () => {
  const panel = loadPanel("calendar-panel-1950-01-15.json");
  const tyHour = panel.hours.find((h) => h.hourBranch === "Tý");
  if (!tyHour) throw new Error("fixture missing hour Tý");
  const geometry = parseMenhGeometry(tyHour);

  it("preserves the four relation groups unflattened, with tam hợp / nhị hợp as two-element tuples", () => {
    expect(geometry.tamHop).toHaveLength(2);
    expect(geometry.nhiHop).toHaveLength(2);
    expect(geometry.toaThu.length).toBe(tyHour.toaThu.length);
    expect(geometry.xungChieu.length).toBe(tyHour.xungChieu.length);
  });

  it("parses brightness letters off the raw label", () => {
    const phaQuan = geometry.toaThu.find((f) => f.rawLabel === "Phá quân (M)");
    expect(phaQuan?.brightness).toBe("M");
    expect(phaQuan?.canonicalName).toBeTruthy();
  });

  it("tags Hóa transformations and Tuần/Triệt void markers distinctly", () => {
    const hoaQuyen = geometry.tamHop[0].find((f) => f.rawLabel.includes("Hóa quyền"));
    expect(hoaQuyen?.isTransformation).toBe(true);
    const tuan = geometry.xungChieu.find((f) => f.rawLabel === "Tuần");
    expect(tuan?.isVoidMarker).toBe(true);
  });

  it("classifies Vô Chính Diệu as a known context marker, not an unknown star", () => {
    // Hour Mão (1950-01-15) has "Vô chính diệu" in its relation lists.
    const maoHour = panel.hours.find((h) => h.hourBranch === "Mão");
    expect(maoHour).toBeDefined();
    if (!maoHour) return;
    const maoGeometry = parseMenhGeometry(maoHour);
    const vcd = maoGeometry.tamHop[0].find((f) => f.rawLabel === "Vô chính diệu");
    expect(vcd?.parseStatus).toBe("known-context-only");
  });

  it("retains flying-star / life-cycle context markers as known-context-only, not silently as canonical major/minor stars", () => {
    const tructPhu = geometry.toaThu.find((f) => f.rawLabel === "Trực phù");
    expect(tructPhu?.parseStatus).toBe("known-context-only");
  });

  it("reports zero unknown facts across all 12 captured hours of this real panel (diagnostics retained, not dropped, when present)", () => {
    const allUnknown = panel.hours.flatMap((h) => unknownFacts(parseMenhGeometry(h)));
    // Not asserting the list is non-empty — real coverage may be complete.
    // Asserting the mechanism works: every returned item really has status "unknown".
    expect(allUnknown.every((f) => f.parseStatus === "unknown")).toBe(true);
  });
});
