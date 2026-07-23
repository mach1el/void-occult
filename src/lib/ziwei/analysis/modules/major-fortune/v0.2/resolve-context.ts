import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import type { DeepReadonly } from "../../../knowledge/major-fortune-scoring";
import type { MajorFortuneV02Knowledge, MajorFortuneV02Rule } from "../../../knowledge/major-fortune-scoring/v0.2";
import type { MajorFortuneV02Diagnostics } from "./types";

export interface ResolvedMajorFortuneV02Context {
  school: ZiweiSchool;
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
  activePalaceBranch: string;
  activeNatalPalaceName: string;
  fortuneStem?: string;
  menhElement: string;
  activePalace: ChartPalace;
  transformations: readonly MutagenRecord[];
  calculationPolicyProfileVersion: string | null;
}

const FORBIDDEN_ANNUAL_FIELDS: Array<{ name: string; present: (chart: ChartData) => boolean }> = [
  { name: "annualStars", present: (c) => Boolean(c.annualStars && c.annualStars.length > 0) },
  { name: "annualMutagens", present: (c) => Boolean(c.annualMutagens && c.annualMutagens.length > 0) },
  { name: "taiTuePalace", present: (c) => Boolean(c.taiTuePalace) },
  { name: "smallLimitPalace", present: (c) => Boolean(c.smallLimitPalace) },
  { name: "annualHeadPalace", present: (c) => Boolean((c as { annualHeadPalace?: unknown }).annualHeadPalace) },
  { name: "isLuuNienDaiVan", present: (c) => c.palaces.some((p) => p.isLuuNienDaiVan) },
  { name: "monthlyPalaces", present: (c) => Boolean(c.monthlyPalaces && c.monthlyPalaces.length > 0) },
  { name: "flowMonths", present: (c) => c.palaces.some((p) => p.flowMonths && p.flowMonths.length > 0) },
];

export function recordForbiddenAnnualFactsV02(
  chart: ChartData,
  diagnostics: MajorFortuneV02Diagnostics,
): void {
  for (const field of FORBIDDEN_ANNUAL_FIELDS) {
    if (field.present(chart)) diagnostics.forbiddenAnnualFacts.push(field.name);
  }
}

export function resolveMajorFortuneV02Context(
  chart: ChartData,
  school: ZiweiSchool,
  knowledge: DeepReadonly<MajorFortuneV02Knowledge> | MajorFortuneV02Knowledge,
  diagnostics: MajorFortuneV02Diagnostics,
): ResolvedMajorFortuneV02Context | null {
  recordForbiddenAnnualFactsV02(chart, diagnostics);

  const profile = knowledge.schoolCapabilities.profiles[school];
  if (!profile) {
    diagnostics.unsupportedSchoolCapability.push(`missing-profile:${school}`);
    return null;
  }

  const activePalace = chart.majorFortunePalace;
  if (!activePalace) {
    diagnostics.noActiveMajorFortune.push("chart:no-active-major-fortune-palace");
    return null;
  }

  const cycleIndex = activePalace.majorFortune?.order;
  const startAge = activePalace.majorFortune?.start;
  const endAge = activePalace.majorFortune?.end;
  if (cycleIndex === undefined || startAge === undefined || endAge === undefined) {
    diagnostics.invalidResolvedContext.push("majorFortunePalace.majorFortune incomplete");
    return null;
  }

  if (!chart.menhElement) {
    diagnostics.invalidResolvedContext.push("menhElement missing");
    return null;
  }

  const majorMutagens = chart.majorMutagens ?? [];
  if (majorMutagens.length > 0 && !profile.supportsMajorFortuneTransformations) {
    diagnostics.forbiddenSchoolTransformations.push("majorMutagens:transformations-disabled");
    diagnostics.calculationCoreBlockers.push("nam-phai-major-fortune-transformations");
  }

  const transformations =
    profile.supportsMajorFortuneTransformations && activePalace.stem ? majorMutagens : [];

  return {
    school,
    cycleIndex,
    startAge,
    endAge,
    activePalaceIndex: activePalace.index,
    activePalaceBranch: activePalace.branch,
    activeNatalPalaceName: activePalace.name,
    fortuneStem: activePalace.stem,
    menhElement: chart.menhElement,
    activePalace,
    transformations,
    calculationPolicyProfileVersion: null,
  };
}

export type ElementRelationId =
  | "palace_generates_natal"
  | "natal_generates_palace"
  | "same_element"
  | "palace_controls_natal"
  | "natal_controls_palace";

export function resolveElementRelation(
  palaceElement: string,
  natalElement: string,
  generates: Record<string, string>,
  controls: Record<string, string>,
): ElementRelationId | null {
  if (palaceElement === natalElement) return "same_element";
  if (generates[palaceElement] === natalElement) return "palace_generates_natal";
  if (generates[natalElement] === palaceElement) return "natal_generates_palace";
  if (controls[palaceElement] === natalElement) return "palace_controls_natal";
  if (controls[natalElement] === palaceElement) return "natal_controls_palace";
  return null;
}

const PRINCIPAL_NAMES = new Set([
  "Tử Vi",
  "Thiên Cơ",
  "Thái Dương",
  "Vũ Khúc",
  "Thiên Đồng",
  "Liêm Trinh",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
]);

export function classifyPrincipalDignityCase(stars: readonly ChartStar[]): string {
  const principals = stars.filter(
    (s) => PRINCIPAL_NAMES.has(s.name) && (s.source ?? "natal") === "natal",
  );
  if (principals.length === 0) return "vo-chinh-dieu";
  const brightnesses = principals.map((s) => s.brightness).filter(Boolean);
  if (principals.some((s) => !s.brightness)) return "missing-brightness";
  const unique = new Set(brightnesses);
  if (unique.size > 1 && principals.length > 1) return "conflicting-brightness";
  if (principals.length === 1) return "one-principal";
  if (principals.length >= 2) return "two-principals";
  return "vo-chinh-dieu";
}

export function setMatches(
  presentNames: ReadonlySet<string>,
  required: readonly string[],
  mode: "all" | "any" | "threshold",
  threshold?: number,
): boolean {
  const hits = required.filter((n) => presentNames.has(n)).length;
  if (mode === "all") return hits === required.length && required.length > 0;
  if (mode === "any") return hits >= 1;
  if (mode === "threshold") return hits >= (threshold ?? required.length);
  return false;
}

export function isExecutableRule(
  rule: { status: string; rawDelta: number | null },
): boolean {
  return rule.status === "executable" && rule.rawDelta != null && Number.isFinite(rule.rawDelta);
}

export function starNamesInFrame(
  chart: ChartData,
  focusIndex: number,
): Set<string> {
  const focus = chart.palaces.find((p) => p.index === focusIndex);
  if (!focus) return new Set();
  const opposite = chart.palaces.find((p) => p.index === (focusIndex + 6) % 12);
  const trineA = chart.palaces.find((p) => p.index === (focusIndex + 4) % 12);
  const trineB = chart.palaces.find((p) => p.index === (focusIndex + 8) % 12);
  const names = new Set<string>();
  for (const palace of [focus, opposite, trineA, trineB]) {
    if (!palace) continue;
    for (const star of palace.stars ?? []) {
      if ((star.source ?? "natal") === "natal") names.add(star.name);
    }
  }
  return names;
}
