import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";

export interface AnnualAxisRawAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type AnnualAxisBand = "guarded" | "balanced" | "supportive" | "strong";

export type AnnualAxisEvidenceLayer = "annual" | "major-fortune" | "natal-activated";

export type AnnualAxisEvidenceCategory =
  | "star"
  | "mutagen"
  | "focal-marker"
  | "annual-focus"
  | "interaction";

export type AnnualAxisFrameRole = "focus" | "opposite" | "trine";

/** V0.4.3 — geometry class after spatial-budget path classification. */
export type AnnualGeometryClass =
  | "direct-exact-target"
  | "direct-head-focus"
  | "tp4c-opposite"
  | "tp4c-trine"
  | "context-only";

/** V0.4.3 — signed-budget bucket for a classified path. */
export type AnnualGeometryBucket = "direct" | "tp4c" | "context-only";

/** V0.4.3 — reconstructable direct vs TP4C contribution trace. */
export interface AnnualSpatialBudgetTrace {
  directBudget: number;
  tp4cBudget: number;
  directSupportRaw: number;
  directPressureRaw: number;
  directSigned: number;
  directContribution: number;
  tp4cSupportRaw: number;
  tp4cPressureRaw: number;
  tp4cSigned: number;
  tp4cContribution: number;
  spatialSigned: number;
}

/** V0.4.3 — physical-fact dedupe counters for one domain result. */
export interface AnnualEvidenceDedupeTrace {
  candidateEvidenceCount: number;
  candidatePathCount: number;
  retainedSignedFactCount: number;
  retainedActivationFactCount: number;
  droppedDuplicatePathCount: number;
  directWonCollisionCount: number;
}

