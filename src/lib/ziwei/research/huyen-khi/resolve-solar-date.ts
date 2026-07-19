import { solarToLunar } from "../../engine-nam-phai";
import type { ParsedBirthTitle, ResolvedSolarDate, SolarDateCandidate } from "./types";

/** Sexagenary cycle order, anchored at 1984 = Giáp Tý (a standard,
 * independently checkable anchor fact — 1984 is well documented as a Giáp
 * Tý / Rat year). `stemIndex = (year - 4) mod 10`, `branchIndex = (year -
 * 4) mod 12` against these orderings. */
const CYCLE_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CYCLE_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function stemBranchForYear(year: number): { stem: string; branch: string } {
  return {
    stem: CYCLE_STEMS[mod(year - 4, 10)]!,
    branch: CYCLE_BRANCHES[mod(year - 4, 12)]!,
  };
}

/** Every absolute year in `[minYear, maxYear]` whose sexagenary stem-branch
 * matches — a stem-branch pair repeats every 60 years, so a public source
 * giving only "Giáp Tuất" (no absolute year) is inherently ambiguous. */
export function candidateLunarYears(
  yearStem: string,
  yearBranch: string,
  minYear = 1900,
  maxYear = 2026,
): number[] {
  const out: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    const sb = stemBranchForYear(y);
    if (sb.stem === yearStem && sb.branch === yearBranch) out.push(y);
  }
  return out;
}

const TIMEZONE = 7;

/**
 * Brute-force solar-date resolver: for each candidate absolute lunar year
 * (from `candidateLunarYears`), scans solar dates across that lunar year's
 * span (using the Calculation Core's own `solarToLunar` as an oracle — no
 * separate lunar→solar formula is reimplemented) and returns every solar
 * date whose resulting lunar year/month/day matches exactly. When more
 * than one candidate exists, `yearResolution` is `"ambiguous"` — the
 * caller must not silently pick one.
 */
export function resolveSolarDateForLunar(parsed: ParsedBirthTitle): ResolvedSolarDate {
  const years = candidateLunarYears(parsed.yearStem, parsed.yearBranch);
  const matches: SolarDateCandidate[] = [];

  for (const lunarYear of years) {
    // A lunar year's solar span runs roughly from late January of
    // `lunarYear` through mid-February of `lunarYear + 1` (Tết boundary).
    // Scanning both full solar years covers it with margin.
    for (const solarYear of [lunarYear, lunarYear + 1]) {
      for (let solarMonth = 1; solarMonth <= 12; solarMonth++) {
        const daysInMonth = new Date(solarYear, solarMonth, 0).getDate();
        for (let solarDay = 1; solarDay <= daysInMonth; solarDay++) {
          const lunar = solarToLunar(solarDay, solarMonth, solarYear, TIMEZONE);
          if (lunar.year === lunarYear && lunar.month === parsed.lunarMonth && lunar.day === parsed.lunarDay) {
            matches.push({ solarYear, solarMonth, solarDay, lunarYear });
          }
        }
      }
    }
  }

  // Deduplicate — the two-solar-year scan can find the same lunar date once.
  const seen = new Set<string>();
  const unique = matches.filter((m) => {
    const key = `${m.solarYear}-${m.solarMonth}-${m.solarDay}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    yearResolution: unique.length === 0 ? "unresolved" : unique.length === 1 ? "unique" : "ambiguous",
    candidates: unique,
  };
}
