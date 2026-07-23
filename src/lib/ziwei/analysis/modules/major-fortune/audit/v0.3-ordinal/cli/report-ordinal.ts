/**
 * Write deterministic Major Fortune V0.3 ordinal summary report.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadMajorFortuneOrdinalKnowledge,
  type MajorFortuneOrdinalPillarId,
} from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { evaluateMajorFortuneOrdinal } from "../../../v0.3-ordinal";
import type { MajorFortuneOrdinalEvidence } from "../../../v0.3-ordinal";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-ordinal-contract");

function allAvailable() {
  return {
    "thien-thoi": { availability: "available" as const },
    "dia-loi": { availability: "available" as const },
    "nhan-hoa": { availability: "available" as const },
    "tu-hoa-sat-tinh": { availability: "available" as const },
  };
}

function ev(
  partial: Partial<MajorFortuneOrdinalEvidence> &
    Pick<
      MajorFortuneOrdinalEvidence,
      | "evidenceId"
      | "physicalFactId"
      | "evidenceClusterId"
      | "pillarId"
      | "signalFamilyId"
      | "direction"
    >,
): MajorFortuneOrdinalEvidence {
  return {
    strength: "normal",
    temporalScope: "major-fortune",
    factIds: [partial.physicalFactId],
    sourceIds: ["SRC-MF-V03-ENG-001"],
    claimIds: ["CLM-MF-V03-ENG-001"],
    policyStatus: "research-admitted",
    schoolScope: ["nam-phai", "trung-chau"],
    reasonCode: "report-fixture",
    ...partial,
  };
}

function main(): void {
  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) {
    console.error(loaded.issues);
    process.exit(1);
  }

  const fixtures: Array<{ id: string; score: number | null; scoreState: string }> = [];

  const noSignal = evaluateMajorFortuneOrdinal({
    school: "nam-phai",
    evidence: [],
    pillarContexts: allAvailable(),
  });
  fixtures.push({ id: "no-signal", score: noSignal.score, scoreState: noSignal.scoreState });

  const allPlus: MajorFortuneOrdinalEvidence[] = [];
  const specs: Array<[MajorFortuneOrdinalPillarId, string, string]> = [
    ["thien-thoi", "element-relation", "element-relation"],
    ["dia-loi", "principal-star-dignity", "principal-star-dignity"],
    ["nhan-hoa", "support-pressure-auxiliary-sets", "auxiliary-set-member"],
    ["tu-hoa-sat-tinh", "severe-pressure-evidence", "severe-pressure"],
  ];
  for (const [pillarId, family, kind] of specs) {
    allPlus.push(
      ev({
        evidenceId: `${pillarId}-s`,
        physicalFactId: `${pillarId}-pf`,
        evidenceClusterId: `${pillarId}-cl`,
        pillarId,
        signalFamilyId: family,
        direction: "support",
        strength: "strong",
        physicalFactKind: kind,
      }),
    );
  }
  const plus = evaluateMajorFortuneOrdinal({
    school: "nam-phai",
    evidence: allPlus,
    pillarContexts: allAvailable(),
  });
  fixtures.push({ id: "all-plus-2", score: plus.score, scoreState: plus.scoreState });

  const allMinus = allPlus.map((e) => ({ ...e, direction: "pressure" as const, evidenceId: `${e.evidenceId}-neg`, physicalFactId: `${e.physicalFactId}-neg`, evidenceClusterId: `${e.evidenceClusterId}-neg` }));
  const minus = evaluateMajorFortuneOrdinal({
    school: "nam-phai",
    evidence: allMinus,
    pillarContexts: allAvailable(),
  });
  fixtures.push({ id: "all-minus-2", score: minus.score, scoreState: minus.scoreState });

  const decision = JSON.parse(readFileSync(join(PACK, "reports/decision.json"), "utf8"));
  const summary = {
    schemaVersion: "0.3.0",
    modelId: loaded.knowledge.manifest.modelId,
    readinessDecision: decision.readinessDecision,
    governance: {
      modelNature: loaded.knowledge.governance.modelNature,
      doctrineRelationship: loaded.knowledge.governance.doctrineRelationship,
      numericAuthority: loaded.knowledge.governance.numericAuthority,
      productionStatus: loaded.knowledge.governance.productionStatus,
    },
    budgets: Object.fromEntries(
      loaded.knowledge.formula.pillars.map((p) => [p.pillarId, p.budget]),
    ),
    formulaVersion: loaded.knowledge.manifest.formulaVersion,
    forbidsPerRuleRawDelta: true,
    fixtureSpotChecks: fixtures,
    excludedTemporalScopes: loaded.knowledge.exclusionRegistry.excludedTemporalScopes,
    excludedSignalFamilyCount:
      loaded.knowledge.exclusionRegistry.excludedSignalFamilyIds.length,
  };

  writeFileSync(join(PACK, "reports/summary-report.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
