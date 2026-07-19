import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { HUYEN_KHI_DATA_DIR } from "./load-dataset";
import { adjudicateLunarDate } from "./lunar-date-adjudication";
import { parseMenhGeometry, unknownFacts } from "./parse-menh-geometry";
import { validateCalendarPanel } from "./validate-calendar-panel";
import { compareSourceAndCore } from "./compare-source-core";
import type {
  HuyenKhiCalendarMenhPanel,
  LunarDateAdjudication,
  ParsedStarFact,
  SourceCoreAgreementReport,
} from "./types-v02-1";

const V02_DIR = path.resolve(HUYEN_KHI_DATA_DIR, "../v0.2");
const PANELS_DIR = path.join(V02_DIR, "calendar-panels");

function loadAllPanels(): HuyenKhiCalendarMenhPanel[] {
  return readdirSync(PANELS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(PANELS_DIR, f), "utf-8")) as HuyenKhiCalendarMenhPanel);
}

/**
 * Every real lunar-date cross-check made across V0.2/V0.2.1, encoded
 * exactly as documented in `reports/v01-date-recovery-report.v0.2.1.json`
 * and `source-access-review.md` — no new fetches, this only re-runs
 * `adjudicateLunarDate` over facts already established this session.
 */
export function buildLunarDateAdjudicationReportV021(): { schemaVersion: string; reportId: string; cases: LunarDateAdjudication[] } {
  const cases: LunarDateAdjudication[] = [
    // Real V0.2 disagreement: site says lunar 4/10, Calculation Core computes 4/11.
    adjudicateLunarDate("1994-05-20", { year: 1994, month: 4, day: 10, isLeapMonth: false }),
    // Real V0.2 exact agreement, first cross-check ever performed in this program.
    adjudicateLunarDate("1969-04-08", { year: 1969, month: 2, day: 22, isLeapMonth: false }),
    // HK-PUB-002 recovery (V0.2) — site's lunar year read as 1996 (year-before-Tết), month 12 day 24.
    adjudicateLunarDate("1997-02-01", { year: 1996, month: 12, day: 24, isLeapMonth: false }),
    // HK-PUB-005 recovery (V0.2.1) — two independent WebFetch passes agreed on lunar 11/19.
    adjudicateLunarDate("1997-12-18", { year: null, month: 11, day: 19, isLeapMonth: false }),
    // HK-PUB-006 recovery (V0.2.1) — majority (2-of-3 passes) agreed on lunar 12/12.
    adjudicateLunarDate("1990-01-08", { year: null, month: 12, day: 12, isLeapMonth: false }),
    // HK-PUB-003 (V0.2.1) — partial-match-inconclusive; lunar 3/19 matched, total did not.
    adjudicateLunarDate("1970-04-24", { year: null, month: 3, day: 19, isLeapMonth: false }),
  ];

  return { schemaVersion: "0.2.1", reportId: "huyen-khi-lunar-date-adjudication-v0-2-1", cases };
}

export function buildCalendarPanelCorpusV021() {
  const panels = loadAllPanels();
  const hoursCaptured = panels.reduce((sum, p) => sum + p.hours.length, 0);
  const targetPanels = 20;
  const targetHours = targetPanels * 12;
  return {
    schemaVersion: "0.2.1",
    reportId: "huyen-khi-calendar-panel-corpus-v0-2-1",
    outputScope: "menh-and-total" as const,
    panelsCaptured: panels.length,
    hoursCaptured,
    targetPanels,
    targetHours,
    panelCompletionRate: Math.round((panels.length / targetPanels) * 1000) / 1000,
    hourCompletionRate: Math.round((hoursCaptured / targetHours) * 1000) / 1000,
    panels: panels.map((p) => ({ solarDate: p.solarDate, sex: p.sex, hoursCaptured: p.hours.length })),
    note:
      "Partial by design — session fetch budget under the approved rate limit (1 req/20s, 1 concurrent) covered 2 of the 20 manifest dates. Manifest (calendar-sampling-manifest.v0.2.1.json) is pre-committed and reusable for the remaining 18 dates in a future pass.",
  };
}

export function buildCalendarPanelValidationReportV021() {
  const panels = loadAllPanels();
  return {
    schemaVersion: "0.2.1",
    reportId: "huyen-khi-calendar-panel-validation-v0-2-1",
    reports: panels.map((p) => validateCalendarPanel(p)),
  };
}

export function buildMenhGeometryParseReportV021() {
  const panels = loadAllPanels();
  const statusCounts: Record<ParsedStarFact["parseStatus"], number> = { canonical: 0, "known-context-only": 0, unknown: 0 };
  const unknown: Array<{ solarDate: string; hourBranch: string; fact: ParsedStarFact }> = [];
  let hoursParsed = 0;

  for (const panel of panels) {
    for (const hour of panel.hours) {
      hoursParsed += 1;
      const geometry = parseMenhGeometry(hour);
      const all = [
        ...geometry.toaThu,
        ...geometry.xungChieu,
        ...geometry.tamHop[0],
        ...geometry.tamHop[1],
        ...geometry.nhiHop[0],
        ...geometry.nhiHop[1],
      ];
      for (const fact of all) statusCounts[fact.parseStatus] += 1;
      for (const fact of unknownFacts(geometry)) unknown.push({ solarDate: panel.solarDate, hourBranch: hour.hourBranch, fact });
    }
  }

  return {
    schemaVersion: "0.2.1",
    reportId: "huyen-khi-menh-geometry-parse-v0-2-1",
    hoursParsed,
    factParseStatusCounts: statusCounts,
    unknownFacts: unknown,
  };
}

export function buildSourceCoreAgreementReportV021() {
  const panels = loadAllPanels();
  const reports: SourceCoreAgreementReport[] = [];
  for (const panel of panels) {
    for (const hour of panel.hours) {
      reports.push(
        compareSourceAndCore(`${panel.solarDate}-${hour.hourBranch}`, panel.solarDate, hour.hourBranch, panel.sex, hour),
      );
    }
  }
  const disagreementCount = reports.filter((r) => r.disagreements.length > 0).length;
  return {
    schemaVersion: "0.2.1",
    reportId: "huyen-khi-source-core-agreement-v0-2-1",
    recordsCompared: reports.length,
    recordsWithDisagreements: disagreementCount,
    reports,
  };
}
