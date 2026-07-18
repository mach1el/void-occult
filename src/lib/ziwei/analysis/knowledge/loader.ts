import type {
  PalaceOverviewKnowledgeV1,
  PalaceOverviewSemanticKnowledgeV1,
} from "./schema";
import {
  assertLoadableCatalogs,
  validatePalaceOverviewKnowledge,
  validatePalaceOverviewSemanticKnowledge,
  type KnowledgeValidationIssue,
} from "./validate";

import profile from "./palace-overview/v1/profile.json";
import majorStars from "./palace-overview/v1/major-stars.json";
import transformations from "./palace-overview/v1/transformations.json";
import minorFamilies from "./palace-overview/v1/minor-star-families.json";
import minorStars from "./palace-overview/v1/minor-stars.json";
import minorStateModifiers from "./palace-overview/v1/minor-star-state-modifiers.json";
import starAliases from "./palace-overview/v1/canonical-star-aliases.json";
import schoolCoverage from "./palace-overview/v1/school-star-coverage.json";
import voidEnvironment from "./palace-overview/v1/void-environment.json";
import changSheng from "./palace-overview/v1/chang-sheng.json";
import structuralRules from "./palace-overview/v1/structural-rules.json";
import sources from "./palace-overview/v1/sources.json";

import versionManifest from "./palace-overview/v1/version-manifest.json";
import menhThanContext from "./palace-overview/v1/menh-than-context.json";
import minorStructuralPairs from "./palace-overview/v1/minor-structural-pairs.json";
import transformationTargetSemantics from "./palace-overview/v1/transformation-target-semantics.json";
import traitPalaceProjection from "./palace-overview/v1/trait-palace-projection.json";
import semanticSources from "./palace-overview/v1/semantic-sources.json";
import sourceMapping from "./palace-overview/v1/source-mapping.json";

export type LoadKnowledgeResult =
  | { ok: true; knowledge: PalaceOverviewKnowledgeV1 }
  | { ok: false; issues: KnowledgeValidationIssue[] };

let cached: LoadKnowledgeResult | null = null;

function buildKnowledge(): PalaceOverviewKnowledgeV1 {
  return {
    profile: profile as PalaceOverviewKnowledgeV1["profile"],
    majorStars: majorStars as PalaceOverviewKnowledgeV1["majorStars"],
    transformations:
      transformations as PalaceOverviewKnowledgeV1["transformations"],
    minorFamilies: minorFamilies as PalaceOverviewKnowledgeV1["minorFamilies"],
    minorStars: minorStars as PalaceOverviewKnowledgeV1["minorStars"],
    minorStateModifiers:
      minorStateModifiers as PalaceOverviewKnowledgeV1["minorStateModifiers"],
    starAliases: starAliases as PalaceOverviewKnowledgeV1["starAliases"],
    schoolCoverage: schoolCoverage as PalaceOverviewKnowledgeV1["schoolCoverage"],
    voidEnvironment:
      voidEnvironment as PalaceOverviewKnowledgeV1["voidEnvironment"],
    changSheng: changSheng as PalaceOverviewKnowledgeV1["changSheng"],
    structuralRules:
      structuralRules as PalaceOverviewKnowledgeV1["structuralRules"],
    sources: sources as PalaceOverviewKnowledgeV1["sources"],
  };
}

/** Load palace-overview v1 knowledge once; validate in all environments. */
export function loadPalaceOverviewKnowledgeV1(): LoadKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const structural = validatePalaceOverviewKnowledge(knowledge);
  const loadable = assertLoadableCatalogs(knowledge);
  const issues = [...structural.issues, ...loadable];

  cached = issues.length === 0 ? { ok: true, knowledge } : { ok: false, issues };
  return cached;
}

/** Test helper — clear memoized knowledge. */
export function resetPalaceOverviewKnowledgeCache(): void {
  cached = null;
}

export type LoadSemanticKnowledgeResult =
  | { ok: true; knowledge: PalaceOverviewSemanticKnowledgeV1 }
  | { ok: false; issues: KnowledgeValidationIssue[] };

let semanticCached: LoadSemanticKnowledgeResult | null = null;

function buildSemanticKnowledge(): PalaceOverviewSemanticKnowledgeV1 {
  return {
    versionManifest:
      versionManifest as unknown as PalaceOverviewSemanticKnowledgeV1["versionManifest"],
    menhThanContext:
      menhThanContext as unknown as PalaceOverviewSemanticKnowledgeV1["menhThanContext"],
    minorStructuralPairs:
      minorStructuralPairs as unknown as PalaceOverviewSemanticKnowledgeV1["minorStructuralPairs"],
    transformationTargetSemantics:
      transformationTargetSemantics as unknown as PalaceOverviewSemanticKnowledgeV1["transformationTargetSemantics"],
    traitPalaceProjection:
      traitPalaceProjection as unknown as PalaceOverviewSemanticKnowledgeV1["traitPalaceProjection"],
    semanticSources:
      semanticSources as unknown as PalaceOverviewSemanticKnowledgeV1["semanticSources"],
    sourceMapping:
      sourceMapping as unknown as PalaceOverviewSemanticKnowledgeV1["sourceMapping"],
  };
}

/**
 * Load palace-overview V1.2 semantic knowledge. Fully independent of
 * loadPalaceOverviewKnowledgeV1(): a broken/invalid semantic pack must never
 * affect numeric V1.1 scoring or its loadable status.
 */
export function loadPalaceOverviewSemanticKnowledgeV1(): LoadSemanticKnowledgeResult {
  if (semanticCached) return semanticCached;

  const knowledge = buildSemanticKnowledge();
  const validation = validatePalaceOverviewSemanticKnowledge(knowledge);

  semanticCached = validation.ok
    ? { ok: true, knowledge }
    : { ok: false, issues: validation.issues };
  return semanticCached;
}

/** Test helper — clear memoized semantic knowledge. */
export function resetPalaceOverviewSemanticKnowledgeCache(): void {
  semanticCached = null;
}

/**
 * Contract/engine/knowledge version identifiers, per prompt §8. Read
 * unconditionally from version-manifest.json — these are build-time
 * identifiers of what this codebase implements, not gated behind semantic
 * knowledge validating successfully (a broken semantic catalog elsewhere
 * must not blank out version reporting).
 */
export function getPalaceOverviewVersions(): {
  contractVersion: string;
  engineVersion: string;
  knowledgeVersion: string;
} {
  const manifest = versionManifest as unknown as {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
  };
  return {
    contractVersion: manifest.contractVersion,
    engineVersion: manifest.engineVersion,
    knowledgeVersion: manifest.knowledgeVersion,
  };
}
