import { NATAL_PALACE_NAMES, type NatalPalaceName, type PublicHuyenKhiRecord } from "./types";

export interface BaselineMetrics {
  modelId: string;
  description: string;
  inSampleMae: number;
  inSampleRmse: number;
  observationCount: number;
  caveats: string[];
}

function flattenObservations(records: PublicHuyenKhiRecord[]): Array<{ palaceName: NatalPalaceName; value: number; gender: string }> {
  const out: Array<{ palaceName: NatalPalaceName; value: number; gender: string }> = [];
  for (const record of records) {
    for (const palaceName of NATAL_PALACE_NAMES) {
      out.push({ palaceName, value: record.palaceScores[palaceName], gender: "" });
    }
  }
  return out;
}

function mae(errors: number[]): number {
  return errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length;
}

function rmse(errors: number[]): number {
  return Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length);
}

const SEED_CAVEAT =
  "N=18 seed records — far below the quality-gates.v0.1.json unseen-holdout requirement; this is an in-sample demonstration that the tooling works, not a promotion-eligible evaluation.";

/**
 * §10 Model 0 — null baseline: predict each palace's training-set mean
 * for every observation of that palace.
 */
export function computeNullBaseline(records: PublicHuyenKhiRecord[]): BaselineMetrics {
  const byPalace = new Map<NatalPalaceName, number[]>();
  for (const record of records) {
    for (const palaceName of NATAL_PALACE_NAMES) {
      const list = byPalace.get(palaceName) ?? [];
      list.push(record.palaceScores[palaceName]);
      byPalace.set(palaceName, list);
    }
  }

  const errors: number[] = [];
  for (const [, values] of byPalace) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    for (const v of values) errors.push(v - mean);
  }

  return {
    modelId: "model-0-null-baseline",
    description: "Predicts each palace name's training-set mean for every observation.",
    inSampleMae: Math.round(mae(errors) * 1e6) / 1e6,
    inSampleRmse: Math.round(rmse(errors) * 1e6) / 1e6,
    observationCount: errors.length,
    caveats: [SEED_CAVEAT],
  };
}

/**
 * §10 Model 1 — coarse lookup baseline. The full contract (palace name +
 * Cục + Mệnh branch + major-star configuration + brightness) needs
 * resolved chart-fact snapshots, which V0.1's seed set does not have (all
 * 18 titles are lunar-year ambiguous — see `resolve-solar-date.ts`). This
 * computes the coarsest version buildable today — palace name + gender —
 * as a documented placeholder, not the prompt's full Model 1.
 */
export function computeCoarseLookupBaseline(records: PublicHuyenKhiRecord[]): BaselineMetrics {
  const groups = new Map<string, number[]>();
  for (const record of records) {
    for (const palaceName of NATAL_PALACE_NAMES) {
      const key = palaceName; // gender unavailable per-record without a resolved parse join; palace-only for now
      const list = groups.get(key) ?? [];
      list.push(record.palaceScores[palaceName]);
      groups.set(key, list);
    }
  }

  const errors: number[] = [];
  for (const [, values] of groups) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    for (const v of values) errors.push(v - mean);
  }

  return {
    modelId: "model-1-coarse-lookup-placeholder",
    description:
      "Placeholder for the prompt's Model 1 (palace name + Cục + Mệnh branch + major-star configuration + brightness). Only palace name is available without resolved chart facts, so this is numerically identical to Model 0 in V0.1 — not yet a real second rung on the model ladder.",
    inSampleMae: Math.round(mae(errors) * 1e6) / 1e6,
    inSampleRmse: Math.round(rmse(errors) * 1e6) / 1e6,
    observationCount: errors.length,
    caveats: [
      SEED_CAVEAT,
      "Cannot yet condition on Cục/Mệnh branch/major-star configuration — no seed record has a resolved chart-fact snapshot.",
    ],
  };
}

export { flattenObservations };
