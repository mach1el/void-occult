import { ANNUAL_AXIS_DOMAINS } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV0, AnnualAxisWeights } from "./schema";

export interface AnnualKnowledgeValidationIssue {
  path: string;
  message: string;
}

export interface AnnualKnowledgeValidationResult {
  ok: boolean;
  issues: AnnualKnowledgeValidationIssue[];
}

const WEIGHT_SUM_EPSILON = 1e-6;

function isAxes(value: unknown): value is AnnualAxisWeights {
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
 * Validate Annual Axes V0 knowledge structurally. Independent of the
 * Palace Overview knowledge validator — a broken Annual Axes pack must
 * never affect Palace Overview scoring or its loadable status.
 */
export function validateAnnualAxesKnowledge(
  knowledge: AnnualAxesKnowledgeV0,
): AnnualKnowledgeValidationResult {
  const issues: AnnualKnowledgeValidationIssue[] = [];

  // 6 domains exactly match the contract.
  const domainSet = new Set(knowledge.axisDefinitions.domains.map((d) => d.domain));
  if (domainSet.size !== ANNUAL_AXIS_DOMAINS.length) {
    issues.push({
      path: "axisDefinitions.domains",
      message: `expected ${ANNUAL_AXIS_DOMAINS.length} domains, got ${domainSet.size}`,
    });
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (!domainSet.has(domain)) {
      issues.push({ path: "axisDefinitions.domains", message: `missing domain: ${domain}` });
    }
  }

  // Anchor weights sum to 1.0 per domain.
  const expectedSum = knowledge.axisDefinitions.validationRules.anchorWeightsMustSumTo;
  for (const domain of knowledge.axisDefinitions.domains) {
    const sum = domain.anchors.reduce((acc, a) => acc + a.weight, 0);
    if (Math.abs(sum - expectedSum) > WEIGHT_SUM_EPSILON) {
      issues.push({
        path: `axisDefinitions.domains.${domain.domain}`,
        message: `anchor weights sum to ${sum}, expected ${expectedSum}`,
      });
    }
    for (const anchor of domain.anchors) {
      if (!knowledge.axisDefinitions.validationRules.allowedPalaceNames.includes(anchor.annualPalaceName)) {
        issues.push({
          path: `axisDefinitions.domains.${domain.domain}`,
          message: `anchor references a disallowed palace name: ${anchor.annualPalaceName}`,
        });
      }
    }
  }

  // Global ruleId uniqueness across every catalog that declares one.
  const seenRuleIds = new Set<string>();
  const addRuleId = (ruleId: string, path: string) => {
    if (seenRuleIds.has(ruleId)) {
      issues.push({ path, message: `duplicate ruleId: ${ruleId}` });
    }
    seenRuleIds.add(ruleId);
  };
  for (const record of knowledge.focalMarkers.records) {
    addRuleId(record.ruleId, `focalMarkers.${record.markerId}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `focalMarkers.${record.markerId}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.focalMarkers.convergence) {
    addRuleId(record.ruleId, `focalMarkers.convergence.${record.markerCount}`);
  }
  for (const record of knowledge.interactionRules.records) {
    addRuleId(record.ruleId, `interactionRules.${record.ruleId}`);
  }
  for (const record of knowledge.mutagenImpact.records) {
    addRuleId(record.ruleId, `mutagenImpact.${record.mutagen}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `mutagenImpact.${record.mutagen}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.starOverrides.records) {
    addRuleId(record.ruleId, `starOverrides.${record.canonicalStarName}`);
  }

  // Disabled interaction rules must remain disabled — hard gate, not a
  // toggle any loader/analyzer path may flip.
  if (knowledge.interactionRules.defaultEnabled !== false) {
    issues.push({
      path: "interactionRules.defaultEnabled",
      message: "defaultEnabled must be false for V0",
    });
  }
  for (const rule of knowledge.interactionRules.records) {
    if (rule.enabled !== false) {
      issues.push({
        path: `interactionRules.${rule.ruleId}`,
        message: "V0 requires every interaction rule to stay enabled:false",
      });
    }
    if (rule.enabled && rule.sourceRefs.length === 0) {
      issues.push({
        path: `interactionRules.${rule.ruleId}`,
        message: "an enabled interaction rule must carry sourceRefs",
      });
    }
  }

  // Every enabled numeric record must be traceable: either it is covered by
  // the internal-architecture source (SRC-AA-ARCH-001, formula_design /
  // calibration usage) or it carries its own sourceRefs.
  const hasArchitectureSource = knowledge.sourceRegistry.sources.some(
    (s) => s.sourceType === "internal_architecture" && s.allowedUsage.includes("formula_design"),
  );
  if (!hasArchitectureSource) {
    issues.push({
      path: "sourceRegistry",
      message:
        "no internal_architecture source with formula_design usage found to cover the experimental numeric coefficients",
    });
  }

  // Star overrides catalog must stay empty or carry sourceRefs per record —
  // no new star table permitted in V0.
  for (const record of knowledge.starOverrides.records) {
    if (record.sourceRefs.length === 0) {
      issues.push({
        path: `starOverrides.${record.canonicalStarName}`,
        message: "star override record must carry sourceRefs",
      });
    }
  }

  // School domain policy V0.2 — must cover both schools with legal enums.
  const policy = knowledge.schoolDomainPolicy;
  if (!policy || !policy.profiles) {
    issues.push({
      path: "schoolDomainPolicy",
      message: "missing school domain policy catalog",
    });
  } else {
    const allowedCoordinates = new Set(["natal-palace-name", "annual-palace-name"]);
    const allowedFocusModes = new Set(["small-limit", "annual-menh"]);
    for (const school of ["nam-phai", "trung-chau"] as const) {
      const profile = policy.profiles[school];
      if (!profile) {
        issues.push({
          path: `schoolDomainPolicy.profiles.${school}`,
          message: `missing policy profile for ${school}`,
        });
        continue;
      }
      if (!allowedCoordinates.has(profile.domainAnchorCoordinate)) {
        issues.push({
          path: `schoolDomainPolicy.profiles.${school}`,
          message: `invalid domainAnchorCoordinate: ${profile.domainAnchorCoordinate}`,
        });
      }
      if (!allowedFocusModes.has(profile.primaryAnnualFocus)) {
        issues.push({
          path: `schoolDomainPolicy.profiles.${school}`,
          message: `invalid primaryAnnualFocus: ${profile.primaryAnnualFocus}`,
        });
      }
      if (
        typeof profile.domainAnchorProvenance !== "string" ||
        profile.domainAnchorProvenance.length === 0
      ) {
        issues.push({
          path: `schoolDomainPolicy.profiles.${school}`,
          message: "domainAnchorProvenance must be a non-empty string",
        });
      }
    }
    // Nam Phái must use natal-palace-name coordinate; Trung Châu must use
    // annual-palace-name — hard-lock the two known correct pairings so a
    // future edit to the JSON cannot silently swap the resolvers.
    if (
      policy.profiles["nam-phai"] &&
      policy.profiles["nam-phai"].domainAnchorCoordinate !== "natal-palace-name"
    ) {
      issues.push({
        path: "schoolDomainPolicy.profiles.nam-phai",
        message: "nam-phai domainAnchorCoordinate must be natal-palace-name",
      });
    }
    if (
      policy.profiles["trung-chau"] &&
      policy.profiles["trung-chau"].domainAnchorCoordinate !== "annual-palace-name"
    ) {
      issues.push({
        path: "schoolDomainPolicy.profiles.trung-chau",
        message: "trung-chau domainAnchorCoordinate must be annual-palace-name",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
