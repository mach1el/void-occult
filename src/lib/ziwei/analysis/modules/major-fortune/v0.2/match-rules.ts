import type { ChartData } from "@/types/chart";
import type { DeepReadonly } from "../../../knowledge/major-fortune-scoring";
import type {
  MajorFortuneV02Knowledge,
  MajorFortuneV02PillarId,
  MajorFortuneV02Rule,
} from "../../../knowledge/major-fortune-scoring/v0.2";
import {
  classifyPrincipalDignityCase,
  isExecutableRule,
  resolveElementRelation,
  setMatches,
  starNamesInFrame,
  type ResolvedMajorFortuneV02Context,
} from "./resolve-context";
import type {
  MajorFortuneV02Contribution,
  MajorFortuneV02Diagnostics,
  MajorFortuneV02ReasonCode,
} from "./types";

export interface StructuralMatch {
  rule: DeepReadonly<MajorFortuneV02Rule> | MajorFortuneV02Rule;
  physicalFactId: string;
  factIds: string[];
}

function matcherKind(rule: DeepReadonly<MajorFortuneV02Rule> | MajorFortuneV02Rule): string {
  return String(rule.matcher.kind ?? "");
}

export function matchRuleStructurally(
  rule: DeepReadonly<MajorFortuneV02Rule> | MajorFortuneV02Rule,
  chart: ChartData,
  ctx: ResolvedMajorFortuneV02Context,
  knowledge: DeepReadonly<MajorFortuneV02Knowledge> | MajorFortuneV02Knowledge,
): StructuralMatch | null {
  if (rule.school !== ctx.school) return null;
  const kind = matcherKind(rule);

  if (kind === "element-relation") {
    const branch = ctx.activePalaceBranch;
    const palaceElement = knowledge.branchElementMap.branchToElement[branch];
    if (!palaceElement) return null;
    const relation = resolveElementRelation(
      palaceElement,
      ctx.menhElement,
      knowledge.branchElementMap.generates as Record<string, string>,
      knowledge.branchElementMap.controls as Record<string, string>,
    );
    if (relation !== rule.matcher.relationId) return null;
    return {
      rule,
      physicalFactId: `element-relation:${branch}:${palaceElement}:${ctx.menhElement}:${relation}`,
      factIds: [`branch:${branch}`, `menhElement:${ctx.menhElement}`],
    };
  }

  if (kind === "thai-tue") {
    if (rule.matcher.mode === "annual-taiTuePalace") return null;
    return null;
  }

  if (kind === "natal-palace-group") {
    const groupId = String(rule.matcher.groupId);
    const group = knowledge.natalPalaceGroups.groups.find((g) => g.groupId === groupId);
    if (!group) return null;
    if (!group.palaceNames.includes(ctx.activeNatalPalaceName)) return null;
    return {
      rule,
      physicalFactId: `natal-group:${groupId}:${ctx.activeNatalPalaceName}`,
      factIds: [`palaceName:${ctx.activeNatalPalaceName}`],
    };
  }

  if (kind === "principal-dignity") {
    const caseId = String(rule.matcher.caseId);
    if (caseId === "tam-khong-exception") return null;
    const stars = ctx.activePalace.stars ?? [];
    const classified = classifyPrincipalDignityCase(stars);
    if (classified !== caseId) return null;
    return {
      rule,
      physicalFactId: `principal-dignity:${caseId}:${ctx.activePalaceIndex}`,
      factIds: stars.map((s) => `star:${s.name}`),
    };
  }

  if (kind === "star-pattern") {
    const stars = (rule.matcher.stars as string[]) ?? [];
    const mode = (rule.matcher.mode as "all" | "any") ?? "all";
    const present = new Set(
      (ctx.activePalace.stars ?? [])
        .filter((s) => (s.source ?? "natal") === "natal")
        .map((s) => s.name),
    );
    if (!setMatches(present, stars, mode)) return null;
    return {
      rule,
      physicalFactId: `star-pattern:${String(rule.matcher.patternId)}:${ctx.activePalaceIndex}`,
      factIds: stars.map((s) => `star:${s}`),
    };
  }

  if (kind === "major-transformation") {
    if (rule.matcher.schoolGate === "nam-phai-forbidden") return null;
    if (!ctx.fortuneStem) return null;
    for (const record of ctx.transformations) {
      if (!record.palace) continue;
      const chartPalace = chart.palaces.find((p) => p.index === record.palace!.index);
      if (!chartPalace) continue;
      const hasStar = (chartPalace.stars ?? []).some((s) => s.name === record.starName);
      if (!hasStar) continue;
      return {
        rule,
        physicalFactId: `transformation:${record.mutagen}:${record.starName}:${record.palace.index}`,
        factIds: [
          `stem:${ctx.fortuneStem}`,
          `mutagen:${record.mutagen}`,
          `star:${record.starName}`,
          `palace:${record.palace.index}`,
        ],
      };
    }
    return null;
  }

  if (kind === "benefic-malefic-set") {
    const stars = (rule.matcher.stars as string[]) ?? [];
    const mode = (rule.matcher.mode as "all" | "any" | "threshold") ?? "all";
    const present = starNamesInFrame(chart, ctx.activePalaceIndex);
    if (!setMatches(present, stars, mode)) return null;
    return {
      rule,
      physicalFactId: `bm-set:${String(rule.matcher.setId)}:${ctx.activePalaceIndex}`,
      factIds: stars.filter((s) => present.has(s)).map((s) => `star:${s}`),
    };
  }

  if (kind === "void-treatment") {
    return null;
  }

  return null;
}