export interface AnnualAxisEvidence {
  id: string;
  domain: AnnualAxisDomain;
  layer: AnnualAxisEvidenceLayer;
  category: AnnualAxisEvidenceCategory;
  /** Layer-independent identity of the underlying physical fact (star/mutagen/marker). */
  physicalFactId: string;
  ruleId: string;
  targetPalaceIndex: number;
  targetPalaceName: string;
  /** The target palace's own resolved annual label — distinct from
   * `anchorPalaceName` (the anchor's label), since opposite/trine nodes
   * carry a different annual label than their anchor. Null only if the
   * physical palace genuinely has no annual label. */
  targetAnnualPalaceName: string | null;
  frameRole: AnnualAxisFrameRole;
  /** Annual label of the anchor palace whose frame collected this evidence. */
  anchorPalaceName: string;
  /** Diminishing-return competition group within the same domain+layer
   * (e.g. a minor-star family id, "major-star", "annual-mutagen",
   * "focal-marker"). Set at collection time since only the collector knows
   * the underlying knowledge grouping. */
  stackingGroup: string;
  rawAxes: AnnualAxisRawAxes;
  effectiveWeight: number;
  weightedAxes: AnnualAxisRawAxes;
  /** V0.4.1 — confidence weight kept separate from `effectiveWeight` so
   * channel aggregation can apply it once, independently per path (§6). */
  confidenceWeight?: number;
  factIds: string[];
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  /** V0.3 Nam Phái head-centric channel-blend provenance. Undefined for
   * legacy V0.2 evidence rows (Trung Châu path). */
  headChannelWeight?: number;
  localChannelWeight?: number;
  combinedGeometryWeight?: number;
  routing?: number;
  headShare?: number;
  localShare?: number;
  /** V0.4 — annual triggers that activated this natal-derived fact. */
  annualTriggerIds?: string[];
  /** V0.4 — domain affinity weight applied to this evidence.
   * @deprecated V0.4.2 replaced affinity-as-eligibility with physical
   * palace ownership (`ownershipWeight` below) — no longer populated by
   * `nam-phai-v04/collect-evidence.ts`. */
  affinityWeight?: number;
  /** @deprecated see `affinityWeight`. */
  affinitySource?: "exact-star" | "star-family" | "transformation" | "moving-marker";
  /** @deprecated see `affinityWeight`. */
  affinityRecordId?: string;
  /** V0.4.2 — exact physical target palace's ownership weight for this
   * domain (1.0 primary / ≤0.4 secondary, from the strict physical
   * domain-ownership catalog). This, not star/Tứ Hóa identity, is what
   * made the fact eligible for this domain. */
  ownershipWeight?: number;
  ownershipRole?: "primary" | "secondary";
  ownershipRecordId?: string;
  /** V0.4 — activation paths after channel assignment. V0.4.1: each path
   * carries its own independent `boundedPathWeight` (no cross-channel
   * combine-then-split; see §6). */
  activationPaths?: AnnualEvidenceActivationPath[];
  /** V0.4.3 — spatial-budget geometry classification (optional; absent on
   * Trung Châu / V0.4.2 evidence rows). */
  geometryClass?: AnnualGeometryClass;
  geometryBucket?: AnnualGeometryBucket;
  retainedForSignedScore?: boolean;
  retainedForActivation?: boolean;
  rejectedPathReason?: string;
  /** @deprecated V0.4.3 — signed and activation paths use SEPARATE diminishing
   * maps and factors. Kept only for display compatibility; equals
   * `signedDiminishingFactor` for signed rows and `activationDiminishingFactor`
   * for activation-only rows. Never the source of truth for activation. */
  diminishingFactor?: number;
  /** @deprecated V0.4.3 — see `signedAppliedFactor` / `activationAppliedFactor`.
   * Equals the applied factor of this row's PRIMARY role (signed if
   * signed-retained, else activation). Not the activation source of truth. */
  finalAppliedFactor?: number;
  /** V0.4.3 — inverse-sqrt-rank diminishing factor used for the SIGNED score,
   * ranked by signed magnitude. Present when `retainedForSignedScore`. */
  signedDiminishingFactor?: number;
  /** V0.4.3 — inverse-sqrt-rank diminishing factor used for ACTIVATION, ranked
   * by activation magnitude. Present when `retainedForActivation`. */
  activationDiminishingFactor?: number;
  /** V0.4.3 — full multiplicative factor applied to signed support/pressure:
   * confidence × ownershipSubject × signedGeometryWeight × signedDiminishing.
   * Zero (and unused) when not retained for the signed score. */
  signedAppliedFactor?: number;
  /** V0.4.3 — full multiplicative factor applied to activation:
   * confidence × ownershipSubject × activationPathGeometryWeight ×
   * activationDiminishing. Zero (and unused) when not retained for activation. */
  activationAppliedFactor?: number;
}

export type AnnualEvidenceChannel =
  | "global"
  | "routed-head"
  | "direct-domain"
  | "major-background";

export interface AnnualEvidenceActivationPath {
  triggerId: string;
  channel: AnnualEvidenceChannel;
  /** Temporal channel geometry — head-role weight for routed-head, 1 for
   * direct-domain/major-background/global (no head-routing involved). */
  geometryWeight: number;
  /** V0.4.1: semantic star/transformation affinity value. V0.4.2: exact
   * physical target palace's ownership weight for this domain (the field
   * name is kept for shape stability; the value's *source* changed from
   * affinity to physical ownership — see `AnnualAxisEvidence.ownershipWeight`
   * for the same value with clearer naming at the evidence level). */
  affinityWeight: number;
  effectivePathWeight: number;
  /** The weight actually applied to this path's channel contribution,
   * computed independently of any other path on the same physical fact
   * (`min(1, geometryWeight * affinityWeight)`). */
  boundedPathWeight: number;
}

/** V0.4.2 — Nam Phái evidence-collection instrumentation for one domain.
 * Audit/debug only; cheap plain counters accumulated during the existing
 * collection loop (no extra pass over the chart). Field names reflect the
 * V0.4.2 strict physical-ownership eligibility model (superseded the
 * V0.4.1 semantic-affinity model — no runtime behavior change to these
 * counters' consumers, only what they measure). */
