import type { ChartData, ChartPalace } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import type { AnnualDomainAnchorFrame, AnnualFrameNode } from "./collect-domain-frames";
import type { AnnualAxisEvidence, AnnualAxesDiagnostics } from "./types";

const ARCH_SOURCE_ID = "SRC-AA-ARCH-001";

const MARKER_FLAG: Record<string, keyof ChartPalace> = {
  "annual-tai-tue": "isTaiTuePalace",
  "small-limit": "isSmallLimitPalace",
  "annual-major-fortune": "isLuuNienDaiVan",
};

interface CollectFocalEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  frames: AnnualDomainAnchorFrame[];
  school: ZiweiSchool;
  annualKnowledge: AnnualAxesKnowledgeV0;
  diagnostics: AnnualAxesDiagnostics;
}

interface MarkerHit {
  markerId: string;
  ruleId: string;
  axes: { support: number; pressure: number; stability: number; activation: number };
  palace: ChartPalace;
  node: AnnualFrameNode;
  anchorWeight: number;
  anchorPalaceName: string;
}

/**
 * Focal marker + convergence evidence. `polarityRule: "activation_only"` —
 * these markers affect activation only; they never independently supply
 * support/pressure. Forbidden markers for a school are excluded and logged,
 * never silently accepted. Convergence applies only when ≥2 distinct marker
 * IDs resolve to the exact same physical palace.
 */
export function collectFocalEvidence(input: CollectFocalEvidenceInput): AnnualAxisEvidence[] {
  const { chart, domain, frames, school, annualKnowledge, diagnostics } = input;
  const out: AnnualAxisEvidence[] = [];

  const schoolProfile = annualKnowledge.scoringProfile.schoolProfiles[school];
  const enabled = new Set(schoolProfile?.enabledFocalMarkers ?? []);
  const forbidden = new Set(schoolProfile?.forbiddenFocalMarkers ?? []);

  for (const frame of frames) {
    const hitsByPalace = new Map<number, MarkerHit[]>();

    for (const node of frame.nodes) {
      const palace = chart.palaces.find((p) => p.index === node.palaceIndex);
      if (!palace) continue;

      for (const record of annualKnowledge.focalMarkers.records) {
        const flagKey = MARKER_FLAG[record.markerId];
        if (!flagKey || !palace[flagKey]) continue;

        if (forbidden.has(record.markerId)) {
          diagnostics.forbiddenSchoolMarkers.push(`${school}:${record.markerId}`);
          continue;
        }
        if (!enabled.has(record.markerId) || !record.schools.includes(school)) continue;

        const hits = hitsByPalace.get(palace.index) ?? [];
        hits.push({
          markerId: record.markerId,
          ruleId: record.ruleId,
          axes: record.axes,
          palace,
          node,
          anchorWeight: frame.domainAnchorWeight,
          anchorPalaceName: frame.anchorPalaceName,
        });
        hitsByPalace.set(palace.index, hits);
      }
    }

    for (const hits of hitsByPalace.values()) {
      for (const hit of hits) {
        const physicalFactId = `focal-marker:${hit.palace.index}:${hit.markerId}`;
        out.push({
          id: `ann-axis:${domain}:annual:focal-marker:${physicalFactId}:${hit.node.role}`,
          domain,
          layer: "annual",
          category: "focal-marker",
          physicalFactId,
          ruleId: hit.ruleId,
          targetPalaceIndex: hit.palace.index,
          targetPalaceName: hit.palace.name,
          targetAnnualPalaceName: hit.node.annualPalaceName,
          frameRole: hit.node.role,
          anchorPalaceName: hit.anchorPalaceName,
          stackingGroup: "focal-marker",
          rawAxes: { ...hit.axes },
          effectiveWeight: hit.anchorWeight,
          weightedAxes: { ...hit.axes },
          factIds: [physicalFactId],
          sourceIds: [ARCH_SOURCE_ID],
          knowledgeStatus: "experimental",
        });
      }

      const distinctMarkerCount = new Set(hits.map((h) => h.markerId)).size;
      if (distinctMarkerCount < 2) continue;

      const convergence = annualKnowledge.focalMarkers.convergence.find(
        (c) => c.markerCount === distinctMarkerCount,
      );
      if (!convergence) continue;

      const first = hits[0];
      if (!first) continue;
      const physicalFactId = `focal-convergence:${first.palace.index}:${distinctMarkerCount}`;
      out.push({
        id: `ann-axis:${domain}:annual:focal-marker:${physicalFactId}:${first.node.role}`,
        domain,
        layer: "annual",
        category: "focal-marker",
        physicalFactId,
        ruleId: convergence.ruleId,
        targetPalaceIndex: first.palace.index,
        targetPalaceName: first.palace.name,
        targetAnnualPalaceName: first.node.annualPalaceName,
        frameRole: first.node.role,
        anchorPalaceName: first.anchorPalaceName,
        stackingGroup: "focal-marker",
        rawAxes: { ...convergence.axes },
        effectiveWeight: first.anchorWeight,
        weightedAxes: { ...convergence.axes },
        factIds: hits.map((h) => `focal-marker:${h.palace.index}:${h.markerId}`),
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
      });
    }
  }

  return out;
}
