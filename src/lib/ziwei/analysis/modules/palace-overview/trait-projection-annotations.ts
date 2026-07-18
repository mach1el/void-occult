import type { PalaceOverviewKnowledgeV1, PalaceOverviewSemanticKnowledgeV1 } from "../../knowledge";
import type {
  PalaceAnnotation,
  PalaceEvidence,
  PalaceOverviewSemanticDiagnostics,
} from "./types";

/**
 * Projection subjects per prompt §7 (v1.2.1 correction): physical star
 * subjects only — natal major stars in focus, borrowed focus majors for
 * VCD (both already carry palaceRole "focus" from collect-evidence.ts), and
 * direct-scoring minor stars physically in focus that survived diminishing
 * returns (i.e. already present in allEvidence — nothing re-derived).
 * Opposite/trine minors are deliberately excluded.
 *
 * Transformation evidence is deliberately NOT a projection subject: a star
 * receiving 2 Tứ Hóa hits was previously projecting the same trait sentence
 * twice more (once for the star, once per transformation targeting it). Tứ
 * Hóa semantics stay in "Tứ Hóa theo sao nhận Hóa" and may be associated
 * visually with the target star there, without duplicating domain
 * projections here.
 */
function subjectsForProjection(allEvidence: PalaceEvidence[]): PalaceEvidence[] {
  const focusMajors = allEvidence.filter(
    (e) => e.category === "major-star" && e.palaceRole === "focus",
  );
  const focusMinors = allEvidence.filter(
    (e) => e.category === "minor-star-family" && e.palaceRole === "focus",
  );
  return [...focusMajors, ...focusMinors];
}

function traitsForSubject(
  subject: PalaceEvidence,
  knowledge: PalaceOverviewKnowledgeV1,
): string[] {
  if (subject.category === "major-star") {
    if (!subject.starName) return [];
    const major = knowledge.majorStars.stars.find((s) => s.name === subject.starName);
    return major?.traits ?? [];
  }
  if (subject.category === "minor-star-family") {
    return subject.traitTags ?? [];
  }
  return [];
}

export function buildTraitProjectionAnnotations(input: {
  allEvidence: PalaceEvidence[];
  knowledge: PalaceOverviewKnowledgeV1;
  semanticKnowledge: PalaceOverviewSemanticKnowledgeV1;
  diagnostics: PalaceOverviewSemanticDiagnostics;
  focusPalaceIndex: number;
  focusPalaceName: string;
}): PalaceAnnotation[] {
  const {
    allEvidence,
    knowledge,
    semanticKnowledge,
    diagnostics,
    focusPalaceIndex,
    focusPalaceName,
  } = input;
  const catalog = semanticKnowledge.traitPalaceProjection;
  const knowledgeStatus =
    catalog.status === "approved" ? "approved" : "experimental";
  const traitLabelByTrait = new Map(catalog.traits.map((t) => [t.trait, t.label]));
  const palaceEntry = catalog.palaces[focusPalaceName];
  const out: PalaceAnnotation[] = [];

  if (!palaceEntry) return out;

  const subjects = subjectsForProjection(allEvidence);

  // Aggregate by trait + domainId
  const aggregatedMap = new Map<string, {
    trait: string;
    label: string;
    explanationKey: string;
    factIds: string[];
    sourceIds: string[];
    contributorStarNames: string[];
    contributorEvidenceIds: string[];
  }>();

  for (const subject of subjects) {
    const subjectFactId = subject.factIds[0] ?? subject.id;
    const traits = traitsForSubject(subject, knowledge);

    for (const trait of traits) {
      const projectionKey = `${trait}:${palaceEntry.domainId}`;
      let agg = aggregatedMap.get(projectionKey);

      if (!agg) {
        const override = catalog.overrides.find(
          (o) => o.trait === trait && o.palace === focusPalaceName,
        );
        let label: string | null = null;
        let explanationKey: string | null = null;
        if (override) {
          label = override.label;
          explanationKey = `projection.${override.id}`;
        } else {
          const traitLabel = traitLabelByTrait.get(trait);
          if (traitLabel) {
            label = catalog.composition.fallbackTemplate
              .replace("{traitLabel}", traitLabel)
              .replace("{palaceLabel}", palaceEntry.label);
            explanationKey = `projection.fallback.${trait}`;
          }
        }

        if (!label || !explanationKey) {
          if (!diagnostics.unknownProjectionTraits.includes(trait)) {
            diagnostics.unknownProjectionTraits.push(trait);
          }
          continue;
        }

        agg = {
          trait,
          label,
          explanationKey,
          factIds: [],
          sourceIds: [...catalog.sourceIds],
          contributorStarNames: [],
          contributorEvidenceIds: [],
        };
        aggregatedMap.set(projectionKey, agg);
      }

      if (!agg.factIds.includes(subjectFactId)) {
        agg.factIds.push(subjectFactId);
      }
      if (subject.starName && !agg.contributorStarNames.includes(subject.starName)) {
        agg.contributorStarNames.push(subject.starName);
      }
      if (!agg.contributorEvidenceIds.includes(subject.id)) {
        agg.contributorEvidenceIds.push(subject.id);
      }
    }
  }

  for (const agg of aggregatedMap.values()) {
    out.push({
      id: `ann:domain-projection:${focusPalaceIndex}:${agg.trait}`,
      category: "domain-projection",
      label: agg.label,
      explanationKey: agg.explanationKey,
      tags: [],
      factIds: agg.factIds,
      palaceIndexes: [focusPalaceIndex],
      palaceRoles: ["focus"],
      sourceIds: agg.sourceIds,
      knowledgeStatus,
      metadata: {
        trait: agg.trait,
        palaceDomainId: palaceEntry.domainId,
        contributorStarNames: agg.contributorStarNames,
        contributorEvidenceIds: agg.contributorEvidenceIds,
        contributorCount: agg.contributorEvidenceIds.length,
      },
    });
  }

  return out;
}
