import { emptyAnnualAxesDiagnostics, type AnnualAxesDiagnostics } from "./types";

export { emptyAnnualAxesDiagnostics };

/** Collapse duplicate diagnostic entries accumulated across the six domains
 * into a stable, deterministically ordered list per field. */
export function dedupeAnnualAxesDiagnostics(diagnostics: AnnualAxesDiagnostics): AnnualAxesDiagnostics {
  const dedupeSorted = (values: string[]): string[] => Array.from(new Set(values)).sort();

  return {
    invalidKnowledge: dedupeSorted(diagnostics.invalidKnowledge),
    missingAnnualPalaceNames: dedupeSorted(diagnostics.missingAnnualPalaceNames),
    unresolvedAnnualTargets: dedupeSorted(diagnostics.unresolvedAnnualTargets),
    unknownStars: dedupeSorted(diagnostics.unknownStars),
    unknownMutagens: dedupeSorted(diagnostics.unknownMutagens),
    forbiddenSchoolMarkers: dedupeSorted(diagnostics.forbiddenSchoolMarkers),
    duplicatePhysicalFacts: dedupeSorted(diagnostics.duplicatePhysicalFacts),
    disabledInteractionHits: dedupeSorted(diagnostics.disabledInteractionHits),
    missingSourceIds: dedupeSorted(diagnostics.missingSourceIds),
    missingRequiredAnnualFacts: dedupeSorted(diagnostics.missingRequiredAnnualFacts),
    incompleteChartPalaces: dedupeSorted(diagnostics.incompleteChartPalaces),
    duplicateNatalPalaceNames: dedupeSorted(diagnostics.duplicateNatalPalaceNames),
    missingDomainAnchor: dedupeSorted(diagnostics.missingDomainAnchor),
    ambiguousDomainAnchor: dedupeSorted(diagnostics.ambiguousDomainAnchor),
    missingAnnualHeadPalace: dedupeSorted(diagnostics.missingAnnualHeadPalace),
    duplicateAnnualHeadPalaces: dedupeSorted(diagnostics.duplicateAnnualHeadPalaces),
    annualHeadPointerFlagMismatch: dedupeSorted(diagnostics.annualHeadPointerFlagMismatch),
    missingSmallLimitPalace: dedupeSorted(diagnostics.missingSmallLimitPalace),
    invalidAnnualFocusPalace: dedupeSorted(diagnostics.invalidAnnualFocusPalace),
    missingAnnualFocusFrameNodes: dedupeSorted(diagnostics.missingAnnualFocusFrameNodes),
    unsupportedSchoolPolicy: dedupeSorted(diagnostics.unsupportedSchoolPolicy),
    invalidAnnualHeadFrame: dedupeSorted(diagnostics.invalidAnnualHeadFrame),
    routingOutOfRange: dedupeSorted(diagnostics.routingOutOfRange),
    duplicatePhysicalFactBlend: dedupeSorted(diagnostics.duplicatePhysicalFactBlend),
    natalEvidenceMissingTriggers: dedupeSorted(diagnostics.natalEvidenceMissingTriggers),
    domainFrameOvercoverage: dedupeSorted(diagnostics.domainFrameOvercoverage),
  };
}
