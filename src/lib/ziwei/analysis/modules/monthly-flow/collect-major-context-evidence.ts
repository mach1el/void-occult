import type { ChartData, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualMutagenImpactCatalog } from "../../knowledge/annual-axes";
import type { AnnualDomainFrame } from "./collect-annual-domain-frames";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowFrameRole,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

function pushRolesForTarget(
  targetIndex: number,
  monthlyFrame: MonthlyFrame,
  annualDomainFrame: AnnualDomainFrame,
): { monthlyRole: MonthlyFlowFrameRole; annualRole: MonthlyFlowFrameRole } {
  const monthlyRole: MonthlyFlowFrameRole = monthlyFrame.indexSet.has(targetIndex)
    ? monthlyFrame.nodes.find((n) => n.palaceIndex === targetIndex)!.role
    : "outside";
  const annualRole: MonthlyFlowFrameRole =
    annualDomainFrame.roleByIndex.get(targetIndex) ?? "outside";
  return { monthlyRole, annualRole };
}

function collectMajorMutagensInBothFrames(
  chart: ChartData,
  domain: AnnualAxisDomain,
  monthKey: string,
  monthlyFrame: MonthlyFrame,
  annualDomainFrame: AnnualDomainFrame,
  records: readonly MutagenRecord[] | undefined,
  impactCatalog: AnnualMutagenImpactCatalog,
): MonthlyFlowEvidence[] {
  const out: MonthlyFlowEvidence[] = [];
  if (!records) return out;

  for (const record of records) {
    if (!record.palace) continue;
    const targetIndex = record.palace.index;
    if (!monthlyFrame.indexSet.has(targetIndex)) continue;
    if (!annualDomainFrame.indexSet.has(targetIndex)) continue;

    const canonical = canonicalStarName(record.starName);
    const chartPalace = chart.palaces.find((p) => p.index === targetIndex);
    if (!chartPalace) continue;
    const holds = (chartPalace.stars ?? []).some(
      (s) => canonicalStarName(s.name) === canonical,
    );
    if (!holds) continue;

    const impact = impactCatalog.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) continue;

    const { monthlyRole, annualRole } = pushRolesForTarget(
      targetIndex,
      monthlyFrame,
      annualDomainFrame,
    );

    const physicalFactId = `major-transformation-context:${targetIndex}:${record.mutagen}:${canonical}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:major-transformation-context:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "major-transformation-context",
      physicalFactId,
      ruleId: impact.ruleId || "RULE-MFS-MO-MAJOR-MUTAGEN-V0",
      targetPalaceIndex: targetIndex,
      targetNatalPalaceName: record.palace.name,
      targetAnnualPalaceName: chartPalace.annualPalaceName ?? null,
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

function collectActiveMajorPalace(
  chart: ChartData,
  domain: AnnualAxisDomain,
  monthKey: string,
  monthlyFrame: MonthlyFrame,
  annualDomainFrame: AnnualDomainFrame,
  activationAxes: { support: 0; pressure: 0; stability: 0; activation: number },
): MonthlyFlowEvidence[] {
  const active = chart.majorFortunePalace;
  if (!active) return [];
  const targetIndex = active.index;
  if (!monthlyFrame.indexSet.has(targetIndex)) return [];
  if (!annualDomainFrame.indexSet.has(targetIndex)) return [];

  const { monthlyRole, annualRole } = pushRolesForTarget(
    targetIndex,
    monthlyFrame,
    annualDomainFrame,
  );
  const physicalFactId = `major-active-palace:${targetIndex}`;

  return [
    {
      id: `mfs-monthly:${monthKey}:${domain}:major-active-palace-context:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "major-active-palace-context",
      physicalFactId,
      ruleId: "RULE-MFS-MO-MAJOR-ACTIVE-PALACE-V0",
      targetPalaceIndex: targetIndex,
      targetNatalPalaceName: active.name,
      targetAnnualPalaceName: active.annualPalaceName ?? null,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: "major-active-palace",
      rawAxes: { ...activationAxes },
      effectiveWeight: 1,
      weightedAxes: { ...activationAxes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    },
  ];
}

export interface CollectMajorContextEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: AnnualDomainFrame;
  supportsMajorTransformations: boolean;
  annualMutagenImpact: AnnualMutagenImpactCatalog;
  /** Activation axes for the "active-major-palace intersects both frames"
   * marker. Read from `monthly-focus-markers` so the numeric value is
   * never invented here. */
  activePalaceActivationAxes: {
    support: 0;
    pressure: 0;
    stability: 0;
    activation: number;
  };
}

/**
 * Major-Fortune context evidence — never re-scores Major Fortune. Two
 * feeds:
 *   1. Major Tứ Hóa records whose exact target lies in BOTH frames.
 *      Requires school-level support for major transformations
 *      (`supportsMajorTransformations`); Nam Phái is off in V0.
 *   2. Active major palace activation-only marker — fires when the
 *      active-decade palace index intersects both frames.
 */
export function collectMajorContextEvidence(
  input: CollectMajorContextEvidenceInput,
): MonthlyFlowEvidence[] {
  const out: MonthlyFlowEvidence[] = [];

  if (input.supportsMajorTransformations) {
    out.push(
      ...collectMajorMutagensInBothFrames(
        input.chart,
        input.domain,
        input.monthKey,
        input.monthlyFrame,
        input.annualDomainFrame,
        input.chart.majorMutagens,
        input.annualMutagenImpact,
      ),
    );
  }

  out.push(
    ...collectActiveMajorPalace(
      input.chart,
      input.domain,
      input.monthKey,
      input.monthlyFrame,
      input.annualDomainFrame,
      input.activePalaceActivationAxes,
    ),
  );

  return out;
}
