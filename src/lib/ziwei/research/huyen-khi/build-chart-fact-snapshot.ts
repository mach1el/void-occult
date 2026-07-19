import type { BirthInput, ChartData, ChartPalace } from "@/types/chart";
import { calculate as calculateNamPhai } from "../../engine-nam-phai";
import { calculate as calculateTrungChau } from "../../engine-trung-chau";
import { canonicalStarName } from "../../analysis/facts";
import { loadPalaceOverviewKnowledgeV1 } from "../../analysis/knowledge";
import type { ZiweiSchool } from "../../analysis/facts";
import type { ParsedBirthTitle, HuyenKhiChartFactSnapshot } from "./types";
import { resolveSolarDateForLunar } from "./resolve-solar-date";

const ENGINE_VERSION = "huyen-khi-fact-snapshot-v0.1";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isVoidAtBranch(chart: ChartData, branch: string, type: "Tuần" | "Triệt"): boolean {
  return (chart.voidMarkers ?? []).some((m) => m.type === type && m.branches.includes(branch));
}

function starClassSplit(
  palace: ChartPalace,
  numeric: ReturnType<typeof loadPalaceOverviewKnowledgeV1>,
): { major: Array<{ canonicalName: string; brightness: string | null }>; minor: Array<{ canonicalName: string; brightness: string | null }> } {
  const major: Array<{ canonicalName: string; brightness: string | null }> = [];
  const minor: Array<{ canonicalName: string; brightness: string | null }> = [];
  if (!numeric.ok) return { major, minor };
  for (const star of palace.stars ?? []) {
    const canonical = canonicalStarName(star.name);
    const isMajor = numeric.knowledge.majorStars.stars.some((s) => s.name === canonical);
    const entry = { canonicalName: canonical, brightness: star.brightness ?? null };
    if (isMajor) major.push(entry);
    else minor.push(entry);
  }
  return { major, minor };
}

function buildSnapshotForSchool(chart: ChartData, school: ZiweiSchool): HuyenKhiChartFactSnapshot {
  const numeric = loadPalaceOverviewKnowledgeV1();
  const menhIndex = chart.palaces.findIndex((p) => p.isMenh);
  const thanIndex = chart.palaces.findIndex((p) => p.isThan);

  const natalTransformationsByPalace = new Map<number, string[]>();
  for (const record of chart.natalMutagens ?? []) {
    if (!record.palace) continue;
    const list = natalTransformationsByPalace.get(record.palace.index) ?? [];
    list.push(`${record.mutagen}:${canonicalStarName(record.starName)}`);
    natalTransformationsByPalace.set(record.palace.index, list);
  }

  return {
    calculationEngineVersion: ENGINE_VERSION,
    school,
    cuc: chart.cuc?.name ?? "",
    menhPalaceIndex: menhIndex,
    thanPalaceIndex: thanIndex,
    palaces: chart.palaces.map((palace) => {
      const { major, minor } = starClassSplit(palace, numeric);
      const idx = palace.index;
      return {
        index: idx,
        branch: palace.branch,
        natalPalaceName: palace.name,
        stem: palace.stem ?? null,
        // Known V0.1 limitation: no exported Nạp Âm name table exists yet
        // (only a private element helper inside the engines) — left null
        // rather than duplicating/guessing the 60-entry naming table.
        stemBranchNapAm: null,
        majorStars: major,
        minorStars: minor,
        natalTransformations: natalTransformationsByPalace.get(idx) ?? [],
        hasTuan: isVoidAtBranch(chart, palace.branch, "Tuần"),
        hasTriet: isVoidAtBranch(chart, palace.branch, "Triệt"),
        oppositeIndex: (idx + 6) % 12,
        trineIndexes: [(idx + 4) % 12, (idx + 8) % 12] as [number, number],
        adjacentIndexes: [(idx + 11) % 12, (idx + 1) % 12] as [number, number],
      };
    }),
  };
}

export interface FactSnapshotResult {
  status: "resolved" | "ambiguous" | "unresolved";
  yearCandidateCount: number;
  namPhai: HuyenKhiChartFactSnapshot | null;
  trungChau: HuyenKhiChartFactSnapshot | null;
}

/**
 * Resolves a parsed birth title into chart-fact snapshots for both
 * schools. Only builds a concrete snapshot when the lunar→solar
 * resolution is unambiguous (§ solar/lunar year ambiguity) — an ambiguous
 * or unresolved date returns `namPhai: null, trungChau: null` rather than
 * guessing one of several candidate years.
 */
export function buildHuyenKhiChartFactSnapshots(parsed: ParsedBirthTitle): FactSnapshotResult {
  const resolved = resolveSolarDateForLunar(parsed);
  if (resolved.yearResolution !== "unique") {
    return {
      status: resolved.yearResolution,
      yearCandidateCount: resolved.candidates.length,
      namPhai: null,
      trungChau: null,
    };
  }

  const candidate = resolved.candidates[0];
  if (!candidate) {
    return { status: "unresolved", yearCandidateCount: 0, namPhai: null, trungChau: null };
  }

  const solarDate = `${candidate.solarYear}-${pad2(candidate.solarMonth)}-${pad2(candidate.solarDay)}`;
  const input: BirthInput = {
    solarDate,
    birthHour: parsed.hourBranch,
    gender: parsed.gender,
    timezone: "7",
    annualYear: String(candidate.solarYear),
    flowBase: "luu-nien",
  };

  const namPhaiChart = calculateNamPhai(input);
  const trungChauChart = calculateTrungChau(input);

  return {
    status: "resolved",
    yearCandidateCount: 1,
    namPhai: buildSnapshotForSchool(namPhaiChart, "nam-phai"),
    trungChau: buildSnapshotForSchool(trungChauChart, "trung-chau"),
  };
}
