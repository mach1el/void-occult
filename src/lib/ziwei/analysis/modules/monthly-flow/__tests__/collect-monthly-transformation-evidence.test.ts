import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { collectMonthlyTransformationEvidence } from "../collect-monthly-transformation-evidence";
import { collectMonthlyFrame } from "../collect-monthly-frame";
import type { ResolvedMonthlyTransformation } from "../types";

function palace(
  index: number,
  name: string,
  stars: ChartPalace["stars"] = [],
): ChartPalace {
  return { index, branch: `b${index}`, name, stars };
}

function baseChart(): ChartData {
  const palaces: ChartPalace[] = Array.from({ length: 12 }, (_, i) =>
    palace(i, `P${i}`, []),
  );
  return { palaces } as unknown as ChartData;
}

describe("collectMonthlyTransformationEvidence — exact target rules", () => {
  const loaded = loadMonthlyFlowScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("monthly flow knowledge failed to load");
  const knowledge = loaded.knowledge;
  const geometry = knowledge.domainDefinitions.monthlyActivationFrame;

  const monthKey = "2026-M03";

  it("emits evidence when target sits inside the annual-domain frame + inside monthly TP4C (focus role)", () => {
    const chart = baseChart();
    const monthlyFrame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey,
      geometry,
    });
    if (!monthlyFrame) throw new Error("expected frame");
    const domainFrame = {
      domain: "health" as const,
      focusPalaceIndex: 0,
      nodes: [
        { palaceIndex: 0, natalPalaceName: "P0", annualPalaceName: "Mệnh", role: "focus" as const },
        { palaceIndex: 6, natalPalaceName: "P6", annualPalaceName: null, role: "opposite" as const },
        { palaceIndex: 4, natalPalaceName: "P4", annualPalaceName: null, role: "trine" as const },
        { palaceIndex: 8, natalPalaceName: "P8", annualPalaceName: null, role: "trine" as const },
      ],
      indexSet: new Set([0, 6, 4, 8]),
      roleByIndex: new Map<number, "focus" | "opposite" | "trine">([
        [0, "focus"],
        [6, "opposite"],
        [4, "trine"],
        [8, "trine"],
      ]),
    };
    const transformations: ResolvedMonthlyTransformation[] = [
      {
        mutagen: "Lộc",
        starName: "Tử Vi",
        canonicalStarName: "Tử Vi",
        targetPalaceIndex: 0,
        targetNatalPalaceName: "P0",
      },
    ];

    const evidence = collectMonthlyTransformationEvidence({
      chart,
      domain: "health",
      monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      transformations,
      impactCatalog: knowledge.transformationImpact,
    });

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.category).toBe("monthly-transformation");
    expect(evidence[0]?.monthlyFrameRole).toBe("focus");
    expect(evidence[0]?.annualDomainRole).toBe("focus");
  });

  it("emits evidence with monthlyFrameRole 'outside' when target is inside annual domain frame but outside monthly TP4C", () => {
    const chart = baseChart();
    const monthlyFrame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey,
      geometry,
    });
    if (!monthlyFrame) throw new Error("expected frame");
    const domainFrame = {
      domain: "family" as const,
      focusPalaceIndex: 3,
      nodes: [
        { palaceIndex: 3, natalPalaceName: "P3", annualPalaceName: null, role: "focus" as const },
        { palaceIndex: 9, natalPalaceName: "P9", annualPalaceName: null, role: "opposite" as const },
        { palaceIndex: 7, natalPalaceName: "P7", annualPalaceName: null, role: "trine" as const },
        { palaceIndex: 11, natalPalaceName: "P11", annualPalaceName: null, role: "trine" as const },
      ],
      indexSet: new Set([3, 9, 7, 11]),
      roleByIndex: new Map<number, "focus" | "opposite" | "trine">([
        [3, "focus"],
        [9, "opposite"],
        [7, "trine"],
        [11, "trine"],
      ]),
    };
    const transformations: ResolvedMonthlyTransformation[] = [
      {
        mutagen: "Kỵ",
        starName: "Cự Môn",
        canonicalStarName: "Cự Môn",
        targetPalaceIndex: 3,
        targetNatalPalaceName: "P3",
      },
    ];

    const evidence = collectMonthlyTransformationEvidence({
      chart,
      domain: "family",
      monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      transformations,
      impactCatalog: knowledge.transformationImpact,
    });

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.monthlyFrameRole).toBe("outside");
    expect(evidence[0]?.annualDomainRole).toBe("focus");
  });

  it("does not emit evidence when target sits outside the annual domain frame", () => {
    const chart = baseChart();
    const monthlyFrame = collectMonthlyFrame({
      chart,
      focusPalaceIndex: 0,
      monthKey,
      geometry,
    });
    if (!monthlyFrame) throw new Error("expected frame");
    const domainFrame = {
      domain: "career" as const,
      focusPalaceIndex: 1,
      nodes: [
        { palaceIndex: 1, natalPalaceName: "P1", annualPalaceName: null, role: "focus" as const },
        { palaceIndex: 7, natalPalaceName: "P7", annualPalaceName: null, role: "opposite" as const },
        { palaceIndex: 5, natalPalaceName: "P5", annualPalaceName: null, role: "trine" as const },
        { palaceIndex: 9, natalPalaceName: "P9", annualPalaceName: null, role: "trine" as const },
      ],
      indexSet: new Set([1, 7, 5, 9]),
      roleByIndex: new Map<number, "focus" | "opposite" | "trine">([
        [1, "focus"],
        [7, "opposite"],
        [5, "trine"],
        [9, "trine"],
      ]),
    };
    const transformations: ResolvedMonthlyTransformation[] = [
      {
        mutagen: "Kỵ",
        starName: "Cự Môn",
        canonicalStarName: "Cự Môn",
        targetPalaceIndex: 0,
        targetNatalPalaceName: "P0",
      },
    ];

    const evidence = collectMonthlyTransformationEvidence({
      chart,
      domain: "career",
      monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      transformations,
      impactCatalog: knowledge.transformationImpact,
    });

    expect(evidence).toHaveLength(0);
  });
});
