import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR } from "../load-dataset";
import { validateCalendarPanel } from "../validate-calendar-panel";
import type { HuyenKhiCalendarMenhPanel } from "../types-v02-1";

const V02_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2");

function loadPanel(fileName: string): HuyenKhiCalendarMenhPanel {
  return JSON.parse(readFileSync(path.join(V02_DIR, "calendar-panels", fileName), "utf-8")) as HuyenKhiCalendarMenhPanel;
}

describe("validateCalendarPanel · real captured panels", () => {
  it("marks a real, fully-transcribed 12-hour panel as complete", () => {
    const report = validateCalendarPanel(loadPanel("calendar-panel-1950-01-15.json"));
    expect(report.complete).toBe(true);
    expect(report.missingHours).toEqual([]);
    expect(report.duplicateHours).toEqual([]);
    expect(report.solarDate).toBe("1950-01-15");
  });

  it("marks the second real panel complete too", () => {
    const report = validateCalendarPanel(loadPanel("calendar-panel-1955-02-15.json"));
    expect(report.complete).toBe(true);
  });

  it("rejects a panel missing hours", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const truncated = { ...panel, hours: panel.hours.slice(0, 10) };
    const report = validateCalendarPanel(truncated);
    expect(report.complete).toBe(false);
    expect(report.missingHours).toHaveLength(2);
  });

  it("rejects a panel with a duplicated hour", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const withDuplicate = { ...panel, hours: [...panel.hours.slice(0, 11), panel.hours[0]!] };
    const report = validateCalendarPanel(withDuplicate);
    expect(report.complete).toBe(false);
    expect(report.duplicateHours).toContain("Tý");
    expect(report.missingHours).toContain("Hợi");
  });

  it("rejects a panel with a malformed (non-finite) score", () => {
    const panel = loadPanel("calendar-panel-1950-01-15.json");
    const malformedHours = panel.hours.map((h, i) => (i === 0 ? { ...h, menhHuyenKhi: Number.NaN } : h));
    const report = validateCalendarPanel({ ...panel, hours: malformedHours });
    expect(report.complete).toBe(false);
  });
});
