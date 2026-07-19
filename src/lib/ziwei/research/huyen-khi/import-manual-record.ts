import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HUYEN_KHI_DATA_DIR, loadPublicHuyenKhiDataset } from "./load-dataset";
import { validatePublicRecord } from "./validate-public-record";
import type { PublicHuyenKhiRecord } from "./types";

const DATASET_PATH = path.join(HUYEN_KHI_DATA_DIR, "public-output-samples.v0.1.json");

export interface ImportResult {
  ok: boolean;
  issues: string[];
}

/**
 * §5 manual import CLI. Appends exactly one operator-supplied record after
 * schema/additivity validation — never auto-generates records, never
 * fetches network data. Rejects duplicate `sampleId`/`sourceUrl`.
 */
export function importManualRecord(record: PublicHuyenKhiRecord): ImportResult {
  const dataset = loadPublicHuyenKhiDataset();

  if (dataset.records.some((r) => r.sampleId === record.sampleId)) {
    return { ok: false, issues: [`duplicate sampleId: ${record.sampleId}`] };
  }
  if (dataset.records.some((r) => r.sourceUrl === record.sourceUrl)) {
    return { ok: false, issues: [`duplicate sourceUrl: ${record.sourceUrl}`] };
  }

  const issues = validatePublicRecord(record);
  if (issues.length > 0) {
    return { ok: false, issues: issues.map((i) => `${i.path}: ${i.message}`) };
  }

  dataset.records.push(record);
  writeFileSync(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
  return { ok: true, issues: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonArg = process.argv[2];
  if (!jsonArg) {
    console.error(
      "Usage: tsx import-manual-record.ts '<PublicHuyenKhiRecord JSON>'\n" +
        "This tool only appends operator-supplied records — it does not fetch or scrape any site.",
    );
    process.exit(1);
  }
  const record = JSON.parse(readFileSync(jsonArg, "utf-8")) as PublicHuyenKhiRecord;
  const result = importManualRecord(record);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
