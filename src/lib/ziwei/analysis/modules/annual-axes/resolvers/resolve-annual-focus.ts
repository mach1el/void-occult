import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import type { ResolvedAnnualFocus, AnnualFocusResolutionIssues } from "./types";

export interface ResolveAnnualFocusOutput {
  focus: ResolvedAnnualFocus | null;
  issues: AnnualFocusResolutionIssues;
}

/**
 * Resolve the school's primary annual **head** palace (V0.3):
 *  - Nam Phái  → `chart.annualHeadPalace` (Lưu Tiểu Hạn / one-year palace
 *    inside the active Major Fortune decade). Falls back once to a unique
 *    `isLuuNienDaiVan` palace and emits a diagnostic when the explicit
 *    pointer is absent. Never uses `smallLimitPalace` as primary.
 *  - Trung Châu → the physical palace whose `annualPalaceName === "Mệnh"`.
 *
 * Returns `focus: null` when the chart is missing the school's required
 * anchor, with the corresponding flags set on `issues`.
 */
export function resolveAnnualFocus(
  chart: ChartData,
  school: ZiweiSchool,
): ResolveAnnualFocusOutput {
  const issues: AnnualFocusResolutionIssues = {
    missingAnnualHeadPalace: false,
    duplicateAnnualHeadPalaces: false,
    annualHeadPointerFlagMismatch: false,
    missingSmallLimitPalace: false,
    invalidAnnualFocusPalace: false,
  };

  if (school === "nam-phai") {
    return resolveNamPhaiAnnualHead(chart, issues);
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

function resolveNamPhaiAnnualHead(
  chart: ChartData,
  issues: AnnualFocusResolutionIssues,
): ResolveAnnualFocusOutput {
  const flagged = chart.palaces.filter((p) => p.isLuuNienDaiVan === true);
  if (flagged.length > 1) {
    issues.duplicateAnnualHeadPalaces = true;
    issues.invalidAnnualFocusPalace = true;
    return { focus: null, issues };
  }

  const explicit = chart.annualHeadPalace;
  if (explicit) {
    const palace = chart.palaces.find((p) => p.index === explicit.index);
    if (!palace) {
      issues.invalidAnnualFocusPalace = true;
      return { focus: null, issues };
    }
    if (flagged.length === 1 && flagged[0]!.index !== palace.index) {
      issues.annualHeadPointerFlagMismatch = true;
    }
    return {
      focus: {
        mode: "annual-major-fortune",
        palaceIndex: palace.index,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        annualPalaceName: palace.annualPalaceName ?? null,
      },
      issues,
    };
  }

  // Migration-only fallback: unique isLuuNienDaiVan flag.
  issues.missingAnnualHeadPalace = true;
  if (flagged.length === 0) {
    issues.invalidAnnualFocusPalace = true;
    return { focus: null, issues };
  }
  const palace = flagged[0]!;
  return {
    focus: {
      mode: "annual-major-fortune",
      palaceIndex: palace.index,
      palaceName: palace.name,
      palaceBranch: palace.branch,
      annualPalaceName: palace.annualPalaceName ?? null,
    },
    issues,
  };
}
