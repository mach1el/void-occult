/**
 * Production UI projection — never exposes health domain scores.
 * Internal engine still scores six domains; this layer filters for display.
 */
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { MonthlyFlowMonthSummary } from "./month-summaries";

/** Domains allowed in production UI (AGENTS.md: no Health prognosis). */
export const MONTHLY_FLOW_VISIBLE_DOMAINS = [
  "family",
  "wealth",
  "career",
  "social",
  "romance",
] as const;

export type MonthlyFlowVisibleDomain = (typeof MONTHLY_FLOW_VISIBLE_DOMAINS)[number];

export const MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT = MONTHLY_FLOW_VISIBLE_DOMAINS.length;

export interface MonthlyFlowVisibleMonthProjection {
  monthKey: string;
  lunarMonth: number;
  isLeapMonth: boolean;
  status: "available" | "partial" | "unavailable";

  visibleCompositeScore: number | null;
  visibleAxisCount: number;
  visibleAxisCoverage: number;

  visibleDomainScores: Partial<Record<MonthlyFlowVisibleDomain, number>>;
  visibleStrongestDomain: MonthlyFlowVisibleDomain | null;
  visibleWeakestDomain: MonthlyFlowVisibleDomain | null;

  /** Underlying engine summary (may still contain health internally). */
  summary: MonthlyFlowMonthSummary;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function isMonthlyFlowVisibleDomain(
  domain: AnnualAxisDomain,
): domain is MonthlyFlowVisibleDomain {
  return (MONTHLY_FLOW_VISIBLE_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Project one month summary onto the five visible domains only.
 * Does not mutate the engine summary; never feeds scores back into scoring.
 */
export function projectVisibleMonthSummary(
  summary: MonthlyFlowMonthSummary,
): MonthlyFlowVisibleMonthProjection {
  const visibleDomainScores: Partial<Record<MonthlyFlowVisibleDomain, number>> = {};
  const available: Array<{ domain: MonthlyFlowVisibleDomain; score: number }> = [];

  for (const domain of MONTHLY_FLOW_VISIBLE_DOMAINS) {
    const axis = summary.result.axes[domain];
    if (axis.status === "available" && axis.score != null) {
      visibleDomainScores[domain] = axis.score;
      available.push({ domain, score: axis.score });
    }
  }

  if (summary.status === "unavailable" || available.length === 0) {
    return {
      monthKey: summary.monthKey,
      lunarMonth: summary.lunarMonth,
      isLeapMonth: summary.isLeapMonth,
      status: summary.status,
      visibleCompositeScore: null,
      visibleAxisCount: available.length,
      visibleAxisCoverage: available.length / MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT,
      visibleDomainScores,
      visibleStrongestDomain: null,
      visibleWeakestDomain: null,
      summary,
    };
  }

  const mean = available.reduce((sum, a) => sum + a.score, 0) / available.length;
  const sorted = [...available].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.domain < b.domain ? -1 : a.domain > b.domain ? 1 : 0;
  });

  return {
    monthKey: summary.monthKey,
    lunarMonth: summary.lunarMonth,
    isLeapMonth: summary.isLeapMonth,
    status: summary.status,
    visibleCompositeScore: round1(mean),
    visibleAxisCount: available.length,
    visibleAxisCoverage: available.length / MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT,
    visibleDomainScores,
    visibleStrongestDomain: sorted[0]?.domain ?? null,
    visibleWeakestDomain: sorted[sorted.length - 1]?.domain ?? null,
    summary,
  };
}

export function projectVisibleMonthSummaries(
  summaries: readonly MonthlyFlowMonthSummary[],
): MonthlyFlowVisibleMonthProjection[] {
  return summaries.map(projectVisibleMonthSummary);
}
