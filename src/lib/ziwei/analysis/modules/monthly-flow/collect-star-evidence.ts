import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { canonicalStarName, isMutagenMarkerName, isVoidStarName } from "../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualDomainFrame } from "./collect-annual-domain-frames";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowAxes,
  MonthlyFlowEvidence,
  MonthlyFlowFrameRole,
  MonthlyFlowMonthDiagnostics,
} from "./types";

const NON_PHYSICAL_SOURCES = new Set([
  "annual",
  "natal-mutagen",
  "annual-mutagen",
  "major-mutagen",
]);

/**
 * Physical natal stars only — shared by monthly star collection and
 * monthly Tứ Hóa target resolution. Rejects annual moving stars,
 * mutagen pseudo-stars, void/context markers, and Lưu-prefixed names
 * (except the natal star "Lưu Hà").
 */
export function isEligibleNatalPhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  if (isVoidStarName(star.name)) return false;
  if (isMutagenMarkerName(star.name)) return false;
  if (NON_PHYSICAL_SOURCES.has(source)) return false;
  // Lưu-prefixed moving names canonicalize to natal spellings; never treat
  // them as the natal physical target even if source were mis-tagged.
  if (/^Lưu\s+/.test(star.name) && !star.name.startsWith("Lưu Hà")) return false;
  return true;
}

interface StarKnowledgeMatch {
  axes: MonthlyFlowAxes;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  starClass: "major" | "minor";
}

type StarKnowledgeResult =
  | ({ kind: "scored" } & StarKnowledgeMatch)
  | { kind: "not-scored" }
  | { kind: "unknown" };

function resolveStarKnowledge(
  canonicalName: string,
  brightness: string | undefined,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): StarKnowledgeResult {
  const major = numericKnowledge.majorStars.stars.find((s) => s.name === canonicalName);
  if (major) {
    const status = numericKnowledge.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: MonthlyFlowAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numericKnowledge.majorStars.brightnessModifiers[brightness] ??
        numericKnowledge.majorStars.brightnessModifiers.Bình;
      if (modifier) {
        axes = {
          support: axes.support * modifier.supportFactor,
          pressure: axes.pressure * modifier.pressureFactor,
          stability: axes.stability + modifier.stabilityDelta,
          activation: axes.activation * modifier.activationFactor,
        };
      }
    }
    return {
      kind: "scored",
      axes,
      sourceIds: numericKnowledge.majorStars.sourceIds,
      knowledgeStatus: status,
      starClass: "major",
    };
  }

  const minor = numericKnowledge.minorStars.stars.find((s) => s.canonicalName === canonicalName);
  if (minor && minor.scoringMode !== "direct") return { kind: "not-scored" };
  if (minor && minor.scoringMode === "direct") {
    const family = numericKnowledge.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return { kind: "unknown" };
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: MonthlyFlowAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy =
        numericKnowledge.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
      if (policy) {
        axes = {
          support: axes.support * policy.supportFactor,
          pressure: axes.pressure * policy.pressureFactor,
          stability: axes.stability + policy.stabilityDelta,
          activation: axes.activation * policy.activationFactor,
        };
      }
    }
    return {
      kind: "scored",
      axes,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
      starClass: "minor",
    };
  }

  return { kind: "unknown" };
}

function physicalNatalStars(palace: ChartPalace | undefined): ChartStar[] {
  if (!palace) return [];
  return (palace.stars ?? []).filter(isEligibleNatalPhysicalStar);
}

export interface CollectStarEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: AnnualDomainFrame;
  numericKnowledge: PalaceOverviewKnowledgeV1;
  monthDiagnostics: MonthlyFlowMonthDiagnostics;
}

/**
 * Monthly star evidence — the natal star sitting at any palace that lies
 * in BOTH the annual domain frame AND the monthly TP4C. Each physical
 * fact counts once per (monthKey, domain, palaceIndex, canonicalStar);
 * the aggregator later dedupes on that identity across categories/frames.
 * VCD (Vô Chính Diệu) borrowing intentionally omitted from V0 — the
 * mission scope restricts this collector to the intersection set only.
 */
export function collectStarEvidence(input: CollectStarEvidenceInput): MonthlyFlowEvidence[] {
  const {
    chart,
    domain,
    monthKey,
    monthlyFrame,
    annualDomainFrame,
    numericKnowledge,
    monthDiagnostics,
  } = input;

  const out: MonthlyFlowEvidence[] = [];
  const seenPhysical = new Set<string>();

  for (const monthlyNode of monthlyFrame.nodes) {
    if (!annualDomainFrame.indexSet.has(monthlyNode.palaceIndex)) continue;

    const annualRole: MonthlyFlowFrameRole =
      annualDomainFrame.roleByIndex.get(monthlyNode.palaceIndex) ?? "outside";
    const monthlyRole: MonthlyFlowFrameRole = monthlyNode.role;

    const palace = chart.palaces.find((p) => p.index === monthlyNode.palaceIndex);
    if (!palace) continue;

    for (const star of physicalNatalStars(palace)) {
      const canonical = canonicalStarName(star.name);
      const physicalFactId = `star:${palace.index}:${canonical}`;
      const identity = `${monthKey}|${domain}|${physicalFactId}`;
      if (seenPhysical.has(identity)) continue;
      seenPhysical.add(identity);

      const result = resolveStarKnowledge(canonical, star.brightness, numericKnowledge);
      if (result.kind === "not-scored") continue;
      if (result.kind === "unknown") {
        monthDiagnostics.unknownStars.push(canonical);
        continue;
      }

      const ruleId =
        result.starClass === "major"
          ? "RULE-MFS-MO-STAR-MAJOR-CANONICAL-V0"
          : "RULE-MFS-MO-STAR-MINOR-CANONICAL-V0";
      const stackingGroup = result.diminishingGroup ?? "major-star";

      out.push({
        id: `mfs-monthly:${monthKey}:${domain}:monthly-focus-star:${physicalFactId}:${monthlyRole}:${annualRole}`,
        domain,
        monthKey,
        category: "monthly-focus-star",
        physicalFactId,
        ruleId,
        targetPalaceIndex: palace.index,
        targetNatalPalaceName: palace.name,
        targetAnnualPalaceName: palace.annualPalaceName ?? null,
        monthlyFrameRole: monthlyRole,
        annualDomainRole: annualRole,
        stackingGroup,
        rawAxes: { ...result.axes },
        effectiveWeight: 1,
        weightedAxes: { ...result.axes },
        factIds: [physicalFactId],
        sourceIds: result.sourceIds,
        knowledgeStatus: result.knowledgeStatus,
      });
    }
  }

  return out;
}
