import { ANNUAL_AXIS_DOMAINS } from "../../contracts/annual-axes";
import type { DeepReadonly } from "./deep-freeze";
import type { MonthlyFlowAxisWeights, MonthlyFlowScoringKnowledgeV0 } from "./schema";

export interface MonthlyFlowKnowledgeValidationIssue {
  path: string;
  message: string;
}

export interface MonthlyFlowKnowledgeValidationResult {
  ok: boolean;
  issues: MonthlyFlowKnowledgeValidationIssue[];
}

function isAxes(value: unknown): value is MonthlyFlowAxisWeights {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.support === "number" &&
    typeof v.pressure === "number" &&
    typeof v.stability === "number" &&
    typeof v.activation === "number"
  );
}

/**
 * Validate Monthly Flow Scoring V0 knowledge structurally. Independent of
 * other modules' validators — a broken Monthly Flow pack must never affect
 * Annual Axes / Major Fortune / Palace Overview loadability.
 */
export function validateMonthlyFlowScoringKnowledge(
  knowledge: MonthlyFlowScoringKnowledgeV0 | DeepReadonly<MonthlyFlowScoringKnowledgeV0>,
): MonthlyFlowKnowledgeValidationResult {
  const issues: MonthlyFlowKnowledgeValidationIssue[] = [];

  const domainSet = new Set(knowledge.domainDefinitions.domains.map((d) => d.domain));
  if (domainSet.size !== ANNUAL_AXIS_DOMAINS.length) {
    issues.push({
      path: "domainDefinitions.domains",
      message: `expected ${ANNUAL_AXIS_DOMAINS.length} domains, got ${domainSet.size}`,
    });
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!domainSet.has(domain)) {
      issues.push({ path: "domainDefinitions.domains", message: `missing domain: ${domain}` });
    }
  }

  if (knowledge.domainDefinitions.availability.natalPalaceNameFallbackAllowed !== false) {
    issues.push({
      path: "domainDefinitions.availability.natalPalaceNameFallbackAllowed",
      message: "natal palace name fallback must remain false",
    });
  }

  if (knowledge.identityPolicy.coordinateIndependence.inferCalendarFromFocusPalace !== false) {
    issues.push({
      path: "identityPolicy.coordinateIndependence.inferCalendarFromFocusPalace",
      message: "must be false",
    });
  }
  if (knowledge.identityPolicy.coordinateIndependence.inferFocusPalaceFromCalendarBranch !== false) {
    issues.push({
      path: "identityPolicy.coordinateIndependence.inferFocusPalaceFromCalendarBranch",
      message: "must be false",
    });
  }

  const bands = [...knowledge.scoringProfile.output.bands].sort(
    (a, b) => a.minInclusive - b.minInclusive,
  );
  let expectedStart = knowledge.scoringProfile.output.scoreMin;
  for (const band of bands) {
    if (band.minInclusive !== expectedStart) {
      issues.push({
        path: `scoringProfile.output.bands.${band.id}`,
        message: `band gap: expected minInclusive ${expectedStart}, got ${band.minInclusive}`,
      });
    }
    expectedStart = band.maxExclusive ?? band.maxInclusive ?? expectedStart;
  }
  const last = bands[bands.length - 1];
  if (last && (last.maxInclusive ?? last.maxExclusive) !== knowledge.scoringProfile.output.scoreMax) {
    issues.push({ path: "scoringProfile.output.bands", message: "bands do not reach scoreMax" });
  }

  const seenRuleIds = new Set<string>();
  const addRuleId = (ruleId: string, path: string) => {
    if (seenRuleIds.has(ruleId)) {
      issues.push({ path, message: `duplicate ruleId: ${ruleId}` });
    }
    seenRuleIds.add(ruleId);
  };

  for (const record of knowledge.focusMarkers.records) {
    addRuleId(record.ruleId, `focusMarkers.${record.markerId}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `focusMarkers.${record.markerId}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.transformationImpact.records) {
    addRuleId(record.ruleId, `transformationImpact.${record.mutagen}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `transformationImpact.${record.mutagen}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.movingStars.records) {
    addRuleId(record.ruleId, `movingStars.${record.markerId}`);
  }
  for (const record of knowledge.calendarRelations.records) {
    addRuleId(record.ruleId, `calendarRelations.${record.ruleId}`);
  }
  for (const record of knowledge.interactionRules.records) {
    addRuleId(record.ruleId, `interactionRules.${record.ruleId}`);
  }

  const requireDisabled = (
    catalogPath: string,
    defaultEnabled: boolean,
    records: ReadonlyArray<{ enabled: boolean; ruleId?: string; markerId?: string }>,
  ) => {
    if (defaultEnabled !== false) {
      issues.push({ path: `${catalogPath}.defaultEnabled`, message: "must be false for V0" });
    }
    for (const record of records) {
      if (record.enabled !== false) {
        const id = record.ruleId ?? record.markerId ?? "?";
        issues.push({
          path: `${catalogPath}.${id}`,
          message: "V0 requires enabled:false",
        });
      }
    }
  };

  requireDisabled("movingStars", knowledge.movingStars.defaultEnabled, knowledge.movingStars.records);
  requireDisabled(
    "calendarRelations",
    knowledge.calendarRelations.defaultEnabled,
    knowledge.calendarRelations.records,
  );
  requireDisabled(
    "interactionRules",
    knowledge.interactionRules.defaultEnabled,
    knowledge.interactionRules.records,
  );

  if (knowledge.schoolCapabilities.profiles["nam-phai"].supportsSixAxisOverlayFromCurrentChart) {
    issues.push({
      path: "schoolCapabilities.profiles.nam-phai",
      message: "Nam Phái must not support six-axis overlay from current ChartData in V0",
    });
  }

  const hasArchitectureSource = knowledge.sourceRegistry.sources.some(
    (s) => s.sourceType === "internal_architecture" && s.allowedUsage.includes("formula_design"),
  );
  if (!hasArchitectureSource) {
    issues.push({
      path: "sourceRegistry",
      message:
        "no internal_architecture source with formula_design usage found to cover experimental numeric coefficients",
    });
  }

  return { ok: issues.length === 0, issues };
}
