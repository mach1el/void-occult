import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV03NamPhai,
} from "../../../knowledge/annual-axes/v0.3";
import mutagenImpactCatalog from "../../../knowledge/annual-axes/annual-mutagen-impact.v0.json";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type {
  AnnualAxisEvidence,
  AnnualAxisEvidenceLayer,
  AnnualAxisRawAxes,
  AnnualAxisFrameRole,
  AnnualAxesDiagnostics,
  AnnualDomainRouting,
} from "../types";
import { relationRole } from "./routing";

const ARCH_SOURCE_ID = "SRC-AA-ENG-003";
const ANNUAL_STAR_SOURCES = new Set(["annual"]);
const MUTAGEN_MARKER_SOURCES = new Set(["natal-mutagen", "annual-mutagen"]);

/** V0.3 reuses the V0.2 exact-target mutagen axes catalog — no new Tứ Hóa
 * tables are introduced by this PR (see corrective prompt non-goals). */
const MUTAGEN_IMPACT = mutagenImpactCatalog as {
  records: Array<{
    mutagen: string;
    axes: AnnualAxisRawAxes;
    stackingGroup: string;
    ruleId: string;
  }>;
};

function isNatalPhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  return !ANNUAL_STAR_SOURCES.has(source) && !MUTAGEN_MARKER_SOURCES.has(source);
}

interface StarResolution {
  axes: AnnualAxisRawAxes;
  starClass: "major" | "minor";
  familyId?: string;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

function resolveStar(
  canonical: string,
  brightness: string | undefined,
  numeric: PalaceOverviewKnowledgeV1,
): StarResolution | null {
  const major = numeric.majorStars.stars.find((s) => s.name === canonical);
  if (major) {
    const status = numeric.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numeric.majorStars.brightnessModifiers[brightness] ??
        numeric.majorStars.brightnessModifiers.Bình;
      if (modifier) {
        axes = {
          support: axes.support * modifier.supportFactor,
          pressure: axes.pressure * modifier.pressureFactor,
          stability: axes.stability + modifier.stabilityDelta,
          activation: axes.activation * modifier.activationFactor,
        };
      }
    }
    return {
      axes,
      starClass: "major",
      sourceIds: numeric.majorStars.sourceIds,
      knowledgeStatus: status,
    };
  }

  const minor = numeric.minorStars.stars.find((s) => s.canonicalName === canonical);
  if (minor && minor.scoringMode === "direct") {
    const family = numeric.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return null;
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy = numeric.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
      if (policy) {
        axes = {
          support: axes.support * policy.supportFactor,
          pressure: axes.pressure * policy.pressureFactor,
          stability: axes.stability + policy.stabilityDelta,
          activation: axes.activation * policy.activationFactor,
        };
      }
    }
    return {
      axes,
      starClass: "minor",
      familyId: family.id,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
    };
  }

  return null;
}

interface ChannelWeights {
  headChannelWeight: number;
  localChannelWeight: number;
  bestLocalAnchorName: string | null;
  bestLocalRole: AnnualAxisFrameRole | "outside";
  headRole: AnnualAxisFrameRole | "outside";
}

function computeChannelWeights(
  targetPalaceIndex: number,
  domain: AnnualAxisDomain,
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV03NamPhai,
  headFrame: AnnualFocusFrame,
): ChannelWeights {
  const headWeights = knowledge.routingProfile.headFrameRoleWeights;
  const localWeights = knowledge.routingProfile.localDomainFrameRoleWeights;

  const headRole = relationRole(headFrame.focusPalaceIndex, targetPalaceIndex);
  const headChannelWeight = headWeights[headRole];

  const nameToIndex = new Map<string, number>();
  for (const palace of chart.palaces) {
    if (palace.name && !nameToIndex.has(palace.name)) {
      nameToIndex.set(palace.name, palace.index);
    }
  }

  const domainDefinition = knowledge.axisDefinitions.domains.find((d) => d.domain === domain);
  if (!domainDefinition) {
    return { headChannelWeight, localChannelWeight: 0, bestLocalAnchorName: null, bestLocalRole: "outside", headRole };
  }

  let best = 0;
  let bestName: string | null = null;
  let bestRole: AnnualAxisFrameRole | "outside" = "outside";
  for (const anchor of domainDefinition.anchors) {
    const anchorIndex = nameToIndex.get(anchor.palaceName);
    if (anchorIndex === undefined) continue;
    const role = relationRole(anchorIndex, targetPalaceIndex);
    const weight = anchor.weight * localWeights[role];
    if (weight > best) {
      best = weight;
      bestName = anchor.palaceName;
      bestRole = role === "outside" ? "outside" : (role as AnnualAxisFrameRole);
    }
  }

  return {
    headChannelWeight,
    localChannelWeight: best,
    bestLocalAnchorName: bestName,
    bestLocalRole: bestRole,
    headRole,
  };
}

