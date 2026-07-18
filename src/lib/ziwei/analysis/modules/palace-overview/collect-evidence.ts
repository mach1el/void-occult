import type { NatalZiweiFact, ZiweiBrightness, ZiweiSchool } from "../../facts";
import type { StaticFrame, StaticFrameNode } from "../../frame";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  AxisSeed,
  MinorStarRecord,
  MinorStateModifierPolicy,
  SchoolProfileId,
} from "../../knowledge/schema";
import {
  absEffect,
  emptyAxes,
  scaleAxes,
  type PalaceEvidence,
  type PalaceEvidenceAxes,
  type PalaceOverviewDiagnostics,
} from "./types";

/** Bridge Calculation-Core school id to knowledge-catalog school profile id. */
function schoolProfileId(school: ZiweiSchool): SchoolProfileId {
  return school === "nam-phai" ? "nam-phai-v1" : "trung-chau-v1";
}

export interface CollectEvidenceContext {
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  diagnostics: PalaceOverviewDiagnostics;
}

function axesFromSeed(seed: AxisSeed): PalaceEvidenceAxes {
  return {
    support: seed.support,
    pressure: seed.pressure,
    stability: seed.stability,
    activation: seed.activation,
  };
}

function multiplyAxes(
  axes: PalaceEvidenceAxes,
  factor: number,
): PalaceEvidenceAxes {
  return scaleAxes(axes, factor);
}

function applyBrightness(
  axes: PalaceEvidenceAxes,
  brightness: ZiweiBrightness,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceEvidenceAxes {
  const mod =
    knowledge.majorStars.brightnessModifiers[brightness] ??
    knowledge.majorStars.brightnessModifiers.Bình!;
  return {
    support: axes.support * mod.supportFactor,
    pressure: axes.pressure * mod.pressureFactor,
    stability: axes.stability + mod.stabilityDelta,
    activation: axes.activation * mod.activationFactor,
  };
}

function applyMinorStateModifier(
  axes: PalaceEvidenceAxes,
  policy: MinorStateModifierPolicy,
): PalaceEvidenceAxes {
  return {
    support: axes.support * policy.supportFactor,
    pressure: axes.pressure * policy.pressureFactor,
    stability: axes.stability + policy.stabilityDelta,
    activation: axes.activation * policy.activationFactor,
  };
}

function nodeFacts(
  ctx: CollectEvidenceContext,
  node: StaticFrameNode,
): NatalZiweiFact[] {
  return ctx.factsByPalace.get(node.palaceIndex) ?? [];
}

function majorFacts(facts: NatalZiweiFact[]): NatalZiweiFact[] {
  return facts.filter(
    (f) => f.kind === "star" && f.starClass === "major" && f.canonicalStarName,
  );
}

function voidTypesOnPalace(facts: NatalZiweiFact[]): Array<"Tuần" | "Triệt"> {
  return facts
    .filter((f) => f.kind === "void-marker" && f.voidType)
    .map((f) => f.voidType!);
}

function knowledgeStatus(
  knowledge: PalaceOverviewKnowledgeV1,
): "experimental" | "approved" {
  return knowledge.profile.status === "approved" ? "approved" : "experimental";
}

function majorStarLookup(knowledge: PalaceOverviewKnowledgeV1, name: string) {
  return knowledge.majorStars.stars.find((s) => s.name === name);
}

function collectMajorEvidence(
  ctx: CollectEvidenceContext,
  borrowedFactIds: Set<string>,
): PalaceEvidence[] {
  const { frame, knowledge, diagnostics } = ctx;
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!focus) return [];

  const focusMajors = majorFacts(nodeFacts(ctx, focus));
  const isVoidMajor = focusMajors.length === 0;
  const out: PalaceEvidence[] = [];
  const status = knowledgeStatus(knowledge);

  if (isVoidMajor) {
    const opposite = frame.nodes.find((n) => n.role === "opposite");
    const oppositeMajors = opposite ? majorFacts(nodeFacts(ctx, opposite)) : [];
    if (oppositeMajors.length > 0) {
      const borrow = knowledge.voidEnvironment.voidMajorBorrowFactor;
      for (const fact of oppositeMajors) {
        const name = fact.canonicalStarName!;
        const record = majorStarLookup(knowledge, name);
        if (!record) {
          diagnostics.unknownStars.push(name);
          continue;
        }
        let brightness = fact.brightness;
        if (!brightness) {
          brightness = "Bình";
          diagnostics.missingBrightness.push(fact.id);
        }
        let axes = applyBrightness(
          axesFromSeed(record.axes),
          brightness,
          knowledge,
        );
        axes = multiplyAxes(axes, borrow * focus.geometryWeight);
        borrowedFactIds.add(fact.id);
        out.push({
          id: `ev:major-borrow:${focus.palaceIndex}:${name}`,
          category: "major-star",
          factIds: [fact.id],
          palaceRole: "focus",
          palaceName: focus.palaceName,
          palaceBranch: focus.palaceBranch,
          axes,
          label: `${name} (mượn đối cung)`,
          explanationKey: "major.borrowed-from-opposite",
          sourceIds: knowledge.majorStars.sourceIds,
          knowledgeStatus: status,
          borrowedFromOpposite: true,
        });
      }
      out.push({
        id: `ev:void-context:${focus.palaceIndex}`,
        category: "void-environment",
        factIds: [],
        palaceRole: "focus",
        palaceName: focus.palaceName,
        palaceBranch: focus.palaceBranch,
        axes: axesFromSeed(knowledge.voidEnvironment.voidContext),
        label: "Vô chính diệu",
        explanationKey: "void.borrow-context",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
      });
    } else {
      out.push({
        id: `ev:void-double:${focus.palaceIndex}`,
        category: "void-environment",
        factIds: [],
        palaceRole: "focus",
        palaceName: focus.palaceName,
        palaceBranch: focus.palaceBranch,
        axes: axesFromSeed(knowledge.voidEnvironment.doubleVoidContext),
        label: "Vô chính diệu (đối cung cũng trống)",
        explanationKey: "void.double-empty",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
      });
    }
  }

  for (const node of frame.nodes) {
    for (const fact of majorFacts(nodeFacts(ctx, node))) {
      if (borrowedFactIds.has(fact.id)) continue;
      const name = fact.canonicalStarName!;
      const record = majorStarLookup(knowledge, name);
      if (!record) {
        diagnostics.unknownStars.push(name);
        continue;
      }
      let brightness = fact.brightness;
      if (!brightness) {
        brightness = "Bình";
        diagnostics.missingBrightness.push(fact.id);
      }
      let axes = applyBrightness(
        axesFromSeed(record.axes),
        brightness,
        knowledge,
      );
      axes = multiplyAxes(axes, node.geometryWeight);
      out.push({
        id: `ev:major:${node.palaceIndex}:${name}:${node.role}`,
        category: "major-star",
        factIds: [fact.id],
        palaceRole: node.role,
        palaceName: node.palaceName,
        palaceBranch: node.palaceBranch,
        axes,
        label: name,
        explanationKey: `major.${name}`,
        sourceIds: knowledge.majorStars.sourceIds,
        knowledgeStatus: status,
      });
    }
  }

  return out;
}

