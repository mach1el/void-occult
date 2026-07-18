/** Shared contracts for Zi Wei analysis modules (Phase 0 — no scoring). */

export type ZiweiAnalysisModule =
  | "palace-overview"
  | "annual-axes"
  | "major-fortune"
  | "monthly-flow";

export type ZiweiAnalysisStatus =
  | {
      status: "unavailable";
      module: ZiweiAnalysisModule;
      reason: "rebuilding";
    }
  | {
      status: "available";
      module: ZiweiAnalysisModule;
      version: string;
    };

/** Phase 0: every module reports rebuilding. */
export function getAnalysisStatus(
  module: ZiweiAnalysisModule,
): ZiweiAnalysisStatus {
  return { status: "unavailable", module, reason: "rebuilding" };
}

export const ANALYSIS_MODULES: ZiweiAnalysisModule[] = [
  "palace-overview",
  "annual-axes",
  "major-fortune",
  "monthly-flow",
];
