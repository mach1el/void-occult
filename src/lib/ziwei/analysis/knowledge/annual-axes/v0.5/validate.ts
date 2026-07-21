import type {
  AnnualAxesKnowledgeV05NamPhai,
  AnnualAxisCalibrationV05,
  AnnualBucketFormulaV05,
  AnnualDistributionGatesV05,
  AnnualEvidenceDedupePolicyV05,
  AnnualNatalGainV05,
  AnnualScoreProfileV05,
  AnnualSpatialBudgetV05,
} from "./schema";
import type { AnnualAxisDomainId } from "../schema";

export interface AnnualKnowledgeV05ValidationIssue {
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

const LAYERS = ["annual", "major-fortune", "natal-activated"] as const;
const GEOMETRY = [
  "direct-exact-target",
  "direct-head-focus",
  "tp4c-opposite",
  "tp4c-trine",
  "context-only",
] as const;

function issue(path: string, message: string): AnnualKnowledgeV05ValidationIssue {
  return { path, message };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateSpatialBudget(
  budget: AnnualSpatialBudgetV05,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV05ValidationIssue[],
): void {
  const tol = budget.weightTolerance;
  const sb = budget.signedBudget;
  if (!isFiniteNumber(sb.direct) || Math.abs(sb.direct - 0.9) > (tol || 0)) {
    issues.push(issue("spatialBudget.signedBudget.direct", "must equal 0.9"));
  }
  if (!isFiniteNumber(sb.tp4c) || Math.abs(sb.tp4c - 0.1) > (tol || 0)) {
    issues.push(issue("spatialBudget.signedBudget.tp4c", "must equal 0.1"));
  }
  for (const sourceId of budget.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`spatialBudget.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateDedupe(
  policy: AnnualEvidenceDedupePolicyV05,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV05ValidationIssue[],
): void {
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
  if (new Set(policy.geometryPrecedence).size !== GEOMETRY.length) {
    issues.push(issue("dedupePolicy.geometryPrecedence", "must list each geometry class once"));
  }
  for (const sourceId of policy.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`dedupePolicy.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateBucketFormula(
  formula: AnnualBucketFormulaV05,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV05ValidationIssue[],
): void {
  if (!isFiniteNumber(formula.evidenceScale) || formula.evidenceScale <= 0) {
    issues.push(issue("bucketFormula.evidenceScale", "must be a positive finite number"));
  }
  if (!isFiniteNumber(formula.epsilon) || formula.epsilon <= 0) {
    issues.push(issue("bucketFormula.epsilon", "must be a positive finite number"));
  }
  for (const [key, value] of Object.entries(formula.signedLayerWeights)) {
    if (!isFiniteNumber(value) || value < 0) {
      issues.push(
        issue(
          `bucketFormula.signedLayerWeights.${key}`,
          "must be a non-negative finite number",
        ),
      );
    }
  }
  for (const [key, value] of Object.entries(formula.annualActivationStrength)) {
    if (!isFiniteNumber(value) || value < 0) {
      issues.push(
        issue(
          `bucketFormula.annualActivationStrength.${key}`,
          "must be a non-negative finite number",
        ),
      );
    }
  }
  const aas = formula.annualActivationStrength;
  if (
    aas.supportWeight !== 0 ||
    aas.pressureWeight !== 0 ||
    aas.activationWeight !== 1
  ) {
    issues.push(
      issue(
        "bucketFormula.annualActivationStrength",
        "V0.5 requires supportWeight=0, pressureWeight=0, activationWeight=1",
      ),
    );
  }
  if (typeof formula.contextChannels.mayContributeActivation !== "boolean") {
    issues.push(
      issue(
        "bucketFormula.contextChannels.mayContributeActivation",
        "must be a boolean",
      ),
    );
  }
  for (const sourceId of formula.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`bucketFormula.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateCalibration(
  calibration: AnnualAxisCalibrationV05,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV05ValidationIssue[],
): void {
  if (!isFiniteNumber(calibration.activationScale) || calibration.activationScale <= 0) {
    issues.push(issue("calibration.activationScale", "must be a positive finite number"));
  }
  for (const domain of DOMAINS) {
    const scale = calibration.domainScales[domain];
    if (!isFiniteNumber(scale) || scale <= 0) {
      issues.push(issue(`calibration.domainScales.${domain}`, "must be a positive finite number"));
    }
    const q75 = calibration.q75AbsLatent[domain];
    if (!isFiniteNumber(q75) || q75 < 0) {
      issues.push(issue(`calibration.q75AbsLatent.${domain}`, "must be a non-negative finite number"));
    }
  }
  for (const sourceId of calibration.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`calibration.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

export function validateAnnualAxesKnowledgeV05NamPhai(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV05ValidationIssue[] } {
  const issues: AnnualKnowledgeV05ValidationIssue[] = [];
  validateSpatialBudget(knowledge.spatialBudget, resolvedSourceIds, issues);
  validateDedupe(knowledge.dedupePolicy, resolvedSourceIds, issues);
  validateBucketFormula(knowledge.bucketFormula, resolvedSourceIds, issues);

  const ng = knowledge.natalGain;
  if (!isFiniteNumber(ng.minimum) || !isFiniteNumber(ng.maximum) || ng.minimum >= ng.maximum) {
    issues.push(issue("natalGain", "minimum must be less than maximum"));
  }

  const sp = knowledge.scoreProfile;
  if (!isFiniteNumber(sp.amplitude) || sp.amplitude <= 0) {
    issues.push(issue("scoreProfile.amplitude", "must be positive"));
  }
  if (
    !isFiniteNumber(sp.minimumDomainScale) ||
    !isFiniteNumber(sp.maximumDomainScale) ||
    sp.minimumDomainScale >= sp.maximumDomainScale
  ) {
    issues.push(issue("scoreProfile.minimumDomainScale", "invalid domain scale bounds"));
  }

  validateCalibration(knowledge.calibration, resolvedSourceIds, issues);

  const gates = knowledge.distributionGates.hardGates;
  for (const [key, value] of Object.entries(gates)) {
    if (!isFiniteNumber(value)) {
      issues.push(issue(`distributionGates.hardGates.${key}`, "must be a finite number"));
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
