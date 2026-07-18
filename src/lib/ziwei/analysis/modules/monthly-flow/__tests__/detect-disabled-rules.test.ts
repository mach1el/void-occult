import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { detectDisabledRules } from "../detect-disabled-rules";
import {
  emptyMonthlyFlowMonthDiagnostics,
  type ResolvedMonthlyTransformation,
} from "../types";

function palace(index: number, stars: ChartStar[], name = `P${index}`): ChartPalace {
  return { index, branch: `b${index}`, name, stars };
}

function chartWith(palaces: ChartPalace[], annualMutagens: MutagenRecord[] = []): ChartData {
  const all = [...palaces];
  for (let i = 0; i < 12; i++) {
    if (!all.find((p) => p.index === i)) all.push(palace(i, []));
  }
  return { palaces: all, annualMutagens } as unknown as ChartData;
}

describe("detectDisabledRules — monthly interactions", () => {
  const loaded = loadMonthlyFlowScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("failed to load monthly knowledge");
  const knowledge = loaded.knowledge;

  it("hits when Khoa + Kỵ resolve to the same palace + canonical star", () => {
    const target = palace(4, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const chart = chartWith([target]);
    const monthlyTransformations: ResolvedMonthlyTransformation[] = [
      {
        mutagen: "Khoa",
        starName: "Vũ Khúc",
        canonicalStarName: "Vũ Khúc",
        targetPalaceIndex: 4,
        targetNatalPalaceName: "P4",
      },
      {
        mutagen: "Kỵ",
        starName: "Vũ Khúc",
        canonicalStarName: "Vũ Khúc",
        targetPalaceIndex: 4,
        targetNatalPalaceName: "P4",
      },
    ];
    const monthDiagnostics = emptyMonthlyFlowMonthDiagnostics();
    detectDisabledRules({
      chart,
      monthKey: "2026-M04",
      monthlyTransformations,
      interactionRules: knowledge.interactionRules,
      calendarRelations: knowledge.calendarRelations,
      monthDiagnostics,
    });

    expect(
      monthDiagnostics.disabledInteractionHits.some((h) =>
        h.includes("RULE-MONTHLY-KHOA-KY-CANDIDATE"),
      ),
    ).toBe(true);
  });

  it("does not hit when Khoa and Kỵ resolve to different palaces", () => {
    const a = palace(1, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const b = palace(5, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const chart = chartWith([a, b]);
    const monthlyTransformations: ResolvedMonthlyTransformation[] = [
      {
        mutagen: "Khoa",
        starName: "Vũ Khúc",
        canonicalStarName: "Vũ Khúc",
        targetPalaceIndex: 1,
        targetNatalPalaceName: "P1",
      },
      {
        mutagen: "Kỵ",
        starName: "Vũ Khúc",
        canonicalStarName: "Vũ Khúc",
        targetPalaceIndex: 5,
        targetNatalPalaceName: "P5",
      },
    ];
    const monthDiagnostics = emptyMonthlyFlowMonthDiagnostics();
    detectDisabledRules({
      chart,
      monthKey: "2026-M05",
      monthlyTransformations,
      interactionRules: knowledge.interactionRules,
      calendarRelations: knowledge.calendarRelations,
      monthDiagnostics,
    });
    expect(monthDiagnostics.disabledInteractionHits).toEqual([]);
  });

  it("every disabled rule contributes zero numeric evidence (function returns void)", () => {
    for (const rule of knowledge.interactionRules.records) {
      expect(rule.enabled).toBe(false);
    }
    for (const rule of knowledge.calendarRelations.records) {
      expect(rule.enabled).toBe(false);
    }
    // Function shape assertion — no return type, purely diagnostic.
    const monthDiagnostics = emptyMonthlyFlowMonthDiagnostics();
    const chart = chartWith([]);
    const returned = detectDisabledRules({
      chart,
      monthKey: "2026-M01",
      monthlyTransformations: [],
      interactionRules: knowledge.interactionRules,
      calendarRelations: knowledge.calendarRelations,
      monthDiagnostics,
    }) as unknown;
    expect(returned).toBeUndefined();
  });
});
