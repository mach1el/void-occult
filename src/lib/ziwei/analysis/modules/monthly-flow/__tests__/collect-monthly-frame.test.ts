import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { collectMonthlyFrame } from "../collect-monthly-frame";

const FORWARD_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

function buildChart(): ChartData {
  const palaces: ChartPalace[] = FORWARD_NAMES.map((name, index) => ({
    index,
    branch: `b${index}`,
    name,
  }));
  return { palaces } as unknown as ChartData;
}

describe("collectMonthlyFrame — TP4C geometry", () => {
  const loaded = loadMonthlyFlowScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("monthly flow knowledge failed to load");
  const geometry = loaded.knowledge.domainDefinitions.monthlyActivationFrame;

  it("wraps correctly when focus is index 11", () => {
    const chart = buildChart();
    const frame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 11,
      monthKey: "2026-M01",
      geometry,
    });
    expect(frame).not.toBeNull();
    expect(frame?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [11, "focus"],
      [5, "opposite"],
      [3, "trine"],
      [7, "trine"],
    ]);
    expect([...(frame?.indexSet ?? [])].sort((a, b) => a - b)).toEqual([3, 5, 7, 11]);
  });

  it("wraps correctly when focus is index 0", () => {
    const chart = buildChart();
    const frame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey: "2026-M02",
      geometry,
    });
    expect(frame).not.toBeNull();
    expect(frame?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [0, "focus"],
      [6, "opposite"],
      [4, "trine"],
      [8, "trine"],
    ]);
  });

  it("returns null and reports missing nodes when TP4C is incomplete", () => {
    const chart = buildChart();
    chart.palaces = chart.palaces.filter((p) => p.index !== 6);
    const missing: string[] = [];
    const frame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey: "2026-M03",
      geometry,
      onMissingNode: (key) => missing.push(key),
    });
    expect(frame).toBeNull();
    expect(missing.some((m) => m.includes("opposite"))).toBe(true);
  });

  it("returns null and reports missing when a trine is absent", () => {
    const chart = buildChart();
    chart.palaces = chart.palaces.filter((p) => p.index !== 4);
    const missing: string[] = [];
    const frame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey: "2026-M04",
      geometry,
      onMissingNode: (key) => missing.push(key),
    });
    expect(frame).toBeNull();
    expect(missing.some((m) => m.includes("trine"))).toBe(true);
  });
});
