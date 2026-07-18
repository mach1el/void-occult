import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import type { ResolvedAnnualFocus, AnnualFocusResolutionIssues } from "./types";

export interface ResolveAnnualFocusOutput {
  focus: ResolvedAnnualFocus | null;
  issues: AnnualFocusResolutionIssues;
}

/**
 * Resolve the school's primary annual focus palace:
 *  - Nam Phái  → `chart.smallLimitPalace` (Tiểu Hạn palace);
 *  - Trung Châu → the physical palace whose `annualPalaceName === "Mệnh"`.
 *
 * Both resolutions are activation-overlay inputs only — the focus never
 * independently supplies support/pressure to a domain axis (see
 * `collect-annual-focus-evidence.ts`). Returns `focus: null` when the
 * chart is missing the school's required anchor, with the corresponding
 * flag set on `issues` so the caller can raise a diagnostic.
 */
export function resolveAnnualFocus(
  chart: ChartData,
  school: ZiweiSchool,
): ResolveAnnualFocusOutput {
  const issues: AnnualFocusResolutionIssues = {
    missingSmallLimitPalace: false,
    invalidAnnualFocusPalace: false,
  };

  if (school === "nam-phai") {
    const smallLimit = chart.smallLimitPalace;
    if (!smallLimit) {
      issues.missingSmallLimitPalace = true;
      return { focus: null, issues };
    }
    // Fresh lookup by index guards against a caller passing a stale palace
    // ref that has diverged from the chart's `palaces` array.
    const palace = chart.palaces.find((p) => p.index === smallLimit.index);
    if (!palace) {
      issues.invalidAnnualFocusPalace = true;
      return { focus: null, issues };
    }
    return {
      focus: {
        mode: "small-limit",
        palaceIndex: palace.index,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        annualPalaceName: palace.annualPalaceName ?? null,
      },
      issues,
    };
  }

  // trung-chau
  const menhAnnual = chart.palaces.find((p) => p.annualPalaceName === "Mệnh");
  if (!menhAnnual) {
    issues.invalidAnnualFocusPalace = true;
    return { focus: null, issues };
  }
  return {
    focus: {
      mode: "annual-menh",
      palaceIndex: menhAnnual.index,
      palaceName: menhAnnual.name,
      palaceBranch: menhAnnual.branch,
      annualPalaceName: menhAnnual.annualPalaceName ?? "Mệnh",
    },
    issues,
  };
}
