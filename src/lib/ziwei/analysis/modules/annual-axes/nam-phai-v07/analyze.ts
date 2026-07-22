import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import {
  loadAnnualAxesKnowledgeV04NamPhai,
  type AnnualAxesKnowledgeV04NamPhai,
} from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV07NamPhai } from "../../../knowledge/annual-axes/v0.7";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import {
  dedupeAnnualAxesDiagnostics,
  emptyAnnualAxesDiagnostics,
} from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { classifyEvidencePaths } from "../nam-phai-v043/classify-paths";
import {
  type AnnualAxesCapabilities,
  type AnnualAxesResult,
  type AnnualAxisEvidence,
  type AnnualAxisBand,
  type AnnualAxisResult,
  type AnnualFocusSummary,
  type AnnualAxesDiagnostics,
} from "../types";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { aggregateV07Buckets } from "./aggregate-buckets";
import { dedupeV07SpatialPaths } from "./dedupe";
import { scoreV07Domain } from "./score-domain";

const CONTRACT_VERSION = "0.7.0";
const ENGINE_VERSION = "0.7.0";
const TOP_DRIVER_COUNT = 3;

function topDrivers(
  evidence: AnnualAxisEvidence[],
  axis: "support" | "pressure",
): AnnualAxisEvidence[] {
  return evidence
    .filter((e) => e.retainedForSignedScore !== false && e.weightedAxes[axis] > 0)
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
  for (const domain of ANNUAL_AXIS_DOMAINS) {
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

function resolveBand(
  score: number,
  knowledge04: AnnualAxesKnowledgeV04NamPhai,
): AnnualAxisBand {
  const profile = knowledge04.deltaProfile;
  for (const band of profile.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id as AnnualAxisBand;
  }
  return "balanced";
}

/** Nam Phái Annual Axes V0.7 calibrated scoring core. */
export function analyzeAnnualAxesNamPhaiV07(chart: ChartData): AnnualAxesResult {
  const diagnostics = emptyAnnualAxesDiagnostics();

  const knowledge04Result = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04Result.ok) {
    for (const issue of knowledge04Result.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge04 = knowledge04Result.knowledge;

  const knowledge042Result = loadAnnualAxesKnowledgeV042NamPhai();
  if (!knowledge042Result.ok) {
    for (const issue of knowledge042Result.issues) {
      diagnostics.invalidKnowledge.push(`v0.4.2:${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge042 = knowledge042Result.knowledge;

  const knowledge07Result = loadAnnualAxesKnowledgeV07NamPhai();
  if (!knowledge07Result.ok) {
    for (const issue of knowledge07Result.issues) {
      diagnostics.invalidKnowledge.push(`v0.7:${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge07 = knowledge07Result.knowledge;

  const numericResult = loadPalaceOverviewKnowledgeV1();
  if (!numericResult.ok) {
    for (const issue of numericResult.issues) {
      diagnostics.invalidKnowledge.push(`numeric:${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const numericKnowledge = numericResult.knowledge;

  const focusResolution = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focusResolution.focus
    ? buildAnnualFocusFrame(chart, focusResolution.focus)
    : null;

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;

  if (!headFrame) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      axes[domain] = unavailableAxisResult(domain, ["missing-annual-head"]);
    }
    return {
      module: "annual-axes",
      annualYear: chart.annualYear,
      school: "nam-phai",
      versions: {
        contractVersion: CONTRACT_VERSION,
        engineVersion: ENGINE_VERSION,
        knowledgeVersion: `annual-axes-v0.7@${knowledge07.calibration.formulaVersion}`,
      },
      status: "unavailable",
      axes,
      diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
      capabilities: {
        supportsDomainScoring: false,
        supportsAnnualFocus: false,
        domainAnchorCoordinate: "natal-palace-name",
        domainAnchorProvenance: "nam-phai-natal-domain-anchor",
        primaryAnnualFocus: "annual-major-fortune",
      },
      annualFocus: null,
    };
  }

  const routings = computeDomainRoutingsV04(chart, knowledge04, headFrame, diagnostics);

  for (const domainDefinition of knowledge04.axisDefinitions.domains) {
    const domain = domainDefinition.domain as AnnualAxisDomain;
    const routing = routings.get(domain);
    if (!routing) {
      axes[domain] = unavailableAxisResult(domain, ["missing-routing"]);
      continue;
    }

    const { evidence, stats } = collectNamPhaiV04TriggeredEvidence({
      chart,
      domain,
      knowledge: knowledge04,
      knowledge042,
      numericKnowledge,
      headFrame,
      routing,
      diagnostics,
    });

    const classified = classifyEvidencePaths(
      evidence,
      headFrame.focusPalaceIndex,
      knowledge07.spatialBudget.tp4cRelativeRoleWeights,
    );
    const deduped = dedupeV07SpatialPaths(classified, knowledge07);
    const aggregate = aggregateV07Buckets(deduped, knowledge07);
    const natalResponse = computeNatalDomainResponse(chart, domain, knowledge04, numericKnowledge);
    const scored = scoreV07Domain({
      aggregate,
      natalResponse,
      domain,
      knowledge: knowledge07,
    });

    axes[domain] = {
      domain,
      status: "available",
      score: scored.score,
      band: resolveBand(scored.score, knowledge04),
      rawAxes: aggregate.rawAxes,
      normalizedAxes: {
        support: scored.supportNorm,
        pressure: scored.pressureNorm,
        stability: 0,
        activation: scored.activationGate,
      },
      intensity: scored.intensity,
      conflict: scored.conflict,
      evidence: aggregate.evidence,
      topSupportDrivers: topDrivers(aggregate.evidence, "support"),
      topPressureDrivers: topDrivers(aggregate.evidence, "pressure"),
      annualDelta: Math.round((scored.score - knowledge07.scoreProfile.neutral) * 10) / 10,
      natalResponse,
      activationGate: scored.activationGate,
      latent: scored.strictLatent,
      scoreTrace: {
        formulaVersion: "v0.7-robust-centered-annual-score",
        signedLayerFactors: scored.trace.signedLayerFactors,
        spatialSignedRaw: scored.trace.spatialSignedRaw,
        domainCenter: scored.trace.domainCenter,
        centeredSpatial: scored.trace.centeredSpatial,
        annualActivationRaw: scored.trace.annualActivationRaw,
        activationGate: scored.trace.activationGate,
        natalGain: scored.trace.natalGain,
        strictLatent: scored.trace.strictLatent,
        domainScale: scored.trace.domainScale,
        scoreAmplitude: scored.trace.scoreAmplitude,
        absoluteScore: scored.trace.absoluteScore,
      },
      spatialBudgetTrace: aggregate.spatialBudgetTrace,
      dedupeTrace: deduped.trace,
      collectStats: stats,
    };
  }

  const domainStatuses = ANNUAL_AXIS_DOMAINS.map((d) => axes[d].status);
  const moduleStatus = domainStatuses.every((s) => s === "available")
    ? "available"
    : domainStatuses.every((s) => s === "unavailable")
      ? "unavailable"
      : "partial";

  const annualFocus: AnnualFocusSummary | null = focusResolution.focus
    ? {
        mode: focusResolution.focus.mode,
        palaceIndex: focusResolution.focus.palaceIndex,
        palaceName: focusResolution.focus.palaceName,
        palaceBranch: focusResolution.focus.palaceBranch,
        annualPalaceName: focusResolution.focus.annualPalaceName,
        frameBranches: headFrame.frameBranches,
      }
    : null;

  return {
    module: "annual-axes",
    annualYear: chart.annualYear,
    school: "nam-phai",
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion: `annual-axes-v0.7@${knowledge07.calibration.formulaVersion}`,
    },
    status: moduleStatus,
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities: {
      supportsDomainScoring: moduleStatus !== "unavailable",
      supportsAnnualFocus: annualFocus !== null,
      domainAnchorCoordinate: "natal-palace-name",
      domainAnchorProvenance: "nam-phai-natal-domain-anchor",
      primaryAnnualFocus: "annual-major-fortune",
    },
    annualFocus,
  };
}
