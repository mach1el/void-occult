import { describe, expect, it } from "vitest";
import {
  buildAuditBirthInputs,
  FAST_CORPUS_CONTRACT,
  FULL_CORPUS_CONTRACT,
} from "../build-audit-corpus";
import { computeDistributionReport } from "../compute-distribution-report";
import { collectAuditObservations, runAudit } from "../run-distribution-audit";
import type { AnnualAxesAuditObservation } from "../types";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../../knowledge/annual-axes/v0.4";
import { evaluateDistributionGates } from "../../nam-phai-v04/evaluate-gates";

describe("annual-axes audit corpus", () => {
  it("builds a deterministic fast corpus of the contracted size", () => {
    const a = buildAuditBirthInputs(FAST_CORPUS_CONTRACT);
    const b = buildAuditBirthInputs(FAST_CORPUS_CONTRACT);
    expect(a).toHaveLength(FAST_CORPUS_CONTRACT.chartCount);
    expect(a).toEqual(b);
    expect(new Set(a.map((x) => x.birthHour)).size).toBeGreaterThan(1);
    expect(new Set(a.map((x) => x.gender)).size).toBe(2);
  });

  it("full corpus contract matches the V0.4 prompt minimum (100×12)", () => {
    expect(FULL_CORPUS_CONTRACT.chartCount).toBe(100);
    expect(FULL_CORPUS_CONTRACT.yearsPerChart).toBe(12);
  });
});

describe("annual-axes distribution report — fast Nam Phái baseline", () => {
  it("produces a well-formed report and is deterministic", () => {
    const reportA = runAudit("nam-phai", FAST_CORPUS_CONTRACT, "annual-axes-current");
    const reportB = runAudit("nam-phai", FAST_CORPUS_CONTRACT, "annual-axes-current");
    expect(reportA).toEqual(reportB);
    expect(reportA.chartCount).toBe(FAST_CORPUS_CONTRACT.chartCount);
    expect(reportA.yearsPerChart).toBe(FAST_CORPUS_CONTRACT.yearsPerChart);
    expect(reportA.resultCount).toBe(
      FAST_CORPUS_CONTRACT.chartCount * FAST_CORPUS_CONTRACT.yearsPerChart,
    );
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(reportA.scoreSummaryByDomain[domain].min).toBeLessThanOrEqual(
        reportA.scoreSummaryByDomain[domain].max,
      );
    }
    expect(reportA.allSixAbove50Rate).toBeGreaterThanOrEqual(0);
    expect(reportA.allSixAbove50Rate).toBeLessThanOrEqual(1);
  });

  it("exposes distribution metrics for V0.4 gate evaluation (measurement only)", () => {
    const report = runAudit("nam-phai", FAST_CORPUS_CONTRACT, "annual-axes-v0.4");
    expect(typeof report.allSixAbove60Rate).toBe("number");
    expect(typeof report.intraYearAxisSpread.meanStandardDeviation).toBe("number");
    expect(typeof report.longitudinalChange.annualHeadMoveSensitivityRate).toBe("number");
    // V0.4 must not collapse to universal favorability on the fast corpus.
    expect(report.allSixAbove60Rate).toBeLessThan(1);

    const loaded = loadAnnualAxesKnowledgeV04NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const evaluation = evaluateDistributionGates(report, loaded.knowledge.distributionGates.hardGates);
    // Fast corpus is not the release gate; still require evaluation to run.
    expect(evaluation.results.length).toBeGreaterThan(0);
    expect(evaluation.results.every((r) => typeof r.passed === "boolean")).toBe(true);
  });
});

describe("computeDistributionReport — synthetic vectors", () => {
  it("detects exact duplicate six-axis vectors", () => {
    const mk = (chartId: string, year: number, scores: number[]): AnnualAxesAuditObservation => ({
      chartId,
      school: "nam-phai",
      annualYear: year,
      annualHeadPalaceIndex: 0,
      status: "available",
      scores: {
        health: scores[0]!,
        family: scores[1]!,
        wealth: scores[2]!,
        career: scores[3]!,
        social: scores[4]!,
        romance: scores[5]!,
      },
    });
    const vec = [70, 71, 72, 73, 74, 75];
    const report = computeDistributionReport("test", [
      mk("a", 2020, vec),
      mk("b", 2020, vec),
      mk("c", 2020, [10, 20, 30, 40, 50, 60]),
    ]);
    expect(report.exactDuplicateVectorRate).toBeGreaterThan(0);
  });
});

describe("collectAuditObservations", () => {
  it("returns one observation per chart×year", () => {
    const obs = collectAuditObservations("trung-chau", {
      ...FAST_CORPUS_CONTRACT,
      chartCount: 2,
      yearsPerChart: 2,
    });
    expect(obs).toHaveLength(4);
  });
});
