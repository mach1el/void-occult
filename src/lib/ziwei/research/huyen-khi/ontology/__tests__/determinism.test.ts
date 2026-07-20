import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  loadHuyenKhiOntology,
  resetHuyenKhiOntologyCache,
} from "../load-ontology";
import { buildReports, serializeReport } from "../reports/generate-reports";
import { ONTOLOGY_REPORTS_DIR } from "../paths";

describe("Huyền Khí ontology — determinism (§14)", () => {
  it("reloading yields structurally identical knowledge", () => {
    resetHuyenKhiOntologyCache();
    const a = loadHuyenKhiOntology();
    resetHuyenKhiOntologyCache();
    const b = loadHuyenKhiOntology();
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(JSON.stringify(a.ontology)).toBe(JSON.stringify(b.ontology));
    }
  });

  it("reports are byte-stable across regeneration", () => {
    const first = buildReports();
    const second = buildReports();
    for (const name of Object.keys(first)) {
      expect(serializeReport(first[name])).toBe(serializeReport(second[name]));
    }
  });

  it("committed reports match freshly generated output (no drift)", () => {
    const reports = buildReports();
    for (const [name, report] of Object.entries(reports)) {
      const committed = readFileSync(path.join(ONTOLOGY_REPORTS_DIR, name), "utf-8");
      expect(committed).toBe(serializeReport(report));
    }
  });

  it("reports carry no wall-clock timestamp (byte-stability guarantee)", () => {
    const serialized = Object.values(buildReports()).map(serializeReport).join("\n");
    expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
