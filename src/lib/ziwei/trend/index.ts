/**
 * Engine xu hướng Tử Vi — tất định, không LLM.
 *
 * Public API: Cát/Hung (Đại vận · Lưu niên), độ vững 12 cung, trọng số.
 */

export type {
  ScoreLine,
  ScoreSignalCategory,
  ScorePalaceRole,
  ScoreLayer,
  VoidMajorPalaceInfo,
  TrendPoint,
  TrendAxes,
  PalaceStrength,
  LuuNienTrendOptions,
  ScoringProfileId,
  AnnualAxisName,
  AnnualAxisStrength,
} from "./types";
export {
  getDaiVanTrend,
  getLuuNienTrend,
  shortPalaceName,
} from "./score";

export {
  loadNamPhaiMonthlyV2Profile,
  loadFramePatternRules,
  isExperimentalMonthlyProfile,
} from "./profile/nam-phai-monthly-v2";
export { softSaturate } from "./soft-saturation";
export {
  scoreLuuNguyetFrameV2,
  scoreFortuneFrameV2,
} from "./monthly-flow-v2";

export type { PalaceRadarOptions, RadarWeights } from "./palace-radar";
export { getPalaceStrengths, RADAR_WEIGHTS } from "./palace-radar";

export {
  ANNUAL_AXIS_ORDER,
  getAnnualAxisStrengths,
} from "./annual-axis-radar";

export type { UIBreakdownItem, UIBreakdownResult } from "./ui-breakdown";
export {
  formatUIBreakdown,
  isBaseContributionLine,
  roundTo1Decimal,
} from "./ui-breakdown";

export type { ScoringWeights } from "./weights";
export { SCORING_WEIGHTS } from "./weights";

export type { ComboRule, ComboLayer } from "./combo-rules";
export { COMBO_RULES, EXCLUDED_MEDICAL_COMBO_IDS } from "./combo-rules";
export { evaluateCombos } from "./combo-eval";
