import { describe, expect, it } from "vitest";

import {
  ALLOWED_NEUTRAL_IMPORT,
  FORBIDDEN_IMPORT_MARKERS,
  scanNamespaceBoundary,
} from "../namespace-scan";

describe("Huyền Khí ontology — namespace boundary (§11, §15)", () => {
  it("no ontology source imports a production analysis score/catalog", () => {
    const scan = scanNamespaceBoundary();
    expect(scan.filesScanned).toBeGreaterThan(0);
    expect(scan.forbiddenImportHits).toEqual([]);
  });

  it("no ontology source performs a network dependency", () => {
    const scan = scanNamespaceBoundary();
    expect(scan.networkHits).toEqual([]);
  });

  it("boundary scan reports clean", () => {
    expect(scanNamespaceBoundary().clean).toBe(true);
  });

  it("the only allowed cross-package import is the neutral facts types", () => {
    // Documented exception; asserted so it stays the single permitted import.
    expect(ALLOWED_NEUTRAL_IMPORT).toBe("@/lib/ziwei/analysis/facts/types");
    // The neutral module is NOT among the forbidden markers.
    expect(FORBIDDEN_IMPORT_MARKERS).not.toContain(ALLOWED_NEUTRAL_IMPORT);
  });

  it("forbidden markers cover all four production analysis modules + external host", () => {
    for (const marker of [
      "analysis/knowledge/palace-overview",
      "analysis/modules/annual-axes",
      "analysis/modules/major-fortune",
      "analysis/modules/monthly-flow",
      "tuvi.cohoc.net",
    ]) {
      expect(FORBIDDEN_IMPORT_MARKERS).toContain(marker);
    }
  });
});
