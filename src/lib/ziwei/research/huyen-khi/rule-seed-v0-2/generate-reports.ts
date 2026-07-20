import fs from "node:fs";
import path from "node:path";

import { loadHuyenKhiOntology } from "../ontology/load-ontology";
import {
  countFixtureMaturity,
  countFixtureStatuses,
  promotionContext,
} from "../ontology/validate-fixture";
import type { HuyenKhiExpertFixturePlan } from "../ontology/types";
import { REPORTS_DIR } from "./paths";

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function generateReports(data: any) {
  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    throw new Error("Cannot generate V0.2 reports: ontology V0.1 is invalid");
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const write = (file: string, content: unknown) =>
    fs.writeFileSync(
      path.join(REPORTS_DIR, file),
      `${JSON.stringify(content, null, 2)}\n`,
    );

  const topics = data.topics.topics as any[];
  const extractions = data.extractions.extractions as any[];
  const rules = data.rules.rules as any[];
  const fixtures = data.fixtures as HuyenKhiExpertFixturePlan;
  const batches = data.batches.batches as any[];

  const candidateLocatedTopics = topics.filter(
    (topic) => topic.evidenceStatus === "candidate-located",
  ).length;
  const witnessVerifiedTopics = topics.filter(
    (topic) => topic.evidenceStatus === "witness-verified",
  ).length;
  const sourceReviewedTopics = topics.filter(
    (topic) => topic.evidenceStatus === "source-reviewed",
  ).length;

  write("topic-coverage-report.v0.2.json", {
    schemaVersion: "0.2.0",
    totalTopics: topics.length,
    candidateLocatedTopics,
    witnessVerifiedTopics,
    sourceReviewedTopics,
    unresolvedTopics: topics.filter((topic) => topic.evidenceStatus === "unresolved")
      .length,
    canonicalTopicContractVersion: data.topics.ontologyTopicContractVersion,
  });

  write("source-extraction-report.v0.2.json", {
    schemaVersion: "0.2.0",
    totalExtractions: extractions.length,
    candidateLocated: extractions.filter((entry) =>
      entry.verificationFlags.includes("candidate-located"),
    ).length,
    witnessVerified: extractions.filter((entry) =>
      entry.verificationFlags.includes("witness-verified"),
    ).length,
    sourceReviewed: extractions.filter((entry) =>
      entry.verificationFlags.includes("source-reviewed"),
    ).length,
    sourceIds: unique(extractions.map((entry) => entry.sourceId)),
  });

  const extractedSources = new Set(extractions.map((entry) => entry.sourceId));
  const traceableRules = rules.filter(
    (rule) =>
      Array.isArray(rule.sourceIds) &&
      rule.sourceIds.length > 0 &&
      rule.sourceIds.every((sourceId: string) => extractedSources.has(sourceId)),
  ).length;
  write("candidate-rule-report.v0.2.json", {
    schemaVersion: "0.2.0",
    totalRules: rules.length,
    traceableRules,
    traceabilityRate: rules.length === 0 ? 0 : traceableRules / rules.length,
    effectiveRules: 0,
    catalogEffective: data.rules.effective,
    note: "Candidate rules are research records only and are never loaded as effective ontology knowledge.",
  });

  const maturity = countFixtureMaturity(fixtures);
  const status = countFixtureStatuses(
    fixtures,
    promotionContext(loaded.ontology),
  );
  write("fixture-readiness-report.v0.2.json", {
    schemaVersion: "0.2.0",
    materializedFixtures: fixtures.fixtures.length,
    ...maturity,
    derivedStatus: status,
    canonicalPlannedTemplateCount:
      loaded.ontology.fixturePlan.fixtures.length,
    note: "V0.2 materializes only evidence-linked fixtures; planned templates remain canonical in ontology V0.1.",
  });

  write("review-work-queue-report.v0.2.json", {
    schemaVersion: "0.2.0",
    batchCount: batches.length,
    queuedFixtureIds: unique(
      batches.flatMap((batch) => batch.fixtureIds as string[]),
    ),
    requiredReviewerRoles: unique(
      batches.flatMap((batch) => batch.requiredReviewerRoles as string[]),
    ),
  });

  const gates = loaded.ontology.releaseGates.symbolicEvaluatorPhasePromotionGates;
  const blockers: string[] = [];
  if (status.approvedForPromotion < gates.approvedExpertFixtureCountMin) {
    blockers.push(
      `approved expert fixtures ${status.approvedForPromotion}/${gates.approvedExpertFixtureCountMin}`,
    );
  }
  if (maturity.researchReady < gates.researchReadyFixtureCountMin) {
    blockers.push(
      `research-ready fixtures ${maturity.researchReady}/${gates.researchReadyFixtureCountMin}`,
    );
  }
  if (sourceReviewedTopics < gates.sourceReviewedMajorStarCoverageMin) {
    blockers.push(
      `source-reviewed major-star topics ${sourceReviewedTopics}/${gates.sourceReviewedMajorStarCoverageMin}`,
    );
  }

  write("promotion-gate-snapshot.v0.2.json", {
    schemaVersion: "0.2.0",
    approvedExpertFixtureCount: status.approvedForPromotion,
    researchReadyFixtureCount: maturity.researchReady,
    witnessVerifiedExtractionCount: extractions.filter((entry) =>
      entry.verificationFlags.includes("witness-verified"),
    ).length,
    sourceReviewedTopicCount: sourceReviewedTopics,
    symbolicEvaluatorPhaseUnlocked: blockers.length === 0,
    blockers,
    productionRuntimeUnlocked: false,
  });
}
