import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import { loadPalaceOverviewKnowledgeV1 } from "../../knowledge";
import { loadAnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../knowledge/monthly-flow";
import type { DeepReadonly } from "../../knowledge/monthly-flow";
import type { MonthlyFlowScoringKnowledgeV0 } from "../../knowledge/monthly-flow";
import {
  buildAllAnnualDomainFrames,
  type AnnualDomainFrame,
} from "./collect-annual-domain-frames";
import { collectMonthlyFrame } from "./collect-monthly-frame";
import { collectStarEvidence } from "./collect-star-evidence";
import { collectMonthlyTransformationEvidence } from "./collect-monthly-transformation-evidence";
import { collectAnnualContextEvidence } from "./collect-annual-context-evidence";
import { collectMajorContextEvidence } from "./collect-major-context-evidence";
import { collectStructuralEvidence } from "./collect-structural-evidence";
import { detectDisabledRules } from "./detect-disabled-rules";
import { auditEvidenceSources } from "./audit-evidence-sources";
import { aggregateMonthlyEvidence } from "./aggregate";
import { normalizeMonthlyFlowAxes, sumWeightedAxes } from "./normalize";
import {
  dedupeMonthlyFlowMonthDiagnostics,
  dedupeMonthlyFlowYearDiagnostics,
  emptyMonthlyFlowMonthDiagnostics,
  emptyMonthlyFlowYearDiagnostics,
  foldMonthDiagnosticsIntoYear,
} from "./diagnostics";
import {
  resolveAnnualDomainMap,
  type AnnualDomainMap,
} from "./resolve-annual-domain-map";
import { resolveMonthContexts } from "./resolve-month-contexts";
import type {
  ExplicitLeapMonthContext,
  MonthlyCalculationProvider,
  MonthlyFlowAxisResult,
  MonthlyFlowEvidence,
  MonthlyFlowMonthCapabilities,
  MonthlyFlowMonthDiagnostics,
  MonthlyFlowReasonCode,
  MonthlyFlowResult,
  MonthlyFlowVersionProvenance,
  MonthlyFlowYearDiagnostics,
  MonthResult,
  ResolvedMonthlyFlowContext,
} from "./types";
import type { MonthlyFlowResolvedDomainContext } from "./resolve-monthly-flow-annual-domains";

const CONTRACT_VERSION = "0.1.0";
const ENGINE_VERSION = "0.1.2";
const TOP_DRIVER_COUNT = 3;

type MonthlyKnowledge = DeepReadonly<MonthlyFlowScoringKnowledgeV0> | MonthlyFlowScoringKnowledgeV0;

function topDrivers(
  evidence: MonthlyFlowEvidence[],
  axis: "support" | "pressure",
): MonthlyFlowEvidence[] {
  return evidence
    .filter((e) => e.weightedAxes[axis] > 0)
    .sort((a, b) => b.weightedAxes[axis] - a.weightedAxes[axis])
    .slice(0, TOP_DRIVER_COUNT);
}

function unavailableAxisResult(
  domain: AnnualAxisDomain,
  reasonCodes: MonthlyFlowReasonCode[],
): MonthlyFlowAxisResult {
  return {
    domain,
    status: "unavailable",
    score: null,
    band: null,
    evidence: [],
    reasonCodes,
  };
}

function capabilitiesFor(
  school: ZiweiSchool,
  knowledge: MonthlyKnowledge,
): MonthlyFlowMonthCapabilities {
  const profile = knowledge.schoolCapabilities.profiles[school];
  return {
    supportsMonthlyFocus: profile.supportsMonthlyFocus,
    supportsCalendarStemBranch: profile.supportsCalendarStemBranch,
    supportsMonthlyTransformations: profile.supportsMonthlyTransformations,
    supportsSixAxisOverlayFromCurrentChart: profile.supportsSixAxisOverlayFromCurrentChart,
    supportsLeapMonth: profile.supportsLeapMonth,
  };
}

const EMPTY_CAPABILITIES: MonthlyFlowMonthCapabilities = {
  supportsMonthlyFocus: false,
  supportsCalendarStemBranch: false,
  supportsMonthlyTransformations: false,
  supportsSixAxisOverlayFromCurrentChart: false,
  supportsLeapMonth: "unavailable",
};

function versionProvenance(
  monthlyKnowledge: MonthlyKnowledge | null,
): MonthlyFlowVersionProvenance {
  if (!monthlyKnowledge) {
    return {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      scoringKnowledgeVersion: "unavailable",
      capabilityProfileVersion: "unavailable",
      calculationPolicyProfileVersion: null,
    };
  }
  return {
    contractVersion: CONTRACT_VERSION,
    engineVersion: ENGINE_VERSION,
    scoringKnowledgeVersion: `${monthlyKnowledge.scoringProfile.profileId}@${monthlyKnowledge.scoringProfile.schemaVersion}`,
    capabilityProfileVersion: `${monthlyKnowledge.schoolCapabilities.catalogId}@${monthlyKnowledge.schoolCapabilities.schemaVersion}`,
    calculationPolicyProfileVersion: null,
  };
}

function findActivationAxes(
  monthlyKnowledge: MonthlyKnowledge,
): { support: 0; pressure: 0; stability: 0; activation: number } {
  const focusMarker = monthlyKnowledge.focusMarkers.records.find(
    (r) => r.frameRole === "focus",
  );
  return {
    support: 0,
    pressure: 0,
    stability: 0,
    activation: focusMarker ? focusMarker.axes.activation : 0,
  };
}

function scoreOneDomain(
  chart: ChartData,
  context: ResolvedMonthlyFlowContext,
  domain: AnnualAxisDomain,
  monthlyFrame: ReturnType<typeof collectMonthlyFrame>,
  domainFrame: AnnualDomainFrame | undefined,
  monthlyKnowledge: MonthlyKnowledge,
  annualKnowledge: Parameters<typeof collectAnnualContextEvidence>[0]["annualMutagenImpact"] extends never
    ? never
    : {
        mutagenImpact: Parameters<typeof collectAnnualContextEvidence>[0]["annualMutagenImpact"];
      },
  numericKnowledge: Parameters<typeof collectAnnualContextEvidence>[0]["numericKnowledge"],
  supportsMajorTransformations: boolean,
  monthDiagnostics: MonthlyFlowMonthDiagnostics,
): MonthlyFlowAxisResult {
  if (!monthlyFrame) return unavailableAxisResult(domain, ["missing-monthly-frame-nodes"]);
  if (!domainFrame) return unavailableAxisResult(domain, ["missing-frame-nodes"]);

  const activationAxes = findActivationAxes(monthlyKnowledge);

  const candidates: MonthlyFlowEvidence[] = [
    ...collectStarEvidence({
      chart,
      domain,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      numericKnowledge,
      monthDiagnostics,
    }),
    ...collectMonthlyTransformationEvidence({
      chart,
      domain,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      transformations: context.transformations,
      impactCatalog: monthlyKnowledge.transformationImpact,
    }),
    ...collectAnnualContextEvidence({
      chart,
      domain,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      numericKnowledge,
      annualMutagenImpact: annualKnowledge.mutagenImpact,
      monthDiagnostics,
    }),
    ...collectMajorContextEvidence({
      chart,
      domain,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      supportsMajorTransformations,
      annualMutagenImpact: annualKnowledge.mutagenImpact,
      activePalaceActivationAxes: activationAxes,
    }),
    ...collectStructuralEvidence({
      domain,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: domainFrame,
      focusMarkers: monthlyKnowledge.focusMarkers,
    }),
  ];

  const evidence = aggregateMonthlyEvidence({
    candidates,
    profile: monthlyKnowledge.scoringProfile,
    monthDiagnostics,
  });

  const rawAxes = sumWeightedAxes(evidence);
  const normalized = normalizeMonthlyFlowAxes(rawAxes, monthlyKnowledge.scoringProfile);

  return {
    domain,
    status: "available",
    score: normalized.score,
    band: normalized.band,
    rawAxes,
    normalizedAxes: normalized.normalizedAxes,
    intensity: normalized.intensity,
    conflict: normalized.conflict,
    evidence,
    topSupportDrivers: topDrivers(evidence, "support"),
    topPressureDrivers: topDrivers(evidence, "pressure"),
  };
}

function scoreMonth(
  chart: ChartData,
  context: ResolvedMonthlyFlowContext,
  domainFrames: Map<AnnualAxisDomain, AnnualDomainFrame>,
  hasDomainMap: boolean,
  monthlyKnowledge: MonthlyKnowledge,
  annualKnowledge: Parameters<typeof scoreOneDomain>[6],
  numericKnowledge: Parameters<typeof scoreOneDomain>[7],
  supportsMajorTransformations: boolean,
  yearDiagnostics: MonthlyFlowYearDiagnostics,
): MonthResult {
  const monthDiagnostics = emptyMonthlyFlowMonthDiagnostics();
  const monthKey = context.identity.monthKey;

  monthDiagnostics.ambiguousTransformationTargets.push(
    ...context.transformationDiagnostics.ambiguous,
  );
  monthDiagnostics.unresolvedTransformationTargets.push(
    ...context.transformationDiagnostics.unresolved,
  );

  const monthlyFrame = collectMonthlyFrame({
    chart,
    focusPalaceIndex: context.identity.focusPalaceIndex,
    monthKey,
    geometry: monthlyKnowledge.domainDefinitions.monthlyActivationFrame,
    onMissingNode: (detail) => monthDiagnostics.missingMonthlyFrameNodes.push(detail),
  });

  detectDisabledRules({
    chart,
    monthKey,
    monthlyTransformations: context.transformations,
    interactionRules: monthlyKnowledge.interactionRules,
    calendarRelations: monthlyKnowledge.calendarRelations,
    monthDiagnostics,
  });

  const axes = {} as Record<AnnualAxisDomain, MonthlyFlowAxisResult>;
  const statuses: Array<"available" | "unavailable"> = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!hasDomainMap) {
      axes[domain] = unavailableAxisResult(domain, ["incomplete-annual-domain-map"]);
      statuses.push("unavailable");
      continue;
    }
    const result = scoreOneDomain(
      chart,
      context,
      domain,
      monthlyFrame,
      domainFrames.get(domain),
      monthlyKnowledge,
      annualKnowledge,
      numericKnowledge,
      supportsMajorTransformations,
      monthDiagnostics,
    );
    axes[domain] = result;
    statuses.push(result.status);
  }

  let monthStatus: MonthResult["status"] =
    statuses.every((s) => s === "available")
      ? "available"
      : statuses.every((s) => s === "unavailable")
        ? "unavailable"
        : "partial";

  // Incomplete provider Tứ Hóa resolution keeps fully-resolved evidence but
  // the month must not report available.
  if (context.transformationsPartial && monthStatus === "available") {
    monthStatus = "partial";
  }

  foldMonthDiagnosticsIntoYear(monthDiagnostics, yearDiagnostics);

  return {
    identity: context.identity,
    status: monthStatus,
    axes,
    diagnostics: dedupeMonthlyFlowMonthDiagnostics(monthDiagnostics),
  };
}

