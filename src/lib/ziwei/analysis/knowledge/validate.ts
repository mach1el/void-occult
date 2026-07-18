import type {
  AxisSeed,
  KnowledgeRecordMeta,
  KnowledgeStatus,
  MinorBrightnessPolicy,
  MinorFamilyRecord,
  MinorStarScoringMode,
  PalaceOverviewKnowledgeV1,
  PalaceOverviewProfile,
} from "./schema";

const SCORING_MODES: ReadonlySet<MinorStarScoringMode> = new Set([
  "direct",
  "context-only",
]);

const BRIGHTNESS_POLICIES: ReadonlySet<MinorBrightnessPolicy> = new Set([
  "none",
  "hoa-linh",
  "literary-if-present",
]);

const ALLOWED_LOAD: ReadonlySet<KnowledgeStatus> = new Set([
  "approved",
  "experimental",
]);

export interface KnowledgeValidationIssue {
  path: string;
  message: string;
}

export interface KnowledgeValidationResult {
  ok: boolean;
  issues: KnowledgeValidationIssue[];
}

function isMeta(value: unknown): value is KnowledgeRecordMeta {
  if (!value || typeof value !== "object") return false;
  const m = value as KnowledgeRecordMeta;
  return (
    typeof m.id === "string" &&
    typeof m.version === "string" &&
    typeof m.status === "string" &&
    Array.isArray(m.schoolProfiles) &&
    Array.isArray(m.sourceIds) &&
    typeof m.confidence === "number" &&
    typeof m.effectiveFrom === "string"
  );
}

function validateMeta(
  meta: KnowledgeRecordMeta,
  path: string,
  issues: KnowledgeValidationIssue[],
  seenIds: Set<string>,
): void {
  if (seenIds.has(meta.id)) {
    issues.push({ path: `${path}.id`, message: `duplicate knowledge id ${meta.id}` });
  }
  seenIds.add(meta.id);

  if (!["draft", "experimental", "approved", "deprecated"].includes(meta.status)) {
    issues.push({ path: `${path}.status`, message: `invalid status ${meta.status}` });
  }
  if (meta.confidence < 0 || meta.confidence > 1) {
    issues.push({
      path: `${path}.confidence`,
      message: `confidence out of range: ${meta.confidence}`,
    });
  }
  if (!meta.version) {
    issues.push({ path: `${path}.version`, message: "version missing" });
  }
}

function validateAxes(
  axes: AxisSeed,
  path: string,
  issues: KnowledgeValidationIssue[],
): void {
  for (const key of ["support", "pressure", "stability", "activation"] as const) {
    if (typeof axes[key] !== "number" || Number.isNaN(axes[key])) {
      issues.push({ path: `${path}.${key}`, message: "axis must be a number" });
    }
  }
}

function validateProfile(
  profile: PalaceOverviewProfile,
  issues: KnowledgeValidationIssue[],
): void {
  const scales = [
    profile.qualityNormalization.scale,
    profile.axisNormalization.supportScale,
    profile.axisNormalization.pressureScale,
    profile.axisNormalization.activationScale,
    profile.axisNormalization.stabilityScale,
    profile.intensityNormalization.scale,
    profile.geometry.focus,
    profile.geometry.opposite,
    profile.geometry.trine,
  ];
  for (const scale of scales) {
    if (!(scale > 0)) {
      issues.push({ path: "profile.scales", message: `scale must be > 0 (got ${scale})` });
    }
  }
  if (profile.familyMaxContributors < 1) {
    issues.push({
      path: "profile.familyMaxContributors",
      message: "must be >= 1",
    });
  }
}

function validateMinorStars(
  knowledge: PalaceOverviewKnowledgeV1,
  familyById: Map<string, MinorFamilyRecord>,
  issues: KnowledgeValidationIssue[],
): void {
  const sourceIds = new Set(knowledge.sources.sources.map((s) => s.id));
  const seenStarIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenCanonicalNames = new Set<string>();
  const stateModifierPolicyKeys = new Set(
    Object.keys(knowledge.minorStateModifiers.policies),
  );

  const excludedNames = new Set([
    ...knowledge.schoolCoverage.excludedFromStaticScoring.transformMarkers,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.voidMarkers,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.annualExamples,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.changShengSeparate,
  ]);
  const specialCaseNames = new Set(
    knowledge.schoolCoverage.specialCases.map((c) => c.name),
  );

  for (const star of knowledge.minorStars.stars) {
    const path = `minorStars.${star.id}`;

    if (seenStarIds.has(star.id)) {
      issues.push({ path, message: `duplicate minor-star record id: ${star.id}` });
    }
    seenStarIds.add(star.id);

    if (seenNames.has(star.name)) {
      issues.push({ path, message: `duplicate minor-star name: ${star.name}` });
    }
    seenNames.add(star.name);

    if (seenCanonicalNames.has(star.canonicalName)) {
      issues.push({
        path,
        message: `canonical star assigned more than once: ${star.canonicalName}`,
      });
    }
    seenCanonicalNames.add(star.canonicalName);

    const family = familyById.get(star.familyId);
    if (!family) {
      issues.push({ path, message: `missing family: ${star.familyId}` });
    }

    const scoringMode = star.scoringMode as MinorStarScoringMode;
    if (!SCORING_MODES.has(scoringMode)) {
      issues.push({ path, message: `invalid scoringMode: ${star.scoringMode}` });
    }

    const brightnessPolicy = star.brightnessPolicy as MinorBrightnessPolicy;
    if (!BRIGHTNESS_POLICIES.has(brightnessPolicy)) {
      issues.push({
        path,
        message: `invalid brightnessPolicy: ${star.brightnessPolicy}`,
      });
    } else if (!stateModifierPolicyKeys.has(brightnessPolicy)) {
      issues.push({
        path,
        message: `unknown state modifier policy: ${brightnessPolicy}`,
      });
    }

    if (scoringMode === "context-only") {
      const axes = star.axesOverride;
      if (
        axes &&
        (axes.support !== 0 ||
          axes.pressure !== 0 ||
          axes.stability !== 0 ||
          axes.activation !== 0)
      ) {
        issues.push({
          path,
          message: "context-only record must not have non-zero axesOverride",
        });
      }
    }

    if (scoringMode === "direct" && family?.id === "context-only") {
      issues.push({
        path,
        message: "direct record cannot use a context-only family",
      });
    }

    if (star.axesOverride) validateAxes(star.axesOverride, path, issues);

    for (const id of star.sourceIds) {
      if (!sourceIds.has(id)) {
        issues.push({ path, message: `unsupported source id: ${id}` });
      }
    }

    if (!star.schoolProfiles.length) {
      issues.push({ path, message: "record absent from all school profiles" });
    }

    if (excludedNames.has(star.name) && !specialCaseNames.has(star.name)) {
      issues.push({
        path,
        message: `star present in exclusion list without explicit special case: ${star.name}`,
      });
    }
  }
}

