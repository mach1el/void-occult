import type { NatalPalaceName, ParsedBirthTitle, PublicHuyenKhiRecord } from "./types";
import { NATAL_PALACE_NAMES } from "./types";

export interface MatchedPairReport {
  sampleIdA: string;
  sampleIdB: string;
  factsShared: string[];
  factsChanged: string[];
  palaceScoreDeltas: Partial<Record<NatalPalaceName, number>>;
  confounders: string[];
}

const COMPARABLE_FACT_KEYS: Array<keyof ParsedBirthTitle> = [
  "yinYang",
  "gender",
  "yearStem",
  "yearBranch",
  "lunarMonth",
  "lunarDay",
  "hourBranch",
];

/**
 * §9 matched-pair scaffold. V0.1 has no resolved chart-fact snapshots (see
 * `build-chart-fact-snapshot.ts` — all 18 seed titles are lunar-year
 * ambiguous), so this operates over the parsed birth-title facts only
 * (yin/yang, gender, year stem/branch, lunar month/day, hour branch) —
 * chart-structure matched pairs (same Mệnh branch, Tuần/Triệt differs,
 * etc.) require Phase B/C real chart data collection first. Reports
 * however many pairs it actually finds; does not claim significance from
 * a single pair (§9 "do not call a coefficient established from one
 * pair").
 */
export function compareMatchedPairs(
  records: Array<{ record: PublicHuyenKhiRecord; parsed: ParsedBirthTitle }>,
  maxFactsChanged = 1,
): MatchedPairReport[] {
  const pairs: MatchedPairReport[] = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (!a || !b) continue;

      const shared: string[] = [];
      const changed: string[] = [];
      for (const key of COMPARABLE_FACT_KEYS) {
        if (a.parsed[key] === b.parsed[key]) shared.push(String(key));
        else changed.push(String(key));
      }
      if (changed.length === 0 || changed.length > maxFactsChanged) continue;

      const palaceScoreDeltas: Partial<Record<NatalPalaceName, number>> = {};
      for (const palaceName of NATAL_PALACE_NAMES) {
        const delta = b.record.palaceScores[palaceName] - a.record.palaceScores[palaceName];
        if (Math.abs(delta) > 1e-9) palaceScoreDeltas[palaceName] = Math.round(delta * 100) / 100;
      }

      pairs.push({
        sampleIdA: a.record.sampleId,
        sampleIdB: b.record.sampleId,
        factsShared: shared,
        factsChanged: changed,
        palaceScoreDeltas,
        confounders: [
          "No resolved chart-fact snapshot available (lunar year ambiguous) — star placement, Cục, Tuần/Triệt and Tứ Hóa targets are all unconfirmed confounders for this pair.",
        ],
      });
    }
  }

  return pairs;
}
