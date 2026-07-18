import type { NatalZiweiFact } from "../../facts";
import type { StaticFrame, StaticFrameNode, StaticFrameRole } from "../../frame";
import type { PalaceOverviewSemanticKnowledgeV1 } from "../../knowledge";
import type {
  MinorStructuralPairRule,
  PalaceAnnotationScope,
} from "../../knowledge/schema";
import type { PalaceAnnotation, PalaceOverviewSemanticDiagnostics } from "./types";

interface ResolvedParticipant {
  node: StaticFrameNode;
  fact: NatalZiweiFact;
}

interface ResolvedScope {
  scope: PalaceAnnotationScope;
  factIds: string[];
  palaceIndexes: number[];
  palaceRoles: StaticFrameRole[];
}

/**
 * Resolve the strongest scope for one rule's participants within the given
 * TP4C frame. Priority: same-palace > opposite-link > trine-link > tp4c.
 * A missing participant means no hit. One fact cannot fill two participant
 * slots (aliases never double-count a single physical star).
 */
function resolveScope(
  rule: MinorStructuralPairRule,
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
): ResolvedScope | null {
  const usedFactIds = new Set<string>();
  const resolved: ResolvedParticipant[] = [];

  for (const participantName of rule.participants) {
    let found: ResolvedParticipant | null = null;
    for (const node of frame.nodes) {
      const facts = factsByPalace.get(node.palaceIndex) ?? [];
      const fact = facts.find(
        (f) =>
          f.kind === "star" &&
          f.canonicalStarName === participantName &&
          !usedFactIds.has(f.id),
      );
      if (fact) {
        found = { node, fact };
        break;
      }
    }
    if (!found) {
      // A participant simply not present in this palace's TP4C frame is a
      // normal, expected non-match (most rule × palace combinations miss) —
      // not an integrity problem, so it must not be recorded as a diagnostic.
      return null;
    }
    usedFactIds.add(found.fact.id);
    resolved.push(found);
  }

  const palaceIndexes = [...new Set(resolved.map((p) => p.node.palaceIndex))];
  const roles = new Set(resolved.map((p) => p.node.role));

  let scope: PalaceAnnotationScope;
  if (palaceIndexes.length === 1) {
    scope = "same-palace";
  } else if (
    roles.has("focus") &&
    roles.has("opposite") &&
    [...roles].every((r) => r === "focus" || r === "opposite")
  ) {
    scope = "opposite-link";
  } else if (
    roles.has("focus") &&
    roles.has("trine") &&
    [...roles].every((r) => r === "focus" || r === "trine")
  ) {
    scope = "trine-link";
  } else {
    scope = "tp4c";
  }

  if (!rule.match.allowedScopes.includes(scope)) return null;

  return {
    scope,
    factIds: resolved.map((p) => p.fact.id),
    palaceIndexes,
    palaceRoles: [...roles],
  };
}

export function buildMinorPairAnnotations(input: {
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewSemanticKnowledgeV1;
  diagnostics: PalaceOverviewSemanticDiagnostics;
  focusPalaceIndex: number;
}): PalaceAnnotation[] {
  const { frame, factsByPalace, knowledge, focusPalaceIndex } = input;
  const catalog = knowledge.minorStructuralPairs;
  const knowledgeStatus =
    catalog.status === "approved" ? "approved" : "experimental";
  const out: PalaceAnnotation[] = [];

  for (const rule of catalog.rules) {
    const resolved = resolveScope(rule, frame, factsByPalace);
    if (!resolved) continue;

    out.push({
      id: `ann:minor-pair:${focusPalaceIndex}:${rule.id}`,
      category: "minor-pair",
      label: rule.label,
      explanationKey: rule.explanationKey,
      tags: rule.tags,
      factIds: resolved.factIds,
      palaceIndexes: resolved.palaceIndexes,
      palaceRoles: resolved.palaceRoles,
      sourceIds: catalog.sourceIds,
      knowledgeStatus,
      metadata: { scope: resolved.scope },
    });
  }

  return out;
}
