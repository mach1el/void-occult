import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import {
  loadAnnualAxesKnowledgeV04NamPhai,
  type AnnualAxesKnowledgeV04NamPhai,
} from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { dedupeAnnualAxesDiagnostics, emptyAnnualAxesDiagnostics } from "../diagnostics";
import {
  type AnnualAxesCapabilities,
  type AnnualAxesDiagnostics,
  type AnnualAxesResult,
  type AnnualAxisEvidence,
  type AnnualAxisResult,
  type AnnualFocusSummary,
} from "../types";
import { collectNamPhaiV04TriggeredEvidence } from "./collect-evidence";
import { aggregateNamPhaiV04Channels } from "./aggregate-channels";
import { computeNatalDomainResponse } from "./natal-response";
import { normalizeAnnualDeltaV04 } from "./normalize-delta";
import { computeDomainRoutingsV04 } from "./routing";

const CONTRACT_VERSION = "0.4.0";
const ENGINE_VERSION = "0.4.2";
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
): AnnualAxisResult {
  return {
    domain,
    status: "unavailable",
    score: null,
    band: null,
    evidence: [],
    reasonCodes,
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
 * V0.4 Nam Phái annual-delta analyzer.
 * Scores represent year-specific change around neutral 50 — not natal quality.
 */
export function analyzeAnnualAxesNamPhaiV04(chart: ChartData): AnnualAxesResult {
  const diagnostics = emptyAnnualAxesDiagnostics();

  const knowledgeResult = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledgeResult.ok) {
    for (const issue of knowledgeResult.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge: AnnualAxesKnowledgeV04NamPhai = knowledgeResult.knowledge;

  const knowledge042Result = loadAnnualAxesKnowledgeV042NamPhai();
  if (!knowledge042Result.ok) {
    for (const issue of knowledge042Result.issues) {
      diagnostics.invalidKnowledge.push(`v0.4.2:${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge042 = knowledge042Result.knowledge;

  const numericResult = loadPalaceOverviewKnowledgeV1();
  if (!numericResult.ok) {
    for (const issue of numericResult.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(
      chart.annualYear,
      diagnostics,
      `${knowledge.deltaProfile.profileId}@${knowledge.deltaProfile.schemaVersion}`,
    );
  }
  const numericKnowledge = numericResult.knowledge;
  const knowledgeVersion = `${knowledge.deltaProfile.profileId}@${knowledge.deltaProfile.schemaVersion}`;

  if (chart.palaces.length !== 12) {
    diagnostics.incompleteChartPalaces.push(`nam-phai:palace-count=${chart.palaces.length}`);
  }

  const focus = resolveAnnualFocus(chart, "nam-phai");
  if (focus.issues.missingAnnualHeadPalace) diagnostics.missingAnnualHeadPalace.push("chart:annualHeadPalace");
  if (focus.issues.duplicateAnnualHeadPalaces) diagnostics.duplicateAnnualHeadPalaces.push("chart:isLuuNienDaiVan");
  if (focus.issues.annualHeadPointerFlagMismatch) {
    diagnostics.annualHeadPointerFlagMismatch.push("chart:annualHeadPalace!=isLuuNienDaiVan");
  }
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

  const routings = computeDomainRoutingsV04(chart, knowledge, headFrame, diagnostics);

  for (const domainDefinition of knowledge.axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const routing = routings.get(domain);
    if (!routing) {
      axes[domain] = unavailableAxisResult(domain, ["missing-routing"]);
      continue;
    }

    const { evidence, stats } = collectNamPhaiV04TriggeredEvidence({
      chart,
      domain,
      knowledge,
      knowledge042,
      numericKnowledge,
      headFrame,
      routing,
      diagnostics,
    });

    const aggregated = aggregateNamPhaiV04Channels(evidence, knowledge);
    const natalResponse = computeNatalDomainResponse(chart, domain, knowledge, numericKnowledge);
    const normalized = normalizeAnnualDeltaV04({
      channels: aggregated.channels,
      routedStrength: routing.routedStrength,
      natalResponse,
      rawAxes: aggregated.rawAxes,
      knowledge,
    });

    axes[domain] = {
      domain,
      status: "available",
      score: normalized.score,
      band: normalized.band,
      rawAxes: aggregated.rawAxes,
      normalizedAxes: normalized.normalizedAxes,
      intensity: normalized.intensity,
      conflict: normalized.conflict,
      evidence: aggregated.evidence,
      topSupportDrivers: topDrivers(aggregated.evidence, "support"),
      topPressureDrivers: topDrivers(aggregated.evidence, "pressure"),
      routing: {
        routing: routing.routing,
        headShare: routing.headShare,
        localShare: routing.localShare,
      },
      annualDelta: normalized.annualDelta,
      routedStrength: routing.routedStrength,
      natalResponse,
      channels: aggregated.channels,
      collectStats: stats,
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
