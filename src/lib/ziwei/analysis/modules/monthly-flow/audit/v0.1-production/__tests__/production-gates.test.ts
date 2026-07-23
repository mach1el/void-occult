import { describe, expect, it } from "vitest";
import { getAnalysisStatus } from "@/lib/ziwei/analysis/contracts/common";
import { isMonthlyFlowV01Enabled } from "@/lib/ziwei/analysis/feature-flags";
import { hardGateShape } from "../hard-gate-shape";

// Lightweight gate tests — full corpus audit is CLI-only.
describe("Monthly Flow V0.1 production gates", () => {
  it("feature flag defaults on and status is available 0.1.2", () => {
    expect(isMonthlyFlowV01Enabled()).toBe(true);
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.1.2",
    });
  });

  it("keeps other modules available", () => {
    expect(getAnalysisStatus("palace-overview").status).toBe("available");
    expect(getAnalysisStatus("major-fortune").status).toBe("available");
  });

  it("documents hard-gate zero targets", () => {
    expect(hardGateShape).toEqual({
      determinismFailures: 0,
      scoreBoundFailures: 0,
      duplicatePhysicalFactFailures: 0,
      missingSourceIds: 0,
      providerSchoolMismatch: 0,
      fabricatedLeapMonthCount: 0,
    });
  });
});
