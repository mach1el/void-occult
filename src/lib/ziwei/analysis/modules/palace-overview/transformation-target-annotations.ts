import type { NatalZiweiFact } from "../../facts";
import type { StaticFrame } from "../../frame";
import type {
  PalaceOverviewKnowledgeV1,
  PalaceOverviewSemanticKnowledgeV1,
} from "../../knowledge";
import type { PalaceAnnotation, PalaceOverviewSemanticDiagnostics } from "./types";

/**
 * Resolve a target star's trait vocabulary from the numeric catalogs —
 * major-star traits first, then minor-star traitTags. Never invents traits.
 */
function resolveTargetTraits(
  targetStar: string,
  knowledge: PalaceOverviewKnowledgeV1,
): string[] | null {
  const major = knowledge.majorStars.stars.find((s) => s.name === targetStar);
  if (major) return major.traits;
  const minor = knowledge.minorStars.stars.find(
    (s) => s.canonicalName === targetStar,
  );
  if (minor) return minor.traitTags;
  return null;
}

export function buildTransformationTargetAnnotations(input: {
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  semanticKnowledge: PalaceOverviewSemanticKnowledgeV1;
  diagnostics: PalaceOverviewSemanticDiagnostics;
  focusPalaceIndex: number;
}): PalaceAnnotation[] {
  const {
    frame,
    factsByPalace,
    knowledge,
    semanticKnowledge,
    diagnostics,
    focusPalaceIndex,
  } = input;
  const catalog = semanticKnowledge.transformationTargetSemantics;
  const knowledgeStatus =
    catalog.status === "approved" ? "approved" : "experimental";
  const out: PalaceAnnotation[] = [];
  const seen = new Set<string>();

  for (const node of frame.nodes) {
    const facts = factsByPalace.get(node.palaceIndex) ?? [];
    for (const fact of facts) {
      if (fact.kind !== "transformation" || !fact.transformation || !fact.targetStar) {
        continue;
      }
      // A transformation can only match traits of its own target star, never
      // another star sharing the same palace.
      const traits = resolveTargetTraits(fact.targetStar, knowledge);
      if (!traits) {
        diagnostics.unmappedTargetTraits.push(`${fact.id}:${fact.targetStar}`);
        continue;
      }

      for (const rule of catalog.rules) {
        if (rule.transformation !== fact.transformation) continue;
        if (!rule.targetTraitsAny.some((t) => traits.includes(t))) continue;

        const dedupKey = `${fact.id}:${rule.id}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        out.push({
          id: `ann:transform-target:${focusPalaceIndex}:${dedupKey}`,
          category: "transformation-target",
          label: `Hóa ${fact.transformation} → ${fact.targetStar}`,
          explanationKey: rule.explanationKey,
          tags: rule.tags,
          factIds: [fact.id],
          palaceIndexes: [node.palaceIndex],
          palaceRoles: [node.role],
          sourceIds: catalog.sourceIds,
          knowledgeStatus,
          metadata: {
            transformation: fact.transformation,
            targetStar: fact.targetStar,
            targetTraits: traits,
          },
        });
      }
    }
  }

  return out;
}
