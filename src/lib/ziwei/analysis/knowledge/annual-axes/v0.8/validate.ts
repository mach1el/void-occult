import type {
  AnnualAxesKnowledgeV08NamPhai,
  AnnualDomainMappingV08,
  AnnualPointClassesV08,
  AnnualStarAliasesV08,
  AnnualStarRegistryV08,
  V08PointClass,
} from "./schema";
import type { AnnualAxisDomainId } from "../schema";

export interface AnnualKnowledgeV08ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

const POINT_CLASSES: V08PointClass[] = [
  "annualTransformStrongPositive",
  "annualTransformPositive",
  "annualTransformNegative",
  "otherAnnualPositive",
  "otherAnnualNegative",
  "staticPositive",
  "staticNegative",
  "dignifiedStaticPositive",
];

function issue(path: string, message: string): AnnualKnowledgeV08ValidationIssue {
  return { path, message };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateMapping(
  mapping: AnnualDomainMappingV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (mapping.formulaVersion !== "v0.8-annual-palace-weighted-score") {
    issues.push(issue("domainMapping.formulaVersion", "must be v0.8-annual-palace-weighted-score"));
  }
  for (const domain of DOMAINS) {
    const entry = mapping.domains[domain];
    if (!entry) {
      issues.push(issue(`domainMapping.domains.${domain}`, "missing"));
      continue;
    }
    const primary = entry.primary;
    if (!isFiniteNumber(primary.weight) || Math.abs(primary.weight - 0.6) > 1e-9) {
      issues.push(issue(`domainMapping.domains.${domain}.primary.weight`, "must equal 0.60"));
    }
    if (primary.type === "annual-palace" && !primary.palace) {
      issues.push(issue(`domainMapping.domains.${domain}.primary.palace`, "required"));
    }
    const coopSum = entry.cooperating.reduce((s, c) => s + (c.weight ?? 0), 0);
    if (Math.abs(coopSum - 0.4) > 1e-9) {
      issues.push(
        issue(`domainMapping.domains.${domain}.cooperating`, "weights must sum to 0.40"),
      );
    }
    const total = primary.weight + coopSum;
    if (Math.abs(total - 1) > 1e-9) {
      issues.push(issue(`domainMapping.domains.${domain}`, "weights must sum to 1.00"));
    }
  }
  for (const sourceId of mapping.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`domainMapping.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validatePointClasses(
  profile: AnnualPointClassesV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  for (const key of POINT_CLASSES) {
    if (!isFiniteNumber(profile.classes[key])) {
      issues.push(issue(`pointClasses.classes.${key}`, "must be a finite number"));
    }
  }
  if (profile.classes.annualTransformStrongPositive !== 3) {
    issues.push(issue("pointClasses.classes.annualTransformStrongPositive", "must be +3"));
  }
  if (profile.classes.annualTransformPositive !== 2) {
    issues.push(issue("pointClasses.classes.annualTransformPositive", "must be +2"));
  }
  if (profile.classes.annualTransformNegative !== -3) {
    issues.push(issue("pointClasses.classes.annualTransformNegative", "must be -3"));
  }
  if (profile.thaiTueMultiplier !== 1.25) {
    issues.push(issue("pointClasses.thaiTueMultiplier", "must be 1.25"));
  }
  if (profile.score.neutral !== 50 || profile.score.pointsPerRawUnit !== 5) {
    issues.push(issue("pointClasses.score", "must use 50 + 5 * raw"));
  }
  if (profile.score.minimum !== 10 || profile.score.maximum !== 90) {
    issues.push(issue("pointClasses.score.bounds", "must clamp to [10, 90]"));
  }
  for (const sourceId of profile.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`pointClasses.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateRegistry(
  registry: AnnualStarRegistryV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  for (const domain of DOMAINS) {
    const axis = registry.axes[domain];
    if (!axis) {
      issues.push(issue(`starRegistry.axes.${domain}`, "missing"));
      continue;
    }
    for (const rule of [...axis.positive, ...axis.negative]) {
      if (!rule.starName || !rule.ruleId || !POINT_CLASSES.includes(rule.pointClass)) {
        issues.push(issue(`starRegistry.axes.${domain}.${rule.ruleId}`, "invalid rule"));
      }
    }
  }
  for (const sourceId of registry.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`starRegistry.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateAliases(
  aliases: AnnualStarAliasesV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  const required = ["KhoiViet", "KinhDa", "KhongKiep", "LongPhuong", "ThaiToa", "QuangQuy"];
  for (const key of required) {
    if (!Array.isArray(aliases.groups[key]) || aliases.groups[key]!.length === 0) {
      issues.push(issue(`starAliases.groups.${key}`, "required non-empty alias group"));
    }
  }
  for (const sourceId of aliases.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`starAliases.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

export function validateAnnualAxesKnowledgeV08NamPhai(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV08ValidationIssue[] } {
  const issues: AnnualKnowledgeV08ValidationIssue[] = [];
  validateMapping(knowledge.domainMapping, resolvedSourceIds, issues);
  validatePointClasses(knowledge.pointClasses, resolvedSourceIds, issues);
  validateRegistry(knowledge.starRegistry, resolvedSourceIds, issues);
  validateAliases(knowledge.starAliases, resolvedSourceIds, issues);
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