interface PhysicalFactSpec {
  physicalFactId: string;
  category: AnnualAxisEvidence["category"];
  layer: AnnualAxisEvidenceLayer;
  ruleId: string;
  targetPalace: ChartPalace;
  rawAxes: AnnualAxisRawAxes;
  stackingGroup: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  layerWeightKey: keyof AnnualAxesKnowledgeV03NamPhai["layerWeights"]["weights"];
  factIds?: string[];
}

function buildEvidenceFromFact(
  fact: PhysicalFactSpec,
  domain: AnnualAxisDomain,
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV03NamPhai,
  headFrame: AnnualFocusFrame,
  routing: AnnualDomainRouting,
): AnnualAxisEvidence | null {
  const channels = computeChannelWeights(fact.targetPalace.index, domain, chart, knowledge, headFrame);
  const { headChannelWeight, localChannelWeight, bestLocalAnchorName, bestLocalRole, headRole } = channels;

  if (headChannelWeight === 0 && localChannelWeight === 0) return null;

  const combinedGeometryWeight =
    routing.headShare * headChannelWeight + routing.localShare * localChannelWeight;

  const confidenceWeight = knowledge.scoringProfile.confidenceWeights[fact.knowledgeStatus];
  const layerWeight = knowledge.layerWeights.weights[fact.layerWeightKey];

  const effectiveWeight = combinedGeometryWeight * layerWeight * confidenceWeight;
  const weightedAxes: AnnualAxisRawAxes = {
    support: fact.rawAxes.support * effectiveWeight,
    pressure: fact.rawAxes.pressure * effectiveWeight,
    stability: fact.rawAxes.stability * effectiveWeight,
    activation: fact.rawAxes.activation * effectiveWeight,
  };

  const anchorPalaceName = bestLocalAnchorName ?? "annual-head";
  const frameRole: AnnualAxisFrameRole =
    localChannelWeight >= headChannelWeight
      ? bestLocalRole === "outside"
        ? headRole === "outside"
          ? "focus"
          : (headRole as AnnualAxisFrameRole)
        : (bestLocalRole as AnnualAxisFrameRole)
      : headRole === "outside"
        ? "focus"
        : (headRole as AnnualAxisFrameRole);

  return {
    id: `ann-axis:${domain}:${fact.layer}:${fact.category}:${fact.physicalFactId}`,
    domain,
    layer: fact.layer,
    category: fact.category,
    physicalFactId: fact.physicalFactId,
    ruleId: fact.ruleId,
    targetPalaceIndex: fact.targetPalace.index,
    targetPalaceName: fact.targetPalace.name,
    targetAnnualPalaceName: fact.targetPalace.annualPalaceName ?? null,
    frameRole,
    anchorPalaceName,
    stackingGroup: fact.stackingGroup,
    rawAxes: fact.rawAxes,
    effectiveWeight,
    weightedAxes,
    factIds: fact.factIds ?? [fact.physicalFactId],
    sourceIds: fact.sourceIds.length > 0 ? fact.sourceIds : [ARCH_SOURCE_ID],
    knowledgeStatus: fact.knowledgeStatus,
    headChannelWeight,
    localChannelWeight,
    combinedGeometryWeight,
    routing: routing.routing,
    headShare: routing.headShare,
    localShare: routing.localShare,
  };
}

interface CollectNpV03Input {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV03NamPhai;
  numericKnowledge: PalaceOverviewKnowledgeV1;
  headFrame: AnnualFocusFrame;
  routing: AnnualDomainRouting;
  diagnostics: AnnualAxesDiagnostics;
}

