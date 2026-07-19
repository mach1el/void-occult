import { describe, it, expect } from "vitest";
import { generateResearchReport } from "../generate-research-report";

/**
 * Writes `research/huyen-khi/v0.1/reports/huyen-khi-research-report.v0.1.json`.
 * Gated behind `HUYEN_KHI_BUILD_REPORT=1` (same `describe.runIf` convention
 * as `annual-axes/audit/__tests__/full-audit.write.test.ts`) so the default
 * `npm test` run doesn't rewrite a tracked file's timestamp on every run.
 * Invoked via `npm run research:huyen-khi:build-facts` / `:analyze` (both
 * point at this same report — V0.1 does not yet need two separate
 * pipelines). Uses `vitest run` rather than a bare `tsx` CLI because the
 * Calculation Core's `@/*` path alias is only configured in `vite.config.ts`
 * / `vitest.config` — bare `tsx` cannot resolve it (same reason the
 * existing `audit:annual-axes-distribution` script runs through vitest).
 */
const ENABLED = process.env.HUYEN_KHI_BUILD_REPORT === "1";

describe.runIf(ENABLED)("Huyền Khí V0.1 research report", () => {
  it("generates the combined research report without error", () => {
    const report = generateResearchReport();
    expect(report.seedValidation.recordCount).toBe(18);
    expect(report.seedValidation.exactCount).toBe(18);
  });
});
