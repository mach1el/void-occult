import type { ChartData, ChartPalace } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV03NamPhai,
} from "../../../knowledge/annual-axes/v0.3";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type {
  AnnualAxisEvidence,
  AnnualAxisFrameRole,
  AnnualAxisRawAxes,
  AnnualDomainRouting,
  AnnualAxesDiagnostics,
} from "../types";
import { relationRole } from "./routing";

const ARCH_SOURCE_ID = "SRC-AA-ENG-003";

interface HeadStructuralInput {
  domain: AnnualAxisDomain;
  headFrame: AnnualFocusFrame;
  routing: AnnualDomainRouting;
  knowledge: AnnualAxesKnowledgeV03NamPhai;
  diagnostics: AnnualAxesDiagnostics;
}

/**
 * V0.3 head structural activation. Adds `baseRaw + routingRangeRaw *
 * routing` to activation only; support/pressure/stability deltas are
 * hard-locked to zero (enforced by the loader's validator too).
 */
export function buildHeadStructuralEvidence(input: HeadStructuralInput): AnnualAxisEvidence {
  const { domain, headFrame, routing, knowledge } = input;
  const spec = knowledge.routingProfile.structuralActivation;
  const activationRaw = spec.baseRaw + spec.routingRangeRaw * routing.routing;

  const rawAxes: AnnualAxisRawAxes = {
    support: 0,
    pressure: 0,
    stability: 0,
    activation: activationRaw,
  };

  return {
    id: `ann-axis:${domain}:annual:annual-focus:head-structural:${headFrame.focusPalaceIndex}`,
    domain,
    layer: "annual",
    category: "annual-focus",
    physicalFactId: `annual-head-structural:${headFrame.focusPalaceIndex}`,
    ruleId: "RULE-AA-V03-HEAD-ROUTING",
    targetPalaceIndex: headFrame.focusPalaceIndex,
    targetPalaceName: headFrame.focusPalaceName,
    targetAnnualPalaceName: headFrame.focusAnnualPalaceName,
    frameRole: "focus" as AnnualAxisFrameRole,
    anchorPalaceName: "annual-head",
    stackingGroup: "annual-head-structural",
    rawAxes,
    effectiveWeight: 1,
    weightedAxes: { ...rawAxes },
    factIds: [`annual-head-structural:${headFrame.focusPalaceIndex}`],
    sourceIds: [ARCH_SOURCE_ID],
    knowledgeStatus: "experimental",
    routing: routing.routing,
    headShare: routing.headShare,
    localShare: routing.localShare,
    headChannelWeight: knowledge.routingProfile.headFrameRoleWeights.focus,
    localChannelWeight: 0,
    combinedGeometryWeight:
      routing.headShare * knowledge.routingProfile.headFrameRoleWeights.focus,
  };
}

interface SecondaryContextInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  headFrame: AnnualFocusFrame;
  routing: AnnualDomainRouting;
  knowledge: AnnualAxesKnowledgeV03NamPhai;
  diagnostics: AnnualAxesDiagnostics;
}

function palaceIsInHeadFrame(headFrame: AnnualFocusFrame, palace: ChartPalace | null | undefined): boolean {
  if (!palace) return false;
  const role = relationRole(headFrame.focusPalaceIndex, palace.index);
  return role !== "outside";
}

/**
 * V0.3 secondary context markers. Both the Tam Hợp small-limit palace
 * and the Tai Tue palace contribute activation-only markers according to
 * `annual-context-markers.nam-phai.v0.3.json`. Their layer weight is the
 * relevant secondary weight from `annual-layer-weights.nam-phai.v0.3.json`;
 * they never replace the annual head.
 */
export function collectNamPhaiV03SecondaryContext(
  input: SecondaryContextInput,
): AnnualAxisEvidence[] {
  const { chart, domain, headFrame, routing, knowledge } = input;
  const out: AnnualAxisEvidence[] = [];

  const pushMarker = (
    palace: ChartPalace | null | undefined,
    markerId: string,
    ruleId: string,
    baseActivation: number,
    layerWeightKey: keyof AnnualAxesKnowledgeV03NamPhai["layerWeights"]["weights"],
    stackingGroup: string,
  ) => {
    if (!palace) return;
    const layerWeight = knowledge.layerWeights.weights[layerWeightKey];
    const headWeights = knowledge.routingProfile.headFrameRoleWeights;
    const role = relationRole(headFrame.focusPalaceIndex, palace.index);
    const headChannelWeight = headWeights[role];
    const combinedGeometryWeight = routing.headShare * headChannelWeight;
    const effectiveWeight = combinedGeometryWeight * layerWeight;

    const rawAxes: AnnualAxisRawAxes = {
      support: 0,
      pressure: 0,
      stability: 0,
      activation: baseActivation,
    };
    const weightedAxes: AnnualAxisRawAxes = {
      support: 0,
      pressure: 0,
      stability: 0,
      activation: baseActivation * effectiveWeight,
    };

    out.push({
      id: `ann-axis:${domain}:annual:focal-marker:${markerId}:${palace.index}`,
      domain,
      layer: "annual",
      category: "focal-marker",
      physicalFactId: `${markerId}:${palace.index}`,
      ruleId,
      targetPalaceIndex: palace.index,
      targetPalaceName: palace.name,
      targetAnnualPalaceName: palace.annualPalaceName ?? null,
      frameRole: role === "outside" ? "focus" : (role as AnnualAxisFrameRole),
      anchorPalaceName: markerId,
      stackingGroup,
      rawAxes,
      effectiveWeight,
      weightedAxes,
      factIds: [`${markerId}:${palace.index}`],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
      headChannelWeight,
      localChannelWeight: 0,
      combinedGeometryWeight,
      routing: routing.routing,
      headShare: routing.headShare,
      localShare: routing.localShare,
    });
  };

  const smallLimitMarker = knowledge.contextMarkers.records.find(
    (r) => r.markerId === "tam-hop-small-limit-secondary",
  );
  if (
    smallLimitMarker?.baseAxes &&
    chart.smallLimitPalace &&
    !(palaceIsInHeadFrame(headFrame, chart.smallLimitPalace) &&
      chart.smallLimitPalace.index === headFrame.focusPalaceIndex)
  ) {
    // Guard: when small-limit coincides with the annual head palace, the
    // head structural evidence already dominates that palace.
    pushMarker(
      chart.smallLimitPalace,
      "tam-hop-small-limit",
      smallLimitMarker.ruleId,
      smallLimitMarker.baseAxes.activation,
      "tam-hop-small-limit-secondary",
      "tam-hop-small-limit-secondary",
    );
  }

  const taiTueMarker = knowledge.contextMarkers.records.find(
    (r) => r.markerId === "tai-tue-external-context",
  );
  if (taiTueMarker?.baseAxes && chart.taiTuePalace) {
    pushMarker(
      chart.taiTuePalace,
      "tai-tue-external-context",
      taiTueMarker.ruleId,
      taiTueMarker.baseAxes.activation,
      "tai-tue-external-context",
      "tai-tue-external-context",
    );
  }

  return out;
}
