/**
 * Evaluator declarative cho frame-pattern-rules.json (experimental).
 * Không hard-code tháng/cung/chart id — chỉ rule hits tái sử dụng.
 */

import type { ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { baseStarName, isAnnualStar } from "../star-classification";
import type {
  NamPhaiMonthlyV2Profile,
  PatternEffect,
  PatternRule,
  PatternWhen,
  ScoreAxis,
} from "./profile/nam-phai-monthly-v2";
import { isMutagenStar } from "./util";

export type MonthRole = "focus" | "xung" | "tam-hop";

export interface FrameRow {
  palace: ChartPalace;
  role: MonthRole;
  weight: number;
}

export interface TransformHit {
  starName: string;
  kind: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  layer: "monthly" | "annual" | "natal" | "majorFortune";
  palaceIndex: number;
}

export interface PatternEvalContext {
  frame: FrameRow[];
  focus: ChartPalace;
  transformHits: TransformHit[];
  monthlyFocusEqualsActiveMajorFortunePalace: boolean;
}

export interface PatternHit {
  ruleId: string;
  ruleName: string;
  effects: PatternEffect[];
  reason: string;
}

const LUC_SAT = [
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
];

function majorStarsInFrame(frame: FrameRow[]): Array<{
  name: string;
  brightness?: string;
  palace: ChartPalace;
  role: MonthRole;
  star: ChartStar;
}> {
  const out: Array<{
    name: string;
    brightness?: string;
    palace: ChartPalace;
    role: MonthRole;
    star: ChartStar;
  }> = [];
  for (const row of frame) {
    for (const star of row.palace.stars ?? []) {
      if (isAnnualStar(star) || isMutagenStar(star)) continue;
      if (star.layer !== "major") continue;
      out.push({
        name: baseStarName(star.name),
        brightness: star.brightness,
        palace: row.palace,
        role: row.role,
        star,
      });
    }
  }
  return out;
}

function hasMajor(palace: ChartPalace): boolean {
  return (palace.stars ?? []).some(
    (star) =>
      star.layer === "major" && !isAnnualStar(star) && !isMutagenStar(star),
  );
}

function countBright(
  majors: ReturnType<typeof majorStarsInFrame>,
  allowed: string[],
): number {
  const allow = new Set(allowed);
  return majors.filter((m) => m.brightness && allow.has(m.brightness)).length;
}

function countAfflicted(
  majors: ReturnType<typeof majorStarsInFrame>,
  afflictions: string[],
  ctx: PatternEvalContext,
): number {
  let count = 0;
  for (const major of majors) {
    let hit = false;
    for (const aff of afflictions) {
      if (aff === "Hãm" && major.brightness === "Hãm") hit = true;
      if (aff === "Kỵ") {
        const hasKy = ctx.transformHits.some(
          (t) =>
            t.kind === "Kỵ" &&
            (t.starName === major.name ||
              t.palaceIndex === major.palace.index),
        );
        if (hasKy) hit = true;
      }
      if (aff === "lục-sát-same-palace") {
        const same = (major.palace.stars ?? []).some((s) =>
          LUC_SAT.includes(baseStarName(s.name)),
        );
        if (same) hit = true;
      }
    }
    if (hit) count += 1;
  }
  return count;
}

function matchesWhen(
  when: PatternWhen | undefined,
  ctx: PatternEvalContext,
  majors: ReturnType<typeof majorStarsInFrame>,
): boolean {
  if (!when) return true;

  if (when.focusHasNoMajorStar !== undefined) {
    if (when.focusHasNoMajorStar !== !hasMajor(ctx.focus)) return false;
  }
  if (when.oppositeHasMajorStar !== undefined) {
    const xung = ctx.frame.find((r) => r.role === "xung");
    const oppHas = xung ? hasMajor(xung.palace) : false;
    if (when.oppositeHasMajorStar !== oppHas) return false;
  }
  if (when.monthlyFocusEqualsActiveMajorFortunePalace !== undefined) {
    if (
      when.monthlyFocusEqualsActiveMajorFortunePalace !==
      ctx.monthlyFocusEqualsActiveMajorFortunePalace
    ) {
      return false;
    }
  }
  if (when.brightCountAtLeast !== undefined) {
    const allowed = when.allowedBrightness ?? ["Miếu", "Vượng", "Đắc"];
    if (countBright(majors, allowed) < when.brightCountAtLeast) return false;
  }
  if (when.afflictedMajorCountAtLeast !== undefined) {
    const aff = when.afflictions ?? ["Hãm", "Kỵ"];
    if (countAfflicted(majors, aff, ctx) < when.afflictedMajorCountAtLeast) {
      return false;
    }
  }
  if (when.hasAnyTransform?.length) {
    const kinds = new Set(ctx.transformHits.map((t) => t.kind));
    if (
      !when.hasAnyTransform.some((k) =>
        kinds.has(k as TransformHit["kind"]),
      )
    ) {
      return false;
    }
  }
  if (when.hasTransformsAcrossLayers?.length) {
    const needed = when.hasTransformsAcrossLayers;
    const byStar = new Map<string, Set<string>>();
    for (const hit of ctx.transformHits) {
      const set = byStar.get(hit.starName) ?? new Set();
      set.add(hit.kind);
      byStar.set(hit.starName, set);
    }
    let ok = false;
    for (const kinds of byStar.values()) {
      if (needed.every((k) => kinds.has(k))) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

function frameHasAllStars(
  majors: ReturnType<typeof majorStarsInFrame>,
  names: string[],
): boolean {
  const have = new Set(majors.map((m) => m.name));
  return names.every((n) => have.has(n));
}

function frameHasAtLeast(
  majors: ReturnType<typeof majorStarsInFrame>,
  count: number,
  from: string[],
): boolean {
  const have = new Set(majors.map((m) => m.name));
  let n = 0;
  for (const name of from) if (have.has(name)) n += 1;
  return n >= count;
}

export function evaluateFramePatterns(
  rules: PatternRule[],
  ctx: PatternEvalContext,
): PatternHit[] {
  const majors = majorStarsInFrame(ctx.frame);
  const hits: PatternHit[] = [];

  for (const rule of rules) {
    if (rule.requiresAllStars?.length) {
      if (!frameHasAllStars(majors, rule.requiresAllStars)) continue;
    }
    if (rule.requiresAtLeastStars) {
      if (
        !frameHasAtLeast(
          majors,
          rule.requiresAtLeastStars.count,
          rule.requiresAtLeastStars.from,
        )
      ) {
        continue;
      }
    }
    if (rule.when && !matchesWhen(rule.when, ctx, majors)) continue;

    const effects: PatternEffect[] = [...rule.effects];
    for (const cond of rule.conditionalEffects ?? []) {
      if (matchesWhen(cond.when, ctx, majors)) {
        effects.push(...cond.effects);
      }
    }

    hits.push({
      ruleId: rule.id,
      ruleName: rule.name,
      effects,
      reason: `${rule.name} (${rule.id})`,
    });
  }

  return hits;
}

export function applyAxisEffects(
  hits: PatternHit[],
  add: (axis: ScoreAxis, delta: number, source: string, reason: string) => void,
): {
  borrowOppositeMajors: boolean;
  borrowFactor: number;
  linkedBenefitFactor: number;
  linkedRiskFactor: number;
} {
  let borrowOppositeMajors = false;
  let borrowFactor = 1;
  let linkedBenefitFactor = 1;
  let linkedRiskFactor = 1;

  for (const hit of hits) {
    for (const effect of hit.effects) {
      if ("axis" in effect && effect.axis) {
        add(effect.axis, effect.delta, hit.ruleId, hit.reason);
      } else if ("operation" in effect) {
        if (effect.operation === "borrowMajorStarSignals") {
          borrowOppositeMajors = true;
          borrowFactor = effect.factor ?? 0.65;
        }
        if (effect.operation === "applyLinkedSignalFactors") {
          linkedBenefitFactor *= effect.benefitFactor ?? 1;
          linkedRiskFactor *= effect.riskFactor ?? 1;
        }
      }
    }
  }

  return {
    borrowOppositeMajors,
    borrowFactor,
    linkedBenefitFactor,
    linkedRiskFactor,
  };
}

/** Resolve ĐV mutagens from chart field or stem of active major-fortune palace. */
export function resolveMajorMutagens(
  majorFortunePalace: ChartPalace | null | undefined,
  chartMajorMutagens: MutagenRecord[] | undefined,
  findStarPalace: (starName: string) => ChartPalace | null,
  tuHoaTargets: (stem: string) => Array<{ mutagen: string; starName: string }>,
): MutagenRecord[] {
  if (chartMajorMutagens?.length) return chartMajorMutagens;
  const stem = majorFortunePalace?.stem;
  if (!stem) return [];
  return tuHoaTargets(stem).map(({ mutagen, starName }) => ({
    source: "major-mutagen",
    mutagen,
    starName,
    palace: findStarPalace(starName),
  }));
}

export function patternConfidenceAdjust(
  hits: PatternHit[],
  profile: NamPhaiMonthlyV2Profile,
): number {
  if (!hits.length) return 0;
  return -profile.confidence.experimentalRulePenalty * Math.min(hits.length, 3);
}
