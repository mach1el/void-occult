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

  const seen = new Set<string>();
  const subjects = subjectsForProjection(allEvidence);

  for (const subject of subjects) {
    const subjectFactId = subject.factIds[0] ?? subject.id;
    // Dedup by canonical star identity, not fact id — a star with more than
    // one evidence object referencing the same physical presence must still
    // only ever project one trait sentence per palace.
    const subjectIdentity = subject.starName ?? subjectFactId;
    const traits = traitsForSubject(subject, knowledge);

    for (const trait of traits) {
      const dedupKey = `${trait}:${focusPalaceName}:${subjectIdentity}`;
      if (seen.has(dedupKey)) continue;

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
        diagnostics.unknownProjectionTraits.push(trait);
        continue;
      }
      seen.add(dedupKey);

      out.push({
        id: `ann:domain-projection:${focusPalaceIndex}:${dedupKey}`,
        category: "domain-projection",
        label,
        explanationKey,
        tags: [],
        factIds: [subjectFactId],
        palaceIndexes: [focusPalaceIndex],
        palaceRoles: ["focus"],
        sourceIds: catalog.sourceIds,
        knowledgeStatus,
        metadata: { trait, palaceDomainId: palaceEntry.domainId },
      });
    }
  }

  return out;
}
