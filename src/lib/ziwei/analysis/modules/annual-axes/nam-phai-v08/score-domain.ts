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
import { normalizeStarIdentity } from "./star-identity";
import {
  classifyV08ScoreState,
  type V08ScoreState,
} from "./classify-score-state";

export type { V08ScoreState };

export type V08AxisAvailability = "available" | "partial-data" | "unavailable";

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
  rolesSharingPalace?: string[];
}

export interface V08Coverage {
  resolvedWeight: number;
  totalWeight: number;
  missingPalaces: string[];
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
  absoluteScore: number | null;
  scoreState: V08ScoreState;
  availability: V08AxisAvailability;
  coverage: V08Coverage;
  configuredPalaceCount: number;
  resolvedPalaceCount: number;
  matchedStarCount: number;
  missingInputs: string[];
  missingPrimaryReason?: string;
}

export interface V08DomainScoreResult {
  score: number | null;
  availability: V08AxisAvailability;
  scoreState: V08ScoreState;
  intensity: number;
  conflict: number;
  supportNorm: number;
  pressureNorm: number;
  isThaiTueHighlighted: boolean;
  matchedFacts: MatchedStarFact[];
  coverage: V08Coverage;
  missingReasonCodes: string[];
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
  palaceRole: "primary" | "cooperating" | "small-limit",
  palaceWeight: number,
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
    palaceRole,
    palaceWeight,
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

/**
 * Lưu Thái Tuế prominence only:
 * 1) authoritative annual Thái Tuế palace pointer, or
 * 2) a star exactly identified as Lưu Thái Tuế with annual temporal source.
 * Bare natal "Thái Tuế" never activates the multiplier.
 */
export function isLuuThaiTueInPalace(chart: ChartData, palaceIndex: number): boolean {
  if (chart.taiTuePalace?.index === palaceIndex) return true;
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  return (palace?.stars ?? []).some((s) => {
    const identity = normalizeStarIdentity(s);
    return (
      identity.exactCanonicalName === "Lưu Thái Tuế" &&
      identity.temporalLayer === "annual"
    );
  });
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

  const configuredInputs: Array<
    V08DomainPalaceInput & { role: string; isPrimary: boolean }
  > = [
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

  const totalWeight = configuredInputs.reduce((s, c) => s + c.weight, 0);
  const missingInputs: string[] = [];
  const missingPalaces: string[] = [];
  let primaryMissingReason: string | undefined;
  let primaryResolved = false;
  let resolvedWeight = 0;

  const byPhysical = new Map<
    number,
    {
      weight: number;
      palace: ResolvedAnnualPalace;
      roles: Array<{
        role: string;
        weight: number;
        isPrimary: boolean;
        palaceName: string;
        inputType: V08DomainPalaceInput["type"];
      }>;
    }
  >();

  const unresolvedRoles: V08PalaceContributionTrace[] = [];
  let primaryTracePlaceholder: V08PalaceContributionTrace | null = null;

  for (const cfg of configuredInputs) {
    const resolved = resolveInput(chart, cfg);
    const palaceName =
      cfg.type === "small-limit-palace" ? "Tiểu Hạn" : (cfg.palace ?? "unknown");

    if (!resolved.ok) {
      missingInputs.push(resolved.reason);
      missingPalaces.push(palaceName);
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
      if (cfg.isPrimary) {
        primaryTracePlaceholder = empty;
        primaryMissingReason = resolved.reason;
      } else {
        unresolvedRoles.push(empty);
      }
      continue;
    }

    if (cfg.isPrimary) primaryResolved = true;
    resolvedWeight += cfg.weight;

    const existing = byPhysical.get(resolved.palace.palaceIndex);
    const roleEntry = {
      role: cfg.role,
      weight: cfg.weight,
      isPrimary: cfg.isPrimary,
      palaceName:
        cfg.type === "small-limit-palace"
          ? `Tiểu Hạn (${resolved.palace.annualPalaceName})`
          : resolved.palace.annualPalaceName,
      inputType: cfg.type,
    };
    if (existing) {
      existing.weight += cfg.weight;
      existing.roles.push(roleEntry);
    } else {
      byPhysical.set(resolved.palace.palaceIndex, {
        weight: cfg.weight,
        palace: resolved.palace,
        roles: [roleEntry],
      });
    }
  }

  const coverage: V08Coverage = {
    resolvedWeight: roundToPrecision(resolvedWeight, 4),
    totalWeight: roundToPrecision(totalWeight, 4),
    missingPalaces: [...missingPalaces].sort((a, b) => a.localeCompare(b)),
  };

  // Primary missing or nothing resolved → unavailable (no fabricated 50).
  if (!primaryResolved || byPhysical.size === 0) {
    const primaryTrace =
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
        missingReason: primaryMissingReason ?? "missing-primary-palace",
      } satisfies V08PalaceContributionTrace);

    const reasonCodes = [
      ...(primaryMissingReason ? [primaryMissingReason] : ["missing-primary-palace"]),
      ...missingInputs.filter((r) => r !== primaryMissingReason),
    ];

    const trace: V08DomainScoreTrace = {
      formulaVersion: V08_FORMULA_VERSION,
      primary: primaryTrace,
      cooperating: unresolvedRoles.sort((a, b) => a.role.localeCompare(b.role)),
      axisRawBeforeThaiTue: 0,
      isThaiTueHighlighted: false,
      thaiTueMultiplier: pc.thaiTueNeutralMultiplier,
      prominenceAdjustedRaw: 0,
      rawScore: pc.score.neutral,
      absoluteScore: null,
      scoreState: "unavailable",
      availability: "unavailable",
      coverage,
      configuredPalaceCount: configuredInputs.length,
      resolvedPalaceCount: byPhysical.size,
      matchedStarCount: 0,
      missingInputs: [...missingInputs].sort((a, b) => a.localeCompare(b)),
      missingPrimaryReason: primaryMissingReason ?? "missing-primary-palace",
    };

    return {
      score: null,
      availability: "unavailable",
      scoreState: "unavailable",
      intensity: 0,
      conflict: 0,
      supportNorm: 0,
      pressureNorm: 0,
      isThaiTueHighlighted: false,
      matchedFacts: [],
      coverage,
      missingReasonCodes: reasonCodes,
      trace,
    };
  }

