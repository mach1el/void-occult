import type { ChartData, ChartPalace } from "@/types/chart";
import type { NatalZiweiFact } from "../../facts";
import type { PalaceOverviewSemanticKnowledgeV1 } from "../../knowledge";
import type {
  PalaceAnnotation,
  PalaceOverviewSemanticDiagnostics,
} from "./types";

export interface MenhThanStatus {
  isMenh: boolean;
  isThan: boolean;
}

/**
 * isMenh/isThan per prompt §4: Calculation-Core fields only, never
 * recomputed. Numeric index is the SSOT — a disagreeing marker field only
 * ever feeds a dev diagnostic, it must never influence the returned status
 * (a bad flag could otherwise mark more than one palace as Mệnh/Thân).
 */
export function resolveMenhThanStatus(
  chart: ChartData,
  palace: ChartPalace,
  diagnostics: PalaceOverviewSemanticDiagnostics,
): MenhThanStatus {
  const isMenhByIndex = palace.index === chart.menhIndex;
  const isThanByIndex = palace.index === chart.thanIndex;
  const isMenhByFlag = palace.isMenh === true;
  const isThanByFlag = palace.isThan === true;

  if (isMenhByIndex !== isMenhByFlag) diagnostics.menhIndexMismatch = true;
  if (isThanByIndex !== isThanByFlag) diagnostics.thanIndexMismatch = true;

  return {
    isMenh: isMenhByIndex,
    isThan: isThanByIndex,
  };
}

function palaceHasNatalMajorStar(facts: NatalZiweiFact[]): boolean {
  return facts.some((f) => f.kind === "star" && f.starClass === "major");
}

export function buildMenhThanAnnotations(input: {
  chart: ChartData;
  palace: ChartPalace;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewSemanticKnowledgeV1;
  status: MenhThanStatus;
}): PalaceAnnotation[] {
  const { chart, palace, factsByPalace, knowledge, status } = input;
  const catalog = knowledge.menhThanContext;
  const ruleById = new Map(catalog.rules.map((r) => [r.id, r]));
  const knowledgeStatus =
    catalog.status === "approved" ? "approved" : "experimental";
  const sourceIds = catalog.sourceIds;
  const out: PalaceAnnotation[] = [];

  const push = (
    ruleId: string,
    palaceIndexes: number[],
    palaceRoles: PalaceAnnotation["palaceRoles"],
  ) => {
    const rule = ruleById.get(ruleId);
    if (!rule) return;
    out.push({
      id: `ann:menh-than:${palace.index}:${ruleId}`,
      category: "menh-than",
      label: rule.label,
      explanationKey: rule.explanationKey,
      tags: rule.tags,
      factIds: [],
      palaceIndexes,
      palaceRoles,
      sourceIds,
      knowledgeStatus,
    });
  };

  if (status.isMenh) {
    push("context-menh-core", [palace.index], ["focus"]);
  }
  if (status.isThan) {
    push("context-than-emphasis", [palace.index], ["focus"]);
  }
  if (chart.menhIndex === chart.thanIndex && palace.index === chart.menhIndex) {
    push("context-menh-than-same-palace", [palace.index], ["focus"]);
  }
  if (
    palace.index === chart.menhIndex &&
    !palaceHasNatalMajorStar(factsByPalace.get(chart.menhIndex) ?? [])
  ) {
    push(
      "context-menh-void-than-reference",
      [chart.menhIndex, chart.thanIndex],
      ["focus"],
    );
  }

  return out;
}
