import type { ChartData, ChartStar } from "@/types/chart";
import { canonicalStarName } from "../../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type { NatalDomainResponseProfile } from "../types";
import { domainFrameCoverage } from "./routing";

const ANNUAL_STAR_SOURCES = new Set(["annual"]);
const MUTAGEN_MARKER_SOURCES = new Set(["natal-mutagen", "annual-mutagen"]);

function isNatalPhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  return !ANNUAL_STAR_SOURCES.has(source) && !MUTAGEN_MARKER_SOURCES.has(source);
}

/**
 * Sign-neutral natal response: sensitivity/resilience reshape amplitude
 * only. They never inject a permanent quality offset above/below 50.
 */
export function computeNatalDomainResponse(
  chart: ChartData,
  domain: AnnualAxisDomain,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): NatalDomainResponseProfile {
  const coverage = domainFrameCoverage(chart, knowledge, domain);
  const palaceSet = new Set(coverage.physicalPalaceIndexes);

  let supportPressureMass = 0;
  let stabilityMass = 0;
  let count = 0;
  const provenance: string[] = [];

  for (const palace of chart.palaces) {
    if (!palaceSet.has(palace.index)) continue;
    for (const star of palace.stars ?? []) {
      if (!isNatalPhysicalStar(star)) continue;
      const canonical = canonicalStarName(star.name);
      const major = numericKnowledge.majorStars.stars.find((s) => s.name === canonical);
      if (!major) continue;
      supportPressureMass += Math.abs(major.axes.support) + Math.abs(major.axes.pressure);
      stabilityMass += Math.max(0, major.axes.stability);
      count += 1;
      provenance.push(`natal-major:${palace.index}:${canonical}`);
    }
  }

  const sensitivity =
    count === 0 ? 0.5 : Math.min(1, supportPressureMass / Math.max(1, count * 2.5));
  const resilience =
    count === 0 ? 0.5 : Math.min(1, stabilityMass / Math.max(1, count * 1.5));

  const nr = knowledge.deltaProfile.natalResponse;
  const amplitudeMultiplier = nr.responseFloor + nr.responseRange * sensitivity;

  return {
    sensitivity,
    resilience,
    amplitudeMultiplier,
    provenance: provenance.slice(0, 12),
  };
}

export function resilienceDamping(
  resilience: number,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): number {
  const nr = knowledge.deltaProfile.natalResponse;
  return nr.resilienceDampingFloor + nr.resilienceDampingRange * resilience;
}
