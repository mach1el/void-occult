/**
 * Numeric-scoring-key scan (§3).
 *
 * Ontology knowledge is symbolic only. Any object key that introduces a
 * scoring vocabulary fails validation. Structural integers (schema versions,
 * fixture counts, gate thresholds) are NOT keys of this kind — the ban is on
 * scoring KEYS, not on integers existing anywhere.
 */

/** Forbidden scoring keys (case-insensitive, exact key-name match). */
export const FORBIDDEN_SCORING_KEYS: readonly string[] = [
  "score",
  "weight",
  "coefficient",
  "support",
  "pressure",
  "stability",
  "activation",
  "factor",
  "delta",
  "multiplier",
];

const FORBIDDEN = new Set(FORBIDDEN_SCORING_KEYS.map((k) => k.toLowerCase()));

export interface NumericKeyHit {
  readonly path: string;
  readonly key: string;
}

/**
 * Walk `value` and report every object key whose name is a forbidden scoring
 * key. Deterministic: keys visited in definition order, arrays by index.
 */
export function scanForbiddenScoringKeys(value: unknown, basePath = "$"): NumericKeyHit[] {
  const hits: NumericKeyHit[] = [];
  walk(value, basePath, hits);
  return hits;
}

function walk(value: unknown, currentPath: string, hits: NumericKeyHit[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${currentPath}[${index}]`, hits));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN.has(key.toLowerCase())) {
        hits.push({ path: `${currentPath}.${key}`, key });
      }
      walk(child, `${currentPath}.${key}`, hits);
    }
  }
}
