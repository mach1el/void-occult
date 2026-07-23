import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertNoTrainHoldoutLeak,
  buildMajorFortuneV02BirthCharts,
  calculateChart,
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
  type MajorFortuneV02CorpusContract,
  type MajorFortuneV02CycleObservation,
} from "../v0.2/corpus";
import { analyzeMajorFortuneOrdinalV03 } from "../../v0.3-ordinal/adapter";
import type { MajorFortuneOrdinalResult } from "../../v0.3-ordinal/types";
import { getAnalysisStatus } from "../../../../contracts/common";
import {
  loadMajorFortuneOrdinalKnowledge,
  MAJOR_FORTUNE_ORDINAL_PILLAR_IDS,
  type MajorFortuneOrdinalPillarId,
} from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import adapterPolicy from "../../v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json";

export const MF_V03_ADAPTER_CORPUS = MF_V02_FULL_CORPUS;

export interface SchoolAdapterMetrics {
  school: string;
  chartCount: number;
  cycleObservationCount: number;
  score: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
    histogram: Record<string, number>;
  };
  bandCounts: Record<string, number>;
  scoreStateCounts: Record<string, number>;
  /** @deprecated alias of contextCoverageHistogram */
  coverageHistogram: Record<string, number>;
  contextCoverageHistogram: Record<string, number>;
  scoringCoverageHistogram: Record<string, number>;
  meanContextCoverageWeight: number | null;
  meanScoringCoverageWeight: number | null;
  partialRate: number;
  unavailableRate: number;
  /** In-frame major-fortune-transformations evidence emissions. */
  directTransformationActivationCount: number;
  /** Transformations seen but not scored (wrong palace target). */
  outOfFrameTransformationCount: number;
  /** Observations with ≥1 in-frame XF evidence. */
  observationsWithDirectTransformation: number;
  /** Observations with zero in-frame XF evidence (still scored as no-signal when available). */
  observationsWithoutDirectTransformation: number;
  pillarLevels: Record<MajorFortuneOrdinalPillarId, Record<string, number>>;
  pillarNoSignalRate: Record<MajorFortuneOrdinalPillarId, number>;
  pillarBalancedRate: Record<MajorFortuneOrdinalPillarId, number>;
  pillarPartialRate: Record<MajorFortuneOrdinalPillarId, number>;
  acceptedEvidenceByFamily: Record<string, number>;
  supportMassByFamily: Record<string, number>;
  pressureMassByFamily: Record<string, number>;
  saturationNeg2: Record<MajorFortuneOrdinalPillarId, number>;
  saturationPos2: Record<MajorFortuneOrdinalPillarId, number>;
  rejectedEvidenceReasons: Record<string, number>;
  missingProvenanceCount: number;
  duplicatePhysicalFactCount: number;
  duplicateClusterCount: number;
  crossPillarOwnershipViolationCount: number;
  incompleteTransformationTupleCount: number;
  annualMonthlyInfluenceFailures: number;
  determinismFailures: number;
  boundsFailures: number;
  levelFailures: number;
  familyActivation: Record<string, number>;
  namPhaiXfUnavailableCount: number;
}

