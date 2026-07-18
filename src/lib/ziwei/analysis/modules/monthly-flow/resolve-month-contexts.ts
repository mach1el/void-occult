import type { ChartData, FlowMonthEntry } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { canonicalStarName } from "../../facts";
import { isEligibleNatalPhysicalStar } from "./collect-star-evidence";
import type {
  ExplicitLeapMonthContext,
  MonthlyCalculationProvider,
  MonthlyFlowMonthIdentity,
  MonthlyFlowYearDiagnostics,
  ResolvedMonthlyFlowContext,
  ResolvedMonthlyTransformation,
} from "./types";

const KNOWN_MUTAGENS = new Set(["Lộc", "Quyền", "Khoa", "Kỵ"]);

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildMonthKey(annualYear: number, lunarMonth: number, isLeapMonth: boolean): string {
  return `${annualYear}-${isLeapMonth ? "LM" : "M"}${pad2(lunarMonth)}`;
}

/**
 * Collapse all `FlowMonthEntry` occurrences on `chart.palaces[*].flowMonths`
 * into one canonical list — Trung Châu stores exactly one entry per
 * physical palace but Nam Phái may re-emit the same lunar month at the
 * palaces it visits, so we dedupe by (month, palace.index).
 */
function dedupeFlowMonthsFromPalaces(chart: ChartData): FlowMonthEntry[] {
  const seen = new Set<string>();
  const out: FlowMonthEntry[] = [];
  for (const palace of chart.palaces) {
    for (const entry of palace.flowMonths ?? []) {
      const key = `${entry.month}|${entry.palace.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry);
    }
  }
  return out;
}

function loadRegularMonthEntries(chart: ChartData): FlowMonthEntry[] {
  if (chart.monthlyPalaces && chart.monthlyPalaces.length > 0) {
    return [...chart.monthlyPalaces];
  }
  return dedupeFlowMonthsFromPalaces(chart);
}

interface ResolvedIdentityAttempt {
  identity: MonthlyFlowMonthIdentity | null;
  invalidMonth: boolean;
}

function resolveIdentityForEntry(
  entry: FlowMonthEntry,
  annualYear: number,
  annualStem: string,
  provider: MonthlyCalculationProvider,
  isLeapMonth: boolean,
  diagnostics: MonthlyFlowYearDiagnostics,
): ResolvedIdentityAttempt {
  const month = entry.month;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    diagnostics.invalidMonthNumber.push(`${entry.month}`);
    return { identity: null, invalidMonth: true };
  }

  const focusPalace = entry.palace;
  if (!focusPalace) {
    diagnostics.missingFocusPalace.push(buildMonthKey(annualYear, month, isLeapMonth));
    return { identity: null, invalidMonth: false };
  }

  // Calendar stem/branch always comes from the injected Calculation Core
  // provider (ChartEngine.stemBranchForLunarMonth is the SSOT). Current
  // FlowMonthEntry.stem/branch on ChartData may still carry palace-derived
  // values; never treat those — or palace.stem/palace.branch — as calendar.
  // Callers that need a synthetic calendar override the provider.
  const provided = provider.stemBranchForLunarMonth(annualStem, month);
  const calendarStem = provided.stem;
  const calendarBranch = provided.branch;

  if (!calendarStem || !calendarBranch) {
    diagnostics.missingCalendarStemBranch.push(buildMonthKey(annualYear, month, isLeapMonth));
    return { identity: null, invalidMonth: false };
  }

  return {
    identity: {
      annualYear,
      lunarMonth: month,
      isLeapMonth,
      monthKey: buildMonthKey(annualYear, month, isLeapMonth),
      focusPalaceIndex: focusPalace.index,
      calendarStem,
      calendarBranch,
    },
    invalidMonth: false,
  };
}

function resolveMonthlyTransformations(
  chart: ChartData,
  identity: MonthlyFlowMonthIdentity,
  provider: MonthlyCalculationProvider,
  monthDiagnostics: {
    ambiguous: string[];
    unresolved: string[];
  },
): { transformations: ResolvedMonthlyTransformation[]; partial: boolean } {
  const targets = provider.tuHoaTargets(identity.calendarStem);
  const out: ResolvedMonthlyTransformation[] = [];
  let partial = false;

  for (const target of targets) {
    if (!KNOWN_MUTAGENS.has(target.mutagen)) {
      monthDiagnostics.unresolved.push(
        `${identity.monthKey}:${target.mutagen}:${target.starName}:unknown-mutagen`,
      );
      partial = true;
      continue;
    }

    const canonical = canonicalStarName(target.starName);
    // Exact target = natal physical star only (same eligibility as the
    // monthly star collector). Annual Lưu-* stars, mutagen markers, and
    // void/context records never count — even when canonicalStarName would
    // collapse "Lưu Văn Xương" onto "Văn Xương".
    const palacesHoldingTarget = chart.palaces.filter((palace) =>
      (palace.stars ?? []).some(
        (star) =>
          isEligibleNatalPhysicalStar(star) &&
          canonicalStarName(star.name) === canonical,
      ),
    );

    if (palacesHoldingTarget.length === 0) {
      monthDiagnostics.unresolved.push(
        `${identity.monthKey}:${target.mutagen}:${canonical}:no-palace`,
      );
      partial = true;
      continue;
    }

    if (palacesHoldingTarget.length > 1) {
      monthDiagnostics.ambiguous.push(
        `${identity.monthKey}:${target.mutagen}:${canonical}:palaces=${palacesHoldingTarget.map((p) => p.index).join(",")}`,
      );
      partial = true;
      continue;
    }

    const palace = palacesHoldingTarget[0]!;
    out.push({
      mutagen: target.mutagen as ResolvedMonthlyTransformation["mutagen"],
      starName: target.starName,
      canonicalStarName: canonical,
      targetPalaceIndex: palace.index,
      targetNatalPalaceName: palace.name,
    });
  }

  return { transformations: out, partial };
}

export interface ResolveMonthContextsInput {
  chart: ChartData;
  school: ZiweiSchool;
  provider: MonthlyCalculationProvider;
  /**
   * Leap months are scored only when the caller supplies a fully explicit
   * context — lunar month, focus palace, and calendar stem/branch. The
   * scorer never calls `stemBranchForLunarMonth` for leap contexts and
   * never infers leap calendar identity from the regular month number.
   */
  explicitLeapContexts?: readonly ExplicitLeapMonthContext[];
  diagnostics: MonthlyFlowYearDiagnostics;
}

export interface ResolveMonthContextsResult {
  contexts: ResolvedMonthlyFlowContext[];
  rejected: boolean;
}

const ROOT_INDEX_TIEBREAK_LEAP = 1;

/**
 * Resolve every monthly context this year covers. Coordinate independence
 * is preserved everywhere: focus palace is only ever read from
 * `entry.palace.index` (or the caller's `explicitLeapContexts`); calendar
 * stem/branch is only ever read from the injected
 * `provider.stemBranchForLunarMonth(chart.annualStem, entry.month)`.
 * Neither is ever inferred from `palace.stem` / `palace.branch`, nor from
 * legacy `FlowMonthEntry.stem`/`branch` values that Calculation Core may
 * still populate from the focus palace.
 *
 * Regular months 1..12 are drawn from `chart.monthlyPalaces` when present,
 * otherwise from a deduped flatten of every palace's `flowMonths` — this
 * reads circular `FlowMonthEntry.palace` references without ever
 * `JSON.stringify`-ing them.
 *
 * Leap months are only produced when the caller supplies
 * `explicitLeapContexts` and the school's leap-month capability is
 * `explicit_resolved_context_only`.
 */
export function resolveMonthContexts(
  input: ResolveMonthContextsInput,
): ResolveMonthContextsResult {
  const { chart, school, provider, explicitLeapContexts, diagnostics } = input;

  if (provider.school !== school) {
    diagnostics.providerSchoolMismatch.push(
      `expected:${school}:got:${provider.school}`,
    );
    return { contexts: [], rejected: true };
  }

  const regularEntries = loadRegularMonthEntries(chart);
  const contexts: ResolvedMonthlyFlowContext[] = [];

  const byMonth = new Map<number, FlowMonthEntry[]>();
  for (const entry of regularEntries) {
    const bucket = byMonth.get(entry.month) ?? [];
    bucket.push(entry);
    byMonth.set(entry.month, bucket);
  }

  const usableMonths = new Set<number>();
  for (const [month, entries] of byMonth) {
    if (entries.length > 1) {
      const distinctPalaces = new Set(entries.map((e) => e.palace.index));
      if (distinctPalaces.size > 1) {
        diagnostics.duplicateMonthKeys.push(
          `${chart.annualYear}-M${pad2(month)}:palaces=${[...distinctPalaces].sort((a, b) => a - b).join(",")}`,
        );
        continue;
      }
    }
    usableMonths.add(month);
  }

  const seenMonthKeys = new Set<string>();
  for (const month of [...usableMonths].sort((a, b) => a - b)) {
    const entry = byMonth.get(month)?.[0];
    if (!entry) continue;

    const attempt = resolveIdentityForEntry(
      entry,
      chart.annualYear,
      chart.annualStem,
      provider,
      false,
      diagnostics,
    );
    if (!attempt.identity) continue;

    if (seenMonthKeys.has(attempt.identity.monthKey)) {
      diagnostics.duplicateMonthKeys.push(attempt.identity.monthKey);
      continue;
    }
    seenMonthKeys.add(attempt.identity.monthKey);

    const monthLocal = { ambiguous: [] as string[], unresolved: [] as string[] };
    const { transformations, partial } = resolveMonthlyTransformations(
      chart,
      attempt.identity,
      provider,
      monthLocal,
    );
    diagnostics.ambiguousTransformationTargets.push(...monthLocal.ambiguous);
    diagnostics.unresolvedTransformationTargets.push(...monthLocal.unresolved);

    contexts.push({
      identity: attempt.identity,
      transformations,
      transformationsPartial: partial,
      transformationDiagnostics: {
        ambiguous: monthLocal.ambiguous,
        unresolved: monthLocal.unresolved,
      },
    });
  }

  if (usableMonths.size < 12) {
    for (let m = 1; m <= 12; m++) {
      if (!usableMonths.has(m)) {
        diagnostics.missingMonthlyEntries.push(`${chart.annualYear}-M${pad2(m)}`);
      }
    }
  }

  if (explicitLeapContexts && explicitLeapContexts.length > 0) {
    for (const leap of explicitLeapContexts) {
      if (
        !Number.isInteger(leap.lunarMonth) ||
        leap.lunarMonth < 1 ||
        leap.lunarMonth > 12
      ) {
        diagnostics.invalidMonthNumber.push(`leap:${leap.lunarMonth}`);
        continue;
      }
      if (
        typeof leap.calendarStem !== "string" ||
        !leap.calendarStem ||
        typeof leap.calendarBranch !== "string" ||
        !leap.calendarBranch
      ) {
        diagnostics.missingCalendarStemBranch.push(
          buildMonthKey(chart.annualYear, leap.lunarMonth, true),
        );
        continue;
      }
      if (!Number.isInteger(leap.focusPalaceIndex)) {
        diagnostics.missingFocusPalace.push(
          buildMonthKey(chart.annualYear, leap.lunarMonth, true),
        );
        continue;
      }
      const palace = chart.palaces.find((p) => p.index === leap.focusPalaceIndex);
      if (!palace) {
        diagnostics.missingFocusPalace.push(
          buildMonthKey(chart.annualYear, leap.lunarMonth, true),
        );
        continue;
      }
      // Leap calendar identity is caller-supplied only — never derived via
      // stemBranchForLunarMonth(regularMonthNumber).
      const identity: MonthlyFlowMonthIdentity = {
        annualYear: chart.annualYear,
        lunarMonth: leap.lunarMonth,
        isLeapMonth: true,
        monthKey: buildMonthKey(chart.annualYear, leap.lunarMonth, true),
        focusPalaceIndex: leap.focusPalaceIndex,
        calendarStem: leap.calendarStem,
        calendarBranch: leap.calendarBranch,
      };
      if (seenMonthKeys.has(identity.monthKey)) {
        diagnostics.duplicateMonthKeys.push(identity.monthKey);
        continue;
      }
      seenMonthKeys.add(identity.monthKey);

      const monthLocal = { ambiguous: [] as string[], unresolved: [] as string[] };
      const { transformations, partial } = resolveMonthlyTransformations(
        chart,
        identity,
        provider,
        monthLocal,
      );
      diagnostics.ambiguousTransformationTargets.push(...monthLocal.ambiguous);
      diagnostics.unresolvedTransformationTargets.push(...monthLocal.unresolved);

      contexts.push({
        identity,
        transformations,
        transformationsPartial: partial,
        transformationDiagnostics: {
          ambiguous: monthLocal.ambiguous,
          unresolved: monthLocal.unresolved,
        },
      });
    }
  }

  contexts.sort((a, b) => {
    if (a.identity.lunarMonth !== b.identity.lunarMonth) {
      return a.identity.lunarMonth - b.identity.lunarMonth;
    }
    if (a.identity.isLeapMonth !== b.identity.isLeapMonth) {
      return a.identity.isLeapMonth ? ROOT_INDEX_TIEBREAK_LEAP : -1;
    }
    return 0;
  });

  return { contexts, rejected: false };
}
