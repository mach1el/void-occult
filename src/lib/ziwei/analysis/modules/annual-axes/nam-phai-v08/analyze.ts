import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import {
  loadAnnualAxesKnowledgeV04NamPhai,
  type AnnualAxesKnowledgeV04NamPhai,
} from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import {
  dedupeAnnualAxesDiagnostics,
  emptyAnnualAxesDiagnostics,
} from "../diagnostics";
import {
  type AnnualAxesCapabilities,
  type AnnualAxesResult,
  type AnnualAxisEvidence,
  type AnnualAxisBand,
  type AnnualAxisResult,
  type AnnualFocusSummary,
  type AnnualAxesDiagnostics,
  type AnnualAxisScoreTraceV08,
  emptyAnnualAxes,
} from "../types";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { scoreV08Domain } from "./score-domain";
import type { MatchedStarFact } from "./match-stars";

const CONTRACT_VERSION = "0.8.0";
const ENGINE_VERSION = "0.8.0";
const KNOWLEDGE_VERSION = "0.8.0";
const TOP_DRIVER_COUNT = 3;

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
    capabilities: {
      supportsDomainScoring: false,
      supportsAnnualFocus: false,
      domainAnchorCoordinate: "natal-palace-name",
      domainAnchorProvenance: "nam-phai-luu-nien-palace-mapping",
      primaryAnnualFocus: "annual-major-fortune",
    },
    annualFocus: null,
  };
}

function resolveBand(
  score: number,
  knowledge04: AnnualAxesKnowledgeV04NamPhai,
): AnnualAxisBand {
  for (const band of knowledge04.deltaProfile.bands) {
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

function factToEvidence(
  fact: MatchedStarFact,
  domain: AnnualAxisDomain,
  role: "primary" | "cooperating",
): AnnualAxisEvidence {
  const support = fact.polarity === "positive" ? Math.abs(fact.points) : 0;
  const pressure = fact.polarity === "negative" ? Math.abs(fact.points) : 0;
  return {
    id: `${domain}|${fact.ruleId}|${fact.palaceIndex}|${fact.starName}`,
    domain,
    layer: "annual",
    category: "star",
    physicalFactId: `${fact.palaceIndex}|${fact.starName}`,
    ruleId: fact.ruleId,
    targetPalaceIndex: fact.palaceIndex,
    targetPalaceName: fact.annualPalaceName,
    targetAnnualPalaceName: fact.annualPalaceName,
    frameRole: role === "primary" ? "focus" : "opposite",
    anchorPalaceName: fact.annualPalaceName,
    stackingGroup: fact.ruleId,
    rawAxes: { support, pressure, stability: 0, activation: 0 },
    effectiveWeight: 1,
    weightedAxes: { support, pressure, stability: 0, activation: 0 },
    confidenceWeight: 1,
    factIds: [fact.ruleId],
    sourceIds: [fact.sourceId],
    knowledgeStatus: "experimental",
    retainedForSignedScore: true,
    retainedForActivation: false,
  };
}

function topDrivers(
  facts: MatchedStarFact[],
  polarity: "positive" | "negative",
  domain: AnnualAxisDomain,
  primaryPalaceIndex: number | null,
): AnnualAxisEvidence[] {
  return facts
    .filter((f) => f.polarity === polarity)
    .sort((a, b) => {
      const mag = Math.abs(b.points) - Math.abs(a.points);
      if (mag !== 0) return mag;
      const aPrimary = a.palaceIndex === primaryPalaceIndex ? 0 : 1;
      const bPrimary = b.palaceIndex === primaryPalaceIndex ? 0 : 1;
      if (aPrimary !== bPrimary) return aPrimary - bPrimary;
      return a.ruleId.localeCompare(b.ruleId);
    })
    .slice(0, TOP_DRIVER_COUNT)
    .map((f) =>
      factToEvidence(
        f,
        domain,
        f.palaceIndex === primaryPalaceIndex ? "primary" : "cooperating",
      ),
    );
}

/** Nam Phái Annual Axes V0.8 explicit Lưu Niên palace-weighted scoring core. */
export function analyzeAnnualAxesNamPhaiV08(chart: ChartData): AnnualAxesResult {
  const diagnostics = emptyAnnualAxesDiagnostics();

  const knowledge04Result = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04Result.ok) {
    for (const issue of knowledge04Result.issues) {
      diagnostics.invalidKnowledge.push(`${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge04 = knowledge04Result.knowledge;

  const knowledge08Result = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge08Result.ok) {
    for (const issue of knowledge08Result.issues) {
      diagnostics.invalidKnowledge.push(`v0.8:${issue.path}: ${issue.message}`);
    }
    return invalidKnowledgeResult(chart.annualYear, diagnostics, "unavailable");
  }
  const knowledge08 = knowledge08Result.knowledge;

  const focusResolution = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focusResolution.focus
    ? buildAnnualFocusFrame(chart, focusResolution.focus)
    : null;

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const scored = scoreV08Domain({ chart, domain, knowledge: knowledge08 });
    const evidence = scored.matchedFacts.map((f) =>
      factToEvidence(
        f,
        domain,
        f.palaceIndex === scored.trace.primary.palaceIndex ? "primary" : "cooperating",
      ),
    );
    evidence.sort((a, b) => a.id.localeCompare(b.id));

    const primaryIndex = scored.trace.primary.palaceIndex;
    const pos = scored.matchedFacts
      .filter((f) => f.polarity === "positive")
      .reduce((s, f) => s + f.points, 0);
    const neg = scored.matchedFacts
      .filter((f) => f.polarity === "negative")
      .reduce((s, f) => s + Math.abs(f.points), 0);

    axes[domain] = {
      domain,
      status: "available",
      score: scored.score,
      band: resolveBand(scored.score, knowledge04),
      rawAxes: {
        ...emptyAnnualAxes(),
        support: pos,
        pressure: neg,
      },
      normalizedAxes: {
        support: scored.supportNorm,
        pressure: scored.pressureNorm,
        stability: 0,
        activation: scored.isThaiTueHighlighted ? 1 : 0,
      },
      intensity: scored.intensity,
      conflict: scored.conflict,
      evidence,
      topSupportDrivers: topDrivers(
        scored.matchedFacts,
        "positive",
        domain,
        primaryIndex,
      ),
      topPressureDrivers: topDrivers(
        scored.matchedFacts,
        "negative",
        domain,
        primaryIndex,
      ),
      annualDelta: Math.round((scored.score - 50) * 10) / 10,
      scoreTrace: scored.trace as AnnualAxisScoreTraceV08,
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
        frameBranches: headFrame?.frameBranches ?? [],
      }
    : null;

  const capabilities: AnnualAxesCapabilities = {
    supportsDomainScoring: moduleStatus !== "unavailable",
    supportsAnnualFocus: annualFocus !== null,
    domainAnchorCoordinate: "natal-palace-name",
    domainAnchorProvenance: "nam-phai-luu-nien-palace-mapping",
    primaryAnnualFocus: "annual-major-fortune",
  };

  return {
    module: "annual-axes",
    annualYear: chart.annualYear,
    school: "nam-phai",
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion: KNOWLEDGE_VERSION,
    },
    status: moduleStatus,
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus,
  };
}
