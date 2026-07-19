import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type { AnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import mutagenImpactCatalog from "../../../knowledge/annual-axes/annual-mutagen-impact.v0.json";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type {
  AnnualAxisEvidence,
  AnnualAxisEvidenceLayer,
  AnnualAxisFrameRole,
  AnnualAxisRawAxes,
  AnnualAxesDiagnostics,
  AnnualEvidenceActivationPath,
  NamPhaiV041CollectStats,
} from "../types";
import { resolveOwnership, type ResolvedOwnership } from "./ownership";
import { relationRole, type DomainRoutingV04 } from "./routing";

const ARCH_SOURCE_ID = "SRC-AA-ENG-004";
const ANNUAL_STAR_SOURCES = new Set(["annual"]);
const MUTAGEN_MARKER_SOURCES = new Set(["natal-mutagen", "annual-mutagen"]);

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

function isTriggerEnabled(knowledge: AnnualAxesKnowledgeV04NamPhai, triggerId: string): boolean {
  return knowledge.triggerPolicy.enabledTriggers.some((t) => t.triggerId === triggerId && t.enabled);
}

function headFrameIndexes(headFrame: AnnualFocusFrame): Set<number> {
  return new Set(headFrame.nodes.map((n) => n.palaceIndex));
}

interface CandidateFact {
  physicalFactId: string;
  category: AnnualAxisEvidence["category"];
  layer: AnnualAxisEvidenceLayer;
  ruleId: string;
  targetPalace: ChartPalace;
  rawAxes: AnnualAxisRawAxes;
  stackingGroup: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  origin: "natal-star" | "annual-star" | "annual-mutagen" | "major-mutagen" | "natal-mutagen";
  canonicalStarName?: string;
  familyId?: string;
  mutagen?: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  starClass?: "major" | "minor";
}

/**
 * §2 subject modifier — may only scale an already physically eligible
 * domain, never create eligibility. Mutagens and major stars default to
 * 1; minor stars default to 0 (see `annual-subject-modifiers.v0.4.2.json`
 * for the rationale — without this, strict physical ownership alone lets
 * every minor star sharing an owned/triggered palace flood each domain).
 */
function resolveSubjectModifier(
  knowledge042: AnnualAxesKnowledgeV042NamPhai,
  fact: CandidateFact,
): number {
  const m = knowledge042.subjectModifiers.categoryModifiers;
  if (fact.category === "mutagen") return m.mutagen;
  if (fact.starClass === "minor") return m.minorStar;
  if (fact.starClass === "major") return m.majorStar;
  return knowledge042.subjectModifiers.defaultModifier;
}

interface CollectInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV04NamPhai;
  knowledge042: AnnualAxesKnowledgeV042NamPhai;
  numericKnowledge: PalaceOverviewKnowledgeV1;
  headFrame: AnnualFocusFrame;
  routing: DomainRoutingV04;
  diagnostics: AnnualAxesDiagnostics;
}

export interface CollectEvidenceResultV041 {
  evidence: AnnualAxisEvidence[];
  stats: NamPhaiV041CollectStats;
}

function emptyStats(): NamPhaiV041CollectStats {
  return {
    candidateFacts: 0,
    numericFacts: 0,
    contextOnlyFacts: 0,
    droppedByReason: {
      noAnnualTrigger: 0,
      noOwnershipRecord: 0,
      domainNotOwned: 0,
      noPathEligible: 0,
      duplicatePhysicalFact: 0,
    },
    ownershipResolution: {
      primary: 0,
      secondary: 0,
      noRecord: 0,
    },
  };
}

/**
 * V0.4.2 §5 direct-domain contract: an enabled annual trigger + the exact
 * physical target palace's positive ownership of this domain. No TP4C
 * geometry, no "annual origin ⇒ geometry 1" bypass — `temporalGeometryWeight`
 * is always 1 here (the annual layer directly targeted this palace; no
 * head-routing attenuation applies).
 */
function resolveDirectDomainPath(
  triggerIds: string[],
  ownership: ResolvedOwnership,
): AnnualEvidenceActivationPath | null {
  const triggerId = triggerIds.find(
    (t) => t === "annual-transformation-exact-target" || t === "annual-moving-star-palace",
  );
  if (!triggerId) return null;
  if (ownership.value <= 0) return null;
  const effectivePathWeight = 1 * ownership.value;
  return {
    triggerId,
    channel: "direct-domain",
    geometryWeight: 1,
    affinityWeight: ownership.value,
    effectivePathWeight,
    boundedPathWeight: Math.min(1, effectivePathWeight),
  };
}

/**
 * V0.4.2 §4 routed-head contract: physical head-role geometry × the exact
 * physical target palace's ownership of this domain. A fact at one
 * head-frame palace fans out only to the (≤2) numeric domains owned by
 * that exact palace — no additional broad domain-routing multiplier (§4:
 * "do not additionally multiply this fact by a broad domain routing
 * value"). The head ownership multiplier is applied exactly once, here.
 */