export function validatePalaceOverviewKnowledge(
  knowledge: PalaceOverviewKnowledgeV1,
): KnowledgeValidationResult {
  const issues: KnowledgeValidationIssue[] = [];
  const seenIds = new Set<string>();

  const catalogs: Array<{ path: string; meta: KnowledgeRecordMeta }> = [
    { path: "profile", meta: knowledge.profile },
    { path: "majorStars", meta: knowledge.majorStars },
    { path: "transformations", meta: knowledge.transformations },
    { path: "minorFamilies", meta: knowledge.minorFamilies },
    { path: "minorStars", meta: knowledge.minorStars },
    { path: "minorStateModifiers", meta: knowledge.minorStateModifiers },
    { path: "starAliases", meta: knowledge.starAliases },
    { path: "schoolCoverage", meta: knowledge.schoolCoverage },
    { path: "voidEnvironment", meta: knowledge.voidEnvironment },
    { path: "changSheng", meta: knowledge.changSheng },
    { path: "structuralRules", meta: knowledge.structuralRules },
  ];

  for (const { path, meta } of catalogs) {
    if (!isMeta(meta)) {
      issues.push({ path, message: "missing knowledge meta fields" });
      continue;
    }
    validateMeta(meta, path, issues, seenIds);
  }

  validateProfile(knowledge.profile, issues);

  if (knowledge.majorStars.stars.length !== 14) {
    issues.push({
      path: "majorStars.stars",
      message: `expected 14 major stars, got ${knowledge.majorStars.stars.length}`,
    });
  }
  for (const star of knowledge.majorStars.stars) {
    validateAxes(star.axes, `majorStars.${star.name}`, issues);
  }

  const familyById = new Map(
    knowledge.minorFamilies.families.map((f) => [f.id, f]),
  );
  const diminishingGroups = new Set<string>();
  for (const family of knowledge.minorFamilies.families) {
    validateAxes(family.axes, `minorFamilies.${family.id}`, issues);
    if (!family.diminishingGroup) {
      issues.push({
        path: `minorFamilies.${family.id}`,
        message: "family missing diminishingGroup",
      });
    } else if (diminishingGroups.has(family.diminishingGroup)) {
      issues.push({
        path: `minorFamilies.${family.id}`,
        message: `diminishingGroup not unique: ${family.diminishingGroup}`,
      });
    }
    diminishingGroups.add(family.diminishingGroup);
  }

  validateMinorStars(knowledge, familyById, issues);

  for (const rule of knowledge.structuralRules.rules) {
    if (!rule.participants.length) {
      issues.push({
        path: `structuralRules.${rule.id}`,
        message: "participants missing",
      });
    }
    validateAxes(rule.baseAxes, `structuralRules.${rule.id}`, issues);
  }

  for (const source of knowledge.sources.sources) {
    validateMeta(source, `sources.${source.id}`, issues, seenIds);
  }

  return { ok: issues.length === 0, issues };
}

export function isLoadableStatus(status: KnowledgeStatus): boolean {
  return ALLOWED_LOAD.has(status);
}

export function assertLoadableCatalogs(
  knowledge: PalaceOverviewKnowledgeV1,
): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  const entries: Array<[string, KnowledgeStatus]> = [
    ["profile", knowledge.profile.status],
    ["majorStars", knowledge.majorStars.status],
    ["transformations", knowledge.transformations.status],
    ["minorFamilies", knowledge.minorFamilies.status],
    ["minorStars", knowledge.minorStars.status],
    ["minorStateModifiers", knowledge.minorStateModifiers.status],
    ["starAliases", knowledge.starAliases.status],
    ["schoolCoverage", knowledge.schoolCoverage.status],
    ["voidEnvironment", knowledge.voidEnvironment.status],
    ["changSheng", knowledge.changSheng.status],
    ["structuralRules", knowledge.structuralRules.status],
  ];
  for (const [path, status] of entries) {
    if (status === "draft") {
      issues.push({ path, message: "draft knowledge must not load" });
    }
    if (!isLoadableStatus(status) && status !== "deprecated") {
      issues.push({ path, message: `status ${status} is not loadable` });
    }
    if (status === "deprecated") {
      issues.push({ path, message: "deprecated knowledge must not load" });
    }
  }
  return issues;
}
