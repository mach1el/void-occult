/**
 * Research-only analyzer: V0.8 mechanics + candidate knowledge clone.
 */

import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV08NamPhai, AnnualScoreBandV08 } from "../../knowledge/annual-axes/v0.8";
import { buildAnnualFocusFrame } from "../../modules/annual-axes/build-annual-focus-frame";
import {
  dedupeAnnualAxesDiagnostics,
  emptyAnnualAxesDiagnostics,
} from "../../modules/annual-axes/diagnostics";
import { resolveAnnualFocus } from "../../modules/annual-axes/resolvers/resolve-annual-focus";
import { scoreV08Domain } from "../../modules/annual-axes/nam-phai-v08/score-domain";
import type { MatchedStarFact } from "../../modules/annual-axes/nam-phai-v08/match-stars";
import type {
  AnnualAxesCapabilities,
  AnnualAxesResult,
  AnnualAxisBand,
  AnnualAxisResult,
  AnnualAxisScoreTraceV08,
  AnnualAxisV08Evidence,
  AnnualFocusSummary,
} from "../../modules/annual-axes/types";
import type { AnnualAxesCandidateRound2 } from "./schema";
import { buildCandidateKnowledge } from "./candidate-policy";
import { CONTROL_ENGINE_VERSION } from "./control-v08";

const CONTRACT_VERSION = "0.8.0";
const TOP_DRIVER_COUNT = 3;

function resolveBand(
  score: number,
  bands: AnnualScoreBandV08[],
): AnnualAxisBand {
  for (const band of bands) {
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

function factToV08Evidence(fact: MatchedStarFact): AnnualAxisV08Evidence {
  return {
    ruleId: fact.ruleId,
    starName: fact.starName,
    exactMatchedStarName: fact.exactMatchedStarName,
    temporalLayer: fact.temporalLayer,
    palaceName: fact.annualPalaceName,
    palaceRole: fact.palaceRole,
    palaceWeight: fact.palaceWeight,
    pointValue: fact.points,
    weightedContribution: fact.weightedContribution,
    polarity: fact.polarity,
    thaiTueProminenceApplied: fact.thaiTueProminenceApplied,
  };
}

function topWeightedDrivers(
  facts: MatchedStarFact[],
  polarity: "positive" | "negative",
): AnnualAxisV08Evidence[] {
  return facts
    .filter((f) => f.polarity === polarity)
    .sort(
      (a, b) =>
        Math.abs(b.weightedContribution) - Math.abs(a.weightedContribution) ||
        a.ruleId.localeCompare(b.ruleId),
    )
    .slice(0, TOP_DRIVER_COUNT)
    .map(factToV08Evidence);
}

export function analyzeWithCandidateKnowledge(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  knowledgeVersion: string,
): AnnualAxesResult {
  const diagnostics = emptyAnnualAxesDiagnostics();
  const focusResolution = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focusResolution.focus
    ? buildAnnualFocusFrame(chart, focusResolution.focus)
    : null;

  if (focusResolution.issues.missingAnnualHeadPalace) {
    diagnostics.missingAnnualHeadPalace.push("chart:annualHeadPalace");
  }
  if (focusResolution.issues.missingSmallLimitPalace) {
    diagnostics.missingSmallLimitPalace.push("chart:smallLimitPalace");
  }

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisResult>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const scored = scoreV08Domain({ chart, domain, knowledge });
    if (scored.availability === "unavailable" || scored.score == null) {
      for (const reason of scored.missingReasonCodes) {
        if (reason.startsWith("missing-annual-palace")) {
          diagnostics.missingAnnualPalaceNames.push(reason);
        } else if (reason === "missing-small-limit-palace") {
          diagnostics.missingSmallLimitPalace.push(reason);
        } else {
          diagnostics.missingRequiredAnnualFacts.push(`${domain}:${reason}`);
        }
      }
      axes[domain] = {
        domain,
        engine: "v0.8",
        status: "unavailable",
        score: null,
        band: null,
        reasonCodes: scored.missingReasonCodes,
        coverage: scored.coverage,
        scoreTrace: scored.trace as AnnualAxisScoreTraceV08,
        v08Evidence: [],
        topSupportDriversV08: [],
        topPressureDriversV08: [],
      };
      continue;
    }

    const v08Evidence = scored.matchedFacts.map(factToV08Evidence);
    const status = scored.availability === "partial-data" ? "partial-data" : "available";
    axes[domain] = {
      domain,
      engine: "v0.8",
      status,
      score: scored.score,
      band: resolveBand(scored.score, knowledge.scoreBands.bands),
      scoreTrace: scored.trace as AnnualAxisScoreTraceV08,
      coverage: scored.coverage,
      v08Evidence,
      topSupportDriversV08: topWeightedDrivers(scored.matchedFacts, "positive"),
      topPressureDriversV08: topWeightedDrivers(scored.matchedFacts, "negative"),
      reasonCodes: status === "partial-data" ? scored.missingReasonCodes : undefined,
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
    supportsDomainScoring: true,
    supportsAnnualFocus: Boolean(annualFocus),
    domainAnchorCoordinate: "annual-palace-name",
    domainAnchorProvenance: "nam-phai-luu-nien-palace-mapping",
    primaryAnnualFocus: "annual-major-fortune",
  };

  return {
    module: "annual-axes",
    annualYear: chart.annualYear,
    school: "nam-phai",
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: CONTROL_ENGINE_VERSION,
      knowledgeVersion,
    },
    status: moduleStatus,
    axes,
    diagnostics: dedupeAnnualAxesDiagnostics(diagnostics),
    capabilities,
    annualFocus,
  };
}

export function runCandidate(
  chart: ChartData,
  candidate: AnnualAxesCandidateRound2,
): AnnualAxesResult {
  const knowledge = buildCandidateKnowledge(candidate);
  const knowledgeVersion =
    candidate.candidateType === "control"
      ? candidate.knowledgeVersion
      : `research-r2:${candidate.candidateId}`;
  return analyzeWithCandidateKnowledge(chart, knowledge, knowledgeVersion);
}
