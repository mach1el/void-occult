import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import type { AnnualAxesKnowledgeV07NamPhai } from "../../../knowledge/annual-axes/v0.7";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { emptyAnnualAxesDiagnostics } from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { classifyEvidencePaths } from "../nam-phai-v043/classify-paths";
import { dedupeV07SpatialPaths } from "./dedupe";
import { aggregateV07Buckets } from "./aggregate-buckets";
import { scoreV07Domain, type V07DomainScoreTrace } from "./score-domain";
import type { V07BucketAggregateResult } from "./aggregate-buckets";

export interface V07DomainIntermediate {
  domain: AnnualAxisDomain;
  aggregate: V07BucketAggregateResult;
  annualActivationRaw: number;
  spatialSignedRaw: number;
  domainCenter: number;
  centeredSpatial: number;
  natalGain: number;
  activationGate: number;
  strictLatent: number;
  score: number;
  /** Calibrated score trace from the first (and only) `scoreV07Domain` pass. */
  trace: V07DomainScoreTrace;
}

function resolveBand(score: number, knowledge04: AnnualAxesKnowledgeV04NamPhai) {
  for (const band of knowledge04.deltaProfile.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id;
  }
  return "balanced" as const;
}

/** Score one chart across all domains — used by analyzer and calibration. */
export function scoreV07ChartDomains(
  chart: ChartData,
  knowledge07: AnnualAxesKnowledgeV07NamPhai,
  options?: {
    activationScaleOverride?: number;
    domainScaleOverride?: Partial<Record<AnnualAxisDomain, number>>;
    domainCenterOverride?: Partial<Record<AnnualAxisDomain, number>>;
    signedLayerFactorsOverride?: import("../../../knowledge/annual-axes/v0.7").AnnualSignedLayerFactorsV07;
  },
): V07DomainIntermediate[] | null {
  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  const numeric = loadPalaceOverviewKnowledgeV1();
  if (!knowledge04.ok || !knowledge042.ok || !numeric.ok) return null;

  const diagnostics = emptyAnnualAxesDiagnostics();
  const focus = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focus.focus ? buildAnnualFocusFrame(chart, focus.focus) : null;
  if (!headFrame) return null;

  const routings = computeDomainRoutingsV04(
    chart,
    knowledge04.knowledge,
    headFrame,
    diagnostics,
  );
  const out: V07DomainIntermediate[] = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const routing = routings.get(domain);
    if (!routing) continue;

    const { evidence } = collectNamPhaiV04TriggeredEvidence({
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
      knowledge07.spatialBudget.tp4cRelativeRoleWeights,
    );
    const deduped = dedupeV07SpatialPaths(classified, knowledge07);
    const aggregate = aggregateV07Buckets(deduped, knowledge07, {
      signedLayerFactorsOverride: options?.signedLayerFactorsOverride,
    });
    const natalResponse = computeNatalDomainResponse(
      chart,
      domain,
      knowledge04.knowledge,
      numeric.knowledge,
    );
    const scored = scoreV07Domain({
      aggregate,
      natalResponse,
      domain,
      knowledge: knowledge07,
      activationScaleOverride: options?.activationScaleOverride,
      domainScaleOverride: options?.domainScaleOverride?.[domain],
      domainCenterOverride: options?.domainCenterOverride?.[domain],
    });

    out.push({
      domain,
      aggregate,
      annualActivationRaw: aggregate.annualActivationRaw,
      spatialSignedRaw: scored.spatialSignedRaw,
      domainCenter: scored.domainCenter,
      centeredSpatial: scored.centeredSpatial,
      natalGain: scored.trace.natalGain,
      activationGate: scored.activationGate,
      strictLatent: scored.strictLatent,
      score: scored.score,
      trace: scored.trace,
    });
  }

  return out;
}

/** Map chart domain intermediates to axis rows — never re-scores domains. */
export function scoreV07ChartToAxes(
  chart: ChartData,
  knowledge07: AnnualAxesKnowledgeV07NamPhai,
  knowledge04: AnnualAxesKnowledgeV04NamPhai,
  options?: Parameters<typeof scoreV07ChartDomains>[2],
) {
  const domains = scoreV07ChartDomains(chart, knowledge07, options);
  if (!domains) return null;

  return domains.map((d) => ({
    domain: d.domain,
    score: d.score,
    band: resolveBand(d.score, knowledge04),
    activationGate: d.activationGate,
    strictLatent: d.strictLatent,
    aggregate: d.aggregate,
    trace: d.trace,
  }));
}
