import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FAST_CORPUS_CONTRACT,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "../build-audit-corpus";
import { collectCorpusV09, type AnnualAxesCorpusCollectionV09 } from "./corpus-collection";
import { computeFullMetricsV09, type AnnualAxesFullMetricsV09 } from "./metrics";
import { evaluateGatesV09, type AnnualAxesGateEvaluationResult } from "./gate-evaluator";
import { buildRuleCoverageV09, type AnnualRuleCoverageRecord } from "./rule-coverage";
import { buildCapabilityCoverageV09, type AnnualCapabilityCoverageRecord } from "./capability-coverage";
import { buildContributionMassV09, type AnnualAxesContributionMassV09 } from "./contribution-mass";
import { buildNoSignalAnalysisV09, type AnnualAxesNoSignalAnalysisV09 } from "./no-signal-analysis";

export { FAST_CORPUS_CONTRACT, FULL_CORPUS_CONTRACT };

export interface AnnualAxesV09ResearchArtifacts {
  contract: AuditCorpusContract;
  metrics: AnnualAxesFullMetricsV09;
  gateEvaluation: AnnualAxesGateEvaluationResult;
  ruleCoverage: AnnualRuleCoverageRecord[];
  capabilityCoverage: AnnualCapabilityCoverageRecord[];
  contributionMass: AnnualAxesContributionMassV09;
  noSignalAnalysis: AnnualAxesNoSignalAnalysisV09;
}

function buildChartCorpus(contract: AuditCorpusContract): Array<{ chartId: string; chart: ChartData }> {
  const bases: BirthInput[] = buildAuditBirthInputs(contract);
  const out: Array<{ chartId: string; chart: ChartData }> = [];
  bases.forEach((base, i) => {
    const chartId = `${contract.contractId}:nam-phai:c${i}`;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      out.push({ chartId, chart: calculateNamPhai(yearly) });
    }
  });
  return out;
}

/**
 * Runs the deterministic Nam Phái corpus once through the production V0.8
 * engine and derives every Part A/B/C/E/F research artifact from that single
 * pass. Read-only over production knowledge/engine; writes only under
 * `research/annual-axes/v0.9-foundation/audit/`.
 */
export function computeV09ResearchArtifacts(contract: AuditCorpusContract): AnnualAxesV09ResearchArtifacts {
  const knowledgeResult = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledgeResult.ok) {
    throw new Error(
      `V0.8 knowledge failed to load; V0.9 research artifacts require a valid production baseline: ${JSON.stringify(
        knowledgeResult.issues,
      )}`,
    );
  }
  const knowledge = knowledgeResult.knowledge;

  const charts = buildChartCorpus(contract);
  const corpus: AnnualAxesCorpusCollectionV09 = collectCorpusV09(charts);

  const metrics = computeFullMetricsV09(corpus.observations, {
    minimum: knowledge.pointClasses.score.minimum,
    maximum: knowledge.pointClasses.score.maximum,
  });
  const gateEvaluation = evaluateGatesV09(knowledge.distributionGates, metrics);
  const ruleCoverage = buildRuleCoverageV09(knowledge, corpus.evidenceFacts, corpus.observations.length);
  const capabilityCoverage = buildCapabilityCoverageV09(knowledge, ruleCoverage, corpus.starEmissions);
  const contributionMass = buildContributionMassV09(knowledge, corpus.evidenceFacts, corpus.observations);
  const noSignalAnalysis = buildNoSignalAnalysisV09(corpus.observations);

  return {
    contract,
    metrics,
    gateEvaluation,
    ruleCoverage,
    capabilityCoverage,
    contributionMass,
    noSignalAnalysis,
  };
}

function writeJson(outDir: string, name: string, data: unknown): void {
  writeFileSync(join(outDir, name), `${JSON.stringify(data, null, 2)}\n`);
}

/** CLI / vitest write-test entry — writes the six generated Part A–F/G
 * research JSON artifacts under `research/annual-axes/v0.9-foundation/audit/`. */
export function writeV09ResearchArtifacts(opts: { full: boolean; outDir: string }): AnnualAxesV09ResearchArtifacts {
  const contract = opts.full ? FULL_CORPUS_CONTRACT : FAST_CORPUS_CONTRACT;
  mkdirSync(opts.outDir, { recursive: true });

  const artifacts = computeV09ResearchArtifacts(contract);

  writeJson(opts.outDir, "corpus-contract.v0.9.json", contract);
  writeJson(opts.outDir, "full-distribution-report.v0.8.json", artifacts.metrics);
  writeJson(opts.outDir, "gate-evaluation.v0.8.json", artifacts.gateEvaluation);
  writeJson(opts.outDir, "rule-coverage.v0.8.json", artifacts.ruleCoverage);
  writeJson(opts.outDir, "capability-coverage.v0.8.json", artifacts.capabilityCoverage);
  writeJson(opts.outDir, "no-signal-analysis.v0.8.json", artifacts.noSignalAnalysis);
  writeJson(opts.outDir, "contribution-mass.v0.8.json", artifacts.contributionMass);

  return artifacts;
}
