import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV08NamPhai,
  V08DomainPalaceInput,
} from "../../../knowledge/annual-axes/v0.8";
import { V08_FORMULA_VERSION } from "../../../knowledge/annual-axes/v0.8";
import {
  resolveAnnualPalace,
  resolveSmallLimitPalace,
  type ResolvedAnnualPalace,
} from "./resolve-annual-palace";
import {
  clampPalaceRaw,
  matchPalaceStars,
  type MatchedStarFact,
} from "./match-stars";

export type V08ScoreState =
  | "scored"
  | "no-signal"
  | "balanced-signal"
  | "partial-data";

export interface V08PalaceContributionTrace {
  role: string;
  palaceName: string;
  palaceIndex: number | null;
  configuredWeight: number;
  positivePoints: number;
  negativePoints: number;
  palaceRaw: number;
  matchedFacts: MatchedStarFact[];
  missingReason?: string;
}

export interface V08DomainScoreTrace {
  formulaVersion: typeof V08_FORMULA_VERSION;
  primary: V08PalaceContributionTrace;
  cooperating: V08PalaceContributionTrace[];
  axisRawBeforeThaiTue: number;
  isThaiTueHighlighted: boolean;
  thaiTueMultiplier: number;
  prominenceAdjustedRaw: number;
  rawScore: number;
  absoluteScore: number;
  scoreState: V08ScoreState;
  configuredPalaceCount: number;
  resolvedPalaceCount: number;
  matchedStarCount: number;
  missingInputs: string[];
}

export interface V08DomainScoreResult {
  score: number;
  scoreState: V08ScoreState;
  intensity: number;
  conflict: number;
  supportNorm: number;
  pressureNorm: number;
  isThaiTueHighlighted: boolean;
  matchedFacts: MatchedStarFact[];
  trace: V08DomainScoreTrace;
}

