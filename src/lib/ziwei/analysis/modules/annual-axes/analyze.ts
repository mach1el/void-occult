import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import { loadPalaceOverviewKnowledgeV1 } from "../../knowledge";
import {
  loadAnnualAxesKnowledgeV0,
  type AnnualAxesKnowledgeV0,
} from "../../knowledge/annual-axes";
import { collectDomainAnchorFrames } from "./collect-domain-frames";
import { collectStarEvidence } from "./collect-star-evidence";
import { collectMutagenEvidence } from "./collect-mutagen-evidence";
import { collectFocalEvidence } from "./collect-focal-evidence";
import { aggregateDomainEvidence } from "./aggregate";
import { sumWeightedAxes, normalizeAnnualAxes } from "./normalize";
import { dedupeAnnualAxesDiagnostics, emptyAnnualAxesDiagnostics } from "./diagnostics";
import { selectResolver, resolveAnnualFocus } from "./resolvers";
import type { ResolvedAnnualDomainAnchors, ResolvedAnnualFocus } from "./resolvers/types";
import {
  type AnnualAxesCapabilities,
  type AnnualAxesDiagnostics,
  type AnnualAxesResult,
  type AnnualAxisEvidence,
  type AnnualAxisResult,
  type AnnualFocusSummary,
} from "./types";

const CONTRACT_VERSION = "0.2.0";
const ENGINE_VERSION = "0.2.0";
const TOP_DRIVER_COUNT = 3;

function topDrivers(
  evidence: AnnualAxisEvidence[],
  axis: "support" | "pressure",
): AnnualAxisEvidence[] {
  return evidence
    .filter((e) => e.weightedAxes[axis] > 0)
    .sort((a, b) => b.weightedAxes[axis] - a.weightedAxes[axis])
    .slice(0, TOP_DRIVER_COUNT);
}

function unavailableAxisResult(domain: AnnualAxisDomain, reasonCodes: string[]): AnnualAxisResult {
  return {
    domain,
    status: "unavailable",
    score: null,
    band: null,
    evidence: [],
    reasonCodes,
  };
}

/** Derives the module-level status from each domain's own availability —
 * all available → available; all unavailable → unavailable; any mix →
 * partial. Exported for direct unit testing without forcing a real
 * mixed-availability chart end-to-end. */
export function resolveModuleStatus(
  domainStatuses: Array<"available" | "unavailable">,
): "available" | "partial" | "unavailable" {
  if (domainStatuses.every((s) => s === "available")) return "available";
  if (domainStatuses.every((s) => s === "unavailable")) return "unavailable";
  return "partial";
}

function invalidKnowledgeResult(
  school: ZiweiSchool,
  annualYear: number,
  diagnostics: AnnualAxesDiagnostics,
): AnnualAxesResult {
  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;
  for (const domain of ANNUAL_AXIS_DOMAINS) axes[domain] = unavailableAxisResult(domain, ["invalid-knowledge"]);

  const capabilities: AnnualAxesCapabilities = {
    supportsDomainScoring: false,
    supportsAnnualFocus: false,
    // Coordinate/provenance are unknown when knowledge fails to load; fall
    // back to the school-neutral value that the resolver would have used.
    domainAnchorCoordinate: school === "trung-chau" ? "annual-palace-name" : "natal-palace-name",
    domainAnchorProvenance:
      school === "trung-chau" ? "trung-chau-annual-palace-name" : "nam-phai-natal-domain-anchor",
    primaryAnnualFocus: school === "trung-chau" ? "annual-menh" : "small-limit",
  };

  return {
    module: "annual-axes",
    annualYear,
    school,
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion: "unavailable",
    },
    status: "unavailable",
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus: null,
  };
}

function capabilitiesFor(
  school: ZiweiSchool,
  annualKnowledge: AnnualAxesKnowledgeV0,
  domainAnchors: ResolvedAnnualDomainAnchors,
  focus: ResolvedAnnualFocus | null,
  domainStatuses: Array<"available" | "unavailable">,
): AnnualAxesCapabilities {
  const policyProfile = annualKnowledge.schoolDomainPolicy.profiles[school];
  const supportsDomainScoring = domainStatuses.some((s) => s === "available");
  return {
    supportsDomainScoring,
    supportsAnnualFocus: focus !== null,
    domainAnchorCoordinate: policyProfile.domainAnchorCoordinate,
    domainAnchorProvenance:
      domainAnchors.provenance || policyProfile.domainAnchorProvenance,
    primaryAnnualFocus: policyProfile.primaryAnnualFocus,
  };
}

function hasAnnualStructure(chart: ChartData, school: ZiweiSchool): boolean {
  if (school === "nam-phai") {
    // Nam Phái reads natal palace names directly — a 12-palace chart with
    // populated names is enough structure to score. The chart's own
    // annual layer (mutagens/stars/small-limit) is a *separate* input
    // that individual collectors handle themselves.
    return chart.palaces.length === 12;
  }
  return Boolean(chart.annualPalace) || Boolean(chart.annualStars && chart.annualStars.length > 0);
}

/**
 * Public entry point — deterministic annual axes scoring for one chart +
 * school + annual year. Never mutates `chart` or the loaded knowledge.
 */
