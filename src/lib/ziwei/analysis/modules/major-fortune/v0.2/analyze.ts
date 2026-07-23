import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import {
  loadMajorFortuneKnowledgeV02,
  type MajorFortuneV02BandId,
  type MajorFortuneV02PillarId,
} from "../../../knowledge/major-fortune-scoring/v0.2";
import { classifyMajorFortuneV02ScoreState } from "./classify-score-state";
import { clamp, collectPillarMatches, roundToDecimals } from "./match-rules";
import { resolveMajorFortuneV02Context } from "./resolve-context";
import {
  emptyMajorFortuneV02Diagnostics,
  type MajorFortuneV02PillarResult,
  type MajorFortuneV02Result,
} from "./types";

const PILLAR_ORDER: MajorFortuneV02PillarId[] = [
  "thien-thoi",
  "dia-loi",
  "nhan-hoa",
  "tu-hoa-sat-tinh",
];

function bandForScore(
  score: number,
  bands: Array<{ bandId: MajorFortuneV02BandId; minInclusive: number; maxInclusive: number }>,
): MajorFortuneV02BandId | null {
  for (const b of bands) {
    if (score >= b.minInclusive && score <= b.maxInclusive) return b.bandId;
  }
  return null;
}

function emptyPillar(cap: number): MajorFortuneV02PillarResult {
  return {
    cap,
    rawDelta: 0,
    cappedDelta: 0,
    status: "unavailable",
    contributions: [],
    reasonCodes: ["invalid-knowledge"],
    matchedStructuralRuleIds: [],
  };
}

export interface AnalyzeMajorFortuneV02Options {
  school: ZiweiSchool;
  /** Entry/core/exit metadata only — must not affect numerics. */
  yearInCycle?: number;
}

/**
 * Candidate Major Fortune V0.2 four-pillar scorer.
 * Isolated from V0.1; not wired to production routing or UI.
 */
