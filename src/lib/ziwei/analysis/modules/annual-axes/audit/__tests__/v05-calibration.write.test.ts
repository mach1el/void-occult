/**
 * V0.5 calibration derivation — only runs when ANNUAL_AXES_V05_AUDIT=1.
 *
 * Writes:
 *  - src/lib/ziwei/analysis/knowledge/annual-axes/v0.5/annual-axis-calibration.nam-phai.v0.5.json
 *
 * Regenerates twice and asserts the second run produces no diff.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadAnnualAxesKnowledgeV05NamPhai,
  resetAnnualAxesKnowledgeV05NamPhaiCache,
} from "../../../../knowledge/annual-axes/v0.5";
import { deriveV05Calibration } from "../../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "../build-audit-corpus";

const ENABLED = process.env.ANNUAL_AXES_V05_AUDIT === "1";

const CALIBRATION_PATH = join(
  process.cwd(),
  "src/lib/ziwei/analysis/knowledge/annual-axes/v0.5/annual-axis-calibration.nam-phai.v0.5.json",
);

describe.runIf(ENABLED)("annual-axes v0.5 calibration write", () => {
  it("derives activationScale + domain scales deterministically (no diff on 2nd run)", () => {
    resetAnnualAxesKnowledgeV05NamPhaiCache();
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const derived1 = deriveV05Calibration(loaded.knowledge, FULL_CORPUS_CONTRACT);
    const json1 = `${JSON.stringify(derived1, null, 2)}\n`;

    writeFileSync(CALIBRATION_PATH, json1);

    resetAnnualAxesKnowledgeV05NamPhaiCache();
    const loaded2 = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded2.ok).toBe(true);
    if (!loaded2.ok) return;

    const derived2 = deriveV05Calibration(loaded2.knowledge, FULL_CORPUS_CONTRACT);
    const json2 = `${JSON.stringify(derived2, null, 2)}\n`;
    expect(json2).toBe(json1);

    const onDisk = readFileSync(CALIBRATION_PATH, "utf8");
    expect(onDisk).toBe(json2);
  }, 600_000);
});

