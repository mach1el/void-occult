import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "./build-audit-corpus";
import {
  splitChartIndices,
  stableChartId,
} from "../../../knowledge/annual-axes/v0.5/derive-calibration";
import { scoreV05ChartDomains } from "../nam-phai-v05/score-chart";
import type { AnnualAxisEvidence } from "../types";
import type { V051DomainSample, V051EvidenceMassBreakdown, V051Split } from "./v051-types";

function addMass(
  map: Record<string, V051EvidenceMassBreakdown>,
  key: string,
  support: number,
  pressure: number,
): void {
  const cur = map[key] ?? { supportRaw: 0, pressureRaw: 0, count: 0 };
  cur.supportRaw += support;
  cur.pressureRaw += pressure;
  cur.count += 1;
  map[key] = cur;
}

export function evidenceMassFromRows(evidence: AnnualAxisEvidence[]): {
  directSupportRaw: number;
  directPressureRaw: number;
  tp4cSupportRaw: number;
  tp4cPressureRaw: number;
  retainedSignedCount: number;
  retainedActivationCount: number;
  byLayer: Record<string, V051EvidenceMassBreakdown>;
  byCategory: Record<string, V051EvidenceMassBreakdown>;
  byGeometryBucket: Record<string, V051EvidenceMassBreakdown>;
  bySourceId: Record<string, V051EvidenceMassBreakdown>;
  byRuleId: Record<string, V051EvidenceMassBreakdown>;
  byStackingGroup: Record<string, V051EvidenceMassBreakdown>;
  byOwnershipRole: Record<string, V051EvidenceMassBreakdown>;
} {
  let directSupportRaw = 0;
  let directPressureRaw = 0;
  let tp4cSupportRaw = 0;
  let tp4cPressureRaw = 0;
  let retainedSignedCount = 0;
  let retainedActivationCount = 0;
  const byLayer: Record<string, V051EvidenceMassBreakdown> = {};
  const byCategory: Record<string, V051EvidenceMassBreakdown> = {};
  const byGeometryBucket: Record<string, V051EvidenceMassBreakdown> = {};
  const bySourceId: Record<string, V051EvidenceMassBreakdown> = {};
  const byRuleId: Record<string, V051EvidenceMassBreakdown> = {};
  const byStackingGroup: Record<string, V051EvidenceMassBreakdown> = {};
  const byOwnershipRole: Record<string, V051EvidenceMassBreakdown> = {};

  for (const e of evidence) {
    const support = e.weightedAxes.support;
    const pressure = e.weightedAxes.pressure;
    const bucket = e.geometryBucket ?? "unknown";
    const isDirect = bucket === "direct";
    const isTp4c = bucket === "tp4c";

    if (e.retainedForSignedScore) {
      retainedSignedCount += 1;
      if (isDirect) {
        directSupportRaw += support;
        directPressureRaw += pressure;
      } else if (isTp4c) {
        tp4cSupportRaw += support;
        tp4cPressureRaw += pressure;
      }
    }
    if (e.retainedForActivation) retainedActivationCount += 1;

    if (e.retainedForSignedScore) {
      addMass(byLayer, e.layer, support, pressure);
      addMass(byCategory, e.category, support, pressure);
      addMass(byGeometryBucket, bucket, support, pressure);
      addMass(byRuleId, e.ruleId, support, pressure);
      addMass(byStackingGroup, e.stackingGroup, support, pressure);
      addMass(byOwnershipRole, e.ownershipRole ?? "unknown", support, pressure);
      for (const sid of e.sourceIds) addMass(bySourceId, sid, support, pressure);
    }
  }

  return {
    directSupportRaw,
    directPressureRaw,
    tp4cSupportRaw,
    tp4cPressureRaw,
    retainedSignedCount,
    retainedActivationCount,
    byLayer,
    byCategory,
    byGeometryBucket,
    bySourceId,
    byRuleId,
    byStackingGroup,
    byOwnershipRole,
  };
}

export interface CollectV051SamplesOptions {
  contract?: AuditCorpusContract;
  chartIndices?: number[];
  split?: V051Split;
  activationScaleOverride?: number;
  domainScaleOverride?: Partial<Record<AnnualAxisDomain, number>>;
}

