import {
  emptyMonthlyFlowMonthDiagnostics,
  emptyMonthlyFlowYearDiagnostics,
  type MonthlyFlowMonthDiagnostics,
  type MonthlyFlowYearDiagnostics,
} from "./types";

export { emptyMonthlyFlowMonthDiagnostics, emptyMonthlyFlowYearDiagnostics };

const dedupeSorted = (values: string[]): string[] => Array.from(new Set(values)).sort();

export function dedupeMonthlyFlowMonthDiagnostics(
  diagnostics: MonthlyFlowMonthDiagnostics,
): MonthlyFlowMonthDiagnostics {
  return {
    missingFocusPalace: dedupeSorted(diagnostics.missingFocusPalace),
    missingCalendarStemBranch: dedupeSorted(diagnostics.missingCalendarStemBranch),
    missingMonthlyFrameNodes: dedupeSorted(diagnostics.missingMonthlyFrameNodes),
    ambiguousTransformationTargets: dedupeSorted(diagnostics.ambiguousTransformationTargets),
    unresolvedTransformationTargets: dedupeSorted(diagnostics.unresolvedTransformationTargets),
    unknownStars: dedupeSorted(diagnostics.unknownStars),
    duplicatePhysicalFacts: dedupeSorted(diagnostics.duplicatePhysicalFacts),
    disabledInteractionHits: dedupeSorted(diagnostics.disabledInteractionHits),
    disabledCalendarRelationHits: dedupeSorted(diagnostics.disabledCalendarRelationHits),
    missingSourceIds: dedupeSorted(diagnostics.missingSourceIds),
  };
}

export function dedupeMonthlyFlowYearDiagnostics(
  diagnostics: MonthlyFlowYearDiagnostics,
): MonthlyFlowYearDiagnostics {
  return {
    invalidKnowledge: dedupeSorted(diagnostics.invalidKnowledge),
    providerSchoolMismatch: dedupeSorted(diagnostics.providerSchoolMismatch),
    missingMonthlyEntries: dedupeSorted(diagnostics.missingMonthlyEntries),
    duplicateMonthKeys: dedupeSorted(diagnostics.duplicateMonthKeys),
    invalidMonthNumber: dedupeSorted(diagnostics.invalidMonthNumber),
    missingFocusPalace: dedupeSorted(diagnostics.missingFocusPalace),
    missingCalendarStemBranch: dedupeSorted(diagnostics.missingCalendarStemBranch),
    missingMonthlyFrameNodes: dedupeSorted(diagnostics.missingMonthlyFrameNodes),
    incompleteAnnualDomainLabels: dedupeSorted(diagnostics.incompleteAnnualDomainLabels),
    duplicateAnnualDomainLabels: dedupeSorted(diagnostics.duplicateAnnualDomainLabels),
    unknownStars: dedupeSorted(diagnostics.unknownStars),
    ambiguousTransformationTargets: dedupeSorted(diagnostics.ambiguousTransformationTargets),
    unresolvedTransformationTargets: dedupeSorted(diagnostics.unresolvedTransformationTargets),
    forbiddenPreviousScores: dedupeSorted(diagnostics.forbiddenPreviousScores),
    forbiddenMovingStarInputs: dedupeSorted(diagnostics.forbiddenMovingStarInputs),
    duplicatePhysicalFacts: dedupeSorted(diagnostics.duplicatePhysicalFacts),
    disabledInteractionHits: dedupeSorted(diagnostics.disabledInteractionHits),
    disabledCalendarRelationHits: dedupeSorted(diagnostics.disabledCalendarRelationHits),
    missingSourceIds: dedupeSorted(diagnostics.missingSourceIds),
    missingCalculationPolicyProfile: dedupeSorted(diagnostics.missingCalculationPolicyProfile),
    unsupportedSchoolCapability: dedupeSorted(diagnostics.unsupportedSchoolCapability),
    leapMonthPolicyUnavailable: dedupeSorted(diagnostics.leapMonthPolicyUnavailable),
    missingFocusAnchor: dedupeSorted(diagnostics.missingFocusAnchor),
    focusAnchorDomainMismatch: dedupeSorted(diagnostics.focusAnchorDomainMismatch),
    productionFocusFallbackUsed: dedupeSorted(diagnostics.productionFocusFallbackUsed),
  };
}

export function foldMonthDiagnosticsIntoYear(
  monthDiag: MonthlyFlowMonthDiagnostics,
  yearDiag: MonthlyFlowYearDiagnostics,
): void {
  yearDiag.missingFocusPalace.push(...monthDiag.missingFocusPalace);
  yearDiag.missingCalendarStemBranch.push(...monthDiag.missingCalendarStemBranch);
  yearDiag.missingMonthlyFrameNodes.push(...monthDiag.missingMonthlyFrameNodes);
  yearDiag.ambiguousTransformationTargets.push(...monthDiag.ambiguousTransformationTargets);
  yearDiag.unresolvedTransformationTargets.push(...monthDiag.unresolvedTransformationTargets);
  yearDiag.unknownStars.push(...monthDiag.unknownStars);
  yearDiag.duplicatePhysicalFacts.push(...monthDiag.duplicatePhysicalFacts);
  yearDiag.disabledInteractionHits.push(...monthDiag.disabledInteractionHits);
  yearDiag.disabledCalendarRelationHits.push(...monthDiag.disabledCalendarRelationHits);
  yearDiag.missingSourceIds.push(...monthDiag.missingSourceIds);
}