function roundToPrecision(value: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function resolveInput(
  chart: ChartData,
  input: V08DomainPalaceInput,
): { ok: true; palace: ResolvedAnnualPalace } | { ok: false; reason: string } {
  if (input.type === "small-limit-palace") {
    return resolveSmallLimitPalace(chart);
  }
  if (!input.palace) {
    return { ok: false, reason: "missing-palace-config" };
  }
  return resolveAnnualPalace(chart, input.palace);
}

function scoreResolvedPalace(
  chart: ChartData,
  palace: ResolvedAnnualPalace,
  domain: AnnualAxisDomain,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): {
  positivePoints: number;
  negativePoints: number;
  palaceRaw: number;
  matchedFacts: MatchedStarFact[];
} {
  const matched = matchPalaceStars({
    chart,
    palaceIndex: palace.palaceIndex,
    annualPalaceName: palace.annualPalaceName,
    domain,
    knowledge,
  });
  const palaceRaw = clampPalaceRaw(
    matched.positivePoints,
    matched.negativePoints,
    knowledge,
  );
  return {
    positivePoints: matched.positivePoints,
    negativePoints: matched.negativePoints,
    palaceRaw,
    matchedFacts: matched.matchedFacts,
  };
}

function isThaiTueInPalace(chart: ChartData, palaceIndex: number): boolean {
  if (chart.taiTuePalace?.index === palaceIndex) return true;
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  return (palace?.stars ?? []).some(
    (s) => s.name === "Lưu Thái Tuế" || s.name === "Thái Tuế",
  );
}

/**
 * Score one domain with the explicit palace-weighted V0.8 formula.
 * Same physical palace used in multiple roles is scored once; weights combine.
 */
export function scoreV08Domain(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV08NamPhai;
}): V08DomainScoreResult {
  const { chart, domain, knowledge } = input;
  const mapping = knowledge.domainMapping.domains[domain];
  const pc = knowledge.pointClasses;

  const configuredInputs: Array<V08DomainPalaceInput & { role: string; isPrimary: boolean }> = [
    {
      ...mapping.primary,
      role: mapping.primary.role ?? "primary",
      isPrimary: true,
    },
    ...mapping.cooperating.map((c, i) => ({
      ...c,
      role: c.role ?? `cooperating-${i}`,
      isPrimary: false,
    })),
  ];

  const missingInputs: string[] = [];
  /** physical palace index → accumulated weight + role traces */
  const byPhysical = new Map<
    number,
    {
      weight: number;
      palace: ResolvedAnnualPalace;
      roles: Array<{ role: string; weight: number; isPrimary: boolean; palaceName: string }>;
    }
  >();

  const unresolvedRoles: V08PalaceContributionTrace[] = [];
  let primaryTracePlaceholder: V08PalaceContributionTrace | null = null;

  for (const cfg of configuredInputs) {
    const resolved = resolveInput(chart, cfg);
    const palaceName =
      cfg.type === "small-limit-palace"
        ? "Tiểu Hạn"
        : (cfg.palace ?? "unknown");

    if (!resolved.ok) {
      missingInputs.push(resolved.reason);
      const empty: V08PalaceContributionTrace = {
        role: cfg.role,
        palaceName,
        palaceIndex: null,
        configuredWeight: cfg.weight,
        positivePoints: 0,
        negativePoints: 0,
        palaceRaw: 0,
        matchedFacts: [],
        missingReason: resolved.reason,
      };
      if (cfg.isPrimary) primaryTracePlaceholder = empty;
      else unresolvedRoles.push(empty);
      continue;
    }

    const existing = byPhysical.get(resolved.palace.palaceIndex);
    if (existing) {
      existing.weight += cfg.weight;
      existing.roles.push({
        role: cfg.role,
        weight: cfg.weight,
        isPrimary: cfg.isPrimary,
        palaceName:
          cfg.type === "small-limit-palace"
            ? `Tiểu Hạn (${resolved.palace.annualPalaceName})`
            : resolved.palace.annualPalaceName,
      });
    } else {
      byPhysical.set(resolved.palace.palaceIndex, {
        weight: cfg.weight,
        palace: resolved.palace,
        roles: [
          {
            role: cfg.role,
            weight: cfg.weight,
            isPrimary: cfg.isPrimary,
            palaceName:
              cfg.type === "small-limit-palace"
                ? `Tiểu Hạn (${resolved.palace.annualPalaceName})`
                : resolved.palace.annualPalaceName,
          },
        ],
      });
    }
  }

  // Score each unique physical palace once.
  const scoredPalaces = new Map<
    number,
    {
      positivePoints: number;
      negativePoints: number;
      palaceRaw: number;
      matchedFacts: MatchedStarFact[];
      weight: number;
      palace: ResolvedAnnualPalace;
      roles: Array<{ role: string; weight: number; isPrimary: boolean; palaceName: string }>;
    }
  >();

  for (const [index, entry] of byPhysical) {
    const scored = scoreResolvedPalace(chart, entry.palace, domain, knowledge);
    scoredPalaces.set(index, { ...entry, ...scored });
  }

  let axisRaw = 0;
  const allFacts: MatchedStarFact[] = [];
  for (const scored of scoredPalaces.values()) {
    axisRaw += scored.weight * scored.palaceRaw;
    allFacts.push(...scored.matchedFacts);
  }

  const mappedIndexes = [...scoredPalaces.keys()];
  const isThaiTueHighlighted = mappedIndexes.some((i) => isThaiTueInPalace(chart, i));
  const thaiTueMultiplier = isThaiTueHighlighted
    ? pc.thaiTueMultiplier
    : pc.thaiTueNeutralMultiplier;

  const prominenceAdjustedRaw = clamp(
    axisRaw * thaiTueMultiplier,
    pc.axisRawClamp.minimum,
    pc.axisRawClamp.maximum,
  );

  const rawScore = pc.score.neutral + pc.score.pointsPerRawUnit * prominenceAdjustedRaw;
  const absoluteScore = roundToPrecision(
    clamp(rawScore, pc.score.minimum, pc.score.maximum),
    pc.score.precision,
  );

  const matchedStarCount = allFacts.length;
  const configuredPalaceCount = configuredInputs.length;
  const resolvedPalaceCount = byPhysical.size;
  const hasPartial = missingInputs.length > 0;

  let scoreState: V08ScoreState;
  if (matchedStarCount === 0 && prominenceAdjustedRaw === 0) {
    scoreState = hasPartial ? "partial-data" : "no-signal";
  } else if (prominenceAdjustedRaw === 0) {
    scoreState = hasPartial ? "partial-data" : "balanced-signal";
  } else if (hasPartial) {
    scoreState = "partial-data";
  } else {
    scoreState = "scored";
  }

  // Build primary / cooperating traces for UI (split combined weights back per role).
  let primaryTrace: V08PalaceContributionTrace =
    primaryTracePlaceholder ??
    ({
      role: "primary",
      palaceName: mapping.primary.palace ?? "primary",
      palaceIndex: null,
      configuredWeight: mapping.primary.weight,
      positivePoints: 0,
      negativePoints: 0,
      palaceRaw: 0,
      matchedFacts: [],
    } as V08PalaceContributionTrace);

  const cooperatingTraces: V08PalaceContributionTrace[] = [...unresolvedRoles];

  for (const scored of scoredPalaces.values()) {
    for (const role of scored.roles) {
      const trace: V08PalaceContributionTrace = {
        role: role.role,
        palaceName: role.palaceName,
        palaceIndex: scored.palace.palaceIndex,
        configuredWeight: role.weight,
        positivePoints: scored.positivePoints,
        negativePoints: scored.negativePoints,
        palaceRaw: scored.palaceRaw,
        matchedFacts: scored.matchedFacts,
      };
      if (role.isPrimary) primaryTrace = trace;
      else cooperatingTraces.push(trace);
    }
  }

  cooperatingTraces.sort((a, b) => a.role.localeCompare(b.role));

  const posAbs = allFacts
    .filter((f) => f.polarity === "positive")
    .reduce((s, f) => s + f.points, 0);
  const negAbs = allFacts
    .filter((f) => f.polarity === "negative")
    .reduce((s, f) => s + Math.abs(f.points), 0);
  const supportNorm = clamp(posAbs / 8, 0, 1);
  const pressureNorm = clamp(negAbs / 8, 0, 1);

  const trace: V08DomainScoreTrace = {
    formulaVersion: V08_FORMULA_VERSION,
    primary: primaryTrace,
    cooperating: cooperatingTraces,
    axisRawBeforeThaiTue: axisRaw,
    isThaiTueHighlighted,
    thaiTueMultiplier,
    prominenceAdjustedRaw,
    rawScore,
    absoluteScore,
    scoreState,
    configuredPalaceCount,
    resolvedPalaceCount,
    matchedStarCount,
    missingInputs: [...missingInputs].sort((a, b) => a.localeCompare(b)),
  };

  return {
    score: absoluteScore,
    scoreState,
    intensity: Math.round(100 * supportNorm),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm)),
    supportNorm,
    pressureNorm,
    isThaiTueHighlighted,
    matchedFacts: allFacts,
    trace,
  };
}
