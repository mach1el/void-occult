import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import {
  loadAnnualAxesKnowledgeV03NamPhai,
  type AnnualAxesKnowledgeV03NamPhai,
} from "../../../knowledge/annual-axes/v0.3";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { dedupeAnnualAxesDiagnostics, emptyAnnualAxesDiagnostics } from "../diagnostics";
import {
  addAnnualAxes,
  emptyAnnualAxes,
  type AnnualAxesCapabilities,
  type AnnualAxesDiagnostics,
  type AnnualAxesResult,
  type AnnualAxisEvidence,
  type AnnualAxisResult,
  type AnnualDomainRouting,
  type AnnualFocusSummary,
} from "../types";
import { computeDomainRoutings } from "./routing";
import { collectNamPhaiV03PhysicalFacts } from "./collect-physical-facts";
import {
  buildHeadStructuralEvidence,
  collectNamPhaiV03SecondaryContext,
} from "./collect-context-evidence";
import { aggregateNamPhaiV03DomainEvidence } from "./aggregate";
import { normalizeAnnualAxesV03 } from "./normalize";

const CONTRACT_VERSION = "0.3.0";
const ENGINE_VERSION = "0.3.0";
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

function unavailableAxisResult(
  domain: AnnualAxisDomain,
  reasonCodes: string[],
  routing?: AnnualDomainRouting,
): AnnualAxisResult {
  return {
    domain,
    status: "unavailable",
    score: null,
    band: null,
    evidence: [],
    reasonCodes,
    routing,
  };
}

function invalidKnowledgeResult(
  annualYear: number,
  diagnostics: AnnualAxesDiagnostics,
  knowledgeVersion: string,
): AnnualAxesResult {
  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;
  for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as AnnualAxisDomain[]) {
    axes[domain] = unavailableAxisResult(domain, ["invalid-knowledge"]);
  }
  const capabilities: AnnualAxesCapabilities = {
    supportsDomainScoring: false,
    supportsAnnualFocus: false,
    domainAnchorCoordinate: "natal-palace-name",
    domainAnchorProvenance: "nam-phai-natal-domain-anchor",
    primaryAnnualFocus: "annual-major-fortune",
  };
  return {
    module: "annual-axes",
    annualYear,
    school: "nam-phai",
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion,
    },
    status: "unavailable",
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus: null,
  };
}

/**
 * V0.3 Nam Phái head-centric analyzer. Routes each of the six annual
 * axes from the resolved annual head (`chart.annualHeadPalace` /
 * `getAnnualMajorFortuneIndex` / unique `isLuuNienDaiVan`) and blends
 * head vs local channels at the physical-fact level.
 */
