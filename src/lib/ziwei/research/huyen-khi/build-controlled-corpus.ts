import { readFileSync } from "node:fs";
import path from "node:path";
import { HUYEN_KHI_DATA_DIR } from "./load-dataset";
import type { PublicHuyenKhiDataset } from "./types";

interface CorpusPlanPhase {
  phase: string;
  name: string;
  targetCharts: number;
  requirements: string[];
}

interface CorpusPlan {
  phases: CorpusPlanPhase[];
}

export interface CorpusPhaseStatus {
  phase: string;
  name: string;
  targetCharts: number;
  currentCharts: number;
  completionRate: number;
  requirements: string[];
}

export interface CorpusManifest {
  generatedFromRecordCount: number;
  positiveTotalCount: number;
  negativeTotalCount: number;
  nearZeroTotalCount: number;
  phases: CorpusPhaseStatus[];
}

const NEAR_ZERO_THRESHOLD = 0.5;

function loadCorpusPlan(): CorpusPlan {
  const raw = readFileSync(path.join(HUYEN_KHI_DATA_DIR, "corpus-plan.v0.1.json"), "utf-8");
  return JSON.parse(raw) as CorpusPlan;
}

/**
 * §6 — reports current vs. target corpus composition per the supplied
 * `corpus-plan.v0.1.json`. Only counts real records already in the
 * dataset; never fabricates records to approach a target.
 */
export function buildControlledCorpusManifest(dataset: PublicHuyenKhiDataset): CorpusManifest {
  const plan = loadCorpusPlan();
  const positive = dataset.records.filter((r) => r.displayedTotal > 0).length;
  const negative = dataset.records.filter((r) => r.displayedTotal < 0).length;
  const nearZero = dataset.records.filter((r) => Math.abs(r.displayedTotal) <= NEAR_ZERO_THRESHOLD).length;

  // V0.1 only has Phase A seed data (manually transcribed public
  // summaries); Phases B/C/D require either live collection (gated behind
  // ethics review — not performed automatically) or further manual
  // transcription, so their current count is honestly 0 until real data
  // is added.
  const phases: CorpusPhaseStatus[] = plan.phases.map((p) => {
    const currentCharts = p.phase === "A" ? dataset.records.length : 0;
    return {
      phase: p.phase,
      name: p.name,
      targetCharts: p.targetCharts,
      currentCharts,
      completionRate: Math.round((currentCharts / p.targetCharts) * 1000) / 1000,
      requirements: p.requirements,
    };
  });

  return {
    generatedFromRecordCount: dataset.records.length,
    positiveTotalCount: positive,
    negativeTotalCount: negative,
    nearZeroTotalCount: nearZero,
    phases,
  };
}