export interface NamPhaiV041CollectStats {
  candidateFacts: number;
  numericFacts: number;
  contextOnlyFacts: number;
  droppedByReason: {
    noAnnualTrigger: number;
    /** Fact's exact physical palace has no ownership record at all
     * (should be unreachable — the catalog covers all 12 palaces; kept
     * as a fail-safe counter). */
    noOwnershipRecord: number;
    /** Ownership record exists for the palace, but it does not include
     * this domain — the core §1 eligibility gate. */
    domainNotOwned: number;
    /** Ownership resolved and positive, trigger fired, but no channel
     * path was eligible (e.g. outside head frame, no major-fortune
     * context) — should be rare. */
    noPathEligible: number;
    duplicatePhysicalFact: number;
  };
  ownershipResolution: {
    primary: number;
    secondary: number;
    noRecord: number;
  };
}

export interface AnnualChannelSummary {
  supportRaw: number;
  pressureRaw: number;
  activationRaw: number;
  supportNorm: number;
  pressureNorm: number;
  signed: number;
  evidenceIds: string[];
}

export interface NatalDomainResponseProfile {
  sensitivity: number;
  resilience: number;
  amplitudeMultiplier: number;
  provenance: string[];
}

/** V0.5 calibrated core — deterministic score reconstruction trace. */
export interface AnnualAxisScoreTraceV05 {
  formulaVersion: "v0.5-calibrated-core";
  annualActivationRaw: number;
  activationGate: number;
  natalGain: number;
  spatialSigned: number;
  latent: number;
  domainScale: number;
  absoluteScore: number;
}

/** V0.6 annual-dominant core — includes signed layer factors. */
export interface AnnualAxisScoreTraceV06 {
  formulaVersion: "v0.6-annual-dominant-core";
  candidateId: string;
  signedLayerFactors: {
    annual: number;
    natalActivated: number;
    majorFortune: number;
    global: number;
  };
  directSupportRawBeforeLayerFactor: number;
  directPressureRawBeforeLayerFactor: number;
  tp4cSupportRawBeforeLayerFactor: number;
  tp4cPressureRawBeforeLayerFactor: number;
  directSupportRawAfterLayerFactor: number;
  directPressureRawAfterLayerFactor: number;
  tp4cSupportRawAfterLayerFactor: number;
  tp4cPressureRawAfterLayerFactor: number;
  spatialSigned: number;
  annualActivationRaw: number;
  activationGate: number;
  natalGain: number;
  latent: number;
  domainScale: number;
  absoluteScore: number;
}

/** V0.7 robust-centered annual score — relative to training domain baseline. */
export interface AnnualAxisScoreTraceV07 {
  formulaVersion: "v0.7-robust-centered-annual-score";
  signedLayerFactors: {
    annual: number;
    natalActivated: number;
    majorFortune: number;
    global: number;
  };
  spatialSignedRaw: number;
  domainCenter: number;
  centeredSpatial: number;
  annualActivationRaw: number;
  activationGate: number;
  natalGain: number;
  strictLatent: number;
  domainScale: number;
  scoreAmplitude: number;
  absoluteScore: number;
}

/** V0.8 explicit Lưu Niên palace-weighted score. */
export interface AnnualAxisMatchedStarFactV08 {
  starName: string;
  canonicalStarName: string;
  ruleId: string;
  polarity: "positive" | "negative";
  points: number;
  palaceIndex: number;
  annualPalaceName: string;
  sourceId: string;
}

export interface AnnualAxisPalaceContributionTraceV08 {
  role: string;
  palaceName: string;
  palaceIndex: number | null;
  configuredWeight: number;
  positivePoints: number;
  negativePoints: number;
  palaceRaw: number;
  matchedFacts: AnnualAxisMatchedStarFactV08[];
  missingReason?: string;
}

export interface AnnualAxisScoreTraceV08 {
  formulaVersion: "v0.8-annual-palace-weighted-score";
  primary: AnnualAxisPalaceContributionTraceV08;
  cooperating: AnnualAxisPalaceContributionTraceV08[];
  axisRawBeforeThaiTue: number;
  isThaiTueHighlighted: boolean;
  thaiTueMultiplier: number;
  prominenceAdjustedRaw: number;
  rawScore: number;
  absoluteScore: number;
  scoreState: "scored" | "no-signal" | "balanced-signal" | "partial-data";
  configuredPalaceCount: number;
  resolvedPalaceCount: number;
  matchedStarCount: number;
  missingInputs: string[];
}

