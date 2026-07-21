/**
 * Shared spatial-budget scoring path for production (E) and ablation variants
 * B–E. Each variant is a COMPLETE, explicit configuration so the ablation is
 * strictly stepwise — B→C changes only dedupe, C→D changes only the activation
 * gate, D→E changes only whether geometryBucket joins the diminishing grouping.
 * Every variant is executed independently; no variant relabels another's output.
 */

import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { emptyAnnualAxesDiagnostics } from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { classifyEvidencePaths } from "./classify-paths";
import { aggregateSpatialBudget, type DiminishingGroupBy } from "./aggregate-spatial";
import { dedupeSpatialPaths } from "./dedupe";
import {
  isValidActivationGate,
  normalizeSpatialBudgetV043,
  type ActivationGateOverride,
} from "./normalize-spatial";

export interface SpatialVariantDomainMetrics {
  domain: AnnualAxisDomain;
  score: number | null;
  directContribution: number;
  tp4cContribution: number;
  spatialSigned: number;
  activationGate: number;
  activationRaw: number;
  activationNorm: number;
  retainedSignedFactCount: number;
  retainedActivationFactCount: number;
  directWonCollisionCount: number;
  numericEvidenceCount: number;
}

/**
 * A COMPLETE spatial-budget variant configuration. Every field is explicit so
 * the difference between any two variants is exactly one field.
 */
export interface SpatialVariantConfig {
  /** Physical-fact direct-wins dedupe. B = false (disabled); C/D/E = true. */
  dedupe: boolean;
  /** Activation-gate policy as a complete pair (never floor-only). */
  activationGate: ActivationGateOverride;
  /** Diminishing-return grouping keys. */
  diminishingGroupBy: DiminishingGroupBy;
}

const GROUP_BY_NO_GEOMETRY: DiminishingGroupBy = ["domain", "layer", "stackingGroup"];
const GROUP_BY_WITH_GEOMETRY: DiminishingGroupBy = [
  "domain",
  "geometryBucket",
  "layer",
  "stackingGroup",
];
const GATE_FLOORED: ActivationGateOverride = { floor: 0.15, range: 0.85 };
const GATE_ZERO_FLOOR: ActivationGateOverride = { floor: 0.0, range: 1.0 };

const UNAVAILABLE_DOMAIN = (domain: AnnualAxisDomain): SpatialVariantDomainMetrics => ({
  domain,
  score: null,
  directContribution: 0,
  tp4cContribution: 0,
  spatialSigned: 0,
  activationGate: 0,
  activationRaw: 0,
  activationNorm: 0,
  retainedSignedFactCount: 0,
  retainedActivationFactCount: 0,
  directWonCollisionCount: 0,
  numericEvidenceCount: 0,
});