function collectTransformationEvidence(
  ctx: CollectEvidenceContext,
): PalaceEvidence[] {
  const { frame, knowledge, diagnostics } = ctx;
  const status = knowledgeStatus(knowledge);
  const out: PalaceEvidence[] = [];
  const starNamesInFrame = new Set(
    frame.nodes.flatMap((node) =>
      nodeFacts(ctx, node)
        .filter((f) => f.kind === "star" && f.canonicalStarName)
        .map((f) => f.canonicalStarName!),
    ),
  );

  for (const node of frame.nodes) {
    for (const fact of nodeFacts(ctx, node)) {
      if (fact.kind !== "transformation" || !fact.transformation) continue;
      const target = fact.targetStar;
      if (!target || !starNamesInFrame.has(target)) {
        diagnostics.unmappedTransformations.push(fact.id);
        continue;
      }
      const record = knowledge.transformations.transformations.find(
        (t) => t.transformation === fact.transformation,
      );
      if (!record) continue;
      const axes = multiplyAxes(
        axesFromSeed(record.axes),
        node.geometryWeight,
      );
      out.push({
        id: `ev:transform:${node.palaceIndex}:${fact.transformation}:${target}`,
        category: "transformation",
        factIds: [fact.id],
        palaceRole: node.role,
        palaceName: node.palaceName,
        palaceBranch: node.palaceBranch,
        axes,
        label: `Hóa ${fact.transformation}→${target}`,
        explanationKey: `transform.${fact.transformation}`,
        sourceIds: knowledge.transformations.sourceIds,
        knowledgeStatus: status,
      });
    }
  }
  return out;
}

