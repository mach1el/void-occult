export { analyzeAnnualAxesNamPhaiV043 } from "./analyze";
export { classifyEvidencePaths, classifyActivationPath } from "./classify-paths";
export { dedupeSpatialPaths, comparePathPrecedence, compareActivationPrecedence } from "./dedupe";
export {
  aggregateSpatialBudget,
  computeSignedDiminishingFactors,
  computeActivationDiminishingFactors,
  computeSignedPathFactor,
  computeActivationPathFactor,
  signedMagnitude,
  activationMagnitude,
} from "./aggregate-spatial";
export {
  normalizeSpatialBudgetV043,
  isValidActivationGate,
  type ActivationGateOverride,
} from "./normalize-spatial";
