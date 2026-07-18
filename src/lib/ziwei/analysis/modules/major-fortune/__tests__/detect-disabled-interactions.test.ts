import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import {
  detectDisabledInteractionHits,
  transformationTargetKey,
} from "../detect-disabled-interactions";
import { emptyMajorFortuneDiagnostics } from "../types";

function palace(index: number, stars: ChartStar[], name = `P${index}`): ChartPalace {
  return { index, branch: `b${index}`, name, stars };
}

function chartWithPalaces(palaces: ChartPalace[], natal: MutagenRecord[] = []): ChartData {
  const all = [...palaces];
  for (let i = 0; i < 12; i++) {
    if (!all.find((p) => p.index === i)) all.push(palace(i, []));
  }
  return { palaces: all, natalMutagens: natal } as unknown as ChartData;
}

describe("transformationTargetKey", () => {
  it("joins palace index and canonical star name", () => {
    const record: MutagenRecord = {
      mutagen: "Khoa",
      starName: "Thái Dương",
      palace: palace(3, [{ name: "Thái Dương", layer: "major", source: "natal" }]),
    };
    expect(transformationTargetKey(record)).toBe("3:Thái Dương");
  });

  it("returns null when palace is absent", () => {
    expect(transformationTargetKey({ mutagen: "Khoa", starName: "Thái Dương" })).toBeNull();
  });
});

describe("detectDisabledInteractionHits", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("failed to load knowledge");
  const knowledge = loaded.knowledge;

  it("records a disabled interaction when the same star is on the same palace", () => {
    const target = palace(2, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const chart = chartWithPalaces([target]);
    const major: MutagenRecord[] = [
      { mutagen: "Khoa", starName: "Vũ Khúc", palace: target },
      { mutagen: "Kỵ", starName: "Vũ Khúc", palace: target },
    ];
    const diagnostics = emptyMajorFortuneDiagnostics();
    detectDisabledInteractionHits(chart, major, knowledge, diagnostics);

    expect(
      diagnostics.disabledInteractionHits.some((h) =>
        h.startsWith("RULE-MFS-KHOA-KY-MODERATION-CANDIDATE:2:Vũ Khúc"),
      ),
    ).toBe(true);
  });

  it("does not record a hit when the same canonical star is on different palaces", () => {
    const a = palace(1, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const b = palace(5, [{ name: "Vũ Khúc", layer: "major", source: "natal" }]);
    const chart = chartWithPalaces([a, b]);
    const major: MutagenRecord[] = [
      { mutagen: "Khoa", starName: "Vũ Khúc", palace: a },
      { mutagen: "Kỵ", starName: "Vũ Khúc", palace: b },
    ];
    const diagnostics = emptyMajorFortuneDiagnostics();
    detectDisabledInteractionHits(chart, major, knowledge, diagnostics);

    expect(diagnostics.disabledInteractionHits).toEqual([]);
  });

  it("does not record a hit when the target star is absent from the physical palace", () => {
    const emptyPalace = palace(4, []);
    const chart = chartWithPalaces([emptyPalace]);
    const major: MutagenRecord[] = [
      { mutagen: "Khoa", starName: "Vũ Khúc", palace: emptyPalace },
      { mutagen: "Kỵ", starName: "Vũ Khúc", palace: emptyPalace },
    ];
    const diagnostics = emptyMajorFortuneDiagnostics();
    detectDisabledInteractionHits(chart, major, knowledge, diagnostics);

    expect(diagnostics.disabledInteractionHits).toEqual([]);
  });

  it("disabled rules produce zero numeric evidence and zero score delta (diagnostic only)", () => {
    const target = palace(0, [{ name: "Tham Lang", layer: "major", source: "natal" }]);
    const chart = chartWithPalaces([target], [
      { mutagen: "Lộc", starName: "Tham Lang", palace: target },
    ]);
    const major: MutagenRecord[] = [
      { mutagen: "Quyền", starName: "Tham Lang", palace: target },
    ];
    const diagnostics = emptyMajorFortuneDiagnostics();
    detectDisabledInteractionHits(chart, major, knowledge, diagnostics);

    expect(diagnostics.disabledInteractionHits.length).toBeGreaterThan(0);
    expect(
      diagnostics.disabledInteractionHits.every((h) =>
        h.startsWith("RULE-MFS-NATAL-MAJOR-SAME-TRANSFORMATION-CANDIDATE:"),
      ),
    ).toBe(true);
    // Detector never returns evidence — callers must not score from hits.
    for (const rule of knowledge.interactionRules.records) {
      expect(rule.enabled).toBe(false);
    }
  });
});