/**
 * Resolve minor-star evidence through the per-star catalog (V1.1). Family
 * `starNames` is gone — per-star records are the single membership SSOT.
 * See integration-prompt.md "Evidence collection" for the 6-step contract.
 */
function collectMinorFamilyEvidence(
  ctx: CollectEvidenceContext,
): PalaceEvidence[] {
  const { frame, knowledge, diagnostics } = ctx;
  const status = knowledgeStatus(knowledge);
  const profile = knowledge.profile;
  const out: PalaceEvidence[] = [];

  const recordByCanonicalName = new Map(
    knowledge.minorStars.stars.map((s) => [s.canonicalName, s]),
  );
  const familyById = new Map(
    knowledge.minorFamilies.families.map((f) => [f.id, f]),
  );

  type Contributor = {
    fact: NatalZiweiFact;
    node: StaticFrameNode;
    record: MinorStarRecord;
    axes: PalaceEvidenceAxes;
  };

  const groups = new Map<string, Contributor[]>();

  for (const node of frame.nodes) {
    for (const fact of nodeFacts(ctx, node)) {
      if (fact.kind !== "star" || fact.starClass === "major") continue;
      const name = fact.canonicalStarName;
      if (!name) continue;

      const record = recordByCanonicalName.get(name);
      if (!record) {
        diagnostics.unknownStars.push(name);
        continue;
      }

      // School isolation: a record known to the catalog but not scoped to
      // this school is silently ignored here — Calculation Core should not
      // emit it for this school in the first place (§ School isolation).
      if (!record.schoolProfiles.includes(schoolProfileId(fact.school))) {
        continue;
      }

      if (record.scoringMode === "context-only") {
        diagnostics.contextOnlyFacts.push(fact.id);
        continue;
      }

      const family = familyById.get(record.familyId);
      if (!family) {
        diagnostics.unknownStars.push(name);
        continue;
      }

      let axes = axesFromSeed(record.axesOverride ?? family.axes);

      if (record.brightnessPolicy !== "none" && fact.brightness) {
        const policy =
          knowledge.minorStateModifiers.policies[record.brightnessPolicy][
            fact.brightness
          ];
        if (policy) axes = applyMinorStateModifier(axes, policy);
      }

      axes = multiplyAxes(axes, node.geometryWeight);

      const list = groups.get(family.diminishingGroup) ?? [];
      list.push({ fact, node, record, axes });
      groups.set(family.diminishingGroup, list);
    }
  }

  const max = profile.familyMaxContributors;
  const factors = profile.familyDiminishingReturns;

  for (const contributors of groups.values()) {
    contributors.sort((a, b) => absEffect(b.axes) - absEffect(a.axes));
    contributors.forEach((c, index) => {
      if (index >= max) return;
      const factor = factors[index] ?? 0;
      if (factor === 0) return;
      const axes = multiplyAxes(c.axes, factor);
      const name = c.fact.canonicalStarName!;
      out.push({
        id: `ev:minor:${c.record.familyId}:${c.node.palaceIndex}:${name}`,
        category: "minor-star-family",
        factIds: [c.fact.id],
        palaceRole: c.node.role,
        palaceName: c.node.palaceName,
        palaceBranch: c.node.palaceBranch,
        axes,
        label: name,
        explanationKey: c.record.explanationKey,
        sourceIds: knowledge.minorStars.sourceIds,
        knowledgeStatus: status,
      });
    });
  }

  return out;
}

function collectChangShengEvidence(
  ctx: CollectEvidenceContext,
): PalaceEvidence[] {
  const { frame, knowledge } = ctx;
  const status = knowledgeStatus(knowledge);
  const out: PalaceEvidence[] = [];

  for (const node of frame.nodes) {
    for (const fact of nodeFacts(ctx, node)) {
      if (fact.kind !== "chang-sheng" || !fact.changShengStage) continue;
      const record = knowledge.changSheng.stages.find(
        (s) => s.stage === fact.changShengStage,
      );
      if (!record) continue;
      const axes = multiplyAxes(
        axesFromSeed(record.axes),
        node.geometryWeight,
      );
      out.push({
        id: `ev:chang-sheng:${node.palaceIndex}:${fact.changShengStage}`,
        category: "chang-sheng",
        factIds: [fact.id],
        palaceRole: node.role,
        palaceName: node.palaceName,
        palaceBranch: node.palaceBranch,
        axes,
        label: fact.changShengStage,
        explanationKey: `chang-sheng.${fact.changShengStage}`,
        sourceIds: knowledge.changSheng.sourceIds,
        knowledgeStatus: status,
      });
    }
  }
  return out;
}

