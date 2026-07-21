import type { AnnualAxisDomainId } from "../schema";
import type {
  AnnualAggregationProfileV043,
  AnnualAxesKnowledgeV043NamPhai,
  AnnualEvidenceDedupePolicyV043,
  AnnualEvidenceLayerId,
  AnnualGeometryClass,
  AnnualSpatialBudgetV043,
} from "./schema";

export interface AnnualKnowledgeV043ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

const GEOMETRY_CLASSES: AnnualGeometryClass[] = [
  "direct-exact-target",
  "direct-head-focus",
  "tp4c-opposite",
  "tp4c-trine",
  "context-only",
];

const LAYERS: AnnualEvidenceLayerId[] = ["annual", "major-fortune", "natal-activated"];

const GROUP_BY_KEYS = ["domain", "geometryBucket", "layer", "stackingGroup"] as const;

function issue(path: string, message: string): AnnualKnowledgeV043ValidationIssue {
  return { path, message };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isUnitInterval(n: unknown): n is number {
  return isFiniteNumber(n) && n >= 0 && n <= 1;
}

function validateSpatialBudget(
  budget: AnnualSpatialBudgetV043,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV043ValidationIssue[],
): void {
  const tol = budget.weightTolerance;
  if (!isFiniteNumber(tol) || tol < 0) {
    issues.push(issue("spatialBudget.weightTolerance", "must be a non-negative finite number"));
  }

  const sb = budget.signedBudget;
  if (!isUnitInterval(sb.direct) || Math.abs(sb.direct - 0.9) > (tol || 0)) {
    issues.push(issue("spatialBudget.signedBudget.direct", "must equal 0.9 within tolerance"));
  }
  if (!isUnitInterval(sb.tp4c) || Math.abs(sb.tp4c - 0.1) > (tol || 0)) {
    issues.push(issue("spatialBudget.signedBudget.tp4c", "must equal 0.1 within tolerance"));
  }
  if (!isFiniteNumber(sb.globalAnnualClimate) || Math.abs(sb.globalAnnualClimate) > (tol || 0)) {
    issues.push(
      issue("spatialBudget.signedBudget.globalAnnualClimate", "must equal 0 within tolerance"),
    );
  }
  if (
    !isFiniteNumber(sb.majorFortuneBackground) ||
    Math.abs(sb.majorFortuneBackground) > (tol || 0)
  ) {
    issues.push(
      issue(
        "spatialBudget.signedBudget.majorFortuneBackground",
        "must equal 0 within tolerance",
      ),
    );
  }
  if (
    isFiniteNumber(sb.direct) &&
    isFiniteNumber(sb.tp4c) &&
    Math.abs(sb.direct + sb.tp4c - 1) > (tol || 0)
  ) {
    issues.push(
      issue("spatialBudget.signedBudget", "direct + tp4c must equal 1 within tolerance"),
    );
  }

  const pc = budget.pathClassification;
  if (pc.collisionPolicy !== "direct-wins") {
    issues.push(
      issue("spatialBudget.pathClassification.collisionPolicy", "must be direct-wins"),
    );
  }
  if (!pc.exactAnnualTargetIsDirect || !pc.annualHeadFocusIsDirect) {
    issues.push(
      issue(
        "spatialBudget.pathClassification",
        "exact annual target and annual-head focus must be direct",
      ),
    );
  }
  if (!pc.oppositeIsTp4c || !pc.trineIsTp4c) {
    issues.push(
      issue("spatialBudget.pathClassification", "opposite and trine must be TP4C"),
    );
  }
  if (pc.outsideIsNumeric) {
    issues.push(
      issue("spatialBudget.pathClassification.outsideIsNumeric", "outside must not be numeric"),
    );
  }

  const rw = budget.tp4cRelativeRoleWeights;
  if (!isUnitInterval(rw.opposite) || !isUnitInterval(rw.trine)) {
    issues.push(
      issue(
        "spatialBudget.tp4cRelativeRoleWeights",
        "opposite and trine relative weights must be in [0, 1]",
      ),
    );
  }

  for (const sourceId of budget.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`spatialBudget.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

const STABLE_TIE_BREAK: Array<"ruleId" | "evidenceId"> = ["ruleId", "evidenceId"];
const PRODUCTION_GROUP_BY = ["domain", "geometryBucket", "layer", "stackingGroup"] as const;

function validateDedupe(
  policy: AnnualEvidenceDedupePolicyV043,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV043ValidationIssue[],
): void {
  // signedDedupeKey must be EXACTLY [domain, physicalFactId] — order included.
  if (
    policy.signedDedupeKey.length !== 2 ||
    policy.signedDedupeKey[0] !== "domain" ||
    policy.signedDedupeKey[1] !== "physicalFactId"
  ) {
    issues.push(
      issue("dedupePolicy.signedDedupeKey", "must be exactly [domain, physicalFactId]"),
    );
  }

  // stableTieBreak must contain every required field exactly once, in order.
  if (
    policy.stableTieBreak.length !== STABLE_TIE_BREAK.length ||
    !STABLE_TIE_BREAK.every((f, i) => policy.stableTieBreak[i] === f)
  ) {
    issues.push(
      issue(
        "dedupePolicy.stableTieBreak",
        `must be exactly [${STABLE_TIE_BREAK.join(", ")}] in order`,
      ),
    );
  }

  for (const layer of policy.layerPrecedence) {
    if (!LAYERS.includes(layer)) {
      issues.push(issue(`dedupePolicy.layerPrecedence.${layer}`, "unknown layer"));
    }
  }
  if (new Set(policy.layerPrecedence).size !== policy.layerPrecedence.length) {
    issues.push(issue("dedupePolicy.layerPrecedence", "duplicate layer entries"));
  }
  if (
    policy.layerPrecedence.length !== LAYERS.length ||
    !LAYERS.every((layer, index) => policy.layerPrecedence[index] === layer)
  ) {
    issues.push(
      issue(
        "dedupePolicy.layerPrecedence",
        "must be exactly annual, major-fortune, natal-activated each once",
      ),
    );
  }

  for (const geometry of policy.geometryPrecedence) {
    if (!GEOMETRY_CLASSES.includes(geometry)) {
      issues.push(issue(`dedupePolicy.geometryPrecedence.${geometry}`, "unknown geometry class"));
    }
  }
  if (new Set(policy.geometryPrecedence).size !== GEOMETRY_CLASSES.length) {
    issues.push(
      issue(
        "dedupePolicy.geometryPrecedence",
        "must list each known geometry class exactly once",
      ),
    );
  }

  if (policy.samePhysicalFactMultipleSignedPaths !== "keep-highest-precedence") {
    issues.push(
      issue(
        "dedupePolicy.samePhysicalFactMultipleSignedPaths",
        "must be keep-highest-precedence",
      ),
    );
  }
  if (policy.samePhysicalFactActivationContribution !== "count-once-at-strongest-path") {
    issues.push(
      issue(
        "dedupePolicy.samePhysicalFactActivationContribution",
        "must be count-once-at-strongest-path",
      ),
    );
  }

  for (const sourceId of policy.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`dedupePolicy.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateAggregation(
  profile: AnnualAggregationProfileV043,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV043ValidationIssue[],
): void {
  const n = profile.normalization;
  if (n.function !== "one-minus-exp") {
    issues.push(issue("aggregationProfile.normalization.function", "must be one-minus-exp"));
  }
  for (const key of ["supportScale", "pressureScale", "activationScale"] as const) {
    if (!isFiniteNumber(n[key]) || n[key] <= 0) {
      issues.push(issue(`aggregationProfile.normalization.${key}`, "must be a positive finite number"));
    }
  }

  const dr = profile.diminishingReturns;
  if (dr.function !== "inverse-square-root-rank") {
    issues.push(
      issue("aggregationProfile.diminishingReturns.function", "must be inverse-square-root-rank"),
    );
  }
  for (const key of dr.groupBy) {
    if (!GROUP_BY_KEYS.includes(key)) {
      issues.push(issue(`aggregationProfile.diminishingReturns.groupBy.${key}`, "unknown group key"));
    }
  }
  if (new Set(dr.groupBy).size !== dr.groupBy.length) {
    issues.push(issue("aggregationProfile.diminishingReturns.groupBy", "duplicate group keys"));
  }
  // The production V0.4.3 (variant E) grouping must be exact.
  if (
    dr.groupBy.length !== PRODUCTION_GROUP_BY.length ||
    !PRODUCTION_GROUP_BY.every((k, i) => dr.groupBy[i] === k)
  ) {
    issues.push(
      issue(
        "aggregationProfile.diminishingReturns.groupBy",
        `production V0.4.3 groupBy must be exactly [${PRODUCTION_GROUP_BY.join(", ")}]`,
      ),
    );
  }

  const gate = profile.activationGate;
  if (!isUnitInterval(gate.floor) || !isUnitInterval(gate.range)) {
    issues.push(issue("aggregationProfile.activationGate", "floor and range must be in [0, 1]"));
  }
  if (isFiniteNumber(gate.floor) && isFiniteNumber(gate.range) && gate.floor + gate.range > 1 + 1e-12) {
    issues.push(issue("aggregationProfile.activationGate", "floor + range must not exceed 1"));
  }

  const score = profile.score;
  for (const key of ["neutral", "amplitude", "divisor", "minimum", "maximum", "precision"] as const) {
    if (!isFiniteNumber(score[key])) {
      issues.push(issue(`aggregationProfile.score.${key}`, "must be a finite number"));
    }
  }
  if (isFiniteNumber(score.divisor) && score.divisor <= 0) {
    issues.push(issue("aggregationProfile.score.divisor", "must be positive"));
  }
  if (isFiniteNumber(score.amplitude) && score.amplitude < 0) {
    issues.push(issue("aggregationProfile.score.amplitude", "must be non-negative"));
  }
  if (
    isFiniteNumber(score.precision) &&
    (!Number.isInteger(score.precision) || score.precision < 0)
  ) {
    issues.push(issue("aggregationProfile.score.precision", "must be a non-negative integer"));
  }
  // minimum < neutral < maximum.
  if (
    isFiniteNumber(score.minimum) &&
    isFiniteNumber(score.neutral) &&
    isFiniteNumber(score.maximum) &&
    !(score.minimum < score.neutral && score.neutral < score.maximum)
  ) {
    issues.push(issue("aggregationProfile.score", "must satisfy minimum < neutral < maximum"));
  }

  if (profile.contextChannels.globalAnnualClimateSigned) {
    issues.push(
      issue(
        "aggregationProfile.contextChannels.globalAnnualClimateSigned",
        "must be false in V0.4.3",
      ),
    );
  }
  if (profile.contextChannels.majorFortuneBackgroundSigned) {
    issues.push(
      issue(
        "aggregationProfile.contextChannels.majorFortuneBackgroundSigned",
        "must be false in V0.4.3",
      ),
    );
  }

  for (const sourceId of profile.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`aggregationProfile.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

/**
 * Structural validation for the V0.4.3 spatial-budget pack. Fail closed.
 */
export function validateAnnualAxesKnowledgeV043NamPhai(
  knowledge: AnnualAxesKnowledgeV043NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV043ValidationIssue[] } {
  const issues: AnnualKnowledgeV043ValidationIssue[] = [];

  validateSpatialBudget(knowledge.spatialBudget, resolvedSourceIds, issues);
  validateDedupe(knowledge.dedupePolicy, resolvedSourceIds, issues);
  validateAggregation(knowledge.aggregationProfile, resolvedSourceIds, issues);

  const anchors = knowledge.fixtureMatrix.directAnchors;
  if (anchors.length !== DOMAINS.length) {
    issues.push(
      issue(
        "fixtureMatrix.directAnchors",
        `expected ${DOMAINS.length} anchors, got ${anchors.length}`,
      ),
    );
  }
  const seenDomains = new Set<string>();
  for (const anchor of anchors) {
    if (!DOMAINS.includes(anchor.domain)) {
      issues.push(issue(`fixtureMatrix.directAnchors.${anchor.domain}`, "unknown domain"));
    }
    if (seenDomains.has(anchor.domain)) {
      issues.push(issue(`fixtureMatrix.directAnchors.${anchor.domain}`, "duplicate domain"));
    }
    seenDomains.add(anchor.domain);
    if (!anchor.directFixturePalace || typeof anchor.directFixturePalace !== "string") {
      issues.push(
        issue(`fixtureMatrix.directAnchors.${anchor.domain}.directFixturePalace`, "missing palace"),
      );
    }
  }
  for (const domain of DOMAINS) {
    if (!seenDomains.has(domain)) {
      issues.push(issue("fixtureMatrix.directAnchors", `missing domain ${domain}`));
    }
  }

  for (const sourceId of knowledge.fixtureMatrix.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`fixtureMatrix.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
