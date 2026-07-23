/**
 * Reusable Major Fortune V0.2 source-locator pack validator.
 * CLI and tests must call this implementation — no weaker test-only paths.
 */
import Ajv, { type ErrorObject } from "ajv";

export const MF_V02_SOURCE_MAX_EXCERPT = 400;

export interface SourcePackValidationIssue {
  code: string;
  message: string;
  path?: string;
}

export interface SourcePackValidationResult {
  ok: boolean;
  issues: SourcePackValidationIssue[];
  derived?: {
    eligibleScoringFamilyCount: number;
    eligibleShapeFragmentCount: number;
    claimCount: number;
    sourceCount: number;
    unresolvedQueueCount: number;
    openContradictionIds: string[];
    sourcesByAccess: Record<string, number>;
    sourcesByExtraction: Record<string, number>;
  };
}

export interface SourceLocatorPackInput {
  schemas: Record<string, unknown>;
  artifacts: Record<string, unknown>;
}

type Source = {
  sourceId: string;
  qualityTier: string;
  sourceType: string;
  pageOrInternalLocator: string;
  extractionStatus: string;
  accessStatus: string;
  prohibitedUsage: string[];
};

type Claim = {
  claimId: string;
  topic: string;
  familyId?: string | null;
  sourceIds: string[];
  locators: string[];
  status: string;
  dimension: string;
  candidateEligibility: string;
  polarity: string | null;
  frame: string | null;
  extractionIds: string[];
};

type Extraction = {
  extractionId: string;
  sourceId: string;
  locator: string;
  excerptOrParaphrase: string | null;
  excerptLengthChars: number;
  claimIds: string[];
  layer: string;
  blockedReason?: string | null;
};

type Family = {
  familyId: string;
  eligibility: string;
  existence: boolean;
  scope: boolean;
  polarity: boolean;
  frame: boolean;
  stacking: boolean;
  stackingContract?:
    | "mutually-exclusive-single-outcome"
    | "non-stacking"
    | "excluded-from-combinations-requiring-stacking"
    | "unresolved";
  evidence: {
    existenceClaimIds: string[];
    scopeClaimIds: string[];
    polarityClaimIds: string[];
    frameClaimIds: string[];
    stackingClaimIds: string[];
  };
  blockingGaps?: string[];
};

function issue(
  code: string,
  message: string,
  path?: string,
): SourcePackValidationIssue {
  return path ? { code, message, path } : { code, message };
}

function isEngineeringSource(s: Source): boolean {
  return (
    s.qualityTier === "engineering" ||
    s.sourceType.includes("engineering") ||
    s.sourceType.includes("calculation-contract") ||
    s.sourceType.includes("internal-research")
  );
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  return JSON.stringify(errors ?? []);
}

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of items) out[k] = (out[k] ?? 0) + 1;
  return out;
}

/**
 * Validate an in-memory source-locator pack (schemas + artifacts).
 */