/** V0.3 — head-centric routing exposure per domain. Undefined when the
 * domain result was produced by a non-head-centric school (currently
 * Trung Châu keeps the V0.2 path). */
export interface AnnualDomainRouting {
  routing: number;
  headShare: number;
  localShare: number;
}

export type AnnualAxisResult =
  | {
      domain: AnnualAxisDomain;
      status: "available";
      score: number;
      band: AnnualAxisBand;
      rawAxes: AnnualAxisRawAxes;
      normalizedAxes: AnnualAxisRawAxes;
      intensity: number;
      conflict: number;
      evidence: AnnualAxisEvidence[];
      topSupportDrivers: AnnualAxisEvidence[];
      topPressureDrivers: AnnualAxisEvidence[];
      /** V0.3 Nam Phái head-centric routing. Undefined for the Trung Châu
       * V0.2 path so the locked TC numeric fixture stays byte-identical. */
      routing?: AnnualDomainRouting;
      /** V0.4 annual-delta explainability. */
      annualDelta?: number;
      routedStrength?: number;
      natalResponse?: NatalDomainResponseProfile;
      channels?: {
        globalAnnualClimate: AnnualChannelSummary;
        routedHeadImpact: AnnualChannelSummary;
        directDomainImpact: AnnualChannelSummary;
        majorFortuneBackground: AnnualChannelSummary;
      };
      /** V0.4.1 — Nam Phái evidence-collection instrumentation. */
      collectStats?: NamPhaiV041CollectStats;
      /** V0.4.3 — spatial budget + dedupe explainability (optional). */
      spatialBudgetTrace?: AnnualSpatialBudgetTrace;
      dedupeTrace?: AnnualEvidenceDedupeTrace;
      activationGate?: number;
      /** V0.5 calibrated core latent signal (optional). */
      latent?: number;
      /** V0.5 / V0.6 / V0.7 / V0.8 calibrated core score trace (optional). */
      scoreTrace?:
        | AnnualAxisScoreTraceV05
        | AnnualAxisScoreTraceV06
        | AnnualAxisScoreTraceV07
        | AnnualAxisScoreTraceV08;
    }
  | {
      domain: AnnualAxisDomain;
      status: "unavailable";
      score: null;
      band: null;
      evidence: [];
      reasonCodes: string[];
      routing?: AnnualDomainRouting;
    };

export interface AnnualAxesDiagnostics {
  invalidKnowledge: string[];
  missingAnnualPalaceNames: string[];
  unresolvedAnnualTargets: string[];
  unknownStars: string[];
  unknownMutagens: string[];
  forbiddenSchoolMarkers: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  missingSourceIds: string[];
  missingRequiredAnnualFacts: string[];
  /** V0.2 — chart palace list not exactly 12, or labels are missing for
   * the school's required coordinate (e.g. Trung Châu chart without
   * annual labels). */
  incompleteChartPalaces: string[];
  /** V0.2 — Nam Phái specific: two natal palaces share the same
   * `palace.name` (should never happen on a well-formed chart). */
  duplicateNatalPalaceNames: string[];
  /** V0.2 — a domain anchor label from axis definitions did not match
   * any palace via the school's resolver. */
  missingDomainAnchor: string[];
  /** V0.2 — multiple palaces matched the same anchor label. */
  ambiguousDomainAnchor: string[];
  /** V0.3 — Nam Phái: `chart.annualHeadPalace` missing (may still fall
   * back to a unique `isLuuNienDaiVan` flag). */
  missingAnnualHeadPalace: string[];
  /** V0.3 — more than one palace flagged `isLuuNienDaiVan`. */
  duplicateAnnualHeadPalaces: string[];
  /** V0.3 — `annualHeadPalace` index disagrees with the unique LNDV flag. */
  annualHeadPointerFlagMismatch: string[];
  /** V0.2/V0.3 — Nam Phái secondary: `chart.smallLimitPalace` is missing. */
  missingSmallLimitPalace: string[];
  /** V0.2 — annual focus palace could not be resolved (Nam Phái or Trung
   * Châu). */
  invalidAnnualFocusPalace: string[];
  /** V0.2 — annual focus frame could not build any TP4C nodes. */
  missingAnnualFocusFrameNodes: string[];
  /** V0.2 — school policy missing/invalid for the requested school. */
  unsupportedSchoolPolicy: string[];
  /** V0.3 — Nam Phái head-frame could not be built (opposite/trine
   * palace physically missing). */
  invalidAnnualHeadFrame: string[];
  /** V0.3 — routing computed outside the [0, 1] range for a domain. */
  routingOutOfRange: string[];
  /** V0.3 — duplicate physical facts survived the channel blend. */
  duplicatePhysicalFactBlend: string[];
  /** V0.4 — natal numeric evidence emitted without annual triggers. */
  natalEvidenceMissingTriggers: string[];
  /** V0.4 — domain local frame covers nearly the whole chart. */
  domainFrameOvercoverage: string[];
}

