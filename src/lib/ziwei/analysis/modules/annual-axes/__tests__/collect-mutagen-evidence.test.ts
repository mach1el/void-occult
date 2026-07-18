import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { loadAnnualAxesKnowledgeV0 } from "../../../knowledge/annual-axes";
import { collectMutagenEvidence } from "../collect-mutagen-evidence";
import { emptyAnnualAxesDiagnostics } from "../types";
import type { AnnualDomainAnchorFrame } from "../collect-domain-frames";

function buildChartWithMutagens(): ChartData {
  const focusPalace: ChartPalace = { index: 7, branch: "b7", name: "Tật Ách" };
  const outOfFramePalace: ChartPalace = { index: 2, branch: "b2", name: "Phúc Đức" };

  return {
    palaces: [focusPalace, outOfFramePalace],
    annualMutagens: [
      { mutagen: "Lộc", starName: "Thiên Đồng", palace: focusPalace },
      { mutagen: "Kỵ", starName: "Liêm Trinh", palace: outOfFramePalace },
    ],
    natalMutagens: [{ mutagen: "Quyền", starName: "Thái Dương", palace: focusPalace }],
    majorMutagens: [],
  } as unknown as ChartData;
}

describe("collectMutagenEvidence", () => {
  const loaded = loadAnnualAxesKnowledgeV0();
  if (!loaded.ok) throw new Error("annual axes knowledge failed to load");
  const knowledge = loaded.knowledge;

  const frames: AnnualDomainAnchorFrame[] = [
    {
      anchorPalaceName: "Tật Ách",
      domainAnchorWeight: 0.7,
      nodes: [
        {
          palaceIndex: 7,
          palaceName: "Tật Ách",
          palaceBranch: "b7",
          annualPalaceName: "Tật Ách",
          role: "focus",
        },
      ],
    },
  ];

  it("only counts a transformation when its exact resolved palace is inside the domain frame", () => {
    const chart = buildChartWithMutagens();
    const diagnostics = emptyAnnualAxesDiagnostics();

    const evidence = collectMutagenEvidence({ chart, domain: "health", frames, annualKnowledge: knowledge, diagnostics });

    expect(evidence.some((e) => e.physicalFactId.includes("Kỵ") && e.physicalFactId.includes("Liêm Trinh"))).toBe(
      false,
    );
    expect(evidence.some((e) => e.physicalFactId.includes("Lộc") && e.physicalFactId.includes("Thiên Đồng"))).toBe(
      true,
    );
  });

  it("layer-tags evidence by its source array (annualMutagens→annual, natalMutagens→natal-activated)", () => {
    const chart = buildChartWithMutagens();
    const diagnostics = emptyAnnualAxesDiagnostics();

    const evidence = collectMutagenEvidence({ chart, domain: "health", frames, annualKnowledge: knowledge, diagnostics });

    const annualHit = evidence.find((e) => e.physicalFactId.includes("Lộc"));
    const natalHit = evidence.find((e) => e.physicalFactId.includes("Quyền"));
    expect(annualHit?.layer).toBe("annual");
    expect(natalHit?.layer).toBe("natal-activated");
  });

  it("uses the fixed axes from annual-mutagen-impact.v0.json, not a hardcoded literal", () => {
    const chart = buildChartWithMutagens();
    const diagnostics = emptyAnnualAxesDiagnostics();

    const evidence = collectMutagenEvidence({ chart, domain: "health", frames, annualKnowledge: knowledge, diagnostics });
    const locImpact = knowledge.mutagenImpact.records.find((r) => r.mutagen === "Lộc");
    const annualHit = evidence.find((e) => e.physicalFactId.includes("Lộc"));

    expect(annualHit?.rawAxes).toEqual(locImpact?.axes);
    expect(annualHit?.ruleId).toBe(locImpact?.ruleId);
  });

  it("logs unresolvedAnnualTargets when a mutagen record has no resolved palace", () => {
    const chart = {
      palaces: [{ index: 7, branch: "b7", name: "Tật Ách" }],
      annualMutagens: [{ mutagen: "Kỵ", starName: "Cự Môn", palace: null }],
    } as unknown as ChartData;
    const diagnostics = emptyAnnualAxesDiagnostics();

    collectMutagenEvidence({ chart, domain: "health", frames, annualKnowledge: knowledge, diagnostics });

    expect(diagnostics.unresolvedAnnualTargets.length).toBeGreaterThan(0);
  });
});
