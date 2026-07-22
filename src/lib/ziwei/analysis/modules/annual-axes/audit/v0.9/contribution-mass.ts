import type { AnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../../contracts/annual-axes";
import type { AnnualAxesEvidenceFactRecordV09 } from "./corpus-collection";
import type { AnnualAxesAuditObservationV09 } from "./types";

export interface MassTotals {
  positiveRawMass: number;
  negativeRawMass: number;
  positiveWeightedMass: number;
  negativeWeightedMass: number;
  massRatioPositiveToNegative: number;
  matchCountPositive: number;
  matchCountNegative: number;
  matchCountRatioPositiveToNegative: number;
}

export interface AnnualAxesContributionMassV09 {
  overall: MassTotals;
  perDomain: Record<AnnualAxisDomain, MassTotals>;
  perPointClass: Record<string, MassTotals>;
  perTemporalLayer: Record<string, MassTotals>;
  perPalaceRole: Record<string, MassTotals>;
  zeroPositiveAndNegativeRate: number;
  positiveOnlyRate: number;
  negativeOnlyRate: number;
  mixedSignalRate: number;
}

function emptyMassTotals(): MassTotals {
  return {
    positiveRawMass: 0,
    negativeRawMass: 0,
    positiveWeightedMass: 0,
    negativeWeightedMass: 0,
    massRatioPositiveToNegative: 0,
    matchCountPositive: 0,
    matchCountNegative: 0,
    matchCountRatioPositiveToNegative: 0,
  };
}

function accumulate(totals: MassTotals, fact: AnnualAxesEvidenceFactRecordV09): void {
  if (fact.polarity === "positive") {
    totals.positiveRawMass += Math.abs(fact.pointValue);
    totals.positiveWeightedMass += Math.abs(fact.weightedContribution);
    totals.matchCountPositive += 1;
  } else {
    totals.negativeRawMass += Math.abs(fact.pointValue);
    totals.negativeWeightedMass += Math.abs(fact.weightedContribution);
    totals.matchCountNegative += 1;
  }
}

function finalizeRatios(totals: MassTotals): MassTotals {
  return {
    ...totals,
    massRatioPositiveToNegative:
      totals.negativeWeightedMass === 0 ? Number.POSITIVE_INFINITY : totals.positiveWeightedMass / totals.negativeWeightedMass,
    matchCountRatioPositiveToNegative:
      totals.matchCountNegative === 0 ? Number.POSITIVE_INFINITY : totals.matchCountPositive / totals.matchCountNegative,
  };
}

/**
 * Measures positive vs negative evidence mass separately, sliced by domain,
 * point class, temporal layer, and palace role — so a skewed score
 * distribution can be traced to registry imbalance, producer imbalance,
 * palace-placement imbalance, corpus sampling imbalance, or point-class
 * imbalance instead of asserted as doctrinal bias (Part F requirement).
 */
export function buildContributionMassV09(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  evidenceFacts: AnnualAxesEvidenceFactRecordV09[],
  observations: AnnualAxesAuditObservationV09[],
): AnnualAxesContributionMassV09 {
  const pointClassByRule = new Map<string, string>();
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = knowledge.starRegistry.axes[domain];
    for (const rule of [...axis.positive, ...axis.negative]) {
      pointClassByRule.set(`${domain}#${rule.ruleId}`, rule.pointClass);
    }
  }

  const overall = emptyMassTotals();
  const perDomain = {} as Record<AnnualAxisDomain, MassTotals>;
  for (const domain of ANNUAL_AXIS_DOMAINS) perDomain[domain] = emptyMassTotals();
  const perPointClass: Record<string, MassTotals> = {};
  const perTemporalLayer: Record<string, MassTotals> = {};
  const perPalaceRole: Record<string, MassTotals> = {};

  for (const fact of evidenceFacts) {
    accumulate(overall, fact);
    accumulate(perDomain[fact.domain], fact);

    const pointClass = pointClassByRule.get(`${fact.domain}#${fact.ruleId}`) ?? "unknown";
    perPointClass[pointClass] ??= emptyMassTotals();
    accumulate(perPointClass[pointClass]!, fact);

    perTemporalLayer[fact.temporalLayer] ??= emptyMassTotals();
    accumulate(perTemporalLayer[fact.temporalLayer]!, fact);

    perPalaceRole[fact.palaceRole] ??= emptyMassTotals();
    accumulate(perPalaceRole[fact.palaceRole]!, fact);
  }

  const finalizedPerDomain = {} as Record<AnnualAxisDomain, MassTotals>;
  for (const domain of ANNUAL_AXIS_DOMAINS) finalizedPerDomain[domain] = finalizeRatios(perDomain[domain]);
  const finalizedPerPointClass: Record<string, MassTotals> = {};
  for (const [k, v] of Object.entries(perPointClass)) finalizedPerPointClass[k] = finalizeRatios(v);
  const finalizedPerTemporalLayer: Record<string, MassTotals> = {};
  for (const [k, v] of Object.entries(perTemporalLayer)) finalizedPerTemporalLayer[k] = finalizeRatios(v);
  const finalizedPerPalaceRole: Record<string, MassTotals> = {};
  for (const [k, v] of Object.entries(perPalaceRole)) finalizedPerPalaceRole[k] = finalizeRatios(v);

  let zeroBoth = 0;
  let positiveOnly = 0;
  let negativeOnly = 0;
  let mixed = 0;
  let totalDomainObs = 0;
  for (const obs of observations) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const d = obs.domains[domain];
      totalDomainObs += 1;
      const hasPos = d.positivePoints > 0;
      const hasNeg = d.negativePoints > 0;
      if (!hasPos && !hasNeg) zeroBoth += 1;
      else if (hasPos && !hasNeg) positiveOnly += 1;
      else if (!hasPos && hasNeg) negativeOnly += 1;
      else mixed += 1;
    }
  }

  return {
    overall: finalizeRatios(overall),
    perDomain: finalizedPerDomain,
    perPointClass: finalizedPerPointClass,
    perTemporalLayer: finalizedPerTemporalLayer,
    perPalaceRole: finalizedPerPalaceRole,
    zeroPositiveAndNegativeRate: totalDomainObs === 0 ? 0 : zeroBoth / totalDomainObs,
    positiveOnlyRate: totalDomainObs === 0 ? 0 : positiveOnly / totalDomainObs,
    negativeOnlyRate: totalDomainObs === 0 ? 0 : negativeOnly / totalDomainObs,
    mixedSignalRate: totalDomainObs === 0 ? 0 : mixed / totalDomainObs,
  };
}
