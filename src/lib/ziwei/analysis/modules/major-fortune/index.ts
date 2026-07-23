export type * from "./types";
export { analyzeMajorFortune } from "./analyze";
export { emptyMajorFortuneDiagnostics, dedupeMajorFortuneDiagnostics } from "./diagnostics";
export { normalizeMajorFortuneAxes, resolveMajorFortuneBand } from "./normalize";
export { sumWeightedAxes as sumMajorFortuneWeightedAxes } from "./normalize";
export { aggregateMajorFortuneEvidence } from "./aggregate";
export { auditEvidenceSources, collectKnownSourceIds } from "./audit-evidence-sources";
export {
  collectOverallFrame,
  collectDomainFrames,
  type MajorFortuneFrame,
  type MajorFrameNode,
} from "./collect-major-frames";
export { collectStarEvidence as collectMajorFortuneStarEvidence } from "./collect-star-evidence";
export { collectTransformationEvidence } from "./collect-transformation-evidence";
export { collectStructuralEvidence } from "./collect-structural-evidence";
export { detectDisabledInteractionHits, transformationTargetKey } from "./detect-disabled-interactions";
export { resolveMajorFortuneContext, type ResolvedMajorFortuneContext } from "./resolve-context";
/** Candidate V0.2 four-pillar scorer — research-only; does not replace V0.1. */
export { analyzeMajorFortuneV02 } from "./v0.2";
/** V0.3 ordinal engineering-heuristic contract — production formula engine. */
export { evaluateMajorFortuneOrdinal } from "./v0.3-ordinal";
/** V0.3 ChartData → ordinal evidence adapter. */
export {
  adaptChartToMajorFortuneOrdinalInput,
  analyzeMajorFortuneOrdinalV03,
} from "./v0.3-ordinal/adapter";
/** V0.3 production analysis wrapper + display model. */
export {
  adaptChartToMajorFortuneOrdinalInput as adaptChartToMajorFortuneOrdinalInputUi,
  analyzeMajorFortuneOrdinalV03 as analyzeMajorFortuneOrdinalV03Ui,
  type MajorFortuneProductionResult,
  type MajorFortuneOrdinalV03Analysis,
} from "./v0.3-ordinal-adapter";