/**
 * Apply Tuần/Triệt attenuation to evidence local to voided palaces.
 * Does not multiply the whole frame. Skips structural-rule (added later).
 */
export function applyLocalVoidAttenuation(
  ctx: CollectEvidenceContext,
  evidence: PalaceEvidence[],
): PalaceEvidence[] {
  const { frame, knowledge } = ctx;
  const status = knowledgeStatus(knowledge);
  const result: PalaceEvidence[] = [];
  const voidDeltaAdded = new Set<number>();

  for (const ev of evidence) {
    const palaceNode =
      frame.nodes.find(
        (n) =>
          n.role === ev.palaceRole &&
          n.palaceName === ev.palaceName &&
          n.palaceBranch === ev.palaceBranch,
      ) ?? frame.nodes.find((n) => n.palaceBranch === ev.palaceBranch);

    if (!palaceNode || ev.category === "void-environment") {
      result.push(ev);
      continue;
    }

    const voids = voidTypesOnPalace(nodeFacts(ctx, palaceNode));
    if (voids.length === 0) {
      result.push(ev);
      continue;
    }

    const cfg =
      voids.length >= 2
        ? knowledge.voidEnvironment.doubleVoid
        : knowledge.voidEnvironment.singleVoid;

    let axes = { ...ev.axes };
    if (ev.category === "major-star") {
      axes.support *= cfg.localMajorMagnitudeFactor;
      axes.pressure *= cfg.localMajorMagnitudeFactor;
    } else if (ev.category === "transformation") {
      axes.support *= cfg.localTransformationMagnitudeFactor;
      axes.pressure *= cfg.localTransformationMagnitudeFactor;
    } else if (
      ev.category === "minor-star-family" ||
      ev.category === "chang-sheng"
    ) {
      axes.support *= cfg.localMinorMagnitudeFactor;
      axes.pressure *= cfg.localMinorMagnitudeFactor;
    }
    axes.activation *= cfg.activationFactor;

    result.push({ ...ev, axes });

    if (!voidDeltaAdded.has(palaceNode.palaceIndex)) {
      voidDeltaAdded.add(palaceNode.palaceIndex);
      result.push({
        id: `ev:void-attenuate:${palaceNode.palaceIndex}`,
        category: "void-environment",
        factIds: nodeFacts(ctx, palaceNode)
          .filter((f) => f.kind === "void-marker")
          .map((f) => f.id),
        palaceRole: palaceNode.role,
        palaceName: palaceNode.palaceName,
        palaceBranch: palaceNode.palaceBranch,
        axes: {
          ...emptyAxes(),
          stability: cfg.stabilityDelta,
        },
        label: voids.join("+"),
        explanationKey: "void.local-attenuation",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
      });
    }
  }

  return result;
}

export function collectPalaceEvidence(
  ctx: CollectEvidenceContext,
): { evidence: PalaceEvidence[]; isVoidMajor: boolean; borrowedFactIds: Set<string> } {
  const focus = ctx.frame.nodes.find((n) => n.role === "focus");
  const focusMajors = focus ? majorFacts(nodeFacts(ctx, focus)) : [];
  const isVoidMajor = focusMajors.length === 0;
  const borrowedFactIds = new Set<string>();

  const base = [
    ...collectMajorEvidence(ctx, borrowedFactIds),
    ...collectTransformationEvidence(ctx),
    ...collectMinorFamilyEvidence(ctx),
    ...collectChangShengEvidence(ctx),
  ];

  const evidence = applyLocalVoidAttenuation(ctx, base);
  return { evidence, isVoidMajor, borrowedFactIds };
}

export function emptyDiagnostics(): PalaceOverviewDiagnostics {
  return {
    unknownStars: [],
    duplicateFacts: [],
    contextOnlyFacts: [],
    unmappedTransformations: [],
    missingBrightness: [],
    ruleHits: [],
  };
}