/** V0.2 — per-domain and module-level capabilities exposed to the UI.
 * `supportsAnnualFocus` reflects whether an activation-overlay frame was
 * actually built for this chart (i.e. the school's required focus palace
 * resolved). `supportsDomainScoring` mirrors the module-level status —
 * true iff at least one domain is available. */
export interface AnnualAxesCapabilities {
  supportsDomainScoring: boolean;
  supportsAnnualFocus: boolean;
  domainAnchorCoordinate: "natal-palace-name" | "annual-palace-name";
  domainAnchorProvenance: string;
  primaryAnnualFocus: "annual-major-fortune" | "annual-menh" | "small-limit";
}

/** V0.3 — public summary of the annual head. Never mutated by
 * downstream code; the UI reads it verbatim to render the head header. */
export interface AnnualFocusSummary {
  mode: "annual-major-fortune" | "annual-menh" | "small-limit";
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  annualPalaceName: string | null;
  frameBranches: string[];
}

export interface AnnualAxesResult {
  module: "annual-axes";
  annualYear: number;
  school: ZiweiSchool;
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
  };
  status: "available" | "partial" | "unavailable";
  axes: Record<AnnualAxisDomain, AnnualAxisResult>;
  diagnostics: AnnualAxesDiagnostics;
  capabilities: AnnualAxesCapabilities;
  annualFocus: AnnualFocusSummary | null;
}

export function emptyAnnualAxes(): AnnualAxisRawAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function addAnnualAxes(
  a: AnnualAxisRawAxes,
  b: AnnualAxisRawAxes,
): AnnualAxisRawAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function scaleAnnualAxes(
  axes: AnnualAxisRawAxes,
  factor: number,
): AnnualAxisRawAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function absAnnualEffect(axes: AnnualAxisRawAxes): number {
  return (
    Math.abs(axes.support) +
    Math.abs(axes.pressure) +
    Math.abs(axes.stability) +
    Math.abs(axes.activation)
  );
}

export function emptyAnnualAxesDiagnostics(): AnnualAxesDiagnostics {
  return {
    invalidKnowledge: [],
    missingAnnualPalaceNames: [],
    unresolvedAnnualTargets: [],
    unknownStars: [],
    unknownMutagens: [],
    forbiddenSchoolMarkers: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    missingSourceIds: [],
    missingRequiredAnnualFacts: [],
    incompleteChartPalaces: [],
    duplicateNatalPalaceNames: [],
    missingDomainAnchor: [],
    ambiguousDomainAnchor: [],
    missingAnnualHeadPalace: [],
    duplicateAnnualHeadPalaces: [],
    annualHeadPointerFlagMismatch: [],
    missingSmallLimitPalace: [],
    invalidAnnualFocusPalace: [],
    missingAnnualFocusFrameNodes: [],
    unsupportedSchoolPolicy: [],
    invalidAnnualHeadFrame: [],
    routingOutOfRange: [],
    duplicatePhysicalFactBlend: [],
    natalEvidenceMissingTriggers: [],
    domainFrameOvercoverage: [],
  };
}
