import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { MonthlyFlowTransformationImpactCatalog } from "../../knowledge/monthly-flow";
import type { AnnualDomainFrame } from "./collect-annual-domain-frames";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowFrameRole,
  ResolvedMonthlyTransformation,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

export interface CollectMonthlyTransformationEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: AnnualDomainFrame;
  transformations: readonly ResolvedMonthlyTransformation[];
  impactCatalog: MonthlyFlowTransformationImpactCatalog;
}

/**
 * Monthly Tứ Hóa evidence for one (month, domain). A monthly
 * transformation contributes when its resolved target palace lies inside
 * the annual domain frame — the monthly TP4C is scored via
 * `monthlyFrameRole`, which is `"outside"` when the target sits outside
 * the monthly TP4C. This lets the same monthly transformation feed the
 * domain frame even when the focus/opposite/trine palaces of the month
 * do not literally hold that target star.
 */
export function collectMonthlyTransformationEvidence(
  input: CollectMonthlyTransformationEvidenceInput,
): MonthlyFlowEvidence[] {
  const {
    chart,
    domain,
    monthKey,
    monthlyFrame,
    annualDomainFrame,
    transformations,
    impactCatalog,
  } = input;
  const out: MonthlyFlowEvidence[] = [];

  for (const record of transformations) {
    if (!annualDomainFrame.indexSet.has(record.targetPalaceIndex)) continue;

    const impact = impactCatalog.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) continue;

    const monthlyRole: MonthlyFlowFrameRole = monthlyFrame.indexSet.has(record.targetPalaceIndex)
      ? (monthlyFrame.nodes.find((n) => n.palaceIndex === record.targetPalaceIndex)!.role)
      : "outside";
    const annualRole: MonthlyFlowFrameRole =
      annualDomainFrame.roleByIndex.get(record.targetPalaceIndex) ?? "outside";

    const chartPalace = chart.palaces.find((p) => p.index === record.targetPalaceIndex);
    const targetAnnualName = chartPalace?.annualPalaceName ?? null;

    const physicalFactId = `monthly-transformation:${record.targetPalaceIndex}:${record.mutagen}:${record.canonicalStarName}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:monthly-transformation:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "monthly-transformation",
      physicalFactId,
      ruleId: impact.ruleId,
      targetPalaceIndex: record.targetPalaceIndex,
      targetNatalPalaceName: record.targetNatalPalaceName,
      targetAnnualPalaceName: targetAnnualName,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: impact.stackingGroup,
      rawAxes: { ...impact.axes },
      effectiveWeight: 1,
      weightedAxes: { ...impact.axes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    });
  }

  return out;
}