export function collectV051Samples(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  options: CollectV051SamplesOptions = {},
): V051DomainSample[] {
  const contract = options.contract ?? FULL_CORPUS_CONTRACT;
  const bases = buildAuditBirthInputs(contract);
  const chartIndices =
    options.chartIndices ??
    Array.from({ length: contract.chartCount }, (_, i) => i);
  const { training, holdout } = splitChartIndices(contract.chartCount);
  const trainingSet = new Set(training);
  const holdoutSet = new Set(holdout);

  const samples: V051DomainSample[] = [];

  for (const chartIndex of chartIndices) {
    const base = bases[chartIndex];
    if (!base) continue;
    const chartId = stableChartId(contract, chartIndex);
    const split: V051Split = trainingSet.has(chartIndex)
      ? "training"
      : holdoutSet.has(chartIndex)
        ? "holdout"
        : (options.split ?? "full");

    for (const yearly of expandAnnualYears(
      base,
      contract.baseAnnualYear,
      contract.yearsPerChart,
    )) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV05ChartDomains(chart, knowledge, {
        activationScaleOverride: options.activationScaleOverride,
        domainScaleOverride: options.domainScaleOverride,
      });
      if (!domains) continue;

      for (const d of domains) {
        const trace = d.aggregate.spatialBudgetTrace;
        const masses = evidenceMassFromRows(d.aggregate.evidence);
        samples.push({
          chartId,
          chartIndex,
          split,
          annualYear: chart.annualYear,
          domain: d.domain,
          score: d.score,
          spatialSigned: d.spatialSigned,
          latent: d.latent,
          activationGate: d.activationGate,
          annualActivationRaw: d.annualActivationRaw,
          natalGain: d.natalGain,
          domainScale: d.trace.domainScale,
          directSupportRaw: masses.directSupportRaw,
          directPressureRaw: masses.directPressureRaw,
          tp4cSupportRaw: masses.tp4cSupportRaw,
          tp4cPressureRaw: masses.tp4cPressureRaw,
          tp4cContributionAbs: Math.abs(trace.tp4cContribution ?? 0),
          retainedSignedCount: masses.retainedSignedCount,
          retainedActivationCount: masses.retainedActivationCount,
        });
      }
    }
  }

  return samples;
}

export function aggregateEvidenceDimensions(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  chartIndices: number[],
): ReturnType<typeof evidenceMassFromRows> {
  const contract = FULL_CORPUS_CONTRACT;
  const bases = buildAuditBirthInputs(contract);
  const merged = evidenceMassFromRows([]);

  for (const chartIndex of chartIndices) {
    const base = bases[chartIndex];
    if (!base) continue;
    for (const yearly of expandAnnualYears(
      base,
      contract.baseAnnualYear,
      contract.yearsPerChart,
    )) {
      const chart = calculateNamPhai(yearly);
      const domains = scoreV05ChartDomains(chart, knowledge);
      if (!domains) continue;
      for (const d of domains) {
        const m = evidenceMassFromRows(d.aggregate.evidence);
        merged.directSupportRaw += m.directSupportRaw;
        merged.directPressureRaw += m.directPressureRaw;
        merged.tp4cSupportRaw += m.tp4cSupportRaw;
        merged.tp4cPressureRaw += m.tp4cPressureRaw;
        merged.retainedSignedCount += m.retainedSignedCount;
        merged.retainedActivationCount += m.retainedActivationCount;
        for (const [k, v] of Object.entries(m.byLayer)) {
          addMass(merged.byLayer, k, v.supportRaw, v.pressureRaw);
          merged.byLayer[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.byCategory)) {
          addMass(merged.byCategory, k, v.supportRaw, v.pressureRaw);
          merged.byCategory[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.byGeometryBucket)) {
          addMass(merged.byGeometryBucket, k, v.supportRaw, v.pressureRaw);
          merged.byGeometryBucket[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.bySourceId)) {
          addMass(merged.bySourceId, k, v.supportRaw, v.pressureRaw);
          merged.bySourceId[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.byRuleId)) {
          addMass(merged.byRuleId, k, v.supportRaw, v.pressureRaw);
          merged.byRuleId[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.byStackingGroup)) {
          addMass(merged.byStackingGroup, k, v.supportRaw, v.pressureRaw);
          merged.byStackingGroup[k]!.count += v.count;
        }
        for (const [k, v] of Object.entries(m.byOwnershipRole)) {
          addMass(merged.byOwnershipRole, k, v.supportRaw, v.pressureRaw);
          merged.byOwnershipRole[k]!.count += v.count;
        }
      }
    }
  }

  return merged;
}

export function samplesToVectors(samples: V051DomainSample[]): number[][] {
  const byYear = new Map<string, Partial<Record<AnnualAxisDomain, number>>>();
  for (const s of samples) {
    const key = `${s.chartId}:${s.annualYear}`;
    const cur = byYear.get(key) ?? {};
    cur[s.domain] = s.score;
    byYear.set(key, cur);
  }
  const vectors: number[][] = [];
  for (const partial of byYear.values()) {
    const vals = ANNUAL_AXIS_DOMAINS.map((d) => partial[d]).filter(
      (v): v is number => v != null,
    );
    if (vals.length === 6) vectors.push(vals);
  }
  return vectors;
}