export function analyzeAnnualAxes(chart: ChartData, options: { school: ZiweiSchool }): AnnualAxesResult {
  const { school } = options;
  const diagnostics = emptyAnnualAxesDiagnostics();

  const annualKnowledgeResult = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...annualKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return invalidKnowledgeResult(school, chart.annualYear, diagnostics);
  }
  const annualKnowledge = annualKnowledgeResult.knowledge;

  const numericKnowledgeResult = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...numericKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return invalidKnowledgeResult(school, chart.annualYear, diagnostics);
  }
  const numericKnowledge = numericKnowledgeResult.knowledge;

  const policyProfile = annualKnowledge.schoolDomainPolicy.profiles[school];
  if (!policyProfile) {
    diagnostics.unsupportedSchoolPolicy.push(school);
    return invalidKnowledgeResult(school, chart.annualYear, diagnostics);
  }

  if (!hasAnnualStructure(chart, school)) {
    diagnostics.missingRequiredAnnualFacts.push("chart:annual-structure");
    // No early return — every domain below will naturally resolve zero
    // frames and go unavailable, and the module status falls out of the
    // generic per-domain aggregation at the end.
  }

  // School-specific anchor resolution — Nam Phái matches natal palace
  // names, Trung Châu matches annual "trùng bài" labels. Diagnostics from
  // the resolver are hoisted verbatim into the main diagnostics object.
  const resolver = selectResolver(school);
  const domainAnchors = resolver.resolve(chart, annualKnowledge.axisDefinitions);
  diagnostics.incompleteChartPalaces.push(...domainAnchors.diagnostics.incompleteChartPalaces);
  diagnostics.duplicateNatalPalaceNames.push(
    ...domainAnchors.diagnostics.duplicateNatalPalaceNames,
  );
  diagnostics.missingDomainAnchor.push(...domainAnchors.diagnostics.missingDomainAnchor);
  diagnostics.ambiguousDomainAnchor.push(...domainAnchors.diagnostics.ambiguousDomainAnchor);

  // Annual focus resolution — Nam Phái = Tiểu Hạn, Trung Châu = annual
  // Mệnh. The activation-only overlay itself is applied in Commit 2 via
  // `collect-annual-focus-evidence.ts`; here we resolve the palace so
  // downstream code (and the UI) can read the focus summary regardless.
  const focusResolution = resolveAnnualFocus(chart, school);
  if (focusResolution.issues.missingSmallLimitPalace) {
    diagnostics.missingSmallLimitPalace.push("chart:smallLimitPalace");
  }
  if (focusResolution.issues.invalidAnnualFocusPalace) {
    diagnostics.invalidAnnualFocusPalace.push(`${school}:focus-palace`);
  }

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;

  for (const domainDefinition of annualKnowledge.axisDefinitions.domains) {
    const domain = domainDefinition.domain;
    const resolvedAnchors = domainAnchors.anchorsByDomain.get(domain) ?? [];
    const frames = collectDomainAnchorFrames(chart, domain, resolvedAnchors, diagnostics);

    if (frames.length === 0) {
      diagnostics.missingRequiredAnnualFacts.push(domain);
      axes[domain] = unavailableAxisResult(domain, ["missing-required-annual-facts"]);
      continue;
    }

    const candidates: AnnualAxisEvidence[] = [
      ...collectStarEvidence({ chart, domain, frames, numericKnowledge, annualKnowledge, diagnostics }),
      ...collectMutagenEvidence({ chart, domain, frames, annualKnowledge, diagnostics }),
      ...collectFocalEvidence({ chart, domain, frames, school, annualKnowledge, diagnostics }),
    ];

    const evidence = aggregateDomainEvidence(candidates, annualKnowledge.scoringProfile);
    const rawAxes = sumWeightedAxes(evidence);
    const normalized = normalizeAnnualAxes(rawAxes, annualKnowledge.scoringProfile);

    axes[domain] = {
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

  const domainStatuses = ANNUAL_AXIS_DOMAINS.map((domain) => axes[domain].status);
  const moduleStatus = resolveModuleStatus(domainStatuses);

  const annualFocus: AnnualFocusSummary | null = focusResolution.focus
    ? {
        mode: focusResolution.focus.mode,
        palaceIndex: focusResolution.focus.palaceIndex,
        palaceName: focusResolution.focus.palaceName,
        palaceBranch: focusResolution.focus.palaceBranch,
        annualPalaceName: focusResolution.focus.annualPalaceName,
        // Frame branches are computed by the caller only after the focus
        // frame is materialised (Commit 2). Here we ship an empty array
        // until that overlay lands, keeping the field shape stable.
        frameBranches: [],
      }
    : null;

  const capabilities = capabilitiesFor(
    school,
    annualKnowledge,
    domainAnchors,
    focusResolution.focus,
    domainStatuses,
  );

  return {
    module: "annual-axes",
    annualYear: chart.annualYear,
    school,
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion: `${annualKnowledge.scoringProfile.profileId}@${annualKnowledge.scoringProfile.schemaVersion}`,
    },
    status: moduleStatus,
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus,
  };
}
