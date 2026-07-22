import type { ChartData, ChartStar } from "@/types/chart";
import { canonicalStarName } from "../../../facts/canonical-star-name";
import type {
  AnnualAxesKnowledgeV08NamPhai,
  V08PointClass,
  V08StarRule,
} from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import { isMutagenMarkerName } from "../../../facts/canonical-star-name";

export interface MatchedStarFact {
  starName: string;
  canonicalStarName: string;
  ruleId: string;
  polarity: "positive" | "negative";
  points: number;
  palaceIndex: number;
  annualPalaceName: string;
  sourceId: string;
}

function buildAliasLookup(knowledge: AnnualAxesKnowledgeV08NamPhai): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (key: string, value: string) => {
    const set = map.get(key) ?? new Set<string>();
    set.add(value);
    map.set(key, set);
  };
  for (const names of Object.values(knowledge.starAliases.groups)) {
    for (const name of names) {
      for (const other of names) {
        add(name, other);
        add(canonicalStarName(name), other);
        add(canonicalStarName(name), canonicalStarName(other));
      }
    }
  }
  return map;
}

function starMatchKeys(star: ChartStar): string[] {
  const raw = star.name;
  const canonical = canonicalStarName(raw);
  return Array.from(new Set([raw, canonical]));
}

function ruleMatchesStar(
  rule: V08StarRule,
  star: ChartStar,
  aliasLookup: Map<string, Set<string>>,
): boolean {
  const keys = starMatchKeys(star);
  const ruleNames = new Set<string>([
    rule.starName,
    canonicalStarName(rule.starName),
    ...(aliasLookup.get(rule.starName) ?? []),
    ...(aliasLookup.get(canonicalStarName(rule.starName)) ?? []),
  ]);
  for (const key of keys) {
    if (ruleNames.has(key)) return true;
    const aliases = aliasLookup.get(key);
    if (aliases) {
      for (const a of aliases) {
        if (ruleNames.has(a) || ruleNames.has(canonicalStarName(a))) return true;
      }
    }
  }
  return false;
}

function dignityOk(rule: V08StarRule, star: ChartStar): boolean {
  if (!rule.requiresDignity || rule.requiresDignity.length === 0) return true;
  const brightness = star.brightness ?? "";
  return rule.requiresDignity.includes(brightness);
}

function pointsFor(
  pointClass: V08PointClass,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): number {
  return knowledge.pointClasses.classes[pointClass];
}

/**
 * Match configured axis star rules against stars physically present in a palace.
 * Tứ Hóa rules take precedence; one physical star occurrence matches one rule.
 */
export function matchPalaceStars(input: {
  chart: ChartData;
  palaceIndex: number;
  annualPalaceName: string;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV08NamPhai;
}): {
  positivePoints: number;
  negativePoints: number;
  matchedFacts: MatchedStarFact[];
} {
  const { chart, palaceIndex, annualPalaceName, domain, knowledge } = input;
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  const stars = palace?.stars ?? [];
  const axis = knowledge.starRegistry.axes[domain];
  const aliasLookup = buildAliasLookup(knowledge);

  const positiveRules = [...axis.positive].sort((a, b) => {
    const tu = Number(Boolean(b.isTuHoa)) - Number(Boolean(a.isTuHoa));
    if (tu !== 0) return tu;
    return a.ruleId.localeCompare(b.ruleId);
  });
  const negativeRules = [...axis.negative].sort((a, b) => {
    const tu = Number(Boolean(b.isTuHoa)) - Number(Boolean(a.isTuHoa));
    if (tu !== 0) return tu;
    return a.ruleId.localeCompare(b.ruleId);
  });

  const usedStarKeys = new Set<string>();
  const matchedFacts: MatchedStarFact[] = [];
  let positivePoints = 0;
  let negativePoints = 0;

  const tryMatch = (
    rules: V08StarRule[],
    polarity: "positive" | "negative",
  ) => {
    for (const star of stars) {
      const physicalKey = `${palaceIndex}|${star.name}|${star.source ?? ""}|${star.mutagen ?? ""}`;
      if (usedStarKeys.has(physicalKey)) continue;

      for (const rule of rules) {
        if (!ruleMatchesStar(rule, star, aliasLookup)) continue;
        if (!dignityOk(rule, star)) continue;

        // Tứ Hóa double-count guard: mutagen markers consume the physical slot.
        if (rule.isTuHoa || isMutagenMarkerName(star.name)) {
          // ok — still one slot
        }

        const pts = pointsFor(rule.pointClass, knowledge);
        if (pts === 0) continue;

        usedStarKeys.add(physicalKey);
        const fact: MatchedStarFact = {
          starName: star.name,
          canonicalStarName: canonicalStarName(star.name),
          ruleId: rule.ruleId,
          polarity,
          points: pts,
          palaceIndex,
          annualPalaceName,
          sourceId: "SRC-AA-ENG-004",
        };
        matchedFacts.push(fact);
        if (polarity === "positive") positivePoints += Math.max(0, pts);
        else negativePoints += Math.abs(pts);
        break;
      }
    }
  };

  // Positive Tứ Hóa / rules first, then negative — each star once.
  tryMatch(positiveRules, "positive");
  tryMatch(negativeRules, "negative");

  matchedFacts.sort(
    (a, b) =>
      Math.abs(b.points) - Math.abs(a.points) ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.starName.localeCompare(b.starName),
  );

  return { positivePoints, negativePoints, matchedFacts };
}

export function clampPalaceRaw(
  positivePoints: number,
  negativePoints: number,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): number {
  const raw = positivePoints - negativePoints;
  const { minimum, maximum } = knowledge.pointClasses.palaceRawClamp;
  return Math.min(maximum, Math.max(minimum, raw));
}
