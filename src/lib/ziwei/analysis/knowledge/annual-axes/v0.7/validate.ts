import type {
  AnnualAxesKnowledgeV07NamPhai,
  AnnualAxisCalibrationV07,
  AnnualBucketFormulaV07,
  AnnualEvidenceDedupePolicyV07,
  AnnualSpatialBudgetV07,
} from "./schema";
import type { AnnualAxisDomainId } from "../schema";

export interface AnnualKnowledgeV07ValidationIssue {
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

function issue(path: string, message: string): AnnualKnowledgeV07ValidationIssue {
  return { path, message };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateSpatialBudget(
  budget: AnnualSpatialBudgetV07,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV07ValidationIssue[],
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
  policy: AnnualEvidenceDedupePolicyV07,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV07ValidationIssue[],
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
  formula: AnnualBucketFormulaV07,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV07ValidationIssue[],
): void {
  if (!isFiniteNumber(formula.evidenceScale) || formula.evidenceScale <= 0) {
    issues.push(issue("bucketFormula.evidenceScale", "must be a positive finite number"));
  }
  if (!isFiniteNumber(formula.epsilon) || formula.epsilon <= 0) {
    issues.push(issue("bucketFormula.epsilon", "must be a positive finite number"));
  }
  const factors = formula.signedLayerFactors;
  if (!factors) {
    issues.push(issue("bucketFormula.signedLayerFactors", "required"));
  } else {
    for (const key of ["annual", "natalActivated", "majorFortune", "global"] as const) {
      const value = factors[key];
      if (!isFiniteNumber(value) || value < 0 || value > 1) {
        issues.push(
          issue(
            `bucketFormula.signedLayerFactors.${key}`,
            "must be a finite number in [0, 1]",
          ),
        );
      }
    }
    if (factors.annual !== 1) {
      issues.push(issue("bucketFormula.signedLayerFactors.annual", "must equal 1.0"));
    }
    if (factors.natalActivated !== 0.25) {
      issues.push(
        issue("bucketFormula.signedLayerFactors.natalActivated", "must equal 0.25"),
      );
    }
    if (factors.majorFortune !== 0) {
      issues.push(issue("bucketFormula.signedLayerFactors.majorFortune", "must equal 0.0"));
    }
    if (factors.global !== 0) {
      issues.push(issue("bucketFormula.signedLayerFactors.global", "must equal 0.0"));
    }
  }
  for (const [key, value] of Object.entries(formula.signedLayerWeights ?? {})) {
    if (!isFiniteNumber(value) || value < 0) {
      issues.push(
        issue(
          `bucketFormula.signedLayerWeights.${key}`,
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
        "V0.7 requires supportWeight=0, pressureWeight=0, activationWeight=1",
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
  calibration: AnnualAxisCalibrationV07,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV07ValidationIssue[],
): void {
  if (calibration.engineVersion !== "0.7.0") {
    issues.push(issue("calibration.engineVersion", "must equal 0.7.0"));
  }
  if (calibration.formulaVersion !== "v0.7-robust-centered-annual-score") {
    issues.push(
      issue(
        "calibration.formulaVersion",
        "must equal v0.7-robust-centered-annual-score",
      ),
    );
  }
  if (!isFiniteNumber(calibration.activationScale) || calibration.activationScale <= 0) {
    issues.push(issue("calibration.activationScale", "must be a positive finite number"));
  }
  const factors = calibration.signedLayerFactors;
  if (!factors) {
    issues.push(issue("calibration.signedLayerFactors", "required"));
  } else {
    if (factors.annual !== 1 || factors.natalActivated !== 0.25) {
      issues.push(
        issue(
          "calibration.signedLayerFactors",
          "must be annual=1, natalActivated=0.25, majorFortune=0, global=0",
        ),
      );
    }
    if (factors.majorFortune !== 0 || factors.global !== 0) {
      issues.push(
        issue(
          "calibration.signedLayerFactors",
          "majorFortune and global must be 0",
        ),
      );
    }
  }
  for (const domain of DOMAINS) {
    const scale = calibration.domainScales[domain];
    if (!isFiniteNumber(scale) || scale <= 0) {
      issues.push(issue(`calibration.domainScales.${domain}`, "must be a positive finite number"));
    }
    const center = calibration.domainCenters[domain];
    if (!isFiniteNumber(center)) {
      issues.push(issue(`calibration.domainCenters.${domain}`, "must be a finite number"));
    }
    const q75 = calibration.q75AbsStrictLatent[domain];
    if (!isFiniteNumber(q75) || q75 < 0) {
      issues.push(
        issue(`calibration.q75AbsStrictLatent.${domain}`, "must be a non-negative finite number"),
      );
    }
  }
  for (const sourceId of calibration.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`calibration.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

export function validateAnnualAxesKnowledgeV07NamPhai(
  knowledge: AnnualAxesKnowledgeV07NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV07ValidationIssue[] } {
  const issues: AnnualKnowledgeV07ValidationIssue[] = [];
  validateSpatialBudget(knowledge.spatialBudget, resolvedSourceIds, issues);
  validateDedupe(knowledge.dedupePolicy, resolvedSourceIds, issues);
  validateBucketFormula(knowledge.bucketFormula, resolvedSourceIds, issues);

  const ng = knowledge.natalGain;
  if (!isFiniteNumber(ng.minimum) || !isFiniteNumber(ng.maximum) || ng.minimum >= ng.maximum) {
    issues.push(issue("natalGain", "minimum must be less than maximum"));
  }

  const sp = knowledge.scoreProfile;
  if (!isFiniteNumber(sp.amplitude) || sp.amplitude !== 44) {
    issues.push(issue("scoreProfile.amplitude", "must equal 44"));
  }
  if (!isFiniteNumber(sp.targetQ75ScoreDelta) || sp.targetQ75ScoreDelta !== 22) {
    issues.push(issue("scoreProfile.targetQ75ScoreDelta", "must equal 22"));
  }
  if (
    !isFiniteNumber(sp.minimumDomainScale) ||
    !isFiniteNumber(sp.maximumDomainScale) ||
    sp.minimumDomainScale >= sp.maximumDomainScale
  ) {
    issues.push(issue("scoreProfile.minimumDomainScale", "invalid domain scale bounds"));
  }
  const expectedLatentTarget = Math.atanh(22 / 44);
  if (
    !isFiniteNumber(sp.latentTargetForDomainScale) ||
    Math.abs(sp.latentTargetForDomainScale - expectedLatentTarget) > 1e-9
  ) {
    issues.push(
      issue(
        "scoreProfile.latentTargetForDomainScale",
        "must equal atanh(targetQ75ScoreDelta / amplitude)",
      ),
    );
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
