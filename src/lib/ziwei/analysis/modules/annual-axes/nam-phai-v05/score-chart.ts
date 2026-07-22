import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { emptyAnnualAxesDiagnostics } from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { classifyEvidencePaths } from "../nam-phai-v043/classify-paths";
import { dedupeV05SpatialPaths } from "./dedupe";
import { aggregateV05Buckets } from "./aggregate-buckets";
import { scoreV05Domain, type V05DomainScoreTrace } from "./score-domain";
import type { V05BucketAggregateResult } from "./aggregate-buckets";

export interface V05DomainIntermediate {
  domain: AnnualAxisDomain;
  aggregate: V05BucketAggregateResult;
  annualActivationRaw: number;
  spatialSigned: number;
  natalGain: number;
  activationGate: number;
  latent: number;
  score: number;
  /** Calibrated score trace from the first (and only) `scoreV05Domain` pass. */
  trace: V05DomainScoreTrace;
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
export function scoreV05ChartDomains(
  chart: ChartData,
  knowledge05: AnnualAxesKnowledgeV05NamPhai,
  options?: {
    activationScaleOverride?: number;
    domainScaleOverride?: Partial<Record<AnnualAxisDomain, number>>;
  },
): V05DomainIntermediate[] | null {
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
  const out: V05DomainIntermediate[] = [];

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
      knowledge05.spatialBudget.tp4cRelativeRoleWeights,
    );
    const deduped = dedupeV05SpatialPaths(classified, knowledge05);
    const aggregate = aggregateV05Buckets(deduped, knowledge05);
    const natalResponse = computeNatalDomainResponse(
      chart,
      domain,
      knowledge04.knowledge,
      numeric.knowledge,
    );
    const scored = scoreV05Domain({
      aggregate,
      natalResponse,
      domain,
      knowledge: knowledge05,
      activationScaleOverride: options?.activationScaleOverride,
      domainScaleOverride: options?.domainScaleOverride?.[domain],
    });

    out.push({
      domain,
      aggregate,
      annualActivationRaw: aggregate.annualActivationRaw,
      spatialSigned: aggregate.spatialSigned,
      natalGain: scored.trace.natalGain,
      activationGate: scored.activationGate,
      latent: scored.latent,
      score: scored.score,
      trace: scored.trace,
    });
  }

  return out;
}

/** Map chart domain intermediates to axis rows — never re-scores domains. */
export function scoreV05ChartToAxes(
  chart: ChartData,
  knowledge05: AnnualAxesKnowledgeV05NamPhai,
  knowledge04: AnnualAxesKnowledgeV04NamPhai,
  options?: Parameters<typeof scoreV05ChartDomains>[2],
) {
  const domains = scoreV05ChartDomains(chart, knowledge05, options);
  if (!domains) return null;

  return domains.map((d) => ({
    domain: d.domain,
    score: d.score,
    band: resolveBand(d.score, knowledge04),
    activationGate: d.activationGate,
    latent: d.latent,
    aggregate: d.aggregate,
    trace: d.trace,
  }));
}
