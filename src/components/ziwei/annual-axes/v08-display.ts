import type {
  AnnualAxisCoverageV08,
  AnnualAxisMatchedStarFactV08,
  AnnualAxisPalaceContributionTraceV08,
} from "@/lib/ziwei/analysis/modules/annual-axes";

export function hasPalaceStarSignal(
  facts: Array<Pick<AnnualAxisMatchedStarFactV08, "polarity">>,
): boolean {
  return facts.some((f) => f.polarity === "positive" || f.polarity === "negative");
}

export function isRelevantCooperatingPalace(
  palace: AnnualAxisPalaceContributionTraceV08,
): boolean {
  if (palace.missingReason) return true;
  if (Math.abs(palace.palaceRaw) > 0) return true;
  return hasPalaceStarSignal(palace.matchedFacts);
}

export function shouldShowCoverage(coverage?: AnnualAxisCoverageV08): boolean {
  if (!coverage) return false;
  if (coverage.missingPalaces.length > 0) return true;
  return coverage.resolvedWeight < coverage.totalWeight - 1e-6;
}

export function formatPalaceStars(
  facts: Array<Pick<AnnualAxisMatchedStarFactV08, "starName" | "points" | "polarity">>,
  polarity: "positive" | "negative",
): string | null {
  const matched = facts.filter((f) => f.polarity === polarity);
  if (matched.length === 0) return null;
  return matched
    .map((f) => {
      const signed = f.points > 0 ? `+${f.points}` : `${f.points}`;
      return `${f.starName} (${signed})`;
    })
    .join(", ");
}
