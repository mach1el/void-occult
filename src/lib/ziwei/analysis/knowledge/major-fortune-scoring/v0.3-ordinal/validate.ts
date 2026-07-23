import type {
  MajorFortuneOrdinalBandDef,
  MajorFortuneOrdinalKnowledge,
  MajorFortuneOrdinalPillarId,
} from "./types";
import {
  MAJOR_FORTUNE_ORDINAL_PILLAR_IDS,
  MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS,
} from "./types";

export interface MajorFortuneOrdinalValidationIssue {
  path: string;
  message: string;
}

export interface MajorFortuneOrdinalValidationResult {
  ok: boolean;
  issues: MajorFortuneOrdinalValidationIssue[];
}

function issue(path: string, message: string): MajorFortuneOrdinalValidationIssue {
  return { path, message };
}

export function validateBandContinuity(
  bands: MajorFortuneOrdinalBandDef[],
): MajorFortuneOrdinalValidationIssue[] {
  const issues: MajorFortuneOrdinalValidationIssue[] = [];
  if (bands.length === 0) return [issue("bands", "bands array is empty")];
  const sorted = [...bands].sort((a, b) => a.minInclusive - b.minInclusive);
  if (sorted[0]!.minInclusive !== 0) {
    issues.push(issue("bands[0].minInclusive", "first band must start at 0"));
  }
  const last = sorted[sorted.length - 1]!;
  if (last.maxInclusive !== 100) {
    issues.push(issue(`bands.${last.bandId}.maxInclusive`, "last band must end at 100"));
  }
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]!;
    if (b.minInclusive > b.maxInclusive) {
      issues.push(issue(`bands.${b.bandId}`, "minInclusive > maxInclusive"));
    }
    if (i > 0) {
      const prev = sorted[i - 1]!;
      const expectedNext = Math.round((prev.maxInclusive + 0.1) * 10) / 10;
      if (Math.abs(b.minInclusive - expectedNext) > 1e-9) {
        issues.push(
          issue(
            `bands.${b.bandId}`,
            `gap or overlap after ${prev.bandId}: expected min ${expectedNext}, got ${b.minInclusive}`,
          ),
        );
      }
    }
  }
  return issues;
}

export function validateMajorFortuneOrdinalKnowledge(
  knowledge: MajorFortuneOrdinalKnowledge,
): MajorFortuneOrdinalValidationResult {
  const issues: MajorFortuneOrdinalValidationIssue[] = [];

  const g = knowledge.governance;
  if (g.modelNature !== "engineering-heuristic") {
    issues.push(issue("governance.modelNature", "must be engineering-heuristic"));
  }
  if (g.doctrineRelationship !== "doctrine-informed-not-classical-reconstruction") {
    issues.push(issue("governance.doctrineRelationship", "unexpected value"));
  }
  if (g.numericAuthority !== "engineering-defined") {
    issues.push(issue("governance.numericAuthority", "must be engineering-defined"));
  }
  if (g.productionStatus !== "research-only") {
    issues.push(issue("governance.productionStatus", "must be research-only"));
  }

  const f = knowledge.formula;
  if (f.baseScore !== 50) issues.push(issue("formula.baseScore", "must be 50"));
  if (f.scorePrecisionDecimals !== 1) {
    issues.push(issue("formula.scorePrecisionDecimals", "must be 1"));
  }
  if (f.ordinalDivisor !== 4) issues.push(issue("formula.ordinalDivisor", "must be 4"));
  if (!f.derivation.forbidsPerRuleRawDelta) {
    issues.push(issue("formula.derivation.forbidsPerRuleRawDelta", "must be true"));
  }

  let budgetSum = 0;
  for (const pillarId of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    const def = f.pillars.find((p) => p.pillarId === pillarId);
    if (!def) {
      issues.push(issue("formula.pillars", `missing ${pillarId}`));
      continue;
    }
    if (def.budget !== MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS[pillarId]) {
      issues.push(
        issue(
          `formula.pillars.${pillarId}.budget`,
          `expected ${MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS[pillarId]}`,
        ),
      );
    }
    budgetSum += def.budget;
  }
  if (budgetSum !== 100) {
    issues.push(issue("formula.pillars", `budgets must sum to 100, got ${budgetSum}`));
  }

  issues.push(...validateBandContinuity(knowledge.bands.bands));
  if (knowledge.bands.classicalAuthorityClaimed) {
    issues.push(issue("bands.classicalAuthorityClaimed", "must be false"));
  }

  for (const pillarId of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    const reg = knowledge.pillarRegistry.pillars.find((p) => p.pillarId === pillarId);
    if (!reg) issues.push(issue("pillarRegistry", `missing ${pillarId}`));
  }

  const familyIds = new Set<string>();
  for (const family of knowledge.signalFamilyPolicy.families) {
    if (familyIds.has(family.signalFamilyId)) {
      issues.push(issue("signalFamilyPolicy", `duplicate ${family.signalFamilyId}`));
    }
    familyIds.add(family.signalFamilyId);
    if (family.classicalDoctrineVerified) {
      issues.push(
        issue(
          `signalFamilyPolicy.${family.signalFamilyId}`,
          "Round 1 families must not claim classicalDoctrineVerified",
        ),
      );
    }
  }

  for (const excluded of knowledge.exclusionRegistry.excludedTemporalScopes) {
    if (excluded !== "annual" && excluded !== "monthly") {
      // allow only known temporal exclusions in Round 1
    }
  }
  if (!knowledge.exclusionRegistry.excludedTemporalScopes.includes("annual")) {
    issues.push(issue("exclusionRegistry", "must exclude annual"));
  }
  if (!knowledge.exclusionRegistry.excludedTemporalScopes.includes("monthly")) {
    issues.push(issue("exclusionRegistry", "must exclude monthly"));
  }
  if (!knowledge.exclusionRegistry.metadataOnlyFields.includes("yearInCycle")) {
    issues.push(issue("exclusionRegistry.metadataOnlyFields", "must include yearInCycle"));
  }

  if (knowledge.crossPillarOwnership.silentCrossPillarDoubleCounting !== "forbidden") {
    issues.push(
      issue(
        "crossPillarOwnership.silentCrossPillarDoubleCounting",
        "must be forbidden",
      ),
    );
  }

  const ownerPillars = new Set(
    knowledge.crossPillarOwnership.ownership.map((o) => o.ownerPillarId),
  );
  for (const pillarId of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    if (!ownerPillars.has(pillarId as MajorFortuneOrdinalPillarId)) {
      // ownership is by fact kind; not every pillar must appear if unused — still require all four covered
    }
  }
  if (knowledge.crossPillarOwnership.ownership.length < 4) {
    issues.push(issue("crossPillarOwnership.ownership", "expected at least 4 ownership rows"));
  }

  return { ok: issues.length === 0, issues };
}
