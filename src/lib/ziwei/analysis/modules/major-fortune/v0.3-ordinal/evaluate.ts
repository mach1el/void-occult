/**
 * Pure Major Fortune V0.3 ordinal evaluator.
 *
 * Engineering-heuristic model: no ChartData, no I/O, no env, no current year.
 * Numeric movement derives solely from pillar budgets × ordinal levels.
 */
import {
  loadMajorFortuneOrdinalKnowledge,
  MAJOR_FORTUNE_ORDINAL_PILLAR_IDS,
  MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS,
  validateMajorFortuneOrdinalKnowledge,
  type MajorFortuneOrdinalBandId,
  type MajorFortuneOrdinalKnowledge,
  type MajorFortuneOrdinalLevel,
  type MajorFortuneOrdinalPillarId,
  type MajorFortuneOrdinalSignalFamily,
} from "../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import {
  classifyModuleScoreState,
  classifyPillarState,
  clampOrdinalLevel,
} from "./classify";
import type {
  MajorFortuneOrdinalEvaluationInput,
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalPillarResult,
  MajorFortuneOrdinalRejectedEvidence,
  MajorFortuneOrdinalRejectReason,
  MajorFortuneOrdinalResult,
} from "./types";

function roundToDecimals(value: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function deepFreezeProbe<T>(value: T): T {
  return value;
}

function reject(
  evidenceId: string,
  reason: MajorFortuneOrdinalRejectReason,
  detail: string,
): MajorFortuneOrdinalRejectedEvidence {
  return { evidenceId, reason, detail };
}

function resolveBand(
  score: number,
  bands: MajorFortuneOrdinalKnowledge["bands"]["bands"],
): MajorFortuneOrdinalBandId {
  for (const band of bands) {
    if (score >= band.minInclusive && score <= band.maxInclusive) {
      return band.bandId;
    }
  }
  throw new Error(`score ${score} falls outside configured bands`);
}

function familyById(
  knowledge: MajorFortuneOrdinalKnowledge,
  id: string,
): MajorFortuneOrdinalSignalFamily | undefined {
  return knowledge.signalFamilyPolicy.families.find((f) => f.signalFamilyId === id);
}

function ownershipPillarForKind(
  knowledge: MajorFortuneOrdinalKnowledge,
  physicalFactKind: string | undefined,
): MajorFortuneOrdinalPillarId | null {
  if (!physicalFactKind) return null;
  const row = knowledge.crossPillarOwnership.ownership.find(
    (o) => o.physicalFactKind === physicalFactKind,
  );
  return row?.ownerPillarId ?? null;
}

function transformationTupleComplete(
  evidence: MajorFortuneOrdinalEvidence,
  fields: string[],
): boolean {
  const tuple = evidence.transformationTuple;
  if (!tuple) return false;
  for (const field of fields) {
    const value = (tuple as unknown as Record<string, string>)[field];
    if (typeof value !== "string" || value.trim() === "") return false;
  }
  return true;
}

function massForStrength(
  knowledge: MajorFortuneOrdinalKnowledge,
  strength: MajorFortuneOrdinalEvidence["strength"],
): number {
  return knowledge.formula.massWeights[strength];
}

function emptyPillar(
  budget: number,
  state: MajorFortuneOrdinalPillarResult["state"],
  reasonCodes: string[],
  rejected: MajorFortuneOrdinalRejectedEvidence[] = [],
): MajorFortuneOrdinalPillarResult {
  return {
    budget,
    level: state === "unavailable" || state === "partial-data" ? null : 0,
    delta: 0,
    state,
    supportMass: 0,
    pressureMass: 0,
    acceptedEvidenceIds: [],
    rejectedEvidence: rejected,
    physicalFactIds: [],
    reasonCodes,
  };
}

function unavailableModuleResult(
  school: MajorFortuneOrdinalEvaluationInput["school"],
  knowledge: MajorFortuneOrdinalKnowledge | null,
  invalidContract: string[],
): MajorFortuneOrdinalResult {
  const pillars = {} as Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarResult>;
  for (const pillarId of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    pillars[pillarId] = emptyPillar(
      MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS[pillarId],
      "unavailable",
      ["invalid-contract"],
    );
  }
  return {
    module: "major-fortune",
    model: "v0.3-ordinal",
    school,
    status: "unavailable",
    score: null,
    band: null,
    scoreState: "unavailable",
    coverage: {
      coverageWeight: 0,
      evaluablePillarIds: [],
      missingPillarIds: [...MAJOR_FORTUNE_ORDINAL_PILLAR_IDS],
      partialPillarIds: [],
    },
    pillars,
    versions: {
      contractVersion: knowledge?.manifest.contractVersion ?? "0.3.0",
      engineVersion: knowledge?.manifest.engineVersion ?? "0.3.0-ordinal",
      knowledgeVersion: knowledge?.manifest.knowledgeVersion ?? "0.3.0",
      formulaVersion: knowledge?.manifest.formulaVersion ?? "v0.3-ordinal-four-pillar",
    },
    diagnostics: {
      rejectedEvidenceCount: 0,
      acceptedEvidenceCount: 0,
      duplicatePhysicalFactRejects: 0,
      duplicateClusterRejects: 0,
      excludedTemporalRejects: 0,
      schoolGateRejects: 0,
      invalidContract,
    },
    trace: {
      formulaVersion: knowledge?.manifest.formulaVersion ?? "v0.3-ordinal-four-pillar",
      modelNature: knowledge?.governance.modelNature ?? "engineering-heuristic",
      numericAuthority: knowledge?.governance.numericAuthority ?? "engineering-defined",
      baseScore: 50,
      pillarDeltas: {
        "thien-thoi": 0,
        "dia-loi": 0,
        "nhan-hoa": 0,
        "tu-hoa-sat-tinh": 0,
      },
      sumDelta: 0,
      rawScoreBeforeClamp: 50,
      yearInCycleIgnored: true,
      forbidsPerRuleRawDelta: true,
    },
  };
}

/**
 * Evaluate Major Fortune V0.3 ordinal score from normalized evidence.
 * Does not read ChartData, files, env, or wall-clock time.
 */
export function evaluateMajorFortuneOrdinal(
  input: MajorFortuneOrdinalEvaluationInput,
): MajorFortuneOrdinalResult {
  // Immutability: never mutate caller structures.
  const evidenceSnapshot = input.evidence.map((e) => ({ ...e, schoolScope: [...e.schoolScope], factIds: [...e.factIds], sourceIds: [...e.sourceIds], claimIds: [...e.claimIds] }));
  deepFreezeProbe(input);

  let knowledge: MajorFortuneOrdinalKnowledge;
  if (input.contract) {
    const validation = validateMajorFortuneOrdinalKnowledge(input.contract);
    if (!validation.ok) {
      return unavailableModuleResult(
        input.school,
        input.contract,
        validation.issues.map((i) => `${i.path}: ${i.message}`),
      );
    }
    knowledge = input.contract;
  } else {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) {
      return unavailableModuleResult(
        input.school,
        null,
        loaded.issues.map((i) => `${i.path}: ${i.message}`),
      );
    }
    knowledge = loaded.knowledge as MajorFortuneOrdinalKnowledge;
  }

  const budgetSum = knowledge.formula.pillars.reduce((s, p) => s + p.budget, 0);
  if (budgetSum !== 100) {
    return unavailableModuleResult(input.school, knowledge, [
      `formula.pillars budgets must sum to 100, got ${budgetSum}`,
    ]);
  }

  const familyLookup = new Map(
    knowledge.signalFamilyPolicy.families.map((f) => [f.signalFamilyId, f]),
  );
  const excludedFamilies = new Set(knowledge.exclusionRegistry.excludedSignalFamilyIds);
  const excludedTemporal = new Set(knowledge.exclusionRegistry.excludedTemporalScopes);
  const schoolProfile = knowledge.schoolCapabilityMatrix.profiles[input.school];

  const pillars = {} as Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarResult>;
  const pillarDeltas = {} as Record<MajorFortuneOrdinalPillarId, number>;

  let acceptedEvidenceCount = 0;
  let rejectedEvidenceCount = 0;
  let duplicatePhysicalFactRejects = 0;
  let duplicateClusterRejects = 0;
  let excludedTemporalRejects = 0;
  let schoolGateRejects = 0;

  const globalPhysicalOwner = new Map<string, MajorFortuneOrdinalPillarId>();

  for (const pillarId of MAJOR_FORTUNE_ORDINAL_PILLAR_IDS) {
    const budget =
      knowledge.formula.pillars.find((p) => p.pillarId === pillarId)?.budget ??
      MAJOR_FORTUNE_ORDINAL_REQUIRED_BUDGETS[pillarId];
    const ctx = input.pillarContexts[pillarId];
    if (!ctx) {
      pillars[pillarId] = emptyPillar(budget, "unavailable", ["missing-pillar-context"]);
      pillarDeltas[pillarId] = 0;
      continue;
    }

    if (ctx.availability === "unavailable") {
      pillars[pillarId] = emptyPillar(budget, "unavailable", [
        ...(ctx.reasonCodes ?? ["pillar-unavailable"]),
      ]);
      pillarDeltas[pillarId] = 0;
      continue;
    }

    const rejected: MajorFortuneOrdinalRejectedEvidence[] = [];
    const accepted: MajorFortuneOrdinalEvidence[] = [];
    const seenPhysical = new Set<string>();
    const seenCluster = new Set<string>();

    const candidates = evidenceSnapshot.filter((e) => e.pillarId === pillarId);

    for (const evidence of candidates) {
      if (!evidence.evidenceId || !evidence.physicalFactId || !evidence.evidenceClusterId) {
        rejected.push(reject(evidence.evidenceId || "?", "invalid-evidence", "missing identity fields"));
        continue;
      }

      if (evidence.policyStatus === "blocked") {
        rejected.push(reject(evidence.evidenceId, "blocked-policy", evidence.reasonCode));
        continue;
      }
      if (evidence.policyStatus === "excluded") {
        rejected.push(reject(evidence.evidenceId, "excluded-policy", evidence.reasonCode));
        continue;
      }

      if (excludedFamilies.has(evidence.signalFamilyId)) {
        rejected.push(
          reject(evidence.evidenceId, "excluded-signal-family", evidence.signalFamilyId),
        );
        continue;
      }

      if (excludedTemporal.has(evidence.temporalScope)) {
        excludedTemporalRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "excluded-temporal-scope", evidence.temporalScope),
        );
        continue;
      }

      if (!evidence.schoolScope.includes(input.school)) {
        schoolGateRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "school-scope-mismatch", `school=${input.school}`),
        );
        continue;
      }

      const family = familyLookup.get(evidence.signalFamilyId) ?? familyById(knowledge, evidence.signalFamilyId);
      if (!family) {
        rejected.push(
          reject(evidence.evidenceId, "excluded-signal-family", `unknown family ${evidence.signalFamilyId}`),
        );
        continue;
      }

      if (family.pillarId !== pillarId) {
        rejected.push(
          reject(
            evidence.evidenceId,
            "pillar-family-mismatch",
            `${evidence.signalFamilyId} belongs to ${family.pillarId}`,
          ),
        );
        continue;
      }

      if (!family.schoolScope.includes(input.school)) {
        if (
          evidence.signalFamilyId === "major-fortune-transformations" &&
          input.school === "nam-phai"
        ) {
          schoolGateRejects += 1;
          rejected.push(
            reject(
              evidence.evidenceId,
              "nam-phai-transformation-unavailable",
              "Nam Phái transformations unavailable until Calculation Core supports them",
            ),
          );
          continue;
        }
        schoolGateRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "school-scope-mismatch", `family schoolScope`),
        );
        continue;
      }

      if (
        evidence.signalFamilyId === "major-fortune-transformations" &&
        input.school === "nam-phai"
      ) {
        schoolGateRejects += 1;
        rejected.push(
          reject(
            evidence.evidenceId,
            "nam-phai-transformation-unavailable",
            "Nam Phái transformations unavailable until Calculation Core supports them",
          ),
        );
        continue;
      }

      if (
        evidence.signalFamilyId === "major-fortune-transformations" &&
        !schoolProfile.supportsMajorFortuneTransformations
      ) {
        schoolGateRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "unsupported-school-family", evidence.signalFamilyId),
        );
        continue;
      }

      if (family.requiresCompleteTransformationTuple) {
        const fields = family.transformationTupleFields ?? [
          "fortuneStem",
          "transformationType",
          "transformedStar",
          "targetPalace",
        ];
        if (!transformationTupleComplete(evidence, fields)) {
          rejected.push(
            reject(
              evidence.evidenceId,
              "incomplete-transformation-tuple",
              `requires ${fields.join(",")}`,
            ),
          );
          continue;
        }
      }

      const owner = ownershipPillarForKind(knowledge, evidence.physicalFactKind);
      if (owner && owner !== pillarId) {
        rejected.push(
          reject(
            evidence.evidenceId,
            "cross-pillar-ownership-violation",
            `${evidence.physicalFactKind} owned by ${owner}`,
          ),
        );
        continue;
      }

      const priorOwner = globalPhysicalOwner.get(evidence.physicalFactId);
      if (priorOwner && priorOwner !== pillarId) {
        rejected.push(
          reject(
            evidence.evidenceId,
            "cross-pillar-ownership-violation",
            `physicalFact ${evidence.physicalFactId} already owned by ${priorOwner}`,
          ),
        );
        continue;
      }

      if (seenPhysical.has(evidence.physicalFactId)) {
        duplicatePhysicalFactRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "duplicate-physical-fact", evidence.physicalFactId),
        );
        continue;
      }

      if (seenCluster.has(evidence.evidenceClusterId)) {
        duplicateClusterRejects += 1;
        rejected.push(
          reject(evidence.evidenceId, "duplicate-evidence-cluster", evidence.evidenceClusterId),
        );
        continue;
      }

      seenPhysical.add(evidence.physicalFactId);
      seenCluster.add(evidence.evidenceClusterId);
      globalPhysicalOwner.set(evidence.physicalFactId, pillarId);
      accepted.push(evidence);
    }

    let supportMass = 0;
    let pressureMass = 0;
    for (const evidence of accepted) {
      const mass = massForStrength(knowledge, evidence.strength);
      if (evidence.direction === "support") supportMass += mass;
      else pressureMass += mass;
    }

    const netMass = supportMass - pressureMass;
    const level: MajorFortuneOrdinalLevel =
      ctx.availability === "partial-data" && accepted.length === 0
        ? 0
        : clampOrdinalLevel(netMass);
    // Public evaluator never emits non-ordinal levels; clampOrdinalLevel enforces {-2..2}.
    if (![ -2, -1, 0, 1, 2 ].includes(level)) {
      throw new Error(`impossible non-ordinal level ${String(level)}`);
    }

    const delta =
      ctx.availability === "partial-data" && accepted.length === 0
        ? 0
        : (budget * level) / knowledge.formula.ordinalDivisor;

    const state = classifyPillarState({
      availability: ctx.availability,
      acceptedCount: accepted.length,
      supportMass,
      pressureMass,
      level: ctx.availability === "partial-data" && accepted.length === 0 ? null : level,
    });

    // partial-data with no accepted evidence: level null, zero delta (coverage reduced)
    const finalLevel =
      state === "partial-data" && accepted.length === 0 ? null : level;
    const finalDelta = finalLevel == null ? 0 : delta;

    acceptedEvidenceCount += accepted.length;
    rejectedEvidenceCount += rejected.length;

    pillars[pillarId] = {
      budget,
      level: finalLevel,
      delta: finalDelta,
      state,
      supportMass,
      pressureMass,
      acceptedEvidenceIds: accepted.map((e) => e.evidenceId),
      rejectedEvidence: rejected,
      physicalFactIds: accepted.map((e) => e.physicalFactId),
      reasonCodes: [
        ...(ctx.reasonCodes ?? []),
        ...rejected.map((r) => r.reason),
      ],
    };
    pillarDeltas[pillarId] = finalDelta;
  }

  const evaluablePillarIds = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.filter((id) => {
    const state = pillars[id]!.state;
    return state !== "unavailable";
  });
  const missingPillarIds = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.filter(
    (id) => pillars[id]!.state === "unavailable",
  );
  const partialPillarIds = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.filter(
    (id) => pillars[id]!.state === "partial-data",
  );

  // Coverage: budgets for pillars with evaluable context / 100. Partial still evaluable.
  const coverageWeight =
    evaluablePillarIds.reduce((sum, id) => sum + pillars[id]!.budget, 0) / 100;

  const sumDelta = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.reduce(
    (sum, id) => sum + pillarDeltas[id]!,
    0,
  );
  const rawScoreBeforeClamp = knowledge.formula.baseScore + sumDelta;

  let status: MajorFortuneOrdinalResult["status"] = "available";
  if (missingPillarIds.length === MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.length) {
    status = "unavailable";
  } else if (missingPillarIds.length > 0 || partialPillarIds.length > 0) {
    status = "partial";
  }

  let score: number | null = null;
  let band: MajorFortuneOrdinalBandId | null = null;
  if (status !== "unavailable") {
    score = roundToDecimals(
      clamp(
        rawScoreBeforeClamp,
        knowledge.formula.scoreMinimum,
        knowledge.formula.scoreMaximum,
      ),
      knowledge.formula.scorePrecisionDecimals,
    );
    band = resolveBand(score, knowledge.bands.bands);
  }

  const anyClassifiedPillar = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.some(
    (id) => pillars[id]!.state === "classified",
  );
  const anyBalancedPillar = MAJOR_FORTUNE_ORDINAL_PILLAR_IDS.some(
    (id) => pillars[id]!.state === "balanced-signal",
  );

  const scoreState = classifyModuleScoreState({
    status,
    acceptedEvidenceCount,
    score,
    baseScore: knowledge.formula.baseScore,
    anyClassifiedPillar,
    anyBalancedPillar,
  });

  return {
    module: "major-fortune",
    model: "v0.3-ordinal",
    school: input.school,
    status,
    score,
    band,
    scoreState,
    coverage: {
      coverageWeight: roundToDecimals(coverageWeight, 4),
      evaluablePillarIds,
      missingPillarIds,
      partialPillarIds,
    },
    pillars,
    versions: {
      contractVersion: knowledge.manifest.contractVersion,
      engineVersion: knowledge.manifest.engineVersion,
      knowledgeVersion: knowledge.manifest.knowledgeVersion,
      formulaVersion: knowledge.manifest.formulaVersion,
    },
    diagnostics: {
      rejectedEvidenceCount,
      acceptedEvidenceCount,
      duplicatePhysicalFactRejects,
      duplicateClusterRejects,
      excludedTemporalRejects,
      schoolGateRejects,
      invalidContract: [],
    },
    trace: {
      formulaVersion: knowledge.manifest.formulaVersion,
      modelNature: knowledge.governance.modelNature,
      numericAuthority: knowledge.governance.numericAuthority,
      baseScore: knowledge.formula.baseScore,
      pillarDeltas,
      sumDelta,
      rawScoreBeforeClamp,
      yearInCycleIgnored: input.yearInCycle !== undefined,
      forbidsPerRuleRawDelta: true,
    },
  };
}
