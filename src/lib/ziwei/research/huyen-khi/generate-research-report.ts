import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HUYEN_KHI_DATA_DIR, loadPublicHuyenKhiDataset } from "./load-dataset";
import { validatePublicRecord } from "./validate-public-record";
import { parsePublicSummaryTitle } from "./parse-public-summary";
import { resolveSolarDateForLunar } from "./resolve-solar-date";
import { buildHuyenKhiChartFactSnapshots } from "./build-chart-fact-snapshot";
import { analyzeScoreAlphabet } from "./analyze-score-alphabet";
import { buildControlledCorpusManifest } from "./build-controlled-corpus";
import { compareMatchedPairs } from "./compare-matched-pairs";
import { computeCoarseLookupBaseline, computeNullBaseline } from "./baseline-models";
import type { ParsedBirthTitle, PublicHuyenKhiRecord } from "./types";

const REPORTS_DIR = path.join(HUYEN_KHI_DATA_DIR, "reports");

/**
 * §15 — assembles every V0.1 research report into one JSON artifact plus
 * the individual named reports, matching the deliverables list. Read-only
 * over the committed seed dataset; performs no network access.
 */
export function generateResearchReport() {
  const dataset = loadPublicHuyenKhiDataset();

  const validationIssues = dataset.records.flatMap((r) => validatePublicRecord(r));

  const parsedRecords: Array<{ record: PublicHuyenKhiRecord; parsed: ParsedBirthTitle }> = [];
  const unparsed: string[] = [];
  for (const record of dataset.records) {
    const parsed = parsePublicSummaryTitle(record.displayTitle);
    if (parsed) parsedRecords.push({ record, parsed });
    else unparsed.push(record.sampleId);
  }

  const yearResolution = { unique: 0, ambiguous: 0, unresolved: 0 };
  let resolvedFactSnapshotCount = 0;
  for (const { parsed } of parsedRecords) {
    const resolved = resolveSolarDateForLunar(parsed);
    yearResolution[resolved.yearResolution] += 1;
    const snapshots = buildHuyenKhiChartFactSnapshots(parsed);
    if (snapshots.status === "resolved") resolvedFactSnapshotCount += 1;
  }

  const scoreAlphabet = analyzeScoreAlphabet(dataset);
  const corpusManifest = buildControlledCorpusManifest(dataset);
  const matchedPairs = compareMatchedPairs(parsedRecords, 1);
  const model0 = computeNullBaseline(dataset.records);
  const model1 = computeCoarseLookupBaseline(dataset.records);

  const report = {
    schemaVersion: "0.1.0",
    reportId: "huyen-khi-research-report-v0-1",
    generatedAt: new Date().toISOString(),
    seedValidation: {
      recordCount: dataset.records.length,
      exactCount: dataset.records.filter((r) => r.totalValidation === "exact").length,
      validationIssueCount: validationIssues.length,
      validationIssues,
    },
    parsing: {
      parsedCount: parsedRecords.length,
      unparsedSampleIds: unparsed,
    },
    solarDateResolution: {
      ...yearResolution,
      resolvedFactSnapshotCount,
      note:
        "A stem-branch year (e.g. Giáp Tuất) repeats every 60 years; without an absolute year the lunar->solar mapping is genuinely ambiguous. Chart-fact snapshots are only built for unambiguous resolutions.",
    },
    scoreAlphabet,
    corpusManifest,
    matchedPairs: {
      pairCount: matchedPairs.length,
      pairs: matchedPairs,
      note: "Matched over parsed birth-title facts only (no resolved chart structure yet available in V0.1).",
    },
    baselineModels: [model0, model1],
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(
    path.join(REPORTS_DIR, "huyen-khi-research-report.v0.1.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  return report;
}