/**
 * Year-level status.
 *
 * - available: all twelve regular months M01..M12 exist and every regular
 *   month result is available (leap months, if any, do not block this);
 * - partial: at least one month is scoreable (available or partial) but a
 *   regular month is missing, duplicated, rejected, partial, or unavailable;
 * - unavailable: no month is scoreable.
 */
export function resolveYearStatus(
  months: readonly MonthResult[],
  diagnostics: MonthlyFlowYearDiagnostics,
): "available" | "partial" | "unavailable" {
  const scoreable = months.filter((m) => m.status !== "unavailable");
  if (scoreable.length === 0) return "unavailable";

  const regular = months.filter((m) => !m.identity.isLeapMonth);
  const regularMonths = new Set(regular.map((m) => m.identity.lunarMonth));
  const hasAllTwelveRegular =
    regular.length === 12 &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((m) => regularMonths.has(m));
  const allRegularAvailable =
    hasAllTwelveRegular && regular.every((m) => m.status === "available");
  const incompleteRegularSet =
    diagnostics.missingMonthlyEntries.length > 0 ||
    diagnostics.duplicateMonthKeys.length > 0 ||
    !hasAllTwelveRegular;

  if (allRegularAvailable && !incompleteRegularSet) return "available";
  return "partial";
}

/**
 * Public entry point — deterministic Monthly Flow six-axis scoring for
 * one chart + school + year. Never mutates `chart` or the loaded
 * knowledge. Never reads previous-module scores and never calls into the
 * Lộc Tồn index resolver. Interactions/calendar relations/moving stars
 * are all disabled in V0 and never emit evidence.
 */
