import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { ZiweiSchool } from "../../../facts";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../analyze";
import {
  buildAuditBirthInputs,
  expandAnnualYears,
  FAST_CORPUS_CONTRACT,
  FULL_CORPUS_CONTRACT,
  type AuditCorpusContract,
} from "./build-audit-corpus";
import { computeDistributionReport } from "./compute-distribution-report";
import type {
  AnnualAxesAuditObservation,
  AnnualAxesAuditProfileId,
  AnnualAxesDistributionReport,
} from "./types";

function calculate(school: ZiweiSchool, input: BirthInput): ChartData {
  return school === "nam-phai" ? calculateNamPhai(input) : calculateTrungChau(input);
}

function toObservation(
  chartId: string,
  school: ZiweiSchool,
  chart: ChartData,
): AnnualAxesAuditObservation {
  const result = analyzeAnnualAxes(chart, { school });
  const scores = {} as AnnualAxesAuditObservation["scores"];
  const collectStats: NonNullable<AnnualAxesAuditObservation["collectStats"]> = {};
  let hasCollectStats = false;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = result.axes[domain];
    scores[domain] = axis.status === "available" ? axis.score : null;
    if (axis.status === "available" && axis.collectStats) {
      hasCollectStats = true;
      collectStats[domain] = {
        numericFacts: axis.collectStats.numericFacts,
        contextOnlyFacts: axis.collectStats.contextOnlyFacts,
      };
    }
  }
  return {
    chartId,
    school,
    annualYear: chart.annualYear,
    annualHeadPalaceIndex: chart.annualHeadPalace?.index ??
      chart.palaces.find((p) => p.isLuuNienDaiVan)?.index ??
      null,
    status: result.status,
    scores,
    collectStats: hasCollectStats ? collectStats : undefined,
  };
}

export function collectAuditObservations(
  school: ZiweiSchool,
  contract: AuditCorpusContract,
): AnnualAxesAuditObservation[] {
  const bases = buildAuditBirthInputs(contract);
  const out: AnnualAxesAuditObservation[] = [];
  bases.forEach((base, i) => {
    const chartId = `${contract.contractId}:${school}:c${i}`;
    for (const yearly of expandAnnualYears(base, contract.baseAnnualYear, contract.yearsPerChart)) {
      const chart = calculate(school, yearly);
      out.push(toObservation(chartId, school, chart));
    }
  });
  return out;
}

export function runAudit(
  school: ZiweiSchool,
  contract: AuditCorpusContract,
  profileId: AnnualAxesAuditProfileId = "annual-axes-current",
): AnnualAxesDistributionReport {
  const observations = collectAuditObservations(school, contract);
  return computeDistributionReport(profileId, observations);
}

/** CLI / vitest full-audit entry. Writes JSON under research/. */
export function writeAuditReports(opts: {
  full: boolean;
  outDir: string;
}): AnnualAxesDistributionReport[] {
  const contract = opts.full ? FULL_CORPUS_CONTRACT : FAST_CORPUS_CONTRACT;
  mkdirSync(opts.outDir, { recursive: true });
  writeFileSync(
    join(opts.outDir, "corpus-contract.json"),
    `${JSON.stringify(contract, null, 2)}\n`,
  );

  const reports: AnnualAxesDistributionReport[] = [];
  for (const school of ["nam-phai", "trung-chau"] as const) {
    const profileId =
      school === "nam-phai" ? "annual-axes-v0.4" : "annual-axes-current";
    const report = runAudit(school, contract, profileId);
    reports.push(report);
    const name = `${profileId}-${school}-${contract.contractId}.json`;
    writeFileSync(join(opts.outDir, name), `${JSON.stringify(report, null, 2)}\n`);
  }
  return reports;
}

export { FAST_CORPUS_CONTRACT, FULL_CORPUS_CONTRACT };
