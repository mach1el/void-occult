import type { ChartData, ChartStar } from "@/types/chart";
import type { ZiweiSchool } from "../../../../facts";
import type {
  MajorFortuneAdapterDiagnostics,
  MajorFortuneAdapterResolvedContext,
} from "./types";
import adapterPolicy from "./policy/adapter-policy.v0.3.json";

const PRINCIPAL = new Set(adapterPolicy.principalStarNames as string[]);

function emptyDiagnostics(): MajorFortuneAdapterDiagnostics {
  return {
    forbiddenAnnualMonthlyFieldsPresent: [],
    noActiveMajorFortune: [],
    missingMenhElement: [],
    unsupportedBrightness: [],
    incompleteTransformationTuples: [],
    namPhaiTransformationBlocked: [],
    partialPairSets: [],
    disabledFamilies: [],
    evidenceValidationErrors: [],
    notes: [],
    outOfFrameTransformationCount: 0,
  };
}

function detectForbiddenFields(chart: ChartData, diagnostics: MajorFortuneAdapterDiagnostics): void {
  const checks: Array<{ name: string; present: boolean }> = [
    { name: "annualStars", present: Boolean(chart.annualStars && chart.annualStars.length > 0) },
    { name: "annualMutagens", present: Boolean(chart.annualMutagens && chart.annualMutagens.length > 0) },
    { name: "taiTuePalace", present: Boolean(chart.taiTuePalace) },
    { name: "smallLimitPalace", present: Boolean(chart.smallLimitPalace) },
    {
      name: "annualHeadPalace",
      present: Boolean((chart as { annualHeadPalace?: unknown }).annualHeadPalace),
    },
    { name: "isLuuNienDaiVan", present: chart.palaces.some((p) => p.isLuuNienDaiVan) },
    { name: "monthlyPalaces", present: Boolean(chart.monthlyPalaces && chart.monthlyPalaces.length > 0) },
    {
      name: "flowMonths",
      present: chart.palaces.some((p) => p.flowMonths && p.flowMonths.length > 0),
    },
  ];
  for (const c of checks) {
    if (c.present) diagnostics.forbiddenAnnualMonthlyFieldsPresent.push(c.name);
  }
}

export function resolveAdapterContext(
  chart: ChartData,
  school: ZiweiSchool,
): { context: MajorFortuneAdapterResolvedContext | null; diagnostics: MajorFortuneAdapterDiagnostics } {
  const diagnostics = emptyDiagnostics();
  detectForbiddenFields(chart, diagnostics);

  for (const disabled of adapterPolicy.round1DisabledFamilies) {
    diagnostics.disabledFamilies.push(`${disabled.signalFamilyId}:${disabled.reason}`);
  }

  const activePalace = chart.majorFortunePalace;
  if (!activePalace) {
    diagnostics.noActiveMajorFortune.push("chart:no-active-major-fortune-palace");
    return { context: null, diagnostics };
  }

  const cycleIndex = activePalace.majorFortune?.order;
  const startAge = activePalace.majorFortune?.start;
  const endAge = activePalace.majorFortune?.end;
  if (cycleIndex === undefined || startAge === undefined || endAge === undefined) {
    diagnostics.noActiveMajorFortune.push("majorFortunePalace.majorFortune incomplete");
    return { context: null, diagnostics };
  }

  const menhElement = chart.menhElement ?? null;
  if (!menhElement) {
    diagnostics.missingMenhElement.push("menhElement missing");
  }

  const menhPalace =
    chart.palaces.find((p) => p.isMenh) ??
    chart.palaces.find((p) => p.name === "Mệnh") ??
    null;

  const natalStarsInActivePalace = (activePalace.stars ?? []).filter(
    (s) => (s.source ?? "natal") === "natal",
  );

  const presentNatalStarNames = new Set(natalStarsInActivePalace.map((s) => s.name));

  const majorMutagens = chart.majorMutagens ?? [];
  if (school === "nam-phai" && majorMutagens.length > 0) {
    diagnostics.namPhaiTransformationBlocked.push(
      "majorMutagens present but Nam Phái transformations unavailable until Calculation Core supports them",
    );
  }

  const transformations = school === "trung-chau" ? majorMutagens : [];

  return {
    context: {
      school,
      cycle: {
        cycleIndex,
        startAge,
        endAge,
        activePalaceIndex: activePalace.index,
      },
      activePalace,
      activePalaceBranch: activePalace.branch,
      fortuneStem: activePalace.stem ?? null,
      menhElement,
      menhPalace,
      natalStarsInActivePalace,
      transformations,
      presentNatalStarNames,
    },
    diagnostics,
  };
}

export function natalPrincipalsInPalace(stars: readonly ChartStar[]): ChartStar[] {
  return stars.filter((s) => PRINCIPAL.has(s.name) && (s.source ?? "natal") === "natal");
}

export { emptyDiagnostics };
