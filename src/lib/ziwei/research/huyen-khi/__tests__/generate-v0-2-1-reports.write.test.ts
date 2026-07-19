import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUYEN_KHI_DATA_DIR } from "../load-dataset";
import {
  buildCalendarPanelCorpusV021,
  buildCalendarPanelValidationReportV021,
  buildLunarDateAdjudicationReportV021,
  buildMenhGeometryParseReportV021,
  buildSourceCoreAgreementReportV021,
} from "../generate-v0-2-1-reports";

/**
 * Writes the remaining V0.2.1 report files under
 * `research/huyen-khi/v0.2/reports/`. Gated behind
 * `HUYEN_KHI_BUILD_REPORT_V02_1=1` (same `describe.runIf` convention as
 * `generate-report.write.test.ts`) so a normal `npm test` run doesn't
 * rewrite tracked files on every run. Deliberately does NOT generate
 * Mệnh-baseline or whole-total-baseline reports — those need >=20
 * complete calendar panels and this pass only captured 2.
 */
const ENABLED = process.env.HUYEN_KHI_BUILD_REPORT_V02_1 === "1";
const REPORTS_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2/reports");

describe.runIf(ENABLED)("Huyền Khí V0.2.1 report generation", () => {
  it("writes lunar-date-adjudication-report.v0.2.1.json", () => {
    const report = buildLunarDateAdjudicationReportV021();
    expect(report.cases.length).toBe(6);
    mkdirSync(REPORTS_DIR, { recursive: true });
    writeFileSync(path.join(REPORTS_DIR, "lunar-date-adjudication-report.v0.2.1.json"), JSON.stringify(report, null, 2));
  });

  it("writes calendar-panel-corpus.v0.2.1.json", () => {
    const report = buildCalendarPanelCorpusV021();
    expect(report.panelsCaptured).toBe(2);
    writeFileSync(path.join(REPORTS_DIR, "calendar-panel-corpus.v0.2.1.json"), JSON.stringify(report, null, 2));
  });

  it("writes calendar-panel-validation-report.v0.2.1.json", () => {
    const report = buildCalendarPanelValidationReportV021();
    expect(report.reports.every((r) => r.complete)).toBe(true);
    writeFileSync(path.join(REPORTS_DIR, "calendar-panel-validation-report.v0.2.1.json"), JSON.stringify(report, null, 2));
  });

  it("writes menh-geometry-parse-report.v0.2.1.json", () => {
    const report = buildMenhGeometryParseReportV021();
    expect(report.hoursParsed).toBe(24);
    writeFileSync(path.join(REPORTS_DIR, "menh-geometry-parse-report.v0.2.1.json"), JSON.stringify(report, null, 2));
  });

  it("writes source-core-agreement-report.v0.2.1.json", () => {
    const report = buildSourceCoreAgreementReportV021();
    expect(report.recordsCompared).toBe(24);
    writeFileSync(path.join(REPORTS_DIR, "source-core-agreement-report.v0.2.1.json"), JSON.stringify(report, null, 2));
  });
});