export function analyzeAnnualAxesNamPhaiV03(chart: ChartData): AnnualAxesResult {
  const diagnostics = emptyAnnualAxesDiagnostics();

  const knowledgeResult = loadAnnualAxesKnowledgeV03NamPhai();
  if (!knowledgeResult.ok) {
    for (const issue of knowledgeResult.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge: AnnualAxesKnowledgeV03NamPhai = knowledgeResult.knowledge;

  const numericResult = loadPalaceOverviewKnowledgeV1();
  if (!numericResult.ok) {
    for (const issue of numericResult.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(
      chart.annualYear,
      diagnostics,
      `${knowledge.scoringProfile.profileId}@${knowledge.scoringProfile.schemaVersion}`,
    );
  }
  const numericKnowledge = numericResult.knowledge;

  const knowledgeVersion = `${knowledge.scoringProfile.profileId}@${knowledge.scoringProfile.schemaVersion}`;

  if (chart.palaces.length !== 12) {
    diagnostics.incompleteChartPalaces.push(`nam-phai:palace-count=${chart.palaces.length}`);
  }

  const focus = resolveAnnualFocus(chart, "nam-phai");
  if (focus.issues.missingAnnualHeadPalace) diagnostics.missingAnnualHeadPalace.push("chart:annualHeadPalace");
  if (focus.issues.duplicateAnnualHeadPalaces) diagnostics.duplicateAnnualHeadPalaces.push("chart:isLuuNienDaiVan");
  if (focus.issues.annualHeadPointerFlagMismatch) diagnostics.annualHeadPointerFlagMismatch.push("chart:annualHeadPalace!=isLuuNienDaiVan");
  if (focus.issues.invalidAnnualFocusPalace) diagnostics.invalidAnnualFocusPalace.push("nam-phai:head");

  const headFrame = focus.focus ? buildAnnualFocusFrame(chart, focus.focus) : null;
  if (focus.focus && !headFrame) {
    diagnostics.invalidAnnualHeadFrame.push(`nam-phai:${focus.focus.palaceIndex}`);
  }

  if (!chart.smallLimitPalace) {
    diagnostics.missingSmallLimitPalace.push("chart:smallLimitPalace");
  }

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;

  if (!headFrame) {
    for (const domainDefinition of knowledge.axisDefinitions.domains) {
      const d = domainDefinition.domain as AnnualAxisDomain;
      axes[d] = unavailableAxisResult(d, ["missing-annual-head"]);
    }
    const capabilities: AnnualAxesCapabilities = {
      supportsDomainScoring: false,
      supportsAnnualFocus: false,
      domainAnchorCoordinate: "natal-palace-name",
      domainAnchorProvenance: "nam-phai-natal-domain-anchor",
      primaryAnnualFocus: "annual-major-fortune",
    };
    return {
      module: "annual-axes",
      annualYear: chart.annualYear,
      school: "nam-phai",
      versions: { contractVersion: CONTRACT_VERSION, engineVersion: ENGINE_VERSION, knowledgeVersion },
      status: "unavailable",
      axes,
      diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
      capabilities,
      annualFocus: null,
    };
  }

  const routings = computeDomainRoutings(chart, knowledge, headFrame, diagnostics);

  for (const domainDefinition of knowledge.axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const routing = routings.get(domain);
    if (!routing) {
      axes[domain] = unavailableAxisResult(domain, ["missing-routing"]);
      continue;
    }

    const factEvidence = collectNamPhaiV03PhysicalFacts({
      chart,
      domain,
      knowledge,
      numericKnowledge,
      headFrame,
      routing,
      diagnostics,
    });

    const structuralEvidence = buildHeadStructuralEvidence({
      domain,
      headFrame,
      routing,
      knowledge,
      diagnostics,
    });

    const secondaryEvidence = collectNamPhaiV03SecondaryContext({
      chart,
      domain,
      headFrame,
      routing,
      knowledge,
      diagnostics,
    });

    const candidates: AnnualAxisEvidence[] = [
      ...factEvidence,
      structuralEvidence,
      ...secondaryEvidence,
    ];

    const aggregated = aggregateNamPhaiV03DomainEvidence(candidates, knowledge);
    const rawAxes = aggregated.reduce((acc, e) => addAnnualAxes(acc, e.weightedAxes), emptyAnnualAxes());
    const normalized = normalizeAnnualAxesV03(rawAxes, knowledge);

    axes[domain] = {
      domain,
      status: "available",
      score: normalized.score,
      band: normalized.band,
      rawAxes,
      normalizedAxes: normalized.normalizedAxes,
      intensity: normalized.intensity,
      conflict: normalized.conflict,
      evidence: aggregated,
      topSupportDrivers: topDrivers(aggregated, "support"),
      topPressureDrivers: topDrivers(aggregated, "pressure"),
      routing,
    };
  }

  const statuses = (["health", "family", "wealth", "career", "social", "romance"] as AnnualAxisDomain[]).map(
    (d) => axes[d].status,
  );
  const moduleStatus =
    statuses.every((s) => s === "available")
      ? "available"
      : statuses.every((s) => s === "unavailable")
        ? "unavailable"
        : "partial";

  const annualFocus: AnnualFocusSummary | null = focus.focus
    ? {
        mode: focus.focus.mode,
        palaceIndex: focus.focus.palaceIndex,
        palaceName: focus.focus.palaceName,
        palaceBranch: focus.focus.palaceBranch,
        annualPalaceName: focus.focus.annualPalaceName,
        frameBranches: headFrame.frameBranches,
      }
    : null;

  const capabilities: AnnualAxesCapabilities = {
    supportsDomainScoring: statuses.some((s) => s === "available"),
    supportsAnnualFocus: annualFocus !== null,
    domainAnchorCoordinate: "natal-palace-name",
    domainAnchorProvenance: "nam-phai-natal-domain-anchor",
    primaryAnnualFocus: "annual-major-fortune",
  };

  return {
    module: "annual-axes",
    annualYear: chart.annualYear,
    school: "nam-phai",
    versions: { contractVersion: CONTRACT_VERSION, engineVersion: ENGINE_VERSION, knowledgeVersion },
    status: moduleStatus,
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus,
  };
}
