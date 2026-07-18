import type { ChartData, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import type { AnnualDomainAnchorFrame } from "./collect-domain-frames";
import type { AnnualAxisEvidence, AnnualAxisEvidenceLayer, AnnualAxesDiagnostics } from "./types";

const ARCH_SOURCE_ID = "SRC-AA-ARCH-001";

interface CollectMutagenEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  frames: AnnualDomainAnchorFrame[];
  annualKnowledge: AnnualAxesKnowledgeV0;
  diagnostics: AnnualAxesDiagnostics;
}

function collectFromSource(
  records: MutagenRecord[] | undefined,
  layer: AnnualAxisEvidenceLayer,
  input: CollectMutagenEvidenceInput,
  out: AnnualAxisEvidence[],
): void {
  const { domain, frames, annualKnowledge, diagnostics } = input;
  if (!records) return;

  for (const record of records) {
    if (!record.palace) {
      diagnostics.unresolvedAnnualTargets.push(`${domain}:${layer}:${record.mutagen}:${record.starName}`);
      continue;
    }

    const impact = annualKnowledge.mutagenImpact.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) {
      diagnostics.unknownMutagens.push(record.mutagen);
      continue;
    }

    const canonical = canonicalStarName(record.starName);
    const targetPalaceIndex = record.palace.index;

    for (const frame of frames) {
      const node = frame.nodes.find((n) => n.palaceIndex === targetPalaceIndex);
      if (!node) continue;

      const physicalFactId = `mutagen:${targetPalaceIndex}:${record.mutagen}:${canonical}`;

      out.push({
        id: `ann-axis:${domain}:${layer}:mutagen:${physicalFactId}:${node.role}`,
        domain,
        layer,
        category: "mutagen",
        physicalFactId,
        ruleId: impact.ruleId,
        targetPalaceIndex,
        targetPalaceName: record.palace.name,
        targetAnnualPalaceName: node.annualPalaceName,
        frameRole: node.role,
        anchorPalaceName: frame.anchorPalaceName,
        stackingGroup: impact.stackingGroup,
        rawAxes: { ...impact.axes },
        effectiveWeight: frame.domainAnchorWeight,
        weightedAxes: { ...impact.axes },
        factIds: [physicalFactId],
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
      });
    }
  }
}

/**
 * Tứ Hóa evidence — exact target star + resolved palace only, never spread
 * across the whole TP4C frame. A transformation is only counted for a
 * domain when its resolved palace lies inside that domain's frame for at
 * least one anchor (annual mutagens layer "annual"; natal/major mutagens
 * layer per their own source array).
 */
export function collectMutagenEvidence(input: CollectMutagenEvidenceInput): AnnualAxisEvidence[] {
  const out: AnnualAxisEvidence[] = [];

  // Deliberately no cross-anchor dedup here — see collect-star-evidence.ts.
  collectFromSource(input.chart.annualMutagens, "annual", input, out);
  collectFromSource(input.chart.majorMutagens, "major-fortune", input, out);
  collectFromSource(input.chart.natalMutagens, "natal-activated", input, out);

  return out;
}
