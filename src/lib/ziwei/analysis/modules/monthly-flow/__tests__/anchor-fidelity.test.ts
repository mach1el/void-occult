import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV0 } from "../../../knowledge/annual-axes";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { buildAllAnnualDomainFrames } from "../collect-annual-domain-frames";
import {
  deriveFocusPalaceIndexByDomain,
  resolveMonthlyFlowAnnualDomains,
} from "../resolve-monthly-flow-annual-domains";
import { analyzeMonthlyFlowProduction } from "../v0.1-production";
import { emptyMonthlyFlowYearDiagnostics } from "../types";
import type { ResolvedDomainAnchor } from "../../annual-axes/resolvers/types";
import { REGRESSION_BIRTH } from "./test-providers";

const loadedAnnual = loadAnnualAxesKnowledgeV0();
if (!loadedAnnual.ok) throw new Error("annual axes knowledge required");
const axisDefinitions = loadedAnnual.knowledge.axisDefinitions;

const loadedMonthly = loadMonthlyFlowScoringKnowledgeV0();
if (!loadedMonthly.ok) throw new Error("monthly flow knowledge required");
const monthlyGeometry = loadedMonthly.knowledge.domainDefinitions.annualDomainFrame;

/**
 * Hand-pick focus palace from axis JSON + natal palace names (Nam Phái path).
 * Sort: weight desc, palaceIndex asc — same as deriveFocusPalaceIndexByDomain.
 */
function handPickHighestWeightFocusPalaceIndex(
  domain: AnnualAxisDomain,
  chart: ReturnType<typeof calculateNamPhai>,
  primaryMap: ReadonlyMap<number, AnnualAxisDomain>,
): number {
  const domainDef = axisDefinitions.domains.find((d) => d.domain === domain);
  if (!domainDef) throw new Error(`missing domain definition: ${domain}`);

  const ranked = domainDef.anchors
    .map((anchor) => {
      const palace = chart.palaces.find((p) => p.name === anchor.annualPalaceName);
      if (!palace) {
        throw new Error(`palace not found: ${anchor.annualPalaceName}`);
      }
      return { palaceIndex: palace.index, weight: anchor.weight };
    })
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.palaceIndex - b.palaceIndex;
    });

  for (const candidate of ranked) {
    if (primaryMap.get(candidate.palaceIndex) === domain) {
      return candidate.palaceIndex;
    }
  }
  throw new Error(`no valid focus anchor for domain ${domain}`);
}

describe("anchor fidelity (V0.1.2)", () => {
  it("Nam Phái family focus uses highest-weight anchor (Điền Trạch), not lowest mapped palace", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const adapter = resolveMonthlyFlowAnnualDomains(chart, "nam-phai", axisDefinitions);
    expect(adapter.ok).toBe(true);

    const primaryMap = adapter.primaryDomainByPalaceIndex!;
    const familyPalaceIndices = [...primaryMap.entries()]
      .filter(([, d]) => d === "family")
      .map(([i]) => i)
      .sort((a, b) => a - b);
    const lowestFamilyPalace = familyPalaceIndices[0]!;

    const expectedHighestWeightPalaceIndex = handPickHighestWeightFocusPalaceIndex(
      "family",
      chart,
      primaryMap,
    );
    expect(expectedHighestWeightPalaceIndex).toBe(
      chart.palaces.find((p) => p.name === "Điền Trạch")!.index,
    );
    expect(expectedHighestWeightPalaceIndex).not.toBe(lowestFamilyPalace);

    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const frames = buildAllAnnualDomainFrames(
      primaryMap,
      chart,
      axisDefinitions,
      monthlyGeometry,
      diagnostics,
      adapter.focusPalaceIndexByDomain,
    );
    const frame = frames.get("family");
    expect(frame).toBeDefined();
    expect(frame!.focusPalaceIndex).toBe(expectedHighestWeightPalaceIndex);
    expect(adapter.focusPalaceIndexByDomain!.get("family")).toBe(expectedHighestWeightPalaceIndex);
  });

  it("equal-weight tie breaks by lower palaceIndex in deriveFocusPalaceIndexByDomain", () => {
    const anchorsByDomain = new Map<AnnualAxisDomain, ResolvedDomainAnchor[]>([
      [
        "social",
        [
          {
            annualPalaceName: "High",
            palaceIndex: 5,
            weight: 1,
            provenance: "test",
          },
          {
            annualPalaceName: "Low",
            palaceIndex: 2,
            weight: 1,
            provenance: "test",
          },
        ],
      ],
    ]);
    const primaryMap = new Map<number, AnnualAxisDomain>([
      [2, "social"],
      [5, "social"],
    ]);
    const { map } = deriveFocusPalaceIndexByDomain(anchorsByDomain, primaryMap);
    expect(map.get("social")).toBe(2);
  });

  it("Trung Châu annual coordinate builds frames with adapter focus", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const adapter = resolveMonthlyFlowAnnualDomains(chart, "trung-chau", axisDefinitions);
    expect(adapter.ok).toBe(true);
    expect(adapter.coordinate).toBe("annual-palace-name");

    const diagnostics = emptyMonthlyFlowYearDiagnostics();
    const frames = buildAllAnnualDomainFrames(
      adapter.primaryDomainByPalaceIndex!,
      chart,
      axisDefinitions,
      monthlyGeometry,
      diagnostics,
      adapter.focusPalaceIndexByDomain,
    );
    expect(frames.size).toBe(6);
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const frame = frames.get(domain);
      expect(frame?.focusPalaceIndex).toBe(adapter.focusPalaceIndexByDomain!.get(domain));
    }
  });

  it("missing focus causes adapter ok=false", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const broken = { ...chart, palaces: chart.palaces.slice(0, 10) };
    const adapter = resolveMonthlyFlowAnnualDomains(broken, "nam-phai", axisDefinitions);
    expect(adapter.ok).toBe(false);
    expect(adapter.focusPalaceIndexByDomain).toBeNull();
  });

  it("production analyze never uses productionFocusFallbackUsed", () => {
    for (const school of ["nam-phai", "trung-chau"] as const) {
      const chart =
        school === "nam-phai" ? calculateNamPhai(REGRESSION_BIRTH) : calculateTrungChau(REGRESSION_BIRTH);
      const analysis = analyzeMonthlyFlowProduction(chart, { school });
      expect(analysis.result).not.toBeNull();
      expect(analysis.result!.diagnostics.productionFocusFallbackUsed).toHaveLength(0);
    }
  });
});