/** Score all six domains under a spatial-budget variant (research / ablation). */
export function scoreSpatialVariantDomains(
  chart: ChartData,
  config: SpatialVariantConfig,
): SpatialVariantDomainMetrics[] {
  if (!isValidActivationGate(config.activationGate)) {
    throw new Error(
      `invalid variant activation gate {floor:${config.activationGate.floor}, range:${config.activationGate.range}}`,
    );
  }

  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  const knowledge043 = loadAnnualAxesKnowledgeV043NamPhai();
  const numeric = loadPalaceOverviewKnowledgeV1();
  if (!knowledge04.ok || !knowledge042.ok || !knowledge043.ok || !numeric.ok) {
    throw new Error("knowledge load failed for spatial variant scoring");
  }

  const diagnostics = emptyAnnualAxesDiagnostics();
  const focus = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focus.focus ? buildAnnualFocusFrame(chart, focus.focus) : null;
  if (!headFrame) {
    return ANNUAL_AXIS_DOMAINS.map(UNAVAILABLE_DOMAIN);
  }

  const routings = computeDomainRoutingsV04(chart, knowledge04.knowledge, headFrame, diagnostics);
  const out: SpatialVariantDomainMetrics[] = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const routing = routings.get(domain);
    if (!routing) {
      out.push(UNAVAILABLE_DOMAIN(domain));
      continue;
    }

    const { evidence, stats } = collectNamPhaiV04TriggeredEvidence({
      chart,
      domain,
      knowledge: knowledge04.knowledge,
      knowledge042: knowledge042.knowledge,
      numericKnowledge: numeric.knowledge,
      headFrame,
      routing,
      diagnostics,
    });

    const classified = classifyEvidencePaths(
      evidence,
      headFrame.focusPalaceIndex,
      knowledge043.knowledge.spatialBudget.tp4cRelativeRoleWeights,
    );

    const deduped = config.dedupe
      ? dedupeSpatialPaths(classified, knowledge043.knowledge)
      : noDedupe(classified, knowledge043.knowledge.aggregationProfile.contextChannels.mayContributeActivation);

    const aggregated = aggregateSpatialBudget(deduped, knowledge043.knowledge, {
      diminishingGroupBy: config.diminishingGroupBy,
    });
    const natalResponse = computeNatalDomainResponse(
      chart,
      domain,
      knowledge04.knowledge,
      numeric.knowledge,
    );
    const normalized = normalizeSpatialBudgetV043({
      spatialSigned: aggregated.spatialSigned,
      activationNorm: aggregated.activationNorm,
      natalResponse,
      rawAxes: aggregated.rawAxes,
      knowledge043: knowledge043.knowledge,
      knowledge04: knowledge04.knowledge,
      activationGateOverride: config.activationGate,
    });

    out.push({
      domain,
      score: normalized.score,
      directContribution: aggregated.spatialBudgetTrace.directContribution,
      tp4cContribution: aggregated.spatialBudgetTrace.tp4cContribution,
      spatialSigned: aggregated.spatialSigned,
      activationGate: normalized.activationGate,
      activationRaw: aggregated.activationRaw,
      activationNorm: aggregated.activationNorm,
      retainedSignedFactCount: deduped.trace.retainedSignedFactCount,
      retainedActivationFactCount: deduped.trace.retainedActivationFactCount,
      directWonCollisionCount: deduped.trace.directWonCollisionCount,
      numericEvidenceCount: stats.numericFacts,
    });
  }

  return out;
}

/** Variant B — keep every classified path (no physical-fact dedupe). */
function noDedupe(
  classified: ReturnType<typeof classifyEvidencePaths>,
  mayContributeActivation: boolean,
): ReturnType<typeof dedupeSpatialPaths> {
  const signed = classified.filter(
    (c) => c.geometryBucket === "direct" || c.geometryBucket === "tp4c",
  );
  const activation = classified.filter(
    (c) =>
      c.geometryBucket === "direct" ||
      c.geometryBucket === "tp4c" ||
      mayContributeActivation,
  );
  return {
    signedRetained: signed,
    activationRetained: activation,
    rejected: [],
    trace: {
      candidateEvidenceCount: new Set(classified.map((c) => c.evidence.id)).size,
      candidatePathCount: classified.length,
      retainedSignedFactCount: signed.length,
      retainedActivationFactCount: activation.length,
      droppedDuplicatePathCount: 0,
      directWonCollisionCount: 0,
    },
  };
}

/** Ablation matrix — each preset changes exactly ONE field from the previous. */
export const ABLATION_SPATIAL_VARIANTS = {
  "B-budget-only-no-dedupe": {
    dedupe: false,
    activationGate: GATE_FLOORED,
    diminishingGroupBy: GROUP_BY_NO_GEOMETRY,
  },
  "C-budget-plus-direct-wins": {
    dedupe: true,
    activationGate: GATE_FLOORED,
    diminishingGroupBy: GROUP_BY_NO_GEOMETRY,
  },
  "D-c-plus-activation-floor-0": {
    dedupe: true,
    activationGate: GATE_ZERO_FLOOR,
    diminishingGroupBy: GROUP_BY_NO_GEOMETRY,
  },
  "E-d-plus-diminishing-geometryBucket": {
    dedupe: true,
    activationGate: GATE_ZERO_FLOOR,
    diminishingGroupBy: GROUP_BY_WITH_GEOMETRY,
  },
} as const satisfies Record<string, SpatialVariantConfig>;

/** Production V0.4.3 == variant E. */
export const PRODUCTION_SPATIAL_VARIANT: SpatialVariantConfig =
  ABLATION_SPATIAL_VARIANTS["E-d-plus-diminishing-geometryBucket"];

// Fail closed at module load: every research variant must carry a valid gate.
for (const [id, cfg] of Object.entries(ABLATION_SPATIAL_VARIANTS)) {
  if (!isValidActivationGate(cfg.activationGate)) {
    throw new Error(`ablation variant ${id} has an invalid activation gate`);
  }
}
