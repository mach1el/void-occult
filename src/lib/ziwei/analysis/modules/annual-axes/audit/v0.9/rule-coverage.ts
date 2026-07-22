import type { AnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import type { AnnualAxesEvidenceFactRecordV09 } from "./corpus-collection";

/** A rule matched in <1% of full-corpus chart-years is "rare" rather than
 * "observed" — documented threshold, not silent classification. */
export const RARE_MATCH_RATIO_THRESHOLD = 0.01;

export type RuleCapabilityStatus = "supported" | "unsupported" | "research-only" | "not-applicable";
export type RuleCoverageStatus = "observed" | "rare" | "never-observed" | "unreachable" | "unsupported";

export interface AnnualRuleCoverageRecord {
  ruleId: string;
  domain: AnnualAxisDomain;
  starName: string;
  pointClass: string;
  polarity: "positive" | "negative";
  capabilityStatus: RuleCapabilityStatus;
  producer: string | null;
  corpusMatchCount: number;
  chartMatchCount: number;
  annualYearMatchCount: number;
  totalRawPoints: number;
  totalWeightedContribution: number;
  primaryPalaceMatchCount: number;
  cooperatingPalaceMatchCount: number;
  activeInProduction: boolean;
  coverageStatus: RuleCoverageStatus;
}

function classifyCoverage(
  annualYearMatchCount: number,
  totalAnnualYears: number,
  capabilityStatus: RuleCapabilityStatus,
): RuleCoverageStatus {
  if (capabilityStatus === "unsupported") return "unsupported";
  if (annualYearMatchCount === 0) {
    return capabilityStatus === "research-only" ? "unreachable" : "never-observed";
  }
  const ratio = totalAnnualYears === 0 ? 0 : annualYearMatchCount / totalAnnualYears;
  return ratio < RARE_MATCH_RATIO_THRESHOLD ? "rare" : "observed";
}

/**
 * Every active V0.8 rule (`knowledge.starRegistry`), cross-referenced against
 * the full-corpus matched-evidence stream. Read-only: does not alter, prune,
 * or re-weight the production registry.
 */
export function buildRuleCoverageV09(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  evidenceFacts: AnnualAxesEvidenceFactRecordV09[],
  totalAnnualYears: number,
): AnnualRuleCoverageRecord[] {
  const records: AnnualRuleCoverageRecord[] = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = knowledge.starRegistry.axes[domain];
    const rules = [...axis.positive, ...axis.negative];

    for (const rule of rules) {
      const matches = evidenceFacts.filter((f) => f.domain === domain && f.ruleId === rule.ruleId);
      const chartIds = new Set(matches.map((m) => m.chartId));
      const annualYearKeys = new Set(matches.map((m) => `${m.chartId}#${m.annualYear}`));

      const capability = knowledge.starCapabilities.capabilities.find(
        (c) => c.exactStarName === rule.starName,
      );
      const capabilityStatus: RuleCapabilityStatus = capability?.supportStatus ?? "not-applicable";

      records.push({
        ruleId: rule.ruleId,
        domain,
        starName: rule.starName,
        pointClass: rule.pointClass,
        polarity: rule.polarity,
        capabilityStatus,
        producer: capability?.producer ?? null,
        corpusMatchCount: matches.length,
        chartMatchCount: chartIds.size,
        annualYearMatchCount: annualYearKeys.size,
        totalRawPoints: matches.reduce((s, m) => s + m.pointValue, 0),
        totalWeightedContribution: matches.reduce((s, m) => s + m.weightedContribution, 0),
        primaryPalaceMatchCount: matches.filter((m) => m.palaceRole === "primary").length,
        cooperatingPalaceMatchCount: matches.filter((m) => m.palaceRole !== "primary").length,
        activeInProduction: true,
        coverageStatus: classifyCoverage(annualYearKeys.size, totalAnnualYears, capabilityStatus),
      });
    }
  }

  return records.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
}
