import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type {
  AnnualAxisEvidence,
  AnnualAxisRawAxes,
  AnnualChannelSummary,
  AnnualEvidenceChannel,
} from "../types";
import { emptyAnnualAxes } from "../types";

const CHANNEL_MAP: Record<
  AnnualEvidenceChannel,
  keyof {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  }
> = {
  global: "globalAnnualClimate",
  "routed-head": "routedHeadImpact",
  "direct-domain": "directDomainImpact",
  "major-background": "majorFortuneBackground",
};

function emptyChannel(): AnnualChannelSummary {
  return {
    supportRaw: 0,
    pressureRaw: 0,
    activationRaw: 0,
    supportNorm: 0,
    pressureNorm: 0,
    signed: 0,
    evidenceIds: [],
  };
}

/**
 * §7 diminishing-return rank, within `domain|layer|stackingGroup` (matches
 * current production grouping — the ablation in `audit/run-ablation.ts`
 * compares this against alternatives; production is not switched without
 * evidence it is a material culprit, per the corrective prompt's own
 * "do not choose a grouping solely from gate performance").
 * Returns a per-evidence-id diminishing factor rather than mutating
 * `weightedAxes` — channel contributions apply it fresh alongside
 * `confidenceWeight` and each path's own `boundedPathWeight` (§6).
 */
function computeDiminishingFactors(evidence: AnnualAxisEvidence[]): Map<string, number> {
  const groups = new Map<string, AnnualAxisEvidence[]>();
  for (const e of evidence) {
    const key = `${e.domain}|${e.layer}|${e.stackingGroup}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const factors = new Map<string, number>();
  for (const list of groups.values()) {
    const ranked = [...list].sort((a, b) => {
      const ae = Math.abs(a.weightedAxes.support) + Math.abs(a.weightedAxes.pressure);
      const be = Math.abs(b.weightedAxes.support) + Math.abs(b.weightedAxes.pressure);
      return be - ae || a.id.localeCompare(b.id);
    });
    ranked.forEach((e, index) => {
      factors.set(e.id, 1 / Math.sqrt(index + 1));
    });
  }
  return factors;
}

function finalizeChannel(
  channel: AnnualChannelSummary,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): AnnualChannelSummary {
  const supportNorm = 1 - Math.exp(-channel.supportRaw / knowledge.deltaProfile.supportScale);
  const pressureNorm = 1 - Math.exp(-channel.pressureRaw / knowledge.deltaProfile.pressureScale);
  return {
    ...channel,
    supportNorm,
    pressureNorm,
    signed: supportNorm - pressureNorm,
    evidenceIds: [...new Set(channel.evidenceIds)].sort(),
  };
}

export interface AggregatedChannelsV04 {
  evidence: AnnualAxisEvidence[];
  channels: {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  };
  rawAxes: AnnualAxisRawAxes;
}

/**
 * §6 — each physical evidence record retains its raw axes once; each of
 * its activation paths carries its own bounded path weight. Channel
 * contribution is computed independently per path:
 *   pathContributionAxes = rawAxes * confidenceWeight * diminishingFactor * boundedPathWeight
 * There is no combine-then-proportionally-split step — a fact touching two
 * channels (e.g. routed-head + direct-domain via the head/local
 * intersection) contributes its own bounded weight to each, independently.
 * The module-level `rawAxes` total (used for the activation gate and
 * display normalization) counts each evidence item once, at its strongest
 * path, so a multi-channel fact does not inflate the global magnitude.
 */
export function aggregateNamPhaiV04Channels(
  candidates: AnnualAxisEvidence[],
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): AggregatedChannelsV04 {
  const diminishingFactors = computeDiminishingFactors(candidates);
  const channels = {
    globalAnnualClimate: emptyChannel(),
    routedHeadImpact: emptyChannel(),
    directDomainImpact: emptyChannel(),
    majorFortuneBackground: emptyChannel(),
  };

  const rawAxes = emptyAnnualAxes();
  const evidenceOut: AnnualAxisEvidence[] = [];

  for (const e of candidates) {
    const diminishingFactor = diminishingFactors.get(e.id) ?? 1;
    const confidenceWeight = e.confidenceWeight ?? 1;
    const paths = e.activationPaths ?? [];

    for (const path of paths) {
      const factor = confidenceWeight * diminishingFactor * path.boundedPathWeight;
      const key = CHANNEL_MAP[path.channel];
      const ch = channels[key];
      ch.supportRaw += e.rawAxes.support * factor;
      ch.pressureRaw += e.rawAxes.pressure * factor;
      ch.activationRaw += e.rawAxes.activation * factor;
      ch.evidenceIds.push(e.id);
    }

    const strongestPath =
      paths.length === 0
        ? undefined
        : paths.reduce((a, b) => (b.boundedPathWeight > a.boundedPathWeight ? b : a));
    const overallFactor = strongestPath
      ? confidenceWeight * diminishingFactor * strongestPath.boundedPathWeight
      : 0;
    rawAxes.support += e.rawAxes.support * overallFactor;
    rawAxes.pressure += e.rawAxes.pressure * overallFactor;
    rawAxes.activation += e.rawAxes.activation * overallFactor;

    evidenceOut.push({
      ...e,
      effectiveWeight: overallFactor,
      weightedAxes: {
        support: e.rawAxes.support * overallFactor,
        pressure: e.rawAxes.pressure * overallFactor,
        stability: 0,
        activation: e.rawAxes.activation * overallFactor,
      },
    });
  }

  return {
    evidence: evidenceOut.sort((a, b) => a.id.localeCompare(b.id)),
    channels: {
      globalAnnualClimate: finalizeChannel(channels.globalAnnualClimate, knowledge),
      routedHeadImpact: finalizeChannel(channels.routedHeadImpact, knowledge),
      directDomainImpact: finalizeChannel(channels.directDomainImpact, knowledge),
      majorFortuneBackground: finalizeChannel(channels.majorFortuneBackground, knowledge),
    },
    rawAxes,
  };
}
