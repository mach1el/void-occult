import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { MAJOR_FORTUNE_DOMAINS, type MajorFortuneDomain } from "../../contracts/major-fortune";
import { loadPalaceOverviewKnowledgeV1, type PalaceOverviewKnowledgeV1 } from "../../knowledge";
import {
  loadMajorFortuneScoringKnowledgeV0,
  type DeepReadonly,
  type MajorFortuneScoringKnowledgeV0,
} from "../../knowledge/major-fortune-scoring";
import { resolveMajorFortuneContext, type ResolvedMajorFortuneContext } from "./resolve-context";
import { collectDomainFrames, collectOverallFrame, type MajorFortuneFrame } from "./collect-major-frames";
import { collectStarEvidence } from "./collect-star-evidence";
import { collectTransformationEvidence } from "./collect-transformation-evidence";
import { collectStructuralEvidence } from "./collect-structural-evidence";
import { detectDisabledInteractionHits } from "./detect-disabled-interactions";
import { auditEvidenceSources } from "./audit-evidence-sources";
import { aggregateMajorFortuneEvidence } from "./aggregate";
import { normalizeMajorFortuneAxes, sumWeightedAxes } from "./normalize";
import { dedupeMajorFortuneDiagnostics, emptyMajorFortuneDiagnostics } from "./diagnostics";
import {
  type MajorFortuneAxisResult,
  type MajorFortuneCapabilities,
  type MajorFortuneDiagnostics,
  type MajorFortuneEvidence,
  type MajorFortuneReasonCode,
  type MajorFortuneScoringResult,
  type MajorFortuneVersionProvenance,
} from "./types";

const CONTRACT_VERSION = "0.1.0";
const ENGINE_VERSION = "0.1.0";
const TOP_DRIVER_COUNT = 3;

function topDrivers(
  evidence: MajorFortuneEvidence[],
  axis: "support" | "pressure",
): MajorFortuneEvidence[] {
  return evidence
    .filter((e) => e.weightedAxes[axis] > 0)
    .sort((a, b) => b.weightedAxes[axis] - a.weightedAxes[axis])
    .slice(0, TOP_DRIVER_COUNT);
}

function unavailableAxisResult(reasonCodes: MajorFortuneReasonCode[]): MajorFortuneAxisResult {
  return { status: "unavailable", score: null, band: null, evidence: [], reasonCodes };
}

function capabilitiesFor(
  school: ZiweiSchool,
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
): MajorFortuneCapabilities {
  const profile = knowledge.schoolCapabilities.profiles[school];
  return {
    supportsOverallFrame: profile.supportsOverallFrame,
    supportsTwelveDomainOverlay: profile.supportsTwelveDomainOverlay,
    supportsMajorFortuneTransformations: profile.supportsMajorFortuneTransformations,
  };
}

function versionProvenance(
  mfKnowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0 | null,
  calculationPolicyProfileVersion: string | null,
): MajorFortuneVersionProvenance {
  if (!mfKnowledge) {
    return {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      scoringKnowledgeVersion: "unavailable",
      capabilityProfileVersion: "unavailable",
      calculationPolicyProfileVersion,
    };
  }
  return {
    contractVersion: CONTRACT_VERSION,
    engineVersion: ENGINE_VERSION,
    scoringKnowledgeVersion: `${mfKnowledge.scoringProfile.profileId}@${mfKnowledge.scoringProfile.schemaVersion}`,
    capabilityProfileVersion: `${mfKnowledge.schoolCapabilities.catalogId}@${mfKnowledge.schoolCapabilities.schemaVersion}`,
    calculationPolicyProfileVersion,
  };
}

function resolvePeriodPhase(
  yearInCycle: number | undefined,
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
): { phaseId: string } | null {
  if (yearInCycle === undefined) return null;
  const phase = knowledge.periodPhase.phases.find(
    (p) => yearInCycle >= p.yearInCycleMin && yearInCycle <= p.yearInCycleMax,
  );
  return phase ? { phaseId: phase.phaseId } : null;
}