export function analyzeMajorFortuneV02(
  chart: ChartData,
  options: AnalyzeMajorFortuneV02Options,
): MajorFortuneV02Result {
  void options.yearInCycle; // metadata only — intentionally unused for numerics
  const diagnostics = emptyMajorFortuneV02Diagnostics();
  const loaded = loadMajorFortuneKnowledgeV02();

  const unavailableVersions = {
    contractVersion: "0.2.0",
    engineVersion: "0.2.0-candidate",
    knowledgeVersion: "unavailable",
    formulaVersion: "unavailable",
    calculationPolicyProfileVersion: null as string | null,
  };

  if (!loaded.ok) {
    diagnostics.invalidKnowledge.push(...loaded.issues.map((i) => `${i.path}:${i.message}`));
    const pillars = Object.fromEntries(
      PILLAR_ORDER.map((id) => [id, emptyPillar(0)]),
    ) as MajorFortuneV02Result["pillars"];
    return {
      module: "major-fortune",
      school: options.school,
      status: "unavailable",
      cycle: null,
      score: null,
      band: null,
      scoreState: "unavailable",
      pillars,
      natalResilience: {
        state: null,
        numericEffect: null,
        factIds: [],
        supportingFacts: [],
        blockingFacts: [],
      },
      versions: unavailableVersions,
      diagnostics,
      trace: {
        preClampScore: null,
        pillarRaws: {
          "thien-thoi": 0,
          "dia-loi": 0,
          "nhan-hoa": 0,
          "tu-hoa-sat-tinh": 0,
        },
        pillarCapped: {
          "thien-thoi": 0,
          "dia-loi": 0,
          "nhan-hoa": 0,
          "tu-hoa-sat-tinh": 0,
        },
      },
    };
  }

  const knowledge = loaded.knowledge;
  const versions = {
    contractVersion: knowledge.manifest.contractVersion,
    engineVersion: knowledge.manifest.engineVersion,
    knowledgeVersion: knowledge.manifest.knowledgeVersion,
    formulaVersion: knowledge.manifest.formulaVersion,
    calculationPolicyProfileVersion: null as string | null,
  };

  const ctx = resolveMajorFortuneV02Context(chart, options.school, knowledge, diagnostics);
  if (!ctx) {
    const pillars = Object.fromEntries(
      knowledge.formula.pillars.map((p) => [
        p.pillarId,
        {
          cap: p.cap,
          rawDelta: 0,
          cappedDelta: 0,
          status: "unavailable" as const,
          contributions: [],
          reasonCodes: diagnostics.noActiveMajorFortune.length
            ? (["no-active-major-fortune"] as const)
            : (["invalid-resolved-context"] as const),
          matchedStructuralRuleIds: [],
        },
      ]),
    ) as unknown as MajorFortuneV02Result["pillars"];

    return {
      module: "major-fortune",
      school: options.school,
      status: "unavailable",
      cycle: null,
      score: null,
      band: null,
      scoreState: "unavailable",
      pillars,
      natalResilience: {
        state: null,
        numericEffect: null,
        factIds: [],
        supportingFacts: [],
        blockingFacts: [],
      },
      versions,
      diagnostics,
      trace: {
        preClampScore: null,
        pillarRaws: {
          "thien-thoi": 0,
          "dia-loi": 0,
          "nhan-hoa": 0,
          "tu-hoa-sat-tinh": 0,
        },
        pillarCapped: {
          "thien-thoi": 0,
          "dia-loi": 0,
          "nhan-hoa": 0,
          "tu-hoa-sat-tinh": 0,
        },
      },
    };
  }

  const pillars = {} as MajorFortuneV02Result["pillars"];
  const pillarRaws = {} as Record<MajorFortuneV02PillarId, number>;
  const pillarCapped = {} as Record<MajorFortuneV02PillarId, number>;
  let executableContributionCount = 0;
  let hasPartial = false;

  for (const pillarDef of knowledge.formula.pillars) {
    const bundle = collectPillarMatches(pillarDef.pillarId, chart, ctx, knowledge, diagnostics);
    const raw = bundle.contributions.reduce((sum, c) => sum + c.rawDelta, 0);
    const capped = clamp(raw, -pillarDef.cap, pillarDef.cap);
    if (Math.abs(capped) - Math.abs(raw) > 1e-12 || Math.abs(raw) > pillarDef.cap + 1e-12) {
      // clipping occurred — still valid; capped already applied
    }
    const clipped = clamp(raw, -pillarDef.cap, pillarDef.cap);
    if (Math.abs(raw) > pillarDef.cap + 1e-12 && Math.abs(clipped) > pillarDef.cap + 1e-9) {
      throw new Error(`pillar ${pillarDef.pillarId} exceeded cap after clamp`);
    }

    executableContributionCount += bundle.contributions.length;
    const blockedOnly =
      bundle.contributions.length === 0 && bundle.structuralMatches.length > 0;
    if (blockedOnly) hasPartial = true;

    let status: MajorFortuneV02PillarResult["status"] = "available";
    if (bundle.mutexViolations.length > 0) status = "unavailable";
    else if (blockedOnly) status = "partial";
    else if (bundle.contributions.length === 0 && bundle.structuralMatches.length === 0) {
      status = "available"; // neutral / no-signal for this pillar
    }

    pillars[pillarDef.pillarId] = {
      cap: pillarDef.cap,
      rawDelta: roundToDecimals(raw, knowledge.formula.scorePrecisionDecimals),
      cappedDelta: roundToDecimals(clipped, knowledge.formula.scorePrecisionDecimals),
      status,
      contributions: bundle.contributions,
      reasonCodes: bundle.reasonCodes,
      matchedStructuralRuleIds: bundle.structuralMatches.map((m) => m.rule.ruleId),
    };
    pillarRaws[pillarDef.pillarId] = pillars[pillarDef.pillarId].rawDelta;
    pillarCapped[pillarDef.pillarId] = pillars[pillarDef.pillarId].cappedDelta;

    if (Math.abs(pillars[pillarDef.pillarId].cappedDelta) > pillarDef.cap + 1e-9) {
      throw new Error(`pillar ${pillarDef.pillarId} cappedDelta exceeds cap`);
    }
  }

  const sumCapped = PILLAR_ORDER.reduce((s, id) => s + pillarCapped[id], 0);
  const preClamp = knowledge.formula.baseScore + sumCapped;
  const score = roundToDecimals(
    clamp(preClamp, 0, 100),
    knowledge.formula.scorePrecisionDecimals,
  );
  const band = bandForScore(score, [
    ...knowledge.bands.bands,
  ] as Array<{
    bandId: MajorFortuneV02BandId;
    minInclusive: number;
    maxInclusive: number;
  }>);

  const totalRawAbs = PILLAR_ORDER.reduce((s, id) => s + Math.abs(pillarRaws[id]), 0);
  const scoreState = classifyMajorFortuneV02ScoreState({
    matchedExecutableContributionCount: executableContributionCount,
    totalRawAbs,
    hasPartialData: hasPartial,
    unavailable: false,
  });

  const moduleStatus: MajorFortuneV02Result["status"] = hasPartial
    ? "partial"
    : "available";

  return {
    module: "major-fortune",
    school: options.school,
    status: moduleStatus,
    cycle: {
      cycleIndex: ctx.cycleIndex,
      startAge: ctx.startAge,
      endAge: ctx.endAge,
      activePalaceIndex: ctx.activePalaceIndex,
    },
    score,
    band,
    scoreState,
    pillars,
    natalResilience: {
      state: "unevaluated",
      numericEffect: null,
      factIds: [],
      supportingFacts: [],
      blockingFacts: [],
    },
    versions,
    diagnostics,
    trace: {
      preClampScore: roundToDecimals(preClamp, knowledge.formula.scorePrecisionDecimals),
      pillarRaws,
      pillarCapped,
    },
  };
}