export function analyzeMonthlyFlow(
  chart: ChartData,
  options: {
    school: ZiweiSchool;
    provider: MonthlyCalculationProvider;
    yearInCycle?: number;
    explicitLeapContexts?: readonly ExplicitLeapMonthContext[];
    /**
     * Primary-domain compatibility map from
     * `resolveMonthlyFlowAnnualDomains` (approved school-aware Annual Axes
     * resolver). Production callers must obtain this via the adapter — do
     * not invent ad-hoc palace→domain maps.
     */
    explicitAnnualDomainMap?: ReadonlyMap<number, AnnualAxisDomain>;
    /**
     * Full school-resolved domain context (primary map + focus anchors).
     * Production must supply this; when present, frames never use the
     * lowest-palace-index focus fallback.
     */
    resolvedDomainContext?: MonthlyFlowResolvedDomainContext;
  },
): MonthlyFlowResult {
  const {
    school,
    provider,
    explicitLeapContexts,
    explicitAnnualDomainMap,
    resolvedDomainContext,
  } = options;
  const yearDiagnostics = emptyMonthlyFlowYearDiagnostics();

  yearDiagnostics.missingCalculationPolicyProfile.push(
    "chart:no-calculation-policy-profile-version",
  );

  const monthlyKnowledgeResult = loadMonthlyFlowScoringKnowledgeV0();
  if (!monthlyKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...monthlyKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(null),
      status: "unavailable",
      months: [],
      capabilities: EMPTY_CAPABILITIES,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const monthlyKnowledge = monthlyKnowledgeResult.knowledge;
  const capabilities = capabilitiesFor(school, monthlyKnowledge);

  const annualKnowledgeResult = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...annualKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const annualKnowledge = annualKnowledgeResult.knowledge;

  const numericKnowledgeResult = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...numericKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const numericKnowledge = numericKnowledgeResult.knowledge;

  const majorKnowledgeResult = loadMajorFortuneScoringKnowledgeV0();
  if (!majorKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...majorKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const majorKnowledge = majorKnowledgeResult.knowledge;
  const supportsMajorTransformationsForSchool =
    majorKnowledge.schoolCapabilities.profiles[school].supportsMajorFortuneTransformations;

  const { contexts, rejected } = resolveMonthContexts({
    chart,
    school,
    provider,
    explicitLeapContexts,
    diagnostics: yearDiagnostics,
  });
  if (rejected) {
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }

  const domainMap: AnnualDomainMap | null = resolveAnnualDomainMap({
    chart,
    axisDefinitions: annualKnowledge.axisDefinitions,
    explicitAnnualDomainMap:
      resolvedDomainContext?.primaryDomainByPalaceIndex ?? explicitAnnualDomainMap,
    diagnostics: yearDiagnostics,
  });

  if (resolvedDomainContext) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      if (!resolvedDomainContext.focusPalaceIndexByDomain.has(domain)) {
        yearDiagnostics.missingFocusAnchor.push(`domain:${domain}`);
      }
    }
  }

  const domainFrames = domainMap
    ? buildAllAnnualDomainFrames(
        domainMap,
        chart,
        annualKnowledge.axisDefinitions,
        monthlyKnowledge.domainDefinitions.annualDomainFrame,
        yearDiagnostics,
        resolvedDomainContext?.focusPalaceIndexByDomain ?? null,
      )
    : new Map<AnnualAxisDomain, AnnualDomainFrame>();

  // When production supplies resolvedDomainContext but frames are incomplete,
  // fail closed — do not score with partial/wrong focus.
  if (
    resolvedDomainContext &&
    domainMap &&
    (yearDiagnostics.missingFocusAnchor.length > 0 ||
      yearDiagnostics.focusAnchorDomainMismatch.length > 0 ||
      domainFrames.size !== ANNUAL_AXIS_DOMAINS.length)
  ) {
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }

  if (!capabilities.supportsSixAxisOverlayFromCurrentChart && !explicitAnnualDomainMap) {
    yearDiagnostics.unsupportedSchoolCapability.push(`${school}:six-axis-overlay`);
  }

  const monthResults: MonthResult[] = [];
  for (const context of contexts) {
    const result = scoreMonth(
      chart,
      context,
      domainFrames,
      Boolean(domainMap),
      monthlyKnowledge,
      { mutagenImpact: annualKnowledge.mutagenImpact },
      numericKnowledge,
      supportsMajorTransformationsForSchool,
      yearDiagnostics,
    );
    monthResults.push(result);
  }

  for (const month of monthResults) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = month.axes[domain];
      if (axis.status !== "available") continue;
      auditEvidenceSources(
        axis.evidence,
        {
          monthlyKnowledge,
          palaceKnowledge: numericKnowledge,
          annualKnowledge,
          majorFortuneKnowledge: majorKnowledge,
        },
        month.diagnostics,
      );
    }
  }

  for (const month of monthResults) {
    for (const entry of month.diagnostics.missingSourceIds) {
      yearDiagnostics.missingSourceIds.push(entry);
    }
  }

  const status = resolveYearStatus(monthResults, yearDiagnostics);

  return {
    module: "monthly-flow",
    annualYear: chart.annualYear,
    school,
    versions: versionProvenance(monthlyKnowledge),
    status,
    months: monthResults,
    capabilities,
    diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
  };
}
