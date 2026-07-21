import type { BirthInput } from "@/types/chart";
import type { AuditCorpusContract } from "./types";

export type { AuditCorpusContract };

const HOUR_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

/** Mulberry32 — deterministic PRNG for corpus generation. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]!;
}

function shuffledRange(rand: () => number, count: number): number[] {
  const values = Array.from({ length: count }, (_, i) => i);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return values;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Build a deterministic BirthInput list. Covers both genders, all hour
 * branches, a spread of solar months/days/years (so Cục / stems / branches
 * vary), without using any personal birth data from the repository owner.
 */
export function buildAuditBirthInputs(contract: AuditCorpusContract): BirthInput[] {
  const rand = mulberry32(contract.seed);
  const out: BirthInput[] = [];
  const yearOffsets = shuffledRange(rand, 40);
  const monthOffsets = shuffledRange(rand, 12);
  const dayOffsets = shuffledRange(rand, 28);
  const hourOffsets = shuffledRange(rand, HOUR_BRANCHES.length);

  for (let i = 0; i < contract.chartCount; i++) {
    const gender = i % 2 === 0 ? "female" : "male";
    // Spread years 1960–1999 so Cục / stems / branches vary, but avoid
    // simple lockstep across chart id order. Each dimension uses a
    // deterministic permutation plus a coprime stride so the 80/20 split
    // remains representative instead of clustering by month/hour.
    const year = 1960 + yearOffsets[(i * 7) % yearOffsets.length]!;
    const month = 1 + monthOffsets[(i * 5) % monthOffsets.length]!;
    const day = 1 + dayOffsets[(i * 11) % dayOffsets.length]!;
    const hour = HOUR_BRANCHES[hourOffsets[(i * 7) % hourOffsets.length]!]!;

    out.push({
      solarDate: `${year}-${pad2(month)}-${pad2(day)}`,
      birthHour: hour,
      gender,
      timezone: contract.timezone,
      annualYear: String(contract.baseAnnualYear),
      flowBase: contract.flowBase,
    });
  }

  return out;
}

export function expandAnnualYears(
  base: BirthInput,
  baseYear: number,
  yearsPerChart: number,
): BirthInput[] {
  return Array.from({ length: yearsPerChart }, (_, k) => ({
    ...base,
    annualYear: String(baseYear + k),
  }));
}

export const FAST_CORPUS_CONTRACT: AuditCorpusContract = {
  contractId: "annual-axes-audit-fast-v0.4",
  seed: 20260719,
  chartCount: 8,
  yearsPerChart: 3,
  baseAnnualYear: 2020,
  timezone: "7",
  flowBase: "luu-nien",
  notes: [
    "Fast smoke corpus for unit tests.",
    "Not a release gate; use FULL_CORPUS_CONTRACT for audit:annual-axes-distribution.",
  ],
};

export const FULL_CORPUS_CONTRACT: AuditCorpusContract = {
  contractId: "annual-axes-audit-full-v0.4",
  seed: 20260719,
  chartCount: 100,
  yearsPerChart: 12,
  baseAnnualYear: 2018,
  timezone: "7",
  flowBase: "luu-nien",
  notes: [
    "Minimum smoke corpus from V0.4 corrective prompt §2.",
    "Deterministic; no personal birth data.",
  ],
};

export function pickHourBranch(index: number): string {
  return pick(() => (index % 12) / 12, HOUR_BRANCHES);
}
