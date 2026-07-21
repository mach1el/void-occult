import { describe, expect, it } from "vitest";

import { loadRuleSeed } from "../load-rule-seed";
import { validateCandidateRules } from "../validate-candidate-rules";
import { validateExtractions } from "../validate-extractions";
import { validateFixtureMaterialization } from "../validate-fixture-materialization";
import { validateTopicCoverage } from "../validate-topic-coverage";

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe("Huyền Khí Rule Seed V0.2", () => {
  it("passes every fail-closed pack validator", () => {
    const data = loadRuleSeed();
    for (const result of [
      validateTopicCoverage(data),
      validateExtractions(data),
      validateCandidateRules(data),
      validateFixtureMaterialization(data),
    ]) {
      expect(result.issues, JSON.stringify(result.issues, null, 2)).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it("keeps exactly the canonical 28 ontology topics", () => {
    const data = loadRuleSeed();
    expect(data.topics.topics).toHaveLength(28);
    expect(new Set(data.topics.topics.map((topic: any) => topic.topicId)).size).toBe(28);
    expect(data.topics.topics.filter((topic: any) => topic.evidenceStatus === "candidate-located")).toHaveLength(1);
    expect(data.topics.topics.filter((topic: any) => topic.evidenceStatus === "unresolved")).toHaveLength(27);
  });

  it("keeps candidate rules traceable and non-effective", () => {
    const data = loadRuleSeed();
    expect(data.rules.effective).toBe(false);
    expect(data.rules.rules).toHaveLength(1);
    expect(data.rules.rules[0]).not.toHaveProperty("effective");
    expect(data.rules.rules[0].sourceIds).toEqual([
      "HK-SRC-CLASSIC-TRANSCRIPTION-001",
    ]);
  });

  it("materializes only the evidence-linked research-ready fixture", () => {
    const data = loadRuleSeed();
    expect(data.fixtures.fixtures).toHaveLength(1);
    expect(data.fixtures.fixtures[0]).toMatchObject({
      fixtureId: "HK-FIX-001-MAJOR-MIEU-SUPPORT",
      maturity: "research-ready",
      reviews: [],
    });
  });

  it("rejects a fixture that drops a canonical required field", () => {
    const data = clone(loadRuleSeed());
    delete data.fixtures.fixtures[0].title;
    const result = validateFixtureMaterialization(data);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "schema-invalid")).toBe(true);
  });

  it("rejects an extraction with an unregistered source or placeholder excerpt", () => {
    const data = clone(loadRuleSeed());
    data.extractions.extractions[0].sourceId = "SRC-FAKE";
    data.extractions.extractions[0].excerpt = "Tử Vi...";
    const result = validateExtractions(data);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "EXT_UNRESOLVED_SOURCE",
        "EXT_PLACEHOLDER_EXCERPT",
        "EXT_LOCATOR_SOURCE_MISMATCH",
      ]),
    );
  });

  it("flags short ellipsis excerpts as both missing and placeholder", () => {
    // Regression for PR #97: length gate must not short-circuit placeholder detection.
    const data = clone(loadRuleSeed());
    data.extractions.extractions[0].excerpt = "Tử Vi...";
    const codes = validateExtractions(data).issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining(["EXT_MISSING_EXCERPT", "EXT_PLACEHOLDER_EXCERPT"]),
    );
  });

  it("rejects a long ellipsis excerpt as placeholder without missing-excerpt", () => {
    const data = clone(loadRuleSeed());
    data.extractions.extractions[0].excerpt =
      "Tử Vi tại cung Mệnh xem miếu vượng...";
    const codes = validateExtractions(data).issues.map((issue) => issue.code);
    expect(codes).toContain("EXT_PLACEHOLDER_EXCERPT");
    expect(codes).not.toContain("EXT_MISSING_EXCERPT");
  });
  it("rejects a schema-invalid candidate rule", () => {
    const data = clone(loadRuleSeed());
    data.rules.rules[0].subject = "Tử Vi";
    const result = validateCandidateRules(data);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "schema-invalid")).toBe(true);
  });

  it("rejects non-canonical topic drift", () => {
    const data = clone(loadRuleSeed());
    data.topics.topics[0].topicId = "HK-TOPIC-PLACEHOLDER";
    const result = validateTopicCoverage(data);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["TOPIC_MISSING_CANONICAL", "TOPIC_UNKNOWN"]),
    );
  });
});
