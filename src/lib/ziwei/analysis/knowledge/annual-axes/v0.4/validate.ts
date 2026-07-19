import type { AnnualAxisDomainId } from "../schema";
import type { AnnualAxesKnowledgeV04NamPhai } from "./schema";

export interface AnnualKnowledgeV04ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

const REQUIRED_TRANSFORMATIONS = ["Lộc", "Quyền", "Khoa", "Kỵ"] as const;

function issue(path: string, message: string): AnnualKnowledgeV04ValidationIssue {
  return { path, message };
}

function isUnitInterval(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

/**
 * Structural validation for the V0.4 annual-delta Nam Phái knowledge pack.
 * Fail closed — invalid packs must never produce numeric scores.
 */
export function validateAnnualAxesKnowledgeV04NamPhai(
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV04ValidationIssue[] } {
  const issues: AnnualKnowledgeV04ValidationIssue[] = [];

  if (knowledge.channelProfile.routing.floor !== 0) {
    issues.push(issue("channelProfile.routing.floor", "V0.4 requires routing floor = 0"));
  }

  const weights = knowledge.channelProfile.channelWeights;
  const weightSum =
    weights.globalAnnualClimate +
    weights.routedHeadImpact +
    weights.directDomainImpact +
    weights.majorFortuneBackground;
  if (Math.abs(weightSum - 1) > 1e-6) {
    issues.push(issue("channelProfile.channelWeights", `channel weights must sum to 1 (got ${weightSum})`));
  }
  if (weights.globalAnnualClimate > 0.2) {
    issues.push(
      issue("channelProfile.channelWeights.globalAnnualClimate", "global channel must remain a small minority"),
    );
  }

  const delta = knowledge.deltaProfile;
  if (delta.neutralScore !== 50) {
    issues.push(issue("deltaProfile.neutralScore", "neutralScore must be 50"));
  }
  if (delta.natalResponse.responseFloor < 0 || delta.natalResponse.responseRange < 0) {
    issues.push(issue("deltaProfile.natalResponse", "response coefficients must be non-negative"));
  }

  const sourceIds = new Set(knowledge.sourceRegistry.sources.map((s) => s.sourceId));
  const seenRecordIds = new Set<string>();
  const seenStarKeys = new Set<string>();
  const seenTfKeys = new Set<string>();

  for (const record of knowledge.domainAffinity.records) {
    if (seenRecordIds.has(record.id)) {
      issues.push(issue(`domainAffinity.records.${record.id}`, "duplicate affinity record id"));
    }
    seenRecordIds.add(record.id);

    let anyNonZero = false;
    let anyZero = false;
    for (const domain of DOMAINS) {
      const v = record.affinities[domain];
      if (!isUnitInterval(v)) {
        issues.push(issue(`domainAffinity.records.${record.id}.affinities.${domain}`, "affinity must be in [0,1]"));
      } else if (v > 0) {
        anyNonZero = true;
      } else {
        anyZero = true;
      }
    }
    if (!anyNonZero) {
      issues.push(issue(`domainAffinity.records.${record.id}`, "at least one affinity must be non-zero"));
    }
    // Sparsity requirement applies to star / star-family records (prompt §3);
    // transformations are not required to carry a zero.
    if (
      !anyZero &&
      (record.subject.kind === "star" || record.subject.kind === "star-family")
    ) {
      issues.push(
        issue(
          `domainAffinity.records.${record.id}`,
          "at least one affinity must be exactly zero — records may not be universally positive",
        ),
      );
    }
    if (!record.rationale || record.rationale.trim().length === 0) {
      issues.push(issue(`domainAffinity.records.${record.id}.rationale`, "rationale must be non-empty"));
    }

    for (const sid of record.sourceIds) {
      if (!sourceIds.has(sid)) {
        issues.push(issue(`domainAffinity.records.${record.id}.sourceIds`, `unresolved source ${sid}`));
      }
    }

    if (record.subject.kind === "star") {
      const key = record.subject.canonicalStarName;
      if (seenStarKeys.has(key)) {
        issues.push(issue(`domainAffinity.records.${record.id}`, `duplicate star affinity for ${key}`));
      }
      seenStarKeys.add(key);
    }
    if (record.subject.kind === "transformation") {
      const key = record.subject.transformation;
      if (seenTfKeys.has(key)) {
        issues.push(issue(`domainAffinity.records.${record.id}`, `duplicate transformation affinity for ${key}`));
      }
      seenTfKeys.add(key);
    }
  }

  // V0.4.1 — no universal numeric fallback. A subject with no exact/family/
  // transformation record must resolve to an explicit disposition, never a
  // number that quietly makes it eligible for all six domains.
  const fallback = knowledge.domainAffinity.fallbackPolicy;
  const dispositions: Array<[string, unknown]> = [
    ["unmappedStar", fallback?.unmappedStar],
    ["unmappedStarFamily", fallback?.unmappedStarFamily],
    ["unmappedTransformation", fallback?.unmappedTransformation],
    ["unmappedMovingMarker", fallback?.unmappedMovingMarker],
  ];
  for (const [key, value] of dispositions) {
    if (value !== "context-only" && value !== "invalid-knowledge") {
      issues.push(
        issue(`domainAffinity.fallbackPolicy.${key}`, 'must be "context-only" or "invalid-knowledge"'),
      );
    }
  }
  if (fallback?.unmappedTransformation !== "invalid-knowledge") {
    issues.push(
      issue(
        "domainAffinity.fallbackPolicy.unmappedTransformation",
        "transformation coverage must be 100% — unmapped transformation must fail closed as invalid-knowledge",
      ),
    );
  }

  // Required 100% transformation coverage — the four Tứ Hóa must each have
  // an exact record so `unmappedTransformation` is structurally unreachable.
  for (const tf of REQUIRED_TRANSFORMATIONS) {
    const hasExact = knowledge.domainAffinity.records.some(
      (r) => r.subject.kind === "transformation" && r.subject.transformation === tf,
    );
    if (!hasExact) {
      issues.push(
        issue("domainAffinity.records", `missing required exact transformation affinity record for ${tf}`),
      );
    }
  }

  const enabled = knowledge.triggerPolicy.enabledTriggers.filter((t) => t.enabled);
  if (enabled.length === 0) {
    issues.push(issue("triggerPolicy.enabledTriggers", "at least one trigger must be enabled"));
  }

  const gates = knowledge.distributionGates.hardGates;
  for (const [key, value] of Object.entries(gates)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push(issue(`distributionGates.hardGates.${key}`, "gate threshold must be a finite number"));
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true };
}
