import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV03NamPhai } from "./schema";

export interface AnnualKnowledgeV03ValidationIssue {
  path: string;
  message: string;
}

export interface AnnualKnowledgeV03ValidationResult {
  ok: boolean;
  issues: AnnualKnowledgeV03ValidationIssue[];
}

const WEIGHT_SUM_EPSILON = 1e-6;

/**
 * Structural validation for the V0.3 head-centric Nam Phái knowledge
 * bundle. Kept intentionally narrow — it must never touch the V0.2 Trung
 * Châu catalog set, so the locked TC regression fixture is unaffected.
 */
export function validateAnnualAxesKnowledgeV03NamPhai(
  knowledge: AnnualAxesKnowledgeV03NamPhai,
): AnnualKnowledgeV03ValidationResult {
  const issues: AnnualKnowledgeV03ValidationIssue[] = [];

  const domainSet = new Set(knowledge.axisDefinitions.domains.map((d) => d.domain));
  if (domainSet.size !== ANNUAL_AXIS_DOMAINS.length) {
    issues.push({
      path: "axisDefinitions.domains",
      message: `expected ${ANNUAL_AXIS_DOMAINS.length} domains, got ${domainSet.size}`,
    });
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!domainSet.has(domain)) {
      issues.push({
        path: "axisDefinitions.domains",
        message: `missing domain: ${domain}`,
      });
    }
  }

  const expectedSum = knowledge.axisDefinitions.validationRules.anchorWeightsMustSumTo;
  for (const domain of knowledge.axisDefinitions.domains) {
    const sum = domain.anchors.reduce((acc, a) => acc + a.weight, 0);
    if (Math.abs(sum - expectedSum) > WEIGHT_SUM_EPSILON) {
      issues.push({
        path: `axisDefinitions.domains.${domain.domain}`,
        message: `anchor weights sum to ${sum}, expected ${expectedSum}`,
      });
    }
    const seen = new Set<string>();
    for (const anchor of domain.anchors) {
      if (seen.has(anchor.palaceName)) {
        issues.push({
          path: `axisDefinitions.domains.${domain.domain}`,
          message: `duplicate anchor palaceName: ${anchor.palaceName}`,
        });
      }
      seen.add(anchor.palaceName);
    }
  }

  const routing = knowledge.routingProfile.routing;
  if (routing.min !== 0 || routing.max !== 1) {
    issues.push({
      path: "routingProfile.routing",
      message: `routing range must be [0, 1]; got [${routing.min}, ${routing.max}]`,
    });
  }
  const roles = knowledge.routingProfile.headFrameRoleWeights;
  if (
    !(roles.focus >= roles.opposite &&
      roles.opposite >= roles.trine &&
      roles.trine >= (roles.outside ?? 0))
  ) {
    issues.push({
      path: "routingProfile.headFrameRoleWeights",
      message: "head role weights must be non-increasing focus→opposite→trine→outside",
    });
  }

  if (knowledge.routingProfile.structuralActivation.supportDelta !== 0) {
    issues.push({
      path: "routingProfile.structuralActivation.supportDelta",
      message: "structural activation must not contribute support",
    });
  }
  if (knowledge.routingProfile.structuralActivation.pressureDelta !== 0) {
    issues.push({
      path: "routingProfile.structuralActivation.pressureDelta",
      message: "structural activation must not contribute pressure",
    });
  }
  if (knowledge.routingProfile.structuralActivation.stabilityDelta !== 0) {
    issues.push({
      path: "routingProfile.structuralActivation.stabilityDelta",
      message: "structural activation must not contribute stability",
    });
  }

  if (knowledge.contextMarkers.polarityRule !== "activation_only") {
    issues.push({
      path: "contextMarkers.polarityRule",
      message: "context markers must be activation_only",
    });
  }
  for (const marker of knowledge.contextMarkers.records) {
    if (!marker.baseAxes) continue;
    if (
      marker.baseAxes.support !== 0 ||
      marker.baseAxes.pressure !== 0 ||
      marker.baseAxes.stability !== 0
    ) {
      issues.push({
        path: `contextMarkers.${marker.markerId}`,
        message: "secondary marker must be activation-only",
      });
    }
  }

  if (knowledge.contextMarkers.convergenceRules.length !== 0) {
    issues.push({
      path: "contextMarkers.convergenceRules",
      message: "V0.3 forbids V0.2 convergence bonuses",
    });
  }

  if (knowledge.layerWeights.constraints.disabledInteractionsRemainZero !== true) {
    issues.push({
      path: "layerWeights.constraints.disabledInteractionsRemainZero",
      message: "interactions must remain disabled in V0.3",
    });
  }
  if (knowledge.layerWeights.weights.interaction !== 0) {
    issues.push({
      path: "layerWeights.weights.interaction",
      message: "interaction layer weight must be 0",
    });
  }

  if (knowledge.headPolicy.noCrossSchoolFallback !== true) {
    issues.push({
      path: "headPolicy.noCrossSchoolFallback",
      message: "cross-school fallback is forbidden",
    });
  }

  const guard = knowledge.dynamicResolutionGuard;
  if (!guard || guard.status !== "mandatory") {
    issues.push({
      path: "dynamicResolutionGuard.status",
      message: "dynamic-resolution guard must be present and mandatory",
    });
  } else {
    if (guard.principles.scorerMayNotRecalculateAnnualHead !== true) {
      issues.push({
        path: "dynamicResolutionGuard.principles.scorerMayNotRecalculateAnnualHead",
        message: "scorer must not recalculate annual head",
      });
    }
    if (guard.principles.numericCoefficientsMustComeFromKnowledge !== true) {
      issues.push({
        path: "dynamicResolutionGuard.principles.numericCoefficientsMustComeFromKnowledge",
        message: "numeric coefficients must come from knowledge",
      });
    }
    if (!Array.isArray(guard.requiredSourceScans) || guard.requiredSourceScans.length === 0) {
      issues.push({
        path: "dynamicResolutionGuard.requiredSourceScans",
        message: "requiredSourceScans must be a non-empty list",
      });
    }
  }

  const ruleIds: string[] = [];
  for (const marker of knowledge.contextMarkers.records) {
    ruleIds.push(marker.ruleId);
  }
  const dupRule = ruleIds.filter((id, i) => ruleIds.indexOf(id) !== i);
  if (dupRule.length > 0) {
    issues.push({
      path: "contextMarkers.records",
      message: `duplicate ruleId: ${dupRule.join(", ")}`,
    });
  }

  return { ok: issues.length === 0, issues };
}
