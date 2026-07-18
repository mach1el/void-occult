import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { collectDomainAnchorFrames } from "../collect-domain-frames";
import type { ResolvedDomainAnchor } from "../resolvers/types";
import { emptyAnnualAxesDiagnostics } from "../types";

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

/** Synthetic chart where natal `palace.name` is deliberately shifted from
 * the annual label at the same physical index, so any accidental fallback
 * to natal names would resolve the wrong palace and fail these tests. */
function buildSyntheticChart(): ChartData {
  const palaces: ChartPalace[] = FORWARD_NAMES.map((annualPalaceName, index) => ({
    index,
    branch: `b${index}`,
    name: `NATAL-${index}`,
    annualPalaceName,
  }));
  return { palaces } as unknown as ChartData;
}

function anchor(
  annualPalaceName: string,
  palaceIndex: number,
  weight: number,
): ResolvedDomainAnchor {
  return {
    annualPalaceName,
    palaceIndex,
    weight,
    provenance: "trung-chau-annual-palace-name",
  };
}

describe("collectDomainAnchorFrames", () => {
  it("builds TP4C nodes from pre-resolved anchors (school-agnostic geometry)", () => {
    const chart = buildSyntheticChart();
    const diagnostics = emptyAnnualAxesDiagnostics();

    const frames = collectDomainAnchorFrames(
      chart,
      "health",
      [anchor("Tật Ách", 7, 0.7), anchor("Mệnh", 0, 0.3)],
      diagnostics,
    );

    expect(frames).toHaveLength(2);

    const [tatAch, menh] = frames;
    expect(tatAch?.domainAnchorWeight).toBe(0.7);
    expect(tatAch?.anchorProvenance).toBe("trung-chau-annual-palace-name");
    expect(tatAch?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [7, "focus"],
      [1, "opposite"],
      [11, "trine"],
      [3, "trine"],
    ]);
    // Each node carries its OWN annual label, not the anchor's — opposite
    // and trine nodes must not read back "Tật Ách" (the anchor's label).
    expect(tatAch?.nodes.map((n) => n.annualPalaceName)).toEqual([
      "Tật Ách",
      "Phụ Mẫu",
      "Huynh Đệ",
      "Điền Trạch",
    ]);

    expect(menh?.domainAnchorWeight).toBe(0.3);
    expect(menh?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [0, "focus"],
      [6, "opposite"],
      [4, "trine"],
      [8, "trine"],
    ]);
    expect(menh?.nodes.map((n) => n.annualPalaceName)).toEqual([
      "Mệnh",
      "Thiên Di",
      "Quan Lộc",
      "Tài Bạch",
    ]);

    expect(diagnostics.missingAnnualPalaceNames).toHaveLength(0);
  });

  it("skips an anchor whose palace index no longer exists in the chart", () => {
    const chart = buildSyntheticChart();
    // Remove one palace to simulate an incomplete chart; the pre-resolved
    // anchor still points at that index, so the frame must be skipped.
    chart.palaces = chart.palaces.filter((p) => p.index !== 7);
    const diagnostics = emptyAnnualAxesDiagnostics();

    const frames = collectDomainAnchorFrames(
      chart,
      "health",
      [anchor("Tật Ách", 7, 0.7), anchor("Mệnh", 0, 0.3)],
      diagnostics,
    );

    expect(frames.map((f) => f.anchorPalaceName)).toEqual(["Mệnh"]);
    expect(diagnostics.missingAnnualPalaceNames).toEqual([
      "health:Tật Ách:missing-index-7",
    ]);
  });

  it("never backfills a node's missing annual label from its natal palace.name", () => {
    const chart = buildSyntheticChart();
    // Anchor itself resolves, but its opposite/trine palaces lack an
    // annual label (partially-populated annual structure).
    chart.palaces.forEach((p) => {
      if (p.index !== 7) p.annualPalaceName = undefined;
    });
    const diagnostics = emptyAnnualAxesDiagnostics();

    const frames = collectDomainAnchorFrames(
      chart,
      "health",
      [anchor("Tật Ách", 7, 1.0)],
      diagnostics,
    );

    expect(frames).toHaveLength(1);
    expect(frames[0]?.nodes.map((n) => n.annualPalaceName)).toEqual([
      "Tật Ách",
      null,
      null,
      null,
    ]);
  });
});
