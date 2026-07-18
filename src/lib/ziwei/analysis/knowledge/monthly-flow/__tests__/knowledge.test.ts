import { describe, expect, it } from "vitest";
import {
  loadMonthlyFlowScoringKnowledgeV0,
  resetMonthlyFlowScoringKnowledgeCache,
  validateMonthlyFlowScoringKnowledge,
} from "../index";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";

describe("monthly-flow scoring knowledge V0", () => {
  it("loads and validates cleanly", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error(loaded.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    }
  });

  it("covers exactly the six Annual Axes domains", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const domains = loaded.knowledge.domainDefinitions.domains.map((d) => d.domain);
    expect(new Set(domains)).toEqual(new Set(ANNUAL_AXIS_DOMAINS));
    expect(domains).toHaveLength(6);
  });

  it("has contiguous bands over 0-100", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const bands = [...loaded.knowledge.scoringProfile.output.bands].sort(
      (a, b) => a.minInclusive - b.minInclusive,
    );
    let expected = loaded.knowledge.scoringProfile.output.scoreMin;
    for (const band of bands) {
      expect(band.minInclusive).toBe(expected);
      expected = band.maxExclusive ?? band.maxInclusive ?? expected;
    }
    expect(expected).toBe(loaded.knowledge.scoringProfile.output.scoreMax);
  });

  it("has globally unique ruleIds across every catalog", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const k = loaded.knowledge;
    const ids = [
      ...k.focusMarkers.records.map((r) => r.ruleId),
      ...k.transformationImpact.records.map((r) => r.ruleId),
      ...k.movingStars.records.map((r) => r.ruleId),
      ...k.calendarRelations.records.map((r) => r.ruleId),
      ...k.interactionRules.records.map((r) => r.ruleId),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps calendar relations, interactions, and moving stars disabled", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    expect(loaded.knowledge.calendarRelations.defaultEnabled).toBe(false);
    expect(loaded.knowledge.interactionRules.defaultEnabled).toBe(false);
    expect(loaded.knowledge.movingStars.defaultEnabled).toBe(false);
    for (const rule of loaded.knowledge.calendarRelations.records) {
      expect(rule.enabled).toBe(false);
    }
    for (const rule of loaded.knowledge.interactionRules.records) {
      expect(rule.enabled).toBe(false);
    }
    for (const rule of loaded.knowledge.movingStars.records) {
      expect(rule.enabled).toBe(false);
    }
  });

  it("forbids natal palace name fallback and calendar/focus inference", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    expect(loaded.knowledge.domainDefinitions.availability.natalPalaceNameFallbackAllowed).toBe(
      false,
    );
    expect(loaded.knowledge.identityPolicy.coordinateIndependence.inferCalendarFromFocusPalace).toBe(
      false,
    );
    expect(
      loaded.knowledge.identityPolicy.coordinateIndependence.inferFocusPalaceFromCalendarBranch,
    ).toBe(false);
  });

  it("keeps Nam Phái six-axis overlay unavailable from ChartData", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    expect(
      loaded.knowledge.schoolCapabilities.profiles["nam-phai"].supportsSixAxisOverlayFromCurrentChart,
    ).toBe(false);
  });

  it("covers experimental coefficients with a formula_design source", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const hasArchSource = loaded.knowledge.sourceRegistry.sources.some(
      (s) => s.sourceType === "internal_architecture" && s.allowedUsage.includes("formula_design"),
    );
    expect(hasArchSource).toBe(true);
  });

  it("rejects a knowledge object with an enabled interaction rule", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const tampered = {
      ...loaded.knowledge,
      interactionRules: {
        ...loaded.knowledge.interactionRules,
        records: loaded.knowledge.interactionRules.records.map((r, i) =>
          i === 0 ? { ...r, enabled: true } : r,
        ),
      },
    };
    expect(validateMonthlyFlowScoringKnowledge(tampered).ok).toBe(false);
  });

  it("deep-freezes knowledge so a caller cannot poison later analyses", () => {
    resetMonthlyFlowScoringKnowledgeCache();
    const first = loadMonthlyFlowScoringKnowledgeV0();
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const originalId = first.knowledge.scoringProfile.profileId;
    expect(() => {
      (first.knowledge.scoringProfile as { profileId: string }).profileId = "hacked";
    }).toThrow();

    const second = loadMonthlyFlowScoringKnowledgeV0();
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.knowledge.scoringProfile.profileId).toBe(originalId);
    expect(second.knowledge.scoringProfile.profileId).not.toBe("hacked");
  });
});