export interface PillarMatchBundle {
  structuralMatches: StructuralMatch[];
  contributions: MajorFortuneV02Contribution[];
  reasonCodes: MajorFortuneV02ReasonCode[];
  mutexViolations: string[];
}

export function collectPillarMatches(
  pillarId: MajorFortuneV02PillarId,
  chart: ChartData,
  ctx: ResolvedMajorFortuneV02Context,
  knowledge: DeepReadonly<MajorFortuneV02Knowledge> | MajorFortuneV02Knowledge,
  diagnostics: MajorFortuneV02Diagnostics,
): PillarMatchBundle {
  const schoolRules = knowledge.rules.rules.filter(
    (r) => r.pillarId === pillarId && r.school === ctx.school,
  );
  const structuralMatches: StructuralMatch[] = [];
  const reasonCodes: MajorFortuneV02ReasonCode[] = [];
  const contributions: MajorFortuneV02Contribution[] = [];
  const mutexBuckets = new Map<string, StructuralMatch[]>();

  for (const rule of schoolRules) {
    const match = matchRuleStructurally(rule, chart, ctx, knowledge);
    if (!match) continue;

    if (
      rule.status === "research-blocked" ||
      rule.status === "blocked-by-annual-independence" ||
      rule.status === "blocked-by-calculation-core"
    ) {
      diagnostics.researchBlockedMatches.push(rule.ruleId);
      if (rule.status === "blocked-by-calculation-core") {
        reasonCodes.push("blocked-by-calculation-core");
        diagnostics.calculationCoreBlockers.push(rule.ruleId);
      } else if (rule.status === "blocked-by-annual-independence") {
        reasonCodes.push("blocked-by-annual-independence");
      } else {
        reasonCodes.push("research-blocked-rule");
      }
      structuralMatches.push(match);
      continue;
    }

    structuralMatches.push(match);
    if (rule.mutualExclusionGroup) {
      const list = mutexBuckets.get(rule.mutualExclusionGroup) ?? [];
      list.push(match);
      mutexBuckets.set(rule.mutualExclusionGroup, list);
    }
  }

  const mutexViolations: string[] = [];
  for (const [group, matches] of mutexBuckets) {
    if (matches.length > 1) {
      mutexViolations.push(`${group}:${matches.map((m) => m.rule.ruleId).join(",")}`);
      diagnostics.mutexViolations.push(`${group}:${matches.map((m) => m.rule.ruleId).join(",")}`);
      reasonCodes.push("mutex-violation");
    }
  }

  for (const match of structuralMatches) {
    const rule = match.rule;
    if (!isExecutableRule(rule as MajorFortuneV02Rule)) continue;
    if (rule.mutualExclusionGroup) {
      const bucket = mutexBuckets.get(rule.mutualExclusionGroup) ?? [];
      if (bucket.length !== 1) continue;
    }

    if (!rule.sourceIds.length || !rule.claimIds.length) {
      diagnostics.missingProvenance.push(rule.ruleId);
      continue;
    }

    contributions.push({
      ruleId: rule.ruleId,
      pillarId,
      rawDelta: rule.rawDelta as number,
      factIds: match.factIds,
      sourceIds: [...rule.sourceIds],
      claimIds: [...rule.claimIds],
      knowledgeStatus: rule.knowledgeStatus,
      physicalFactId: match.physicalFactId,
    });
  }

  const seen = new Set<string>();
  const deduped: MajorFortuneV02Contribution[] = [];
  for (const c of contributions) {
    if (seen.has(c.physicalFactId)) continue;
    seen.add(c.physicalFactId);
    deduped.push(c);
  }

  return {
    structuralMatches,
    contributions: deduped,
    reasonCodes: [...new Set(reasonCodes)],
    mutexViolations,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToDecimals(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
