import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { MonthlyFlowFocusMarkersCatalog } from "../../knowledge/monthly-flow";
import type { AnnualDomainFrame } from "./collect-annual-domain-frames";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowFrameRole,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

export interface CollectStructuralEvidenceInput {
  domain: AnnualAxisDomain;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: AnnualDomainFrame;
  focusMarkers: MonthlyFlowFocusMarkersCatalog;
}

/**
 * Structural (activation-only) monthly markers per role: focus/opposite/
 * trine. A monthly-frame role only contributes when its palace also lies
 * inside the annual domain frame — mirroring `focus-star` intersection
 * rule so activation never leaks outside the domain scope.
 */
export function collectStructuralEvidence(
  input: CollectStructuralEvidenceInput,
): MonthlyFlowEvidence[] {
  const { domain, monthKey, monthlyFrame, annualDomainFrame, focusMarkers } = input;
  const out: MonthlyFlowEvidence[] = [];

  for (const node of monthlyFrame.nodes) {
    if (!annualDomainFrame.indexSet.has(node.palaceIndex)) continue;

    const marker = focusMarkers.records.find((r) => r.frameRole === node.role);
    if (!marker) continue;

    const monthlyRole: MonthlyFlowFrameRole = node.role;
    const annualRole: MonthlyFlowFrameRole =
      annualDomainFrame.roleByIndex.get(node.palaceIndex) ?? "outside";

    const physicalFactId = `structural:${marker.markerId}:${node.palaceIndex}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:structural-activation:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "structural-activation",
      physicalFactId,
      ruleId: marker.ruleId,
      targetPalaceIndex: node.palaceIndex,
      targetNatalPalaceName: node.natalPalaceName,
      targetAnnualPalaceName: node.annualPalaceName,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: "structural-activation",
      rawAxes: { ...marker.axes },
      effectiveWeight: 1,
      weightedAxes: { ...marker.axes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    });
  }

  return out;
}