function scoreFrame(
  chart: ChartData,
  frame: MajorFortuneFrame,
  resolvedContext: ResolvedMajorFortuneContext,
  numericKnowledge: PalaceOverviewKnowledgeV1,
  mfKnowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
  diagnostics: MajorFortuneDiagnostics,
): MajorFortuneAxisResult {
  const starEvidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });
  const transformationEvidence = collectTransformationEvidence({
    chart,
    frame,
    transformations: resolvedContext.transformations,
    knowledge: mfKnowledge,
    diagnostics,
  });
  const structuralEvidence = collectStructuralEvidence({
    frame,
    transformationEvidence,
    knowledge: mfKnowledge,
  });

  const evidence = aggregateMajorFortuneEvidence(
    [...starEvidence, ...transformationEvidence, ...structuralEvidence],
    mfKnowledge.scoringProfile,
    diagnostics,
  );
  auditEvidenceSources(evidence, mfKnowledge, numericKnowledge, diagnostics);

  const rawAxes = sumWeightedAxes(evidence);
  const normalized = normalizeMajorFortuneAxes(rawAxes, mfKnowledge.scoringProfile);

  return {
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

function globallyUnavailableResult(
  school: ZiweiSchool,
  reasonCodes: MajorFortuneReasonCode[],
  diagnostics: MajorFortuneDiagnostics,
  versions: MajorFortuneVersionProvenance,
  capabilities: MajorFortuneCapabilities,
): MajorFortuneScoringResult {
  return {
    module: "major-fortune",
    school,
    cycle: null,
    versions,
    status: "unavailable",
    overall: unavailableAxisResult(reasonCodes),
    domainsStatus: "unavailable",
    domains: {},
    capabilities,
    diagnostics: dedupeMajorFortuneDiagnostics(diagnostics),
    periodPhase: null,
  };
}

const EMPTY_CAPABILITIES: MajorFortuneCapabilities = {
  supportsOverallFrame: false,
  supportsTwelveDomainOverlay: false,
  supportsMajorFortuneTransformations: false,
};

/**
 * Public entry point — deterministic Major Fortune decade scoring for one
 * chart + school. Never mutates `chart` or the loaded knowledge. Never reads
 * `annualYear`/annual facts numerically. `yearInCycle` is metadata-only
 * (entry/core/exit) and never changes the numeric result.
 */
export function analyzeMajorFortune(
  chart: ChartData,
  options: { school: ZiweiSchool; yearInCycle?: number },
): MajorFortuneScoringResult {
  const { school, yearInCycle } = options;
  const diagnostics = emptyMajorFortuneDiagnostics();

  const mfKnowledgeResult = loadMajorFortuneScoringKnowledgeV0();
  if (!mfKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...mfKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return globallyUnavailableResult(
      school,
      ["invalid-knowledge"],
      diagnostics,
      versionProvenance(null, null),
      EMPTY_CAPABILITIES,
    );
  }
  const mfKnowledge = mfKnowledgeResult.knowledge;
  const capabilities = capabilitiesFor(school, mfKnowledge);

  const numericKnowledgeResult = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...numericKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return globallyUnavailableResult(
      school,
      ["invalid-knowledge"],
      diagnostics,
      versionProvenance(mfKnowledge, null),
      capabilities,
    );
  }
  const numericKnowledge = numericKnowledgeResult.knowledge;

  const resolvedContext = resolveMajorFortuneContext(
    chart,
    school,
    mfKnowledge,
    capabilities,
    diagnostics,
  );

  if (!resolvedContext) {
    const reasonCodes: MajorFortuneReasonCode[] =
      diagnostics.noActiveMajorFortune.length > 0
        ? ["no-active-major-fortune"]
        : ["invalid-resolved-context"];
    return globallyUnavailableResult(
      school,
      reasonCodes,
      diagnostics,
      versionProvenance(mfKnowledge, null),
      capabilities,
    );
  }

  detectDisabledInteractionHits(
    chart,
    resolvedContext.transformations,
    mfKnowledge,
    diagnostics,
  );

  const overallFrame = collectOverallFrame(
    chart,
    resolvedContext,
    mfKnowledge.domainDefinitions,
    diagnostics,
  );
  const overall = overallFrame
    ? scoreFrame(chart, overallFrame, resolvedContext, numericKnowledge, mfKnowledge, diagnostics)
    : unavailableAxisResult(["missing-frame-nodes"]);

  let domainsStatus: "available" | "unavailable" = "unavailable";
  const domains: Partial<Record<MajorFortuneDomain, MajorFortuneAxisResult>> = {};

  if (resolvedContext.majorPalaceLabels && capabilities.supportsTwelveDomainOverlay) {
    const domainFrames = collectDomainFrames(
      chart,
      resolvedContext,
      mfKnowledge.domainDefinitions,
      diagnostics,
    );
    if (domainFrames.size === MAJOR_FORTUNE_DOMAINS.length) {
      domainsStatus = "available";
      for (const domainId of MAJOR_FORTUNE_DOMAINS) {
        const frame = domainFrames.get(domainId);
        if (!frame) {
          domains[domainId] = unavailableAxisResult(["missing-frame-nodes"]);
          continue;
        }
        domains[domainId] = scoreFrame(
          chart,
          frame,
          resolvedContext,
          numericKnowledge,
          mfKnowledge,
          diagnostics,
        );
      }
    }
  }

  const moduleStatus: "available" | "partial" | "unavailable" =
    overall.status === "unavailable"
      ? "unavailable"
      : domainsStatus === "available"
        ? "available"
        : "partial";

  return {
    module: "major-fortune",
    school,
    cycle: {
      cycleIndex: resolvedContext.cycleIndex,
      startAge: resolvedContext.startAge,
      endAge: resolvedContext.endAge,
      activePalaceIndex: resolvedContext.activePalaceIndex,
    },
    versions: versionProvenance(mfKnowledge, resolvedContext.calculationPolicyProfileVersion),
    status: moduleStatus,
    overall,
    domainsStatus,
    domains,
    capabilities,
    diagnostics: dedupeMajorFortuneDiagnostics(diagnostics),
    periodPhase: resolvePeriodPhase(yearInCycle, mfKnowledge),
  };
}
