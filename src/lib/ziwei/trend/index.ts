/**
 * Engine xu hướng Tử Vi — tất định, không LLM.
 *
 * Public API: Cát/Hung (Đại vận · Lưu niên), độ vững 12 cung, trọng số.
 */

export type {
  ScoreLine,
  TrendPoint,
  PalaceStrength,
  LuuNienTrendOptions,
} from "./types";
export {
  getDaiVanTrend,
  getLuuNienTrend,
  shortPalaceName,
} from "./score";

export type { PalaceRadarOptions, RadarWeights } from "./palace-radar";
export { getPalaceStrengths, RADAR_WEIGHTS } from "./palace-radar";

export type { ScoringWeights } from "./weights";
export { SCORING_WEIGHTS } from "./weights";
