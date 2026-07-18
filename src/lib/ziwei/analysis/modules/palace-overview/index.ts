export type {
  PalaceAnnotation,
  PalaceAnnotationCategory,
  PalaceEvidence,
  PalaceEvidenceAxes,
  PalaceEvidenceCategory,
  PalaceOverviewBand,
  PalaceOverviewDiagnostics,
  PalaceOverviewResult,
  PalaceOverviewSemanticDiagnostics,
} from "./types";
export {
  absEffect,
  addAxes,
  emptyAxes,
  emptySemanticDiagnostics,
  scaleAxes,
} from "./types";
export {
  buildMenhThanAnnotations,
  resolveMenhThanStatus,
  type MenhThanStatus,
} from "./menh-than-annotations";
export { buildMinorPairAnnotations } from "./minor-pair-annotations";
export { buildTransformationTargetAnnotations } from "./transformation-target-annotations";
export { buildTraitProjectionAnnotations } from "./trait-projection-annotations";
export {
  listBenchmarkCaseIds,
  runBenchmarkCase,
  type BenchmarkCaseRun,
  type BenchmarkPalaceResult,
  type BenchmarkSchoolRun,
} from "./benchmark";
export {
  applyLocalVoidAttenuation,
  collectPalaceEvidence,
  emptyDiagnostics,
  type CollectEvidenceContext,
} from "./collect-evidence";
export { evaluateStructuralRules } from "./evaluate-structural-rules";
export { aggregateEvidence, topDrivers } from "./aggregate-evidence";
export {
  bandForScore,
  clamp01to100,
  computeEvidenceCompleteness,
  computeIntensity,
  computeRadarScore,
  normalizeAxes,
  round1,
} from "./normalize-result";
export { analyzePalace } from "./analyze-palace";
export {
  analyzeAllPalaces,
  type AnalyzeAllPalacesOptions,
  type AnalyzeAllPalacesResult,
} from "./analyze-all-palaces";
