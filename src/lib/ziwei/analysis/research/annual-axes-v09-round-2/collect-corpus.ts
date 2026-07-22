/**
 * Corpus collection for Round-2 candidates (research-only).
 */

import type { ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "../../modules/annual-axes/audit/build-audit-corpus";
import { toDomainObservationV09 } from "../../modules/annual-axes/audit/v0.9/collect-v09-observations";
import type { AnnualAxesAuditObservationV09 } from "../../modules/annual-axes/audit/v0.9/types";
import {
  collectCorpusV09,
  type AnnualAxesCorpusCollectionV09,
  type AnnualAxesEvidenceFactRecordV09,
  type StarEmissionRecordV09,
} from "../../modules/annual-axes/audit/v0.9/corpus-collection";
import type { AnnualAxisNamPhaiV08Result } from "../../modules/annual-axes/types";
import type { AnnualAxesCandidateRound2 } from "./schema";
import { runCandidate } from "./run-candidate";
import { AUTHORIZED_STAR } from "./foundation-intake";
import { createHash } from "node:crypto";

export type { AnnualAxesCorpusCollectionV09, AnnualAxesEvidenceFactRecordV09 };

export interface ChartCorpusEntry {
  baseChartId: string;
  chartId: string;
  chartIndex: number;
  annualYear: number;
  chart: ChartData;
}

export interface CorpusSplitRound2 {
  method: "stable-chart-index-mod";
  seed: number;
  trainingRatio: number;
  trainingChartIndexes: number[];
  holdoutChartIndexes: number[];
  trainingChartIds: string[];
  holdoutChartIds: string[];
  yearsPerChart: number;
  overlapCount: number;
}

export function buildChartCorpusRound2(
  contract: AuditCorpusContract = FULL_CORPUS_CONTRACT,
): ChartCorpusEntry[] {
  const bases = buildAuditBirthInputs(contract);
  const out: ChartCorpusEntry[] = [];
  bases.forEach((base, i) => {
    const baseChartId = `${contract.contractId}:nam-phai:c${i}`;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculateNamPhai(yearly);
      out.push({
        baseChartId,
        chartId: baseChartId,
        chartIndex: i,
        annualYear: chart.annualYear,
        chart,
      });
    }
  });
  return out;
}

export function splitCorpusByBaseChart(
  contract: AuditCorpusContract = FULL_CORPUS_CONTRACT,
  trainingRatio = 0.8,
): CorpusSplitRound2 {
  const trainingChartIndexes: number[] = [];
  const holdoutChartIndexes: number[] = [];
  for (let i = 0; i < contract.chartCount; i++) {
    // Deterministic: hash chart index with seed; first 80% by sorted hash → training.
    const h = createHash("sha256").update(`${contract.seed}:split:${i}`).digest();
    const bucket = h[0]! / 255;
    if (bucket < trainingRatio) trainingChartIndexes.push(i);
    else holdoutChartIndexes.push(i);
  }
  // Ensure exact counts when floating edge cases occur.
  while (trainingChartIndexes.length > Math.round(contract.chartCount * trainingRatio)) {
    const moved = trainingChartIndexes.pop()!;
    holdoutChartIndexes.push(moved);
  }
  while (trainingChartIndexes.length < Math.round(contract.chartCount * trainingRatio)) {
    holdoutChartIndexes.sort((a, b) => a - b);
    const moved = holdoutChartIndexes.shift();
    if (moved === undefined) break;
    trainingChartIndexes.push(moved);
  }
  trainingChartIndexes.sort((a, b) => a - b);
  holdoutChartIndexes.sort((a, b) => a - b);

  const trainingSet = new Set(trainingChartIndexes);
  const holdoutSet = new Set(holdoutChartIndexes);
  let overlapCount = 0;
  for (const i of trainingSet) if (holdoutSet.has(i)) overlapCount += 1;

  return {
    method: "stable-chart-index-mod",
    seed: contract.seed,
    trainingRatio,
    trainingChartIndexes,
    holdoutChartIndexes,
    trainingChartIds: trainingChartIndexes.map((i) => `${contract.contractId}:nam-phai:c${i}`),
    holdoutChartIds: holdoutChartIndexes.map((i) => `${contract.contractId}:nam-phai:c${i}`),
    yearsPerChart: contract.yearsPerChart,
    overlapCount,
  };
}

export function filterCorpusByIndexes(
  corpus: ChartCorpusEntry[],
  indexes: number[],
): ChartCorpusEntry[] {
  const set = new Set(indexes);
  return corpus.filter((c) => set.has(c.chartIndex));
}

export function collectCorpusForCandidate(
  entries: ChartCorpusEntry[],
  candidate: AnnualAxesCandidateRound2,
): AnnualAxesCorpusCollectionV09 {
  if (candidate.candidateType === "control") {
    return collectCorpusV09(entries.map((e) => ({ chartId: e.chartId, chart: e.chart })));
  }

  const observations: AnnualAxesAuditObservationV09[] = [];
  const evidenceFacts: AnnualAxesEvidenceFactRecordV09[] = [];
  const starEmissions = new Map<string, StarEmissionRecordV09>();

  for (const entry of entries) {
    const result = runCandidate(entry.chart, candidate);
    const domains = {} as AnnualAxesAuditObservationV09["domains"];
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const domainResult = result.axes[domain] as AnnualAxisNamPhaiV08Result;
      domains[domain] = toDomainObservationV09(domainResult);
      for (const fact of domainResult.v08Evidence ?? []) {
        evidenceFacts.push({
          chartId: entry.chartId,
          annualYear: entry.chart.annualYear,
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
      chartId: entry.chartId,
      school: "nam-phai",
      annualYear: entry.chart.annualYear,
      annualHeadPalaceIndex:
        entry.chart.annualHeadPalace?.index ??
        entry.chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
        null,
      domains,
    });

    for (const palace of entry.chart.palaces) {
      for (const star of palace.stars ?? []) {
        const name = star.name?.trim();
        if (!name) continue;
        const existing = starEmissions.get(name);
        if (existing) {
          existing.emissionCount += 1;
          existing.emittingChartIds.add(entry.chartId);
        } else {
          starEmissions.set(name, {
            exactStarName: name,
            emissionCount: 1,
            emittingChartIds: new Set([entry.chartId]),
          });
        }
      }
    }
  }

  return { observations, evidenceFacts, starEmissions };
}

export function thienMaActivationStats(
  evidenceFacts: AnnualAxesEvidenceFactRecordV09[],
  observationCount: number,
): {
  matchCount: number;
  contributionRate: number;
  zeroEffectRate: number;
  perDomain: Record<string, number>;
} {
  const tm = evidenceFacts.filter((f) => f.starName === AUTHORIZED_STAR);
  const perDomain: Record<string, number> = {};
  for (const domain of ANNUAL_AXIS_DOMAINS) perDomain[domain] = 0;
  for (const f of tm) perDomain[f.domain] = (perDomain[f.domain] ?? 0) + 1;
  const nonzero = tm.filter((f) => f.weightedContribution !== 0).length;
  return {
    matchCount: tm.length,
    contributionRate: observationCount === 0 ? 0 : nonzero / observationCount,
    zeroEffectRate: tm.length === 0 ? 1 : (tm.length - nonzero) / tm.length,
    perDomain,
  };
}

export type { AnnualAxisDomain };