/**
 * Collect V0.3 head-centric physical-fact evidence for one domain: one
 * evidence item per physical fact per domain, blended at the channel
 * level from the annual-head frame and the domain-local frames.
 */
export function collectNamPhaiV03PhysicalFacts(input: CollectNpV03Input): AnnualAxisEvidence[] {
  const { chart, domain, knowledge, numericKnowledge, headFrame, routing, diagnostics } = input;
  const factsByKey = new Map<string, PhysicalFactSpec>();

  const pushFact = (fact: PhysicalFactSpec) => {
    if (factsByKey.has(fact.physicalFactId)) {
      diagnostics.duplicatePhysicalFactBlend.push(`${domain}:${fact.physicalFactId}`);
      return;
    }
    factsByKey.set(fact.physicalFactId, fact);
  };

  const majorLayerWeight: keyof AnnualAxesKnowledgeV03NamPhai["layerWeights"]["weights"] =
    "major-fortune-context";

  for (const palace of chart.palaces) {
    for (const star of palace.stars ?? []) {
      if (!isNatalPhysicalStar(star)) continue;
      const canonical = canonicalStarName(star.name);
      const res = resolveStar(canonical, star.brightness, numericKnowledge);
      if (!res) continue;
      const isInMajor =
        chart.majorFortunePalace && chart.majorFortunePalace.index === palace.index;
      pushFact({
        physicalFactId: `natal-star:${palace.index}:${canonical}`,
        category: "star",
        layer: isInMajor ? "major-fortune" : "natal-activated",
        ruleId:
          res.starClass === "major"
            ? "RULE-AA-STAR-MAJOR-CANONICAL-V0"
            : "RULE-AA-STAR-MINOR-CANONICAL-V0",
        targetPalace: palace,
        rawAxes: res.axes,
        stackingGroup: res.diminishingGroup ?? "major-star",
        sourceIds: res.sourceIds,
        knowledgeStatus: res.knowledgeStatus,
        layerWeightKey: isInMajor ? majorLayerWeight : "natal-physical-star",
      });
    }
  }

  for (const annualStar of chart.annualStars ?? []) {
    const canonical = canonicalStarName(annualStar.name);
    const res = resolveStar(canonical, annualStar.brightness, numericKnowledge);
    if (!res) continue;
    const palace = annualStar.palace;
    pushFact({
      physicalFactId: `annual-star:${palace.index}:${canonical}`,
      category: "star",
      layer: "annual",
      ruleId: "RULE-AA-STAR-ANNUAL-MOVING-V03",
      targetPalace: palace,
      rawAxes: res.axes,
      stackingGroup: res.diminishingGroup ?? "annual-moving-star",
      sourceIds: res.sourceIds,
      knowledgeStatus: res.knowledgeStatus,
      layerWeightKey: "annual-moving-star",
    });
  }

  const pushMutagens = (
    records: MutagenRecord[] | undefined,
    layer: AnnualAxisEvidenceLayer,
    layerKey: keyof AnnualAxesKnowledgeV03NamPhai["layerWeights"]["weights"],
  ) => {
    if (!records) return;
    for (const record of records) {
      if (!record.palace) continue;
      const impact = MUTAGEN_IMPACT.records.find((r) => r.mutagen === record.mutagen);
      if (!impact) {
        diagnostics.unknownMutagens.push(record.mutagen);
        continue;
      }
      const canonical = canonicalStarName(record.starName);
      pushFact({
        physicalFactId: `mutagen:${record.palace.index}:${record.mutagen}:${canonical}`,
        category: "mutagen",
        layer,
        ruleId: impact.ruleId,
        targetPalace: record.palace,
        rawAxes: { ...impact.axes },
        stackingGroup: impact.stackingGroup,
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
        layerWeightKey: layerKey,
      });
    }
  };

  pushMutagens(chart.annualMutagens, "annual", "annual-transformation");
  pushMutagens(chart.natalMutagens, "natal-activated", "natal-physical-star");
  pushMutagens(chart.majorMutagens, "major-fortune", "major-fortune-context");

  const out: AnnualAxisEvidence[] = [];
  for (const fact of factsByKey.values()) {
    const evidence = buildEvidenceFromFact(fact, domain, chart, knowledge, headFrame, input.routing);
    if (evidence) out.push(evidence);
  }
  return out;
}