export interface MajorFortuneV03AdapterAuditMetrics {
  corpusId: string;
  seed: number;
  adapterVersion: string;
  v03ContractHash: string;
  chartCount: number;
  cycleObservationCount: number;
  trainChartCount: number;
  holdoutChartCount: number;
  schools: Record<string, SchoolAdapterMetrics>;
  overall: {
    enabledFamilyActivation: Record<string, number>;
    disabledFamilies: string[];
    hardGateFailures: string[];
    productionRouting: ReturnType<typeof getAnalysisStatus>;
    v03ContractValid: boolean;
  };
  productSmoke: Array<{
    id: string;
    school: string;
    score: number | null;
    band: string | null;
    scoreState: string;
    evidenceCount: number;
  }>;
  observations: Array<{
    observationId: string;
    birthChartId: string;
    split: string;
    school: string;
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
    score: number | null;
    band: string | null;
    scoreState: string;
    status: string;
    coverageWeight: number;
    contextCoverageWeight: number;
    scoringCoverageWeight: number;
    evidenceCount: number;
    acceptedCount: number;
    rejectedCount: number;
    outOfFrameTransformationCount: number;
    directTransformationCount: number;
    tuHoaLevel: number | null;
  }>;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

function scoreBucket(score: number): string {
  const lo = Math.floor(score / 5) * 5;
  return `${lo}-${lo + 4}`;
}

function coverageBucket(w: number): string {
  return (Math.round(w * 20) / 20).toFixed(2);
}

function emptySchool(school: string): SchoolAdapterMetrics {
  const pillarLevels = {} as SchoolAdapterMetrics["pillarLevels"];
  const pillarNoSignalRate = {} as SchoolAdapterMetrics["pillarNoSignalRate"];
  const pillarBalancedRate = {} as SchoolAdapterMetrics["pillarBalancedRate"];
  const pillarPartialRate = {} as SchoolAdapterMetrics["pillarPartialRate"];
  const saturationNeg2 = {} as SchoolAdapterMetrics["saturationNeg2"];
  const saturationPos2 = {} as SchoolAdapterMetrics["saturationPos2"];
  for (const id of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    pillarLevels[id] = { "-2": 0, "-1": 0, "0": 0, "1": 0, "2": 0, null: 0 };
    pillarNoSignalRate[id] = 0;
    pillarBalancedRate[id] = 0;
    pillarPartialRate[id] = 0;
    saturationNeg2[id] = 0;
    saturationPos2[id] = 0;
  }
  return {
    school,
    chartCount: 0,
    cycleObservationCount: 0,
    score: { min: null, max: null, mean: null, median: null, histogram: {} },
    bandCounts: {},
    scoreStateCounts: {},
    coverageHistogram: {},
    contextCoverageHistogram: {},
    scoringCoverageHistogram: {},
    meanContextCoverageWeight: null,
    meanScoringCoverageWeight: null,
    partialRate: 0,
    unavailableRate: 0,
    directTransformationActivationCount: 0,
    outOfFrameTransformationCount: 0,
    observationsWithDirectTransformation: 0,
    observationsWithoutDirectTransformation: 0,
    pillarLevels,
    pillarNoSignalRate,
    pillarBalancedRate,
    pillarPartialRate,
    acceptedEvidenceByFamily: {},
    supportMassByFamily: {},
    pressureMassByFamily: {},
    saturationNeg2,
    saturationPos2,
    rejectedEvidenceReasons: {},
    missingProvenanceCount: 0,
    duplicatePhysicalFactCount: 0,
    duplicateClusterCount: 0,
    crossPillarOwnershipViolationCount: 0,
    incompleteTransformationTupleCount: 0,
    annualMonthlyInfluenceFailures: 0,
    determinismFailures: 0,
    boundsFailures: 0,
    levelFailures: 0,
    familyActivation: {},
    namPhaiXfUnavailableCount: 0,
  };
}

function independenceFingerprint(result: MajorFortuneOrdinalResult): string {
  return JSON.stringify({
    score: result.score,
    band: result.band,
    scoreState: result.scoreState,
    pillars: Object.fromEntries(
      Object.entries(result.pillars).map(([k, v]) => [
        k,
        {
          level: v.level,
          delta: v.delta,
          state: v.state,
          accepted: v.acceptedEvidenceIds,
        },
      ]),
    ),
  });
}

function hashV03Contract(): string {
  const root = join(
    process.cwd(),
    "src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.3-ordinal",
  );
  const files = [
    "formula.v0.3.json",
    "bands.v0.3.json",
    "signal-family-policy.v0.3.json",
    "cross-pillar-ownership.v0.3.json",
    "exclusion-registry.v0.3.json",
    "manifest.v0.3.json",
  ];
  const h = createHash("sha256");
  for (const f of files) {
    h.update(f);
    h.update(readFileSync(join(root, f)));
  }
  return h.digest("hex");
}

interface SchoolAcc {
  metrics: SchoolAdapterMetrics;
  scores: number[];
  charts: Set<string>;
  partial: number;
  unavailable: number;
  contextCoverageSum: number;
  scoringCoverageSum: number;
  coverageObs: number;
  pillarStateHits: Record<MajorFortuneOrdinalPillarId, { noSignal: number; balanced: number; partial: number; total: number }>;
  satNeg: Record<MajorFortuneOrdinalPillarId, number>;
  satPos: Record<MajorFortuneOrdinalPillarId, number>;
}

function newAcc(school: string): SchoolAcc {
  const metrics = emptySchool(school);
  const pillarStateHits = {} as SchoolAcc["pillarStateHits"];
  const satNeg = {} as SchoolAcc["satNeg"];
  const satPos = {} as SchoolAcc["satPos"];
  for (const id of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    pillarStateHits[id] = { noSignal: 0, balanced: 0, partial: 0, total: 0 };
    satNeg[id] = 0;
    satPos[id] = 0;
  }
  return {
    metrics,
    scores: [],
    charts: new Set(),
    partial: 0,
    unavailable: 0,
    contextCoverageSum: 0,
    scoringCoverageSum: 0,
    coverageObs: 0,
    pillarStateHits,
    satNeg,
    satPos,
  };
}

function finalizeSchool(acc: SchoolAcc): SchoolAdapterMetrics {
  const m = acc.metrics;
  m.chartCount = acc.charts.size;
  m.cycleObservationCount = acc.scores.length + (m.scoreStateCounts["unavailable"] ?? 0);
  // Fix: cycleObservationCount should be total observations for school
  const totalObs =
    Object.values(m.scoreStateCounts).reduce((a, b) => a + b, 0) ||
    acc.scores.length;
  m.cycleObservationCount = totalObs;
  const sorted = [...acc.scores].sort((a, b) => a - b);
  m.score.min = sorted[0] ?? null;
  m.score.max = sorted[sorted.length - 1] ?? null;
  m.score.mean = mean(sorted);
  m.score.median = median(sorted);
  m.partialRate = totalObs === 0 ? 0 : acc.partial / totalObs;
  m.unavailableRate = totalObs === 0 ? 0 : acc.unavailable / totalObs;
  m.meanContextCoverageWeight =
    acc.coverageObs === 0 ? null : acc.contextCoverageSum / acc.coverageObs;
  m.meanScoringCoverageWeight =
    acc.coverageObs === 0 ? null : acc.scoringCoverageSum / acc.coverageObs;
  for (const id of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    const hits = acc.pillarStateHits[id]!;
    m.pillarNoSignalRate[id] = hits.total === 0 ? 0 : hits.noSignal / hits.total;
    m.pillarBalancedRate[id] = hits.total === 0 ? 0 : hits.balanced / hits.total;
    m.pillarPartialRate[id] = hits.total === 0 ? 0 : hits.partial / hits.total;
    m.saturationNeg2[id] = hits.total === 0 ? 0 : acc.satNeg[id]! / hits.total;
    m.saturationPos2[id] = hits.total === 0 ? 0 : acc.satPos[id]! / hits.total;
  }
  return m;
}

function recordObservation(
  acc: SchoolAcc,
  obs: MajorFortuneV02CycleObservation,
  analysis: ReturnType<typeof analyzeMajorFortuneOrdinalV03>,
): void {
  acc.charts.add(obs.birthChartId);
  const evalResult = analysis.evaluation;
  const diag = analysis.build.adapterDiagnostics;

  acc.metrics.incompleteTransformationTupleCount +=
    diag.incompleteTransformationTuples.length;
  acc.metrics.missingProvenanceCount += diag.evidenceValidationErrors.length;
  acc.metrics.outOfFrameTransformationCount += diag.outOfFrameTransformationCount;
  if (obs.school === "nam-phai" && diag.namPhaiTransformationBlocked.length > 0) {
    acc.metrics.namPhaiXfUnavailableCount += 1;
  }

  let directXf = 0;
  for (const e of analysis.build.emittedEvidence) {
    acc.metrics.familyActivation[e.signalFamilyId] =
      (acc.metrics.familyActivation[e.signalFamilyId] ?? 0) + 1;
    if (e.signalFamilyId === "major-fortune-transformations") {
      directXf += 1;
    }
  }
  acc.metrics.directTransformationActivationCount += directXf;
  if (obs.school === "trung-chau") {
    if (directXf > 0) acc.metrics.observationsWithDirectTransformation += 1;
    else acc.metrics.observationsWithoutDirectTransformation += 1;
  }

  if (!evalResult) {
    acc.unavailable += 1;
    acc.metrics.scoreStateCounts.unavailable =
      (acc.metrics.scoreStateCounts.unavailable ?? 0) + 1;
    return;
  }

  if (evalResult.status === "partial") acc.partial += 1;
  if (evalResult.status === "unavailable") acc.unavailable += 1;

  if (evalResult.score != null) {
    if (!Number.isFinite(evalResult.score) || evalResult.score < 0 || evalResult.score > 100) {
      acc.metrics.boundsFailures += 1;
    }
    acc.scores.push(evalResult.score);
    const bucket = scoreBucket(evalResult.score);
    acc.metrics.score.histogram[bucket] = (acc.metrics.score.histogram[bucket] ?? 0) + 1;
  }

  if (evalResult.band) {
    acc.metrics.bandCounts[evalResult.band] =
      (acc.metrics.bandCounts[evalResult.band] ?? 0) + 1;
  }
  acc.metrics.scoreStateCounts[evalResult.scoreState] =
    (acc.metrics.scoreStateCounts[evalResult.scoreState] ?? 0) + 1;

  const contextCov = evalResult.coverage.contextCoverageWeight;
  const scoringCov = evalResult.coverage.scoringCoverageWeight;
  const contextBucket = coverageBucket(contextCov);
  const scoringBucket = coverageBucket(scoringCov);
  acc.metrics.coverageHistogram[contextBucket] =
    (acc.metrics.coverageHistogram[contextBucket] ?? 0) + 1;
  acc.metrics.contextCoverageHistogram[contextBucket] =
    (acc.metrics.contextCoverageHistogram[contextBucket] ?? 0) + 1;
  acc.metrics.scoringCoverageHistogram[scoringBucket] =
    (acc.metrics.scoringCoverageHistogram[scoringBucket] ?? 0) + 1;
  acc.contextCoverageSum += contextCov;
  acc.scoringCoverageSum += scoringCov;
  acc.coverageObs += 1;

  for (const id of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    const pillar = evalResult.pillars[id];
    const levelKey = pillar.level == null ? "null" : String(pillar.level);
    acc.metrics.pillarLevels[id][levelKey] =
      (acc.metrics.pillarLevels[id][levelKey] ?? 0) + 1;
    if (pillar.level != null && ![-2, -1, 0, 1, 2].includes(pillar.level)) {
      acc.metrics.levelFailures += 1;
    }
    const hits = acc.pillarStateHits[id]!;
    hits.total += 1;
    if (pillar.state === "no-signal") hits.noSignal += 1;
    if (pillar.state === "balanced-signal") hits.balanced += 1;
    if (pillar.state === "partial-data") hits.partial += 1;
    if (pillar.level === -2) acc.satNeg[id]! += 1;
    if (pillar.level === 2) acc.satPos[id]! += 1;

    for (const r of pillar.rejectedEvidence) {
      acc.metrics.rejectedEvidenceReasons[r.reason] =
        (acc.metrics.rejectedEvidenceReasons[r.reason] ?? 0) + 1;
      if (r.reason === "duplicate-physical-fact") {
        acc.metrics.duplicatePhysicalFactCount += 1;
      }
      if (r.reason === "duplicate-evidence-cluster") {
        acc.metrics.duplicateClusterCount += 1;
      }
      if (r.reason === "cross-pillar-ownership-violation") {
        acc.metrics.crossPillarOwnershipViolationCount += 1;
      }
    }
  }

  // Accepted evidence by family + mass (from accepted IDs)
  const acceptedIds = new Set(
    Object.values(evalResult.pillars).flatMap((p) => p.acceptedEvidenceIds),
  );
  for (const e of analysis.build.emittedEvidence) {
    if (!acceptedIds.has(e.evidenceId)) continue;
    acc.metrics.acceptedEvidenceByFamily[e.signalFamilyId] =
      (acc.metrics.acceptedEvidenceByFamily[e.signalFamilyId] ?? 0) + 1;
    const mass = e.strength === "strong" ? 2 : 1;
    if (e.direction === "support") {
      acc.metrics.supportMassByFamily[e.signalFamilyId] =
        (acc.metrics.supportMassByFamily[e.signalFamilyId] ?? 0) + mass;
    } else {
      acc.metrics.pressureMassByFamily[e.signalFamilyId] =
        (acc.metrics.pressureMassByFamily[e.signalFamilyId] ?? 0) + mass;
    }
  }
}

function checkTemporalIndependence(
  obs: MajorFortuneV02CycleObservation,
  baseline: ReturnType<typeof analyzeMajorFortuneOrdinalV03>,
): boolean {
  const chart = calculateChart(obs.school, obs.input);
  const host = chart.palaces[0]!;
  const mutated = {
    ...chart,
    annualStars: [{ name: "Lưu Hóa Lộc", source: "annual", palace: host }],
    annualMutagens: [{ mutagen: "Hóa Lộc", starName: "Tử Vi" }],
    taiTuePalace: chart.palaces[1] ?? host,
    smallLimitPalace: chart.palaces[2] ?? host,
    monthlyPalaces: [{ month: 1, palace: host }],
    palaces: chart.palaces.map((p, i) =>
      i === 0 ? { ...p, flowMonths: [{ month: 1, palace: host }], isLuuNienDaiVan: true } : p,
    ),
  };
  const mutatedAnalysis = analyzeMajorFortuneOrdinalV03(mutated, { school: obs.school });
  if (!baseline.evaluation || !mutatedAnalysis.evaluation) {
    return baseline.evaluation == null && mutatedAnalysis.evaluation == null;
  }
  return (
    independenceFingerprint(baseline.evaluation) ===
      independenceFingerprint(mutatedAnalysis.evaluation) &&
    JSON.stringify(baseline.build.emittedEvidence) ===
      JSON.stringify(mutatedAnalysis.build.emittedEvidence)
  );
}

export function runMajorFortuneV03AdapterAudit(
  contract: MajorFortuneV02CorpusContract = MF_V03_ADAPTER_CORPUS,
): MajorFortuneV03AdapterAuditMetrics {
  const loaded = loadMajorFortuneOrdinalKnowledge();
  const observations = expandAllMajorFortuneCycleObservations(contract);
  assertNoTrainHoldoutLeak(observations);

  const charts = buildMajorFortuneV02BirthCharts(contract);
  const trainChartCount = charts.filter((c) => c.split === "train").length;
  const holdoutChartCount = charts.filter((c) => c.split === "holdout").length;

  const schoolAcc: Record<string, SchoolAcc> = {
    "nam-phai": newAcc("nam-phai"),
    "trung-chau": newAcc("trung-chau"),
  };

  const hardGateFailures: string[] = [];
  if (!loaded.ok) hardGateFailures.push("v03-contract-invalid");

  const observationRows: MajorFortuneV03AdapterAuditMetrics["observations"] = [];
  const enabledActivation: Record<string, number> = {};

  // Sample temporal independence + determinism on a subset for cost, but count failures.
  const sampleEvery = Math.max(1, Math.floor(observations.length / 40));

  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i]!;
    const chart = calculateChart(obs.school, obs.input);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: obs.school });
    const rerun = analyzeMajorFortuneOrdinalV03(chart, { school: obs.school });
    const acc = schoolAcc[obs.school]!;

    if (
      JSON.stringify(analysis.build.emittedEvidence) !==
        JSON.stringify(rerun.build.emittedEvidence) ||
      analysis.evaluation?.score !== rerun.evaluation?.score
    ) {
      acc.metrics.determinismFailures += 1;
    }

    if (i % sampleEvery === 0) {
      if (!checkTemporalIndependence(obs, analysis)) {
        acc.metrics.annualMonthlyInfluenceFailures += 1;
      }
    }

    recordObservation(acc, obs, analysis);

    observationRows.push({
      observationId: `${obs.birthChartId}|${obs.school}|c${obs.cycleIndex}|p${obs.activePalaceIndex}`,
      birthChartId: obs.birthChartId,
      split: obs.split,
      school: obs.school,
      cycleIndex: obs.cycleIndex,
      startAge: obs.startAge,
      endAge: obs.endAge,
      activePalaceIndex: obs.activePalaceIndex,
      score: analysis.evaluation?.score ?? null,
      band: analysis.evaluation?.band ?? null,
      scoreState: analysis.evaluation?.scoreState ?? "unavailable",
      status: analysis.evaluation?.status ?? "unavailable",
      coverageWeight: analysis.evaluation?.coverage.coverageWeight ?? 0,
      contextCoverageWeight: analysis.evaluation?.coverage.contextCoverageWeight ?? 0,
      scoringCoverageWeight: analysis.evaluation?.coverage.scoringCoverageWeight ?? 0,
      evidenceCount: analysis.build.emittedEvidence.length,
      acceptedCount: analysis.evaluation?.diagnostics.acceptedEvidenceCount ?? 0,
      rejectedCount: analysis.evaluation?.diagnostics.rejectedEvidenceCount ?? 0,
      outOfFrameTransformationCount:
        analysis.build.adapterDiagnostics.outOfFrameTransformationCount,
      directTransformationCount: analysis.build.emittedEvidence.filter(
        (e) => e.signalFamilyId === "major-fortune-transformations",
      ).length,
      tuHoaLevel: analysis.evaluation?.pillars["tu-hoa-sat-tinh"]?.level ?? null,
    });
  }

  // Fix enabledActivation from totals
  for (const school of Object.values(schoolAcc)) {
    for (const [fam, count] of Object.entries(school.metrics.familyActivation)) {
      enabledActivation[fam] = (enabledActivation[fam] ?? 0) + count;
    }
  }

  const schools: Record<string, SchoolAdapterMetrics> = {};
  for (const [k, acc] of Object.entries(schoolAcc)) {
    schools[k] = finalizeSchool(acc);
    if (acc.metrics.boundsFailures > 0) hardGateFailures.push(`${k}:bounds-failures`);
    if (acc.metrics.levelFailures > 0) hardGateFailures.push(`${k}:level-failures`);
    if (acc.metrics.determinismFailures > 0) hardGateFailures.push(`${k}:determinism-failures`);
    if (acc.metrics.annualMonthlyInfluenceFailures > 0) {
      hardGateFailures.push(`${k}:temporal-independence-failures`);
    }
    if (acc.metrics.crossPillarOwnershipViolationCount > 0) {
      hardGateFailures.push(`${k}:cross-pillar-ownership`);
    }
    if (acc.metrics.missingProvenanceCount > 0) {
      hardGateFailures.push(`${k}:missing-provenance`);
    }
  }

  for (const fam of adapterPolicy.enabledSignalFamilies) {
    if ((enabledActivation[fam] ?? 0) === 0) {
      // major-fortune-transformations may only fire on trung-chau
      if (fam === "major-fortune-transformations") {
        const tc = schools["trung-chau"]?.familyActivation[fam] ?? 0;
        if (tc === 0) hardGateFailures.push(`enabled-family-zero-activation:${fam}`);
      } else {
        hardGateFailures.push(`enabled-family-zero-activation:${fam}`);
      }
    }
  }

  // Production transformation-frame gates (Trung Châu)
  const tc = schools["trung-chau"];
  if (tc) {
    const tuLevels = tc.pillarLevels["tu-hoa-sat-tinh"] ?? {};
    const scoredTu =
      (tuLevels["-2"] ?? 0) +
      (tuLevels["-1"] ?? 0) +
      (tuLevels["0"] ?? 0) +
      (tuLevels["1"] ?? 0) +
      (tuLevels["2"] ?? 0);
    const plusOne = tuLevels["1"] ?? 0;
    if (scoredTu > 0 && plusOne === scoredTu) {
      hardGateFailures.push("trung-chau-tu-hoa-constant-plus-one");
    }
    const directObs = tc.observationsWithDirectTransformation;
    const noDirectObs = tc.observationsWithoutDirectTransformation;
    const tcObs = directObs + noDirectObs;
    if (tc.directTransformationActivationCount === 0) {
      hardGateFailures.push("trung-chau-direct-transformation-activation-zero");
    }
    if (tcObs > 0 && directObs === tcObs) {
      hardGateFailures.push("trung-chau-direct-transformation-activation-100pct");
    }
  }

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.3.1") {
    hardGateFailures.push("production-routing-unexpected");
  }

  // Product smoke fixtures (outside calibration — fixed regression birth)
  const smokeInput = {
    solarDate: "1991-09-21",
    birthHour: "Dậu",
    gender: "female" as const,
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien" as const,
  };
  const productSmoke: MajorFortuneV03AdapterAuditMetrics["productSmoke"] = [];
  for (const school of ["nam-phai", "trung-chau"] as const) {
    const chart = calculateChart(school, smokeInput);
    const a = analyzeMajorFortuneOrdinalV03(chart, { school });
    productSmoke.push({
      id: `smoke-1991-09-21-Dau-${school}`,
      school,
      score: a.evaluation?.score ?? null,
      band: a.evaluation?.band ?? null,
      scoreState: a.evaluation?.scoreState ?? "unavailable",
      evidenceCount: a.build.emittedEvidence.length,
    });
  }

  return {
    corpusId: contract.corpusId,
    seed: contract.seed,
    adapterVersion: adapterPolicy.adapterVersion,
    v03ContractHash: hashV03Contract(),
    chartCount: contract.chartCount,
    cycleObservationCount: observations.length,
    trainChartCount,
    holdoutChartCount,
    schools,
    overall: {
      enabledFamilyActivation: enabledActivation,
      disabledFamilies: adapterPolicy.round1DisabledFamilies.map(
        (d) => `${d.signalFamilyId}:${d.reason}`,
      ),
      hardGateFailures: [...new Set(hardGateFailures)].sort(),
      productionRouting: routing,
      v03ContractValid: loaded.ok,
    },
    productSmoke,
    observations: observationRows,
  };
}