  const scoredPalaces = new Map<
    number,
    {
      positivePoints: number;
      negativePoints: number;
      palaceRaw: number;
      matchedFacts: MatchedStarFact[];
      weight: number;
      palace: ResolvedAnnualPalace;
      roles: Array<{
        role: string;
        weight: number;
        isPrimary: boolean;
        palaceName: string;
        inputType: V08DomainPalaceInput["type"];
      }>;
    }
  >();

  for (const [index, entry] of byPhysical) {
    const primaryRole = entry.roles.some((r) => r.isPrimary);
    const hasSmallLimit = entry.roles.some((r) => r.inputType === "small-limit-palace");
    const palaceRole: "primary" | "cooperating" | "small-limit" = primaryRole
      ? "primary"
      : hasSmallLimit
        ? "small-limit"
        : "cooperating";
    const scored = scoreResolvedPalace(
      chart,
      entry.palace,
      domain,
      knowledge,
      palaceRole,
      entry.weight,
    );
    scoredPalaces.set(index, { ...entry, ...scored });
  }

  let axisRaw = 0;
  const allFacts: MatchedStarFact[] = [];
  for (const scored of scoredPalaces.values()) {
    axisRaw += scored.weight * scored.palaceRaw;
    allFacts.push(...scored.matchedFacts);
  }

  // Apply Thái Tuế at most once across unique mapped physical palaces.
  const mappedIndexes = [...scoredPalaces.keys()];
  const thaiTuePalaceIndexes = mappedIndexes.filter((i) => isLuuThaiTueInPalace(chart, i));
  const isThaiTueHighlighted = thaiTuePalaceIndexes.length > 0;
  const thaiTueMultiplier = isThaiTueHighlighted
    ? pc.thaiTueMultiplier
    : pc.thaiTueNeutralMultiplier;

  // Direction preservation: multiplier scales magnitude; zero stays zero.
  const prominenceAdjustedRaw = clamp(
    axisRaw * thaiTueMultiplier,
    pc.axisRawClamp.minimum,
    pc.axisRawClamp.maximum,
  );

  if (isThaiTueHighlighted) {
    for (const fact of allFacts) {
      fact.thaiTueProminenceApplied = true;
      fact.weightedContribution =
        fact.points * fact.palaceWeight * thaiTueMultiplier;
    }
  }

  const rawScore = pc.score.neutral + pc.score.pointsPerRawUnit * prominenceAdjustedRaw;
  const absoluteScore = roundToPrecision(
    clamp(rawScore, pc.score.minimum, pc.score.maximum),
    pc.score.precision,
  );

  const matchedStarCount = allFacts.length;
  const hasCooperatingGap = missingPalaces.length > 0;
  const availability: V08AxisAvailability = hasCooperatingGap
    ? "partial-data"
    : "available";

  const scoreState = classifyV08ScoreState({
    matchedStarCount,
    prominenceAdjustedRaw,
    hasCooperatingGap,
  });

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
    const sharedRoles = scored.roles.map((r) => r.role);
    const shared = sharedRoles.length > 1;
    // Matched facts attach once per physical palace (representative role) so
    // shared roles are not presented as independently scored contributions.
    const representativeRole =
      scored.roles.find((r) => r.isPrimary)?.role ?? scored.roles[0]?.role;
    for (const role of scored.roles) {
      const isRepresentative = role.role === representativeRole;
      const trace: V08PalaceContributionTrace = {
        role: role.role,
        palaceName: role.palaceName,
        palaceIndex: scored.palace.palaceIndex,
        configuredWeight: role.weight,
        positivePoints: scored.positivePoints,
        negativePoints: scored.negativePoints,
        palaceRaw: scored.palaceRaw,
        matchedFacts: isRepresentative ? scored.matchedFacts : [],
        rolesSharingPalace: shared ? sharedRoles : undefined,
      };
      if (role.isPrimary) primaryTrace = trace;
      else cooperatingTraces.push(trace);
    }
  }

  cooperatingTraces.sort((a, b) => a.role.localeCompare(b.role));
  allFacts.sort(
    (a, b) =>
      Math.abs(b.weightedContribution) - Math.abs(a.weightedContribution) ||
      a.ruleId.localeCompare(b.ruleId),
  );

  const posAbs = allFacts
    .filter((f) => f.polarity === "positive")
    .reduce((s, f) => s + Math.abs(f.points), 0);
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
    availability,
    coverage,
    configuredPalaceCount: configuredInputs.length,
    resolvedPalaceCount: byPhysical.size,
    matchedStarCount,
    missingInputs: [...missingInputs].sort((a, b) => a.localeCompare(b)),
  };

  return {
    score: absoluteScore,
    availability,
    scoreState,
    intensity: Math.round(100 * supportNorm),
    conflict: Math.round(100 * Math.min(supportNorm, pressureNorm)),
    supportNorm,
    pressureNorm,
    isThaiTueHighlighted,
    matchedFacts: allFacts,
    coverage,
    missingReasonCodes: [...missingInputs],
    trace,
  };
}
