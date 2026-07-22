import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../../analyze";
import type { AnnualAxisNamPhaiV08Result } from "../../types";
import { normalizeStarIdentity } from "../../nam-phai-v08/star-identity";
import type { AnnualAxesAuditObservationV09 } from "./types";
import { toDomainObservationV09 } from "./collect-v09-observations";

export interface AnnualAxesEvidenceFactRecordV09 {
  chartId: string;
  annualYear: number;
  domain: AnnualAxisDomain;
  ruleId: string;
  starName: string;
  palaceRole: "primary" | "cooperating" | "small-limit";
  polarity: "positive" | "negative";
  pointValue: number;
  weightedContribution: number;
  temporalLayer: string;
}

export interface StarEmissionRecordV09 {
  exactStarName: string;
  emissionCount: number;
  emittingChartIds: Set<string>;
}

export interface AnnualAxesCorpusCollectionV09 {
  observations: AnnualAxesAuditObservationV09[];
  evidenceFacts: AnnualAxesEvidenceFactRecordV09[];
  starEmissions: Map<string, StarEmissionRecordV09>;
}

function recordEmission(
  starEmissions: Map<string, StarEmissionRecordV09>,
  exactStarName: string,
  chartId: string,
): void {
  const existing = starEmissions.get(exactStarName);
  if (existing) {
    existing.emissionCount += 1;
    existing.emittingChartIds.add(chartId);
  } else {
    starEmissions.set(exactStarName, {
      exactStarName,
      emissionCount: 1,
      emittingChartIds: new Set([chartId]),
    });
  }
}

/**
 * Runs the corpus once through the production `analyzeAnnualAxes` entry
 * point and derives every read-only artifact Parts A/E/F need from that
 * single pass: the V0.9 audit observations (Part A), the full (non-deduped)
 * matched-rule evidence stream (Part E/F), and a raw annual-layer star
 * emission scan used to distinguish "producer unreachable" from "producer
 * available but corpus never generated it" from "star emitted but never
 * reached a configured domain palace" in the capability-coverage report.
 */
export function collectCorpusV09(
  charts: Array<{ chartId: string; chart: ChartData }>,
): AnnualAxesCorpusCollectionV09 {
  const observations: AnnualAxesAuditObservationV09[] = [];
  const evidenceFacts: AnnualAxesEvidenceFactRecordV09[] = [];
  const starEmissions = new Map<string, StarEmissionRecordV09>();

  for (const { chartId, chart } of charts) {
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });

    const domains = {} as AnnualAxesAuditObservationV09["domains"];
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const domainResult = result.axes[domain] as AnnualAxisNamPhaiV08Result;
      domains[domain] = toDomainObservationV09(domainResult);
      for (const fact of domainResult.v08Evidence ?? []) {
        evidenceFacts.push({
          chartId,
          annualYear: chart.annualYear,
          domain,
          ruleId: fact.ruleId,
          starName: fact.exactMatchedStarName,
          palaceRole: fact.palaceRole,
          polarity: fact.polarity,
          pointValue: fact.pointValue,
          weightedContribution: fact.weightedContribution,
          temporalLayer: fact.temporalLayer,
        });
      }
    }

    observations.push({
      chartId,
      school: "nam-phai",
      annualYear: chart.annualYear,
      annualHeadPalaceIndex:
        chart.annualHeadPalace?.index ??
        chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
        null,
      domains,
    });

    for (const palace of chart.palaces) {
      for (const star of palace.stars ?? []) {
        const identity = normalizeStarIdentity(star);
        if (identity.temporalLayer !== "annual") continue;
        recordEmission(starEmissions, identity.exactCanonicalName, chartId);
      }
    }
  }

  return { observations, evidenceFacts, starEmissions };
}
