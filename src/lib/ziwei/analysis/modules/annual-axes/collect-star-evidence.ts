import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import type { AnnualDomainAnchorFrame, AnnualFrameNode } from "./collect-domain-frames";
import {
  type AnnualAxisEvidence,
  type AnnualAxisEvidenceLayer,
  type AnnualAxisRawAxes,
  type AnnualAxesDiagnostics,
} from "./types";

const ANNUAL_STAR_SOURCES = new Set(["annual"]);
const MUTAGEN_MARKER_SOURCES = new Set(["natal-mutagen", "annual-mutagen"]);

function isNatalPhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  return !ANNUAL_STAR_SOURCES.has(source) && !MUTAGEN_MARKER_SOURCES.has(source);
}

interface StarKnowledgeMatch {
  axes: AnnualAxisRawAxes;
  familyId?: string;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  starClass: "major" | "minor";
}

function resolveStarKnowledge(
  canonicalName: string,
  brightness: string | undefined,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): StarKnowledgeMatch | null {
  const major = numericKnowledge.majorStars.stars.find((s) => s.name === canonicalName);
  if (major) {
    const status = numericKnowledge.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numericKnowledge.majorStars.brightnessModifiers[brightness] ??
        numericKnowledge.majorStars.brightnessModifiers.Bình;
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
      sourceIds: numericKnowledge.majorStars.sourceIds,
      knowledgeStatus: status,
      starClass: "major",
    };
  }

  const minor = numericKnowledge.minorStars.stars.find((s) => s.canonicalName === canonicalName);
  if (minor && minor.scoringMode === "direct") {
    const family = numericKnowledge.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return null;
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy =
        numericKnowledge.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
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
      familyId: family.id,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
      starClass: "minor",
    };
  }

  return null;
}

function applyStarOverride(
  base: AnnualAxisRawAxes,
  canonicalName: string,
  annualKnowledge: AnnualAxesKnowledgeV0,
): AnnualAxisRawAxes {
  const override = annualKnowledge.starOverrides.records.find(
    (r) => r.canonicalStarName === canonicalName,
  );
  if (!override?.axesOverride) return base;
  return { ...base, ...override.axesOverride };
}

interface CollectStarEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  frames: AnnualDomainAnchorFrame[];
  numericKnowledge: PalaceOverviewKnowledgeV1;
  annualKnowledge: AnnualAxesKnowledgeV0;
  diagnostics: AnnualAxesDiagnostics;
}

function pushStarEvidence(
  out: AnnualAxisEvidence[],
  params: {
    domain: AnnualAxisDomain;
    layer: AnnualAxisEvidenceLayer;
    star: ChartStar;
    palace: ChartPalace;
    node: AnnualFrameNode;
    anchorWeight: number;
    anchorPalaceName: string;
    numericKnowledge: PalaceOverviewKnowledgeV1;
    annualKnowledge: AnnualAxesKnowledgeV0;
    diagnostics: AnnualAxesDiagnostics;
  },
) {
  const { domain, layer, star, palace, node, anchorWeight, anchorPalaceName, numericKnowledge, annualKnowledge, diagnostics } =
    params;
  const canonical = canonicalStarName(star.name);
  const match = resolveStarKnowledge(canonical, star.brightness, numericKnowledge);
  if (!match) {
    diagnostics.unknownStars.push(canonical);
    return;
  }

  const physicalFactId = `star:${palace.index}:${canonical}`;
  const axes = applyStarOverride(match.axes, canonical, annualKnowledge);
  const ruleId =
    match.starClass === "major" ? "RULE-AA-STAR-MAJOR-CANONICAL-V0" : "RULE-AA-STAR-MINOR-CANONICAL-V0";
  const stackingGroup = match.diminishingGroup ?? "major-star";

  out.push({
    id: `ann-axis:${domain}:${layer}:star:${physicalFactId}:${node.role}`,
    domain,
    layer,
    category: "star",
    physicalFactId,
    ruleId,
    targetPalaceIndex: palace.index,
    targetPalaceName: palace.name,
    targetAnnualPalaceName: node.annualPalaceName,
    frameRole: node.role,
    anchorPalaceName,
    stackingGroup,
    rawAxes: axes,
    effectiveWeight: anchorWeight,
    weightedAxes: axes,
    factIds: [physicalFactId],
    sourceIds: match.sourceIds,
    knowledgeStatus: match.knowledgeStatus,
  });
}

export function collectStarEvidence(input: CollectStarEvidenceInput): AnnualAxisEvidence[] {
  const { chart, domain, frames, numericKnowledge, annualKnowledge, diagnostics } = input;
  const out: AnnualAxisEvidence[] = [];

  // Deliberately no cross-anchor dedup here: when the same physical palace
  // is reachable through more than one anchor frame in this domain, every
  // candidate must survive to aggregate.ts, which alone picks the
  // highest-effective-weight contribution per the mission's dedup rule.
  for (const frame of frames) {
    for (const node of frame.nodes) {
      const palace = chart.palaces.find((p) => p.index === node.palaceIndex);
      if (!palace) continue;

      // annual layer — the "Lưu X" flowing stars physically at this node.
      for (const star of chart.annualStars ?? []) {
        if (star.palace.index !== node.palaceIndex) continue;
        pushStarEvidence(out, {
          domain,
          layer: "annual",
          star,
          palace,
          node,
          anchorWeight: frame.domainAnchorWeight,
          anchorPalaceName: frame.anchorPalaceName,
          numericKnowledge,
          annualKnowledge,
          diagnostics,
        });
      }

      // major-fortune layer — natal stars physically sitting in the
      // currently active Major Fortune palace, only when that palace is
      // itself one of this domain's frame nodes.
      if (chart.majorFortunePalace && chart.majorFortunePalace.index === node.palaceIndex) {
        for (const star of palace.stars ?? []) {
          if (!isNatalPhysicalStar(star)) continue;
          pushStarEvidence(out, {
            domain,
            layer: "major-fortune",
            star,
            palace,
            node,
            anchorWeight: frame.domainAnchorWeight,
            anchorPalaceName: frame.anchorPalaceName,
            numericKnowledge,
            annualKnowledge,
            diagnostics,
          });
        }
      }

      // natal-activated layer — natal stars physically sitting at this
      // frame node (any role).
      for (const star of palace.stars ?? []) {
        if (!isNatalPhysicalStar(star)) continue;
        pushStarEvidence(out, {
          domain,
          layer: "natal-activated",
          star,
          palace,
          node,
          anchorWeight: frame.domainAnchorWeight,
          anchorPalaceName: frame.anchorPalaceName,
          numericKnowledge,
          annualKnowledge,
          diagnostics,
        });
      }
    }
  }

  return out;
}