function resolveRoutedHeadPath(
  triggerIds: string[],
  headGeometry: number,
  domainRouting: number,
  ownership: ResolvedOwnership,
): AnnualEvidenceActivationPath | null {
  if (headGeometry <= 0) return null;
  // Domain routing remains an eligibility *gate* (kept from V0.4.1) — not
  // a multiplier (§4 forbids multiplying by a broad domain-routing value;
  // it does not forbid using it to gate whether this domain's routed-head
  // channel is reachable this year at all).
  if (domainRouting <= 0) return null;
  const triggerId = triggerIds.find((t) => t === "annual-head-tp4c");
  if (!triggerId) return null;
  if (ownership.value <= 0) return null;
  const effectivePathWeight = headGeometry * ownership.value;
  return {
    triggerId,
    channel: "routed-head",
    geometryWeight: headGeometry,
    affinityWeight: ownership.value,
    effectivePathWeight,
    boundedPathWeight: Math.min(1, effectivePathWeight),
  };
}

/**
 * V0.4.2 §6 global contract: default OFF. Only a subject explicitly listed
 * in `globalPolicy.enabledGlobalSubjects` may enter `global`; the list is
 * empty by default, so this always returns null — no rejected direct/
 * routed evidence is ever implicitly promoted to global.
 */
function resolveGlobalPath(
  fact: CandidateFact,
  knowledge042: AnnualAxesKnowledgeV042NamPhai,
  ownership: ResolvedOwnership,
): AnnualEvidenceActivationPath | null {
  const subjects = knowledge042.globalPolicy.enabledGlobalSubjects;
  if (subjects.length === 0) return null;
  const subjectId =
    fact.category === "mutagen" ? `mutagen:${fact.mutagen}` : `star:${fact.canonicalStarName}`;
  if (!subjects.includes(subjectId)) return null;
  if (ownership.value <= 0) return null;
  const effectivePathWeight = ownership.value;
  return {
    triggerId: "global-eligibility",
    channel: "global",
    geometryWeight: 1,
    affinityWeight: ownership.value,
    effectivePathWeight,
    boundedPathWeight: Math.min(1, effectivePathWeight),
  };
}

/**
 * V0.4.2 §7 Major Fortune background: major context coefficient (0.55,
 * unchanged temporal-channel coefficient) × the exact physical Major
 * Fortune target palace's ownership of this domain — never broadcast to
 * all six domains.
 */
function resolveMajorBackgroundPath(
  triggerIds: string[],
  inMajor: boolean,
  layer: AnnualAxisEvidenceLayer,
  ownership: ResolvedOwnership,
): AnnualEvidenceActivationPath | null {
  const eligible = triggerIds.includes("major-fortune-context") || (inMajor && layer === "major-fortune");
  if (!eligible) return null;
  if (ownership.value <= 0) return null;
  const geometryWeight = 0.55;
  const effectivePathWeight = geometryWeight * ownership.value;
  return {
    triggerId: "major-fortune-context",
    channel: "major-background",
    geometryWeight,
    affinityWeight: ownership.value,
    effectivePathWeight,
    boundedPathWeight: Math.min(1, effectivePathWeight),
  };
}

/**
 * Collect V0.4.2 triggered annual evidence. Domain eligibility is decided
 * exclusively by the exact physical target palace's ownership record
 * (see `ownership.ts`) — star/Tứ Hóa knowledge only shapes polarity
 * (rawAxes), never which domain(s) a fact may affect. The retired broad
 * multi-anchor domain-TP4C-union and star/transformation affinity models
 * are not referenced in this file anymore.
 */
