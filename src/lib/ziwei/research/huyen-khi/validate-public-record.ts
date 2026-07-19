import { NATAL_PALACE_NAMES, type NatalPalaceName, type PublicHuyenKhiRecord } from "./types";

export interface RecordValidationIssue {
  sampleId: string;
  path: string;
  message: string;
}

const PALACE_SET = new Set<string>(NATAL_PALACE_NAMES);

function sumPalaceScores(record: PublicHuyenKhiRecord): number {
  let total = 0;
  for (const name of NATAL_PALACE_NAMES) {
    total += record.palaceScores[name] ?? 0;
  }
  return Math.round(total * 100) / 100;
}

/**
 * §4 — validates the additive public-output contract for one record:
 * `displayedTotal === sum(palaceScores)` after treating any palace absent
 * from `palacesExplicitlyListed` as zero. A palace may only be inferred
 * zero when this validates exactly at two decimals; otherwise the record
 * stays a mismatch — never silently forced to balance.
 */
export function validatePublicRecord(record: PublicHuyenKhiRecord): RecordValidationIssue[] {
  const issues: RecordValidationIssue[] = [];
  const sid = record.sampleId;

  if (record.metricNamespace !== "huyen-khi") {
    issues.push({ sampleId: sid, path: "metricNamespace", message: "must be exactly 'huyen-khi'" });
  }

  const scoredPalaces = new Set(Object.keys(record.palaceScores));
  for (const name of NATAL_PALACE_NAMES) {
    if (!scoredPalaces.has(name)) {
      issues.push({ sampleId: sid, path: `palaceScores.${name}`, message: "missing palace score" });
    }
  }
  for (const name of scoredPalaces) {
    if (!PALACE_SET.has(name)) {
      issues.push({ sampleId: sid, path: `palaceScores.${name}`, message: "unknown palace name" });
    }
  }

  const listed = new Set(record.palacesExplicitlyListed);
  const omitted = new Set(record.omittedPalacesAssumedZeroForValidation);
  for (const name of NATAL_PALACE_NAMES) {
    const inListed = listed.has(name);
    const inOmitted = omitted.has(name);
    if (inListed === inOmitted) {
      issues.push({
        sampleId: sid,
        path: `palace:${name}`,
        message: "must appear in exactly one of palacesExplicitlyListed / omittedPalacesAssumedZeroForValidation",
      });
    }
    if (inOmitted && record.palaceScores[name] !== 0) {
      issues.push({
        sampleId: sid,
        path: `palaceScores.${name}`,
        message: "omitted palace must carry score 0 pending total validation",
      });
    }
  }

  const calculated = sumPalaceScores(record);
  const delta = Math.round((calculated - record.displayedTotal) * 100) / 100;
  const isExact = Math.abs(delta) < 0.005;

  if (record.calculatedTotal !== calculated) {
    issues.push({
      sampleId: sid,
      path: "calculatedTotal",
      message: `stored calculatedTotal ${record.calculatedTotal} does not match recomputed sum ${calculated}`,
    });
  }
  if (Math.abs(record.totalDelta - delta) > 0.005) {
    issues.push({
      sampleId: sid,
      path: "totalDelta",
      message: `stored totalDelta ${record.totalDelta} does not match recomputed delta ${delta}`,
    });
  }

  const expectedValidation = isExact ? "exact" : "mismatch";
  if (record.totalValidation !== expectedValidation) {
    issues.push({
      sampleId: sid,
      path: "totalValidation",
      message: `expected '${expectedValidation}' (recomputed delta ${delta}), got '${record.totalValidation}'`,
    });
  }
  // Omitted-zero inference is only licensed by an exact validation — if the
  // record has any omitted palace but does not validate exactly, it must
  // not silently report "exact".
  if (omitted.size > 0 && !isExact) {
    issues.push({
      sampleId: sid,
      path: "omittedPalacesAssumedZeroForValidation",
      message: "zero-inference for omitted palaces requires exact total validation; this record does not validate",
    });
  }

  return issues;
}

export function isPalaceName(value: string): value is NatalPalaceName {
  return PALACE_SET.has(value);
}
