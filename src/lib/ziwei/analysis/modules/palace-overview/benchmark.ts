/**
 * V1.2 §10 — expert benchmark scaffolding. Dev/test only: never imported by
 * knowledge/loader.ts or any runtime scoring path. Produces a structured
 * comparison object per seed case; never back-fills expert labels from
 * engine output — the seed chart stays "unreviewed" until a human reviews it.
 */
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, School } from "@/types/chart";
import { analyzeAllPalaces } from "./analyze-all-palaces";
import type { PalaceAnnotation, PalaceOverviewResult } from "./types";
import seedCasesRaw from "../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.seed.json";

interface SeedPalaceLabel {
  palaceName: string;
  support: "low" | "medium" | "high" | null;
  pressure: "low" | "medium" | "high" | null;
  stability: "low" | "medium" | "high" | null;
  activation: "low" | "medium" | "high" | null;
  notes: string | null;
  reviewer: string | null;
  reviewStatus: "unreviewed" | "reviewed" | "disputed";
}

interface SeedCase {
  caseId: string;
  input: BirthInput;
  schools: School[];
  labels: SeedPalaceLabel[];
  pairwiseComparisons: unknown[];
}

const seedCases = (seedCasesRaw as { cases: SeedCase[] }).cases;

const CALCULATORS: Record<School, (input: BirthInput) => ReturnType<typeof calculateNamPhai>> = {
  "nam-phai": calculateNamPhai,
  "trung-chau": calculateTrungChau,
};

export interface BenchmarkPalaceResult {
  palaceName: string;
  score: number;
  band: PalaceOverviewResult["band"];
  rawAxes: PalaceOverviewResult["rawAxes"];
  axes: PalaceOverviewResult["axes"];
  menhThanAnnotations: PalaceAnnotation[];
  pairAnnotations: PalaceAnnotation[];
  transformationTargetAnnotations: PalaceAnnotation[];
  domainProjections: PalaceAnnotation[];
}

export interface BenchmarkSchoolRun {
  school: School;
  versions: PalaceOverviewResult["versions"];
  results: BenchmarkPalaceResult[];
}

export interface BenchmarkCaseRun {
  caseId: string;
  schools: BenchmarkSchoolRun[];
  /** Expert labels straight from the seed file — never filled from engine output. */
  labels: SeedPalaceLabel[];
}

function toBenchmarkPalaceResult(r: PalaceOverviewResult): BenchmarkPalaceResult {
  return {
    palaceName: r.palaceName,
    score: r.score,
    band: r.band,
    rawAxes: r.rawAxes,
    axes: r.axes,
    menhThanAnnotations: r.annotations.filter((a) => a.category === "menh-than"),
    pairAnnotations: r.annotations.filter((a) => a.category === "minor-pair"),
    transformationTargetAnnotations: r.annotations.filter(
      (a) => a.category === "transformation-target",
    ),
    domainProjections: r.annotations.filter((a) => a.category === "domain-projection"),
  };
}

export function listBenchmarkCaseIds(): string[] {
  return seedCases.map((c) => c.caseId);
}

export function runBenchmarkCase(caseId: string): BenchmarkCaseRun {
  const seedCase = seedCases.find((c) => c.caseId === caseId);
  if (!seedCase) {
    throw new Error(`unknown benchmark case id: ${caseId}`);
  }

  const schools: BenchmarkSchoolRun[] = seedCase.schools.map((school) => {
    const chart = CALCULATORS[school](seedCase.input);
    const { results } = analyzeAllPalaces(chart, { school });
    return {
      school,
      versions: results[0]!.versions,
      results: results.map(toBenchmarkPalaceResult),
    };
  });

  return { caseId: seedCase.caseId, schools, labels: seedCase.labels };
}
