import type {
  MajorFortuneV02BandDef,
  MajorFortuneV02Knowledge,
  MajorFortuneV02PillarId,
  MajorFortuneV02Rule,
} from "./types";

export interface MajorFortuneV02ValidationIssue {
  path: string;
  message: string;
}

export interface MajorFortuneV02ValidationResult {
  ok: boolean;
  issues: MajorFortuneV02ValidationIssue[];
}

const PILLAR_IDS: MajorFortuneV02PillarId[] = [
  "thien-thoi",
  "dia-loi",
  "nhan-hoa",
  "tu-hoa-sat-tinh",
];

const REQUIRED_CAPS: Record<MajorFortuneV02PillarId, number> = {
  "thien-thoi": 30,
  "dia-loi": 25,
  "nhan-hoa": 20,
  "tu-hoa-sat-tinh": 25,
};

function issue(path: string, message: string): MajorFortuneV02ValidationIssue {
  return { path, message };
}

export function validateBandContinuity(bands: MajorFortuneV02BandDef[]): MajorFortuneV02ValidationIssue[] {
  const issues: MajorFortuneV02ValidationIssue[] = [];
  if (bands.length === 0) {
    return [issue("bands", "bands array is empty")];
  }
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

export function validateNatalPalaceGroupCoverage(
  groups: Array<{ groupId: string; palaceNames: string[] }>,
): MajorFortuneV02ValidationIssue[] {
  const issues: MajorFortuneV02ValidationIssue[] = [];
  const seen = new Map<string, string>();
  for (const g of groups) {
    for (const name of g.palaceNames) {
      const prev = seen.get(name);
      if (prev) {
        issues.push(issue(`natalPalaceGroups.${g.groupId}`, `palace ${name} also in ${prev}`));
      } else {
        seen.set(name, g.groupId);
      }
    }
  }
  if (seen.size !== 12) {
    issues.push(issue("natalPalaceGroups", `expected 12 unique palaces, got ${seen.size}`));
  }
  return issues;
}

function validateRule(rule: MajorFortuneV02Rule, index: number): MajorFortuneV02ValidationIssue[] {
  const issues: MajorFortuneV02ValidationIssue[] = [];
  const base = `rules[${index}]`;
  if (!rule.ruleId) issues.push(issue(`${base}.ruleId`, "missing"));
  if (!PILLAR_IDS.includes(rule.pillarId)) {
    issues.push(issue(`${base}.pillarId`, `unknown pillar ${rule.pillarId}`));
  }
  if (!rule.sourceIds?.length) issues.push(issue(`${base}.sourceIds`, "empty"));
  if (!rule.claimIds?.length) issues.push(issue(`${base}.claimIds`, "empty"));
  if (rule.status === "executable") {
    if (rule.rawDelta == null || !Number.isFinite(rule.rawDelta)) {
      issues.push(issue(`${base}.rawDelta`, "executable rules require finite rawDelta"));
    }
  }
  if (rule.knowledgeStatus === "approved" && rule.status === "research-blocked") {
    issues.push(issue(`${base}`, "research-blocked rule cannot be knowledgeStatus approved"));
  }
  return issues;
}

export function validateMajorFortuneKnowledgeV02(
  knowledge: MajorFortuneV02Knowledge,
): MajorFortuneV02ValidationResult {
  const issues: MajorFortuneV02ValidationIssue[] = [];

  if (knowledge.formula.baseScore !== 50) {
    issues.push(issue("formula.baseScore", "must be 50"));
  }
  if (knowledge.formula.scorePrecisionDecimals !== 1) {
    issues.push(issue("formula.scorePrecisionDecimals", "must be 1"));
  }

  for (const pillarId of PILLAR_IDS) {
    const def = knowledge.formula.pillars.find((p) => p.pillarId === pillarId);
    if (!def) {
      issues.push(issue("formula.pillars", `missing ${pillarId}`));
      continue;
    }
    if (def.cap !== REQUIRED_CAPS[pillarId]) {
      issues.push(issue(`formula.pillars.${pillarId}.cap`, `expected ${REQUIRED_CAPS[pillarId]}`));
    }
  }

  issues.push(...validateBandContinuity(knowledge.bands.bands));
  issues.push(...validateNatalPalaceGroupCoverage(knowledge.natalPalaceGroups.groups));

  const branches = Object.keys(knowledge.branchElementMap.branchToElement);
  if (branches.length < 12) {
    issues.push(issue("branchElementMap", "must cover at least 12 branches"));
  }
  for (const [branch, element] of Object.entries(knowledge.branchElementMap.branchToElement)) {
    if (!knowledge.branchElementMap.elements.includes(element)) {
      issues.push(issue(`branchElementMap.${branch}`, `unknown element ${element}`));
    }
  }

  knowledge.rules.rules.forEach((rule, i) => issues.push(...validateRule(rule, i)));

  const ruleIds = new Set<string>();
  for (const rule of knowledge.rules.rules) {
    if (ruleIds.has(rule.ruleId)) {
      issues.push(issue("rules", `duplicate ruleId ${rule.ruleId}`));
    }
    ruleIds.add(rule.ruleId);
  }

  return { ok: issues.length === 0, issues };
}