export function collectNamPhaiV04TriggeredEvidence(input: CollectInput): CollectEvidenceResultV041 {
  const { chart, domain, knowledge, knowledge042, numericKnowledge, headFrame, routing, diagnostics } =
    input;
  const stats = emptyStats();

  const headIndexes = headFrameIndexes(headFrame);
  const annualStarPalaceIndexes = new Set(
    (chart.annualStars ?? []).map((s) => s.palace.index),
  );
  const annualMutagenTargets = new Set(
    (chart.annualMutagens ?? [])
      .filter((m) => m.palace)
      .map((m) => `${m.palace!.index}:${canonicalStarName(m.starName)}`),
  );

  const factsByKey = new Map<string, CandidateFact>();
  const pushFact = (fact: CandidateFact) => {
    if (factsByKey.has(fact.physicalFactId)) {
      diagnostics.duplicatePhysicalFacts.push(`${domain}:${fact.physicalFactId}`);
      stats.droppedByReason.duplicatePhysicalFact += 1;
      return;
    }
    factsByKey.set(fact.physicalFactId, fact);
  };

  for (const palace of chart.palaces) {
    for (const star of palace.stars ?? []) {
      if (!isNatalPhysicalStar(star)) continue;
      const canonical = canonicalStarName(star.name);
      const res = resolveStar(canonical, star.brightness, numericKnowledge);
      if (!res) continue;
      const inMajor =
        chart.majorFortunePalace != null && chart.majorFortunePalace.index === palace.index;
      pushFact({
        physicalFactId: `natal-star:${palace.index}:${canonical}`,
        category: "star",
        layer: inMajor ? "major-fortune" : "natal-activated",
        ruleId:
          res.starClass === "major"
            ? "RULE-AA-STAR-MAJOR-CANONICAL-V0"
            : "RULE-AA-STAR-MINOR-CANONICAL-V0",
        targetPalace: palace,
        rawAxes: res.axes,
        stackingGroup: res.diminishingGroup ?? "major-star",
        sourceIds: res.sourceIds,
        knowledgeStatus: res.knowledgeStatus,
        origin: "natal-star",
        canonicalStarName: canonical,
        familyId: res.familyId,
        starClass: res.starClass,
      });
    }
  }

  for (const annualStar of chart.annualStars ?? []) {
    const canonical = canonicalStarName(annualStar.name);
    const res = resolveStar(canonical, annualStar.brightness, numericKnowledge);
    if (!res) continue;
    pushFact({
      physicalFactId: `annual-star:${annualStar.palace.index}:${canonical}`,
      category: "star",
      layer: "annual",
      ruleId: "RULE-AA-STAR-ANNUAL-MOVING-V04",
      targetPalace: annualStar.palace,
      rawAxes: res.axes,
      stackingGroup: res.diminishingGroup ?? "annual-moving-star",
      sourceIds: res.sourceIds,
      knowledgeStatus: res.knowledgeStatus,
      origin: "annual-star",
      canonicalStarName: canonical,
      familyId: res.familyId,
      starClass: res.starClass,
    });
  }

  const pushMutagens = (
    records: MutagenRecord[] | undefined,
    layer: AnnualAxisEvidenceLayer,
    origin: CandidateFact["origin"],
  ) => {
    if (!records) return;
    for (const record of records) {
      if (!record.palace) continue;
      const impact = MUTAGEN_IMPACT.records.find((r) => r.mutagen === record.mutagen);
      if (!impact) {
        diagnostics.unknownMutagens.push(record.mutagen);
        continue;
      }
      const mutagen = record.mutagen as "Lộc" | "Quyền" | "Khoa" | "Kỵ";
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
        origin,
        canonicalStarName: canonical,
        mutagen,
      });
    }
  };

  pushMutagens(chart.annualMutagens, "annual", "annual-mutagen");
  pushMutagens(chart.natalMutagens, "natal-activated", "natal-mutagen");
  pushMutagens(chart.majorMutagens, "major-fortune", "major-mutagen");

  const out: AnnualAxisEvidence[] = [];

  for (const fact of factsByKey.values()) {
    stats.candidateFacts += 1;

    const triggerIds: string[] = [];
    const idx = fact.targetPalace.index;
    const inHead = headIndexes.has(idx);
    const inMajor =
      chart.majorFortunePalace != null && chart.majorFortunePalace.index === idx;

    if (fact.origin === "natal-star" || fact.origin === "natal-mutagen") {
      if (isTriggerEnabled(knowledge, "annual-head-tp4c") && inHead) {
        triggerIds.push("annual-head-tp4c");
      }
      if (
        isTriggerEnabled(knowledge, "annual-transformation-exact-target") &&
        fact.canonicalStarName &&
        annualMutagenTargets.has(`${idx}:${fact.canonicalStarName}`)
      ) {
        triggerIds.push("annual-transformation-exact-target");
      }
      if (
        isTriggerEnabled(knowledge, "annual-moving-star-palace") &&
        annualStarPalaceIndexes.has(idx)
      ) {
        triggerIds.push("annual-moving-star-palace");
      }
      // V0.4.2: "head-domain-frame-intersection" is retired — it depended
      // on the broad multi-anchor domain TP4C union, which no longer
      // decides numeric eligibility (§3). A head-frame fact is routed via
      // "annual-head-tp4c" alone; a same-palace annual-layer hit is routed
      // via "annual-moving-star-palace"/"annual-transformation-exact-target".

      if (triggerIds.length === 0) {
        // Natal without trigger: sensitivity-only — skip numeric evidence.
        stats.droppedByReason.noAnnualTrigger += 1;
        continue;
      }
    } else if (fact.origin === "annual-star") {
      if (isTriggerEnabled(knowledge, "annual-moving-star-palace")) {
        triggerIds.push("annual-moving-star-palace");
      }
    } else if (fact.origin === "annual-mutagen") {
      if (isTriggerEnabled(knowledge, "annual-transformation-exact-target")) {
        triggerIds.push("annual-transformation-exact-target");
      }
    } else if (fact.origin === "major-mutagen") {
      // Major-fortune mutagen is always major-background when present.
      triggerIds.push("major-fortune-context");
    }

    if (triggerIds.length === 0) {
      stats.droppedByReason.noAnnualTrigger += 1;
      continue;
    }

    // §1 core eligibility gate: the exact physical target palace's
    // ownership record — never star/transformation identity — decides
    // which domain(s) this fact may numerically affect.
    const ownership = resolveOwnership(knowledge042, fact.targetPalace.name, domain);
    if (ownership == null) {
      const hasAnyRecord = knowledge042.ownership.records.some(
        (r) => r.palaceName === fact.targetPalace.name,
      );
      if (hasAnyRecord) {
        stats.droppedByReason.domainNotOwned += 1;
      } else {
        stats.droppedByReason.noOwnershipRecord += 1;
        stats.ownershipResolution.noRecord += 1;
      }
      stats.contextOnlyFacts += 1;
      continue;
    }
    if (ownership.role === "primary") stats.ownershipResolution.primary += 1;
    else stats.ownershipResolution.secondary += 1;

    if (ownership.value <= 0) {
      stats.droppedByReason.domainNotOwned += 1;
      continue;
    }

    // §2 subject modifier — scales an already-eligible domain, never
    // creates eligibility (applied to the ownership value once, here;
    // every path below reads this single scaled value).
    const subjectModifier = resolveSubjectModifier(knowledge042, fact);
    const scaledOwnership: ResolvedOwnership = { ...ownership, value: ownership.value * subjectModifier };
    if (scaledOwnership.value <= 0) {
      stats.droppedByReason.domainNotOwned += 1;
      continue;
    }

    const headRole = relationRole(headFrame.focusPalaceIndex, idx);
    const headGeometry = knowledge.channelProfile.routing.headFrameRoleWeights[headRole];

    const activationPaths: AnnualEvidenceActivationPath[] = [];
    const direct = resolveDirectDomainPath(triggerIds, scaledOwnership);
    if (direct) activationPaths.push(direct);
    const routed = resolveRoutedHeadPath(triggerIds, headGeometry, routing.routing, scaledOwnership);
    if (routed) activationPaths.push(routed);
    const global = resolveGlobalPath(fact, knowledge042, scaledOwnership);
    if (global) activationPaths.push(global);
    const majorBackground = resolveMajorBackgroundPath(
      triggerIds,
      inMajor,
      fact.layer,
      scaledOwnership,
    );
    if (majorBackground) activationPaths.push(majorBackground);

    if (activationPaths.length === 0) {
      stats.droppedByReason.noPathEligible += 1;
      continue;
    }

    stats.numericFacts += 1;

    const confidenceWeight = knowledge.deltaProfile.confidenceWeights[fact.knowledgeStatus];
    const strongestPath = activationPaths.reduce((a, b) =>
      b.boundedPathWeight > a.boundedPathWeight ? b : a,
    );
    // Display/sort-only aggregate (topDrivers, evidence list) — channel
    // math below reads `rawAxes` + `activationPaths` + `confidenceWeight`
    // directly, not this blended value.
    const effectiveWeight = strongestPath.boundedPathWeight * confidenceWeight;

    const weightedAxes: AnnualAxisRawAxes = {
      support: fact.rawAxes.support * effectiveWeight,
      pressure: fact.rawAxes.pressure * effectiveWeight,
      stability: 0,
      activation: fact.rawAxes.activation * effectiveWeight,
    };

    // The exact physical palace is its own "anchor" under strict routing —
    // there is no domain-anchor TP4C role anymore. `frameRole` falls back
    // to the fact's role relative to the annual head when meaningful.
    const frameRole: AnnualAxisFrameRole = headRole === "outside" ? "focus" : (headRole as AnnualAxisFrameRole);

    out.push({
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
      anchorPalaceName: fact.targetPalace.name,
      stackingGroup: fact.stackingGroup,
      rawAxes: fact.rawAxes,
      effectiveWeight,
      weightedAxes,
      confidenceWeight,
      factIds: [fact.physicalFactId],
      sourceIds: fact.sourceIds.length > 0 ? fact.sourceIds : [ARCH_SOURCE_ID],
      knowledgeStatus: fact.knowledgeStatus,
      routing: routing.routing,
      headShare: routing.headShare,
      localShare: routing.localShare,
      annualTriggerIds: [...new Set(triggerIds)],
      ownershipWeight: ownership.value,
      ownershipRole: ownership.role,
      ownershipRecordId: ownership.recordId,
      activationPaths,
    } satisfies AnnualAxisEvidence);
  }

  return { evidence: out, stats };
}