export function validateSourceLocatorPack(
  input: SourceLocatorPackInput,
): SourcePackValidationResult {
  const issues: SourcePackValidationIssue[] = [];
  const ajv = new Ajv({ allErrors: true, strict: false });
  const { schemas, artifacts } = input;

  const schemaPairs: Array<[string, string]> = [
    ["sources/source-registry.json", "schema/source-registry.schema.json"],
    ["claims/claim-registry.json", "schema/claim-registry.schema.json"],
    ["reports/decision.json", "schema/decision.schema.json"],
    ["matrices/candidate-family-eligibility-matrix.json", "schema/family-eligibility.schema.json"],
    ["fragments/eligible-shape-fragments.json", "schema/fragments.schema.json"],
    ["sources/source-acquisition-ledger.json", "schema/source-acquisition-ledger.schema.json"],
    ["sources/page-scan-extraction-ledger.json", "schema/page-scan-extraction-ledger.schema.json"],
    ["matrices/claim-to-source-matrix.json", "schema/claim-to-source-matrix.schema.json"],
    ["matrices/topic-evidence-report.json", "schema/topic-evidence-report.schema.json"],
    ["matrices/polarity-evidence-matrix.json", "schema/polarity-evidence-matrix.schema.json"],
    ["matrices/frame-stacking-matrix.json", "schema/frame-stacking-matrix.schema.json"],
    ["contradictions/contradiction-log.json", "schema/contradiction-log.schema.json"],
    ["queue/unresolved-source-queue.json", "schema/unresolved-source-queue.schema.json"],
    ["reports/summary-report.json", "schema/summary-report.schema.json"],
    ["reports/validation-report.json", "schema/validation-report.schema.json"],
    ["reports/decision-check.json", "schema/decision-check.schema.json"],
  ];

  for (const [dataRel, schemaRel] of schemaPairs) {
    const data = artifacts[dataRel];
    const schema = schemas[schemaRel];
    if (data === undefined || schema === undefined) {
      issues.push(issue("missing-artifact", `${dataRel} or ${schemaRel}`, dataRel));
      continue;
    }
    const validate = ajv.compile(schema as object);
    const ok = validate(data);
    if (!ok) {
      issues.push(
        issue(
          "schema-invalid",
          `${dataRel}: ${formatAjvErrors(validate.errors as ErrorObject[])}`,
          dataRel,
        ),
      );
    }
  }

  const sourcesDoc = artifacts["sources/source-registry.json"] as {
    historicalMutationForbidden: boolean;
    sources: Source[];
  };
  const claimsDoc = artifacts["claims/claim-registry.json"] as {
    exactRawDeltaForbidden: boolean;
    claims: Claim[];
  };
  const extractionsDoc = artifacts["sources/page-scan-extraction-ledger.json"] as {
    extractions: Extraction[];
  };
  const familiesDoc = artifacts["matrices/candidate-family-eligibility-matrix.json"] as {
    families: Family[];
  };
  const fragmentsDoc = artifacts["fragments/eligible-shape-fragments.json"] as {
    fragments: Array<Record<string, unknown>>;
  };
  const decision = artifacts["reports/decision.json"] as {
    readinessDecision: string;
    eligibleScoringFamilyCount: number;
    eligibleShapeFragmentCount: number;
    authorizedFinalRawDelta: boolean;
    numericCandidatesEvaluated: boolean;
    historicalRegistryMutation: boolean;
    v01Unchanged: boolean;
    productionRoutingUnchanged: boolean;
    productionRoutingExpected: { status: string; module: string; reason: string };
    openContradictionIds: string[];
  };
  const summary = artifacts["reports/summary-report.json"] as {
    readinessDecision: string;
    eligibleShapeFragmentCount: number;
    unresolvedQueueCount: number;
    openContradictions: string[];
    numericCandidatesEvaluated: boolean;
    authorizedFinalRawDelta: boolean;
    v01Unchanged: boolean;
    productionRoutingUnchanged: boolean;
    sourcesByAccess: Record<string, number>;
    sourcesByExtraction: Record<string, number>;
    familyEligibility: Record<string, string>;
  };
  const contra = artifacts["contradictions/contradiction-log.json"] as {
    contradictions: Array<{ contradictionId: string; status: string; claimIds: string[] }>;
  };
  const queue = artifacts["queue/unresolved-source-queue.json"] as {
    items: Array<{
      queueId: string;
      priority: number;
      sourceId: string | null;
      neededTopics: string[];
      blocker: string;
      ownerAction: string;
      remainingGapReason?: string;
    }>;
  };
  const topicReport = artifacts["matrices/topic-evidence-report.json"] as {
    topics: Array<{ topicId: string }>;
  };

  if (!sourcesDoc || !claimsDoc || !extractionsDoc || !familiesDoc || !decision) {
    return { ok: false, issues };
  }

  if (sourcesDoc.historicalMutationForbidden !== true) {
    issues.push(issue("history-mutation", "historicalMutationForbidden must be true"));
  }
  if (claimsDoc.exactRawDeltaForbidden !== true) {
    issues.push(issue("rawDelta-policy", "exactRawDeltaForbidden must be true"));
  }
  if (decision.authorizedFinalRawDelta !== false) {
    issues.push(issue("authorized-rawDelta", "decision.authorizedFinalRawDelta must be false"));
  }
  if (decision.historicalRegistryMutation !== false) {
    issues.push(issue("history-mutation", "decision.historicalRegistryMutation must be false"));
  }
  if (decision.numericCandidatesEvaluated !== false) {
    issues.push(issue("numeric-eval", "numericCandidatesEvaluated must be false"));
  }

  const sourceById = new Map(sourcesDoc.sources.map((s) => [s.sourceId, s]));
  const claimById = new Map(claimsDoc.claims.map((c) => [c.claimId, c]));
  const extractionById = new Map(extractionsDoc.extractions.map((e) => [e.extractionId, e]));
  const topicIds = new Set(topicReport.topics.map((t) => t.topicId));
  // Map topic aliases used in queue to topic matrix ids
  const topicAlias: Record<string, string> = {
    "benefic-malefic": "benefic-malefic",
    "principal-star-dignity": "principal-star-dignity",
    "trung-chau-transformations": "trung-chau-transformations",
    "element-relation": "element-relation",
  };

  // --- Excerpt length from content ---
  for (const e of extractionsDoc.extractions) {
    const actual = e.excerptOrParaphrase?.length ?? 0;
    if (e.excerptLengthChars !== actual) {
      issues.push(
        issue(
          "excerpt-length-mismatch",
          `${e.extractionId}: metadata=${e.excerptLengthChars} actual=${actual}`,
          e.extractionId,
        ),
      );
    }
    if (actual > MF_V02_SOURCE_MAX_EXCERPT) {
      issues.push(
        issue(
          "long-copied-passage",
          `${e.extractionId}: length ${actual} > ${MF_V02_SOURCE_MAX_EXCERPT}`,
          e.extractionId,
        ),
      );
    }
    if (!sourceById.has(e.sourceId)) {
      issues.push(issue("unresolved-source", `extraction ${e.extractionId} → ${e.sourceId}`));
    }
  }

  // --- Claims: sources, extractions, bidirectional chains ---
  for (const c of claimsDoc.claims) {
    for (const sid of c.sourceIds) {
      if (!sourceById.has(sid)) {
        issues.push(issue("unresolved-source", `${c.claimId} → ${sid}`, c.claimId));
      }
    }
    for (const eid of c.extractionIds ?? []) {
      const ext = extractionById.get(eid);
      if (!ext) {
        issues.push(issue("missing-extraction", `${c.claimId} → ${eid}`, c.claimId));
        continue;
      }
      if (!ext.claimIds.includes(c.claimId)) {
        issues.push(
          issue(
            "extraction-missing-reverse-claim",
            `${eid} does not list ${c.claimId}`,
            eid,
          ),
        );
      }
      if (!c.sourceIds.includes(ext.sourceId)) {
        issues.push(
          issue(
            "claim-extraction-source-mismatch",
            `${c.claimId} extraction ${eid} source ${ext.sourceId} not in claim.sourceIds`,
            c.claimId,
          ),
        );
      }
      if (!c.locators.includes(ext.locator)) {
        issues.push(
          issue(
            "claim-extraction-locator-mismatch",
            `${c.claimId} locators do not include extraction locator ${ext.locator}`,
            c.claimId,
          ),
        );
      }
      if (c.status === "verified-doctrine") {
        if (ext.layer === "engineering") {
          issues.push(
            issue(
              "verified-uses-engineering-extraction",
              `${c.claimId} cites engineering extraction ${eid}`,
              c.claimId,
            ),
          );
        }
        if (ext.locator === "Unknown" || ext.blockedReason) {
          issues.push(
            issue(
              "verified-uses-blocked-extraction",
              `${c.claimId} cites blocked/Unknown extraction ${eid}`,
              c.claimId,
            ),
          );
        }
        if (!ext.excerptOrParaphrase || ext.excerptOrParaphrase.length === 0) {
          issues.push(
            issue(
              "verified-empty-excerpt",
              `${c.claimId} extraction ${eid} has empty paraphrase`,
              c.claimId,
            ),
          );
        }
      }
    }

    if (c.status === "verified-doctrine") {
      if (c.locators.some((l) => l === "Unknown")) {
        issues.push(issue("verified-unknown-locator", c.claimId, c.claimId));
      }
      for (const sid of c.sourceIds) {
        const src = sourceById.get(sid);
        if (src?.pageOrInternalLocator === "Unknown") {
          issues.push(issue("verified-unknown-locator", `${c.claimId} cites ${sid}`, c.claimId));
        }
      }
      if (c.dimension === "polarity") {
        const allEng = c.sourceIds.every((sid) => {
          const s = sourceById.get(sid);
          return s ? isEngineeringSource(s) : true;
        });
        if (allEng) {
          issues.push(issue("polarity-from-engineering", c.claimId, c.claimId));
        }
      }
    }
  }

  // Reverse: extraction.claimIds → claim must reference extraction
  for (const e of extractionsDoc.extractions) {
    for (const cid of e.claimIds) {
      const c = claimById.get(cid);
      if (!c) {
        issues.push(issue("unresolved-claim", `extraction ${e.extractionId} → ${cid}`, e.extractionId));
        continue;
      }
      if (!(c.extractionIds ?? []).includes(e.extractionId)) {
        issues.push(
          issue(
            "claim-missing-reverse-extraction",
            `${cid} does not reference extraction ${e.extractionId}`,
            cid,
          ),
        );
      }
    }
  }

  // --- Family eligibility evidence derivation ---
  const scoringFamilyIds = new Set(
    familiesDoc.families
      .filter(
        (f) =>
          !["natal-resilience", "thai-tue", "tam-khong", "nam-phai-transformations"].includes(
            f.familyId,
          ) || f.eligibility === "candidate-eligible",
      )
      .map((f) => f.familyId),
  );
  // All families in matrix are potentially scoring except we count candidate-eligible only
  void scoringFamilyIds;

  function claimsValidForEligible(
    claimIds: string[],
    dimension: string,
    familyId: string,
  ): { ok: boolean; reason?: string } {
    if (claimIds.length === 0) return { ok: false, reason: "empty-evidence" };
    for (const cid of claimIds) {
      const c = claimById.get(cid);
      if (!c) return { ok: false, reason: `missing-claim:${cid}` };
      if (c.familyId && c.familyId !== familyId) {
        return { ok: false, reason: `wrong-family:${cid}` };
      }
      // Allow topic/familyId match: if familyId set on claim must match; if unset, topic must equal familyId or known alias
      if (c.familyId == null || c.familyId === "") {
        if (c.topic !== familyId && c.topic.replace(/_/g, "-") !== familyId) {
          // topic mapping for transformations
          const topicFamilyMap: Record<string, string> = {
            "transformation-nam-phai": "nam-phai-transformations",
            "trung-chau-transformations": "trung-chau-transformations",
            "principal-star-dignity": "principal-star-dignity",
            "benefic-malefic": "benefic-malefic-sets",
            "element-relation": "element-relation",
            "star-pattern": "star-pattern-compatibility",
            "natal-palace-groups": "natal-palace-groups",
            "tuan-triet": "tuan-triet",
            "tam-khong": "tam-khong",
            "thai-tue": "thai-tue",
            "natal-resilience": "natal-resilience",
          };
          if (topicFamilyMap[c.topic] !== familyId) {
            return { ok: false, reason: `wrong-family:${cid}` };
          }
        }
      }
      if (c.dimension !== dimension) return { ok: false, reason: `wrong-dimension:${cid}` };
      if (c.status !== "verified-doctrine") {
        return { ok: false, reason: `unverified:${cid}` };
      }
      if (c.locators.some((l) => l === "Unknown")) {
        return { ok: false, reason: `unknown-locator:${cid}` };
      }
      if (!(c.extractionIds?.length > 0)) {
        return { ok: false, reason: `no-extraction:${cid}` };
      }
      const allEng = c.sourceIds.every((sid) => {
        const s = sourceById.get(sid);
        return s ? isEngineeringSource(s) : true;
      });
      if (allEng) return { ok: false, reason: `engineering-only:${cid}` };
    }
    return { ok: true };
  }

  function hasAnyResolvingClaims(claimIds: string[], dimension: string): boolean {
    return claimIds.some((cid) => {
      const c = claimById.get(cid);
      return c != null && c.dimension === dimension;
    });
  }

  let eligibleScoringFamilyCount = 0;

  for (const f of familiesDoc.families) {
    if (!f.evidence) {
      issues.push(issue("missing-family-evidence", f.familyId, f.familyId));
      continue;
    }

    const derivedExistence = hasAnyResolvingClaims(f.evidence.existenceClaimIds, "existence");
    const derivedScope = hasAnyResolvingClaims(f.evidence.scopeClaimIds, "scope");
    const derivedPolarity = hasAnyResolvingClaims(f.evidence.polarityClaimIds, "polarity");
    const derivedFrame = hasAnyResolvingClaims(f.evidence.frameClaimIds, "frame");

    if (f.existence !== derivedExistence) {
      issues.push(
        issue(
          "family-boolean-evidence-mismatch",
          `${f.familyId}: existence boolean=${f.existence} derived=${derivedExistence}`,
          f.familyId,
        ),
      );
    }
    if (f.scope !== derivedScope) {
      issues.push(
        issue(
          "family-boolean-evidence-mismatch",
          `${f.familyId}: scope boolean=${f.scope} derived=${derivedScope}`,
          f.familyId,
        ),
      );
    }
    if (f.polarity !== derivedPolarity) {
      issues.push(
        issue(
          "family-boolean-evidence-mismatch",
          `${f.familyId}: polarity boolean=${f.polarity} derived=${derivedPolarity}`,
          f.familyId,
        ),
      );
    }
    if (f.frame !== derivedFrame) {
      issues.push(
        issue(
          "family-boolean-evidence-mismatch",
          `${f.familyId}: frame boolean=${f.frame} derived=${derivedFrame}`,
          f.familyId,
        ),
      );
    }

    if (f.eligibility === "candidate-eligible") {
      eligibleScoringFamilyCount += 1;
      const ex = claimsValidForEligible(f.evidence.existenceClaimIds, "existence", f.familyId);
      if (!ex.ok) {
        issues.push(
          issue("eligible-missing-existence", `${f.familyId}: ${ex.reason}`, f.familyId),
        );
      }
      const sc = claimsValidForEligible(f.evidence.scopeClaimIds, "scope", f.familyId);
      if (!sc.ok) {
        issues.push(issue("eligible-missing-scope", `${f.familyId}: ${sc.reason}`, f.familyId));
      }
      const pol = claimsValidForEligible(f.evidence.polarityClaimIds, "polarity", f.familyId);
      if (!pol.ok) {
        issues.push(issue("eligible-missing-polarity", `${f.familyId}: ${pol.reason}`, f.familyId));
      }
      const fr = claimsValidForEligible(f.evidence.frameClaimIds, "frame", f.familyId);
      if (!fr.ok) {
        issues.push(issue("eligible-missing-frame", `${f.familyId}: ${fr.reason}`, f.familyId));
      }
      // stacking
      const stackingOk =
        f.stackingContract === "mutually-exclusive-single-outcome" ||
        f.stackingContract === "non-stacking" ||
        f.stackingContract === "excluded-from-combinations-requiring-stacking" ||
        claimsValidForEligible(f.evidence.stackingClaimIds, "stacking", f.familyId).ok;
      if (!stackingOk) {
        issues.push(
          issue(
            "eligible-missing-stacking",
            `${f.familyId}: stacking unresolved without contract`,
            f.familyId,
          ),
        );
      }
      // wrong-family / unverified already covered above; add explicit codes used by fixtures
      for (const cid of [
        ...f.evidence.existenceClaimIds,
        ...f.evidence.scopeClaimIds,
        ...f.evidence.polarityClaimIds,
        ...f.evidence.frameClaimIds,
      ]) {
        const c = claimById.get(cid);
        if (!c) {
          issues.push(issue("eligible-backed-by-unverified-claims", `${f.familyId}:${cid}`, f.familyId));
          continue;
        }
        if (c.status !== "verified-doctrine") {
          issues.push(
            issue("eligible-backed-by-unverified-claims", `${f.familyId}:${cid}`, f.familyId),
          );
        }
        const topicFamilyMap: Record<string, string> = {
          "benefic-malefic": "benefic-malefic-sets",
          "star-pattern": "star-pattern-compatibility",
          "transformation-nam-phai": "nam-phai-transformations",
        };
        const mapped = c.familyId ?? topicFamilyMap[c.topic] ?? c.topic;
        if (mapped !== f.familyId) {
          issues.push(
            issue("eligible-backed-by-wrong-family", `${f.familyId} ← ${cid} (${mapped})`, f.familyId),
          );
        }
      }
    }
  }

  // Fragments
  for (const frag of fragmentsDoc.fragments) {
    const text = JSON.stringify(frag);
    if (/"rawDelta"\s*:/.test(text) || /"selectedRawDelta"\s*:/.test(text)) {
      issues.push(issue("authorized-rawDelta", String(frag.familyId ?? frag.fragmentId)));
    }
    if (frag.requiresAnnual === true || frag.requiresMonthly === true) {
      issues.push(issue("annual-monthly-dependency", String(frag.familyId ?? frag.fragmentId)));
    }
  }
  const eligibleShapeFragmentCount = fragmentsDoc.fragments.length;

  // Queue integrity
  const seenQueue = new Set<string>();
  for (const item of queue.items) {
    if (seenQueue.has(item.queueId)) {
      issues.push(issue("duplicate-queue-id", item.queueId));
    }
    seenQueue.add(item.queueId);
    if (!(item.priority >= 1)) {
      issues.push(issue("invalid-queue-priority", item.queueId));
    }
    if (!item.ownerAction || item.ownerAction.trim() === "") {
      issues.push(issue("empty-queue-action", item.queueId));
    }
    for (const t of item.neededTopics) {
      const normalized = topicAlias[t] ?? t;
      if (!topicIds.has(normalized) && !topicIds.has(t)) {
        // topic report uses benefic-malefic etc.
        const found = [...topicIds].some((id) => id === t || id.startsWith(t) || t.startsWith(id));
        if (!found) {
          issues.push(issue("queue-unknown-topic", `${item.queueId}: ${t}`));
        }
      }
    }
    if (item.sourceId != null) {
      const src = sourceById.get(item.sourceId);
      if (!src) {
        issues.push(issue("unresolved-source", `queue ${item.queueId} → ${item.sourceId}`));
      } else {
        const unresolved =
          src.accessStatus === "bibliographic-only" ||
          src.extractionStatus === "blocked-missing-locator" ||
          src.extractionStatus === "hypothesis-only";
        if (src.accessStatus === "verified" && src.extractionStatus === "engineering-verified") {
          if (!item.remainingGapReason) {
            issues.push(
              issue(
                "verified-source-queued-without-gap",
                `${item.queueId}: ${item.sourceId}`,
                item.queueId,
              ),
            );
          }
        }
        if (
          item.blocker === "blocked-missing-locator" &&
          src.extractionStatus !== "blocked-missing-locator"
        ) {
          issues.push(
            issue(
              "queue-blocker-mismatch",
              `${item.queueId}: blocker=${item.blocker} extractionStatus=${src.extractionStatus}`,
            ),
          );
        }
        if (item.blocker === "bibliographic-only" && src.accessStatus !== "bibliographic-only") {
          issues.push(
            issue(
              "queue-blocker-mismatch",
              `${item.queueId}: blocker=${item.blocker} accessStatus=${src.accessStatus}`,
            ),
          );
        }
        void unresolved;
      }
    }
  }

  // Decision / summary consistency
  const sourcesByAccess = countBy(sourcesDoc.sources.map((s) => s.accessStatus));
  const sourcesByExtraction = countBy(sourcesDoc.sources.map((s) => s.extractionStatus));
  const openContradictionIds = contra.contradictions
    .filter((c) => c.status === "open")
    .map((c) => c.contradictionId)
    .sort();

  if (decision.eligibleScoringFamilyCount !== eligibleScoringFamilyCount) {
    issues.push(
      issue(
        "decision-count-mismatch",
        `eligibleScoringFamilyCount decision=${decision.eligibleScoringFamilyCount} derived=${eligibleScoringFamilyCount}`,
      ),
    );
  }
  if (decision.eligibleShapeFragmentCount !== eligibleShapeFragmentCount) {
    issues.push(
      issue(
        "decision-count-mismatch",
        `eligibleShapeFragmentCount decision=${decision.eligibleShapeFragmentCount} derived=${eligibleShapeFragmentCount}`,
      ),
    );
  }
  if (
    JSON.stringify([...(decision.openContradictionIds ?? [])].sort()) !==
    JSON.stringify(openContradictionIds)
  ) {
    issues.push(issue("decision-count-mismatch", "openContradictionIds mismatch"));
  }

  if (summary) {
    if (summary.readinessDecision !== decision.readinessDecision) {
      issues.push(issue("decision-count-mismatch", "summary readinessDecision mismatch"));
    }
    if (summary.eligibleShapeFragmentCount !== eligibleShapeFragmentCount) {
      issues.push(issue("decision-count-mismatch", "summary fragment count mismatch"));
    }
    if (summary.unresolvedQueueCount !== queue.items.length) {
      issues.push(issue("decision-count-mismatch", "summary queue count mismatch"));
    }
    if (JSON.stringify([...(summary.openContradictions ?? [])].sort()) !== JSON.stringify(openContradictionIds)) {
      issues.push(issue("decision-count-mismatch", "summary open contradictions mismatch"));
    }
    if (summary.authorizedFinalRawDelta !== false || summary.numericCandidatesEvaluated !== false) {
      issues.push(issue("decision-count-mismatch", "summary safety flags"));
    }
  }

  if (decision.productionRoutingExpected?.reason !== "rebuilding") {
    issues.push(issue("routing", "production routing must remain rebuilding"));
  }
  if (decision.v01Unchanged !== true || decision.productionRoutingUnchanged !== true) {
    issues.push(issue("runtime-boundary", "V0.1 / production routing flags must stay true"));
  }

  if (decision.readinessDecision === "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE") {
    if (eligibleShapeFragmentCount === 0) {
      issues.push(
        issue(
          "ready-with-zero-fragments",
          "LOCATOR_COMPLETION_READY_FOR_SHAPE_FREEZE requires non-empty fragments",
        ),
      );
    }
  }
  if (decision.readinessDecision === "SOURCE_ACCESS_BLOCKED") {
    const hasInspectable = sourcesDoc.sources.some(
      (s) => s.accessStatus === "verified" || s.accessStatus === "bibliographic-only",
    );
    if (hasInspectable) {
      issues.push(
        issue(
          "access-blocked-while-inspectable",
          "SOURCE_ACCESS_BLOCKED invalid while inspectable records exist",
        ),
      );
    }
  }
  if (decision.readinessDecision === "SOURCE_GAPS_REMAIN") {
    if (eligibleScoringFamilyCount !== 0 || eligibleShapeFragmentCount !== 0) {
      // Still allowed only if gaps remain for classical — but mission wants GAPS with zero families
      // If somehow eligible > 0 with GAPS, mismatch
      if (eligibleScoringFamilyCount > 0 && eligibleShapeFragmentCount > 0) {
        issues.push(
          issue(
            "decision-count-mismatch",
            "SOURCE_GAPS_REMAIN with eligible families/fragments inconsistent for this stage",
          ),
        );
      }
    }
  }

  // Candidate-ready language forbidden in decision notes
  const notes = String((decision as { notes?: string }).notes ?? "");
  if (/READY_FOR_V0_2_CANDIDATE/i.test(notes)) {
    issues.push(issue("candidate-ready-language", "decision notes must not claim candidate-ready"));
  }

  return {
    ok: issues.length === 0,
    issues,
    derived: {
      eligibleScoringFamilyCount,
      eligibleShapeFragmentCount,
      claimCount: claimsDoc.claims.length,
      sourceCount: sourcesDoc.sources.length,
      unresolvedQueueCount: queue.items.length,
      openContradictionIds,
      sourcesByAccess,
      sourcesByExtraction,
    },
  };
}
