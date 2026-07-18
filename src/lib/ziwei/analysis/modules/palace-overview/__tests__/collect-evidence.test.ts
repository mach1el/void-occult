import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { normalizeNatalFacts, indexFactsByPalace } from "@/lib/ziwei/analysis/facts";
import { buildStaticFrame } from "@/lib/ziwei/analysis/frame";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import {
  collectPalaceEvidence,
  emptyDiagnostics,
} from "../collect-evidence";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("collectPalaceEvidence", () => {
  it("produces major/transform evidence without annual facts", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const chart = calculateNamPhai(REGRESSION);
    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const menh = chart.palaces.find((p) => p.isMenh)!;
    const frame = buildStaticFrame(chart, menh.index, {
      geometry: loaded.knowledge.profile.geometry,
    });
    const diagnostics = emptyDiagnostics();
    const { evidence, isVoidMajor } = collectPalaceEvidence({
      frame,
      factsByPalace: indexFactsByPalace(facts),
      knowledge: loaded.knowledge,
      diagnostics,
    });

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every((e) => e.category !== "structural-rule")).toBe(true);
    expect(isVoidMajor).toBe(false);
    expect(
      evidence.some((e) => e.category === "transformation"),
    ).toBe(true);
  });
});
