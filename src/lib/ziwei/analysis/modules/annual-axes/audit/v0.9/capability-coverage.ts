import type { AnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";
import type { AnnualRuleCoverageRecord, RuleCoverageStatus } from "./rule-coverage";
import type { StarEmissionRecordV09 } from "./corpus-collection";

export interface AnnualCapabilityCoverageRecord {
  exactStarName: string;
  temporalLayer: "annual";
  supportStatus: "supported" | "unsupported" | "research-only";
  producer: string | null;
  rationale: string;
  referencingRuleIds: string[];
  /** Physical annual-layer emission anywhere in the corpus, independent of
   * whether any rule/domain palace ever matched it. */
  emissionCount: number;
  emittingChartCount: number;
  /** Sum of each referencing rule's corpus match count — i.e. the star was
   * not just emitted, but landed inside a configured domain palace. */
  configuredPalaceMatchCount: number;
  coverageStatus: RuleCoverageStatus;
  coverageExplanation: string;
}

/**
 * Every entry in the production annual-star capability catalog
 * (`starCapabilities`), cross-referenced against (a) which registry rules
 * reference it, (b) whether the corpus ever physically emitted it, and (c)
 * whether it ever reached a configured domain palace. This is what lets the
 * audit distinguish "producer unreachable" (unsupported, emissionCount
 * always 0) from "producer available but corpus never generated it"
 * (supported, emissionCount 0) from "star emitted but never reached a
 * configured domain palace" (supported, emissionCount > 0 but
 * configuredPalaceMatchCount 0).
 */
export function buildCapabilityCoverageV09(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  ruleCoverage: AnnualRuleCoverageRecord[],
  starEmissions: Map<string, StarEmissionRecordV09>,
): AnnualCapabilityCoverageRecord[] {
  return knowledge.starCapabilities.capabilities
    .map((capability): AnnualCapabilityCoverageRecord => {
      const referencing = ruleCoverage.filter((r) => r.starName === capability.exactStarName);
      const referencingRuleIds = [...new Set(referencing.map((r) => r.ruleId))].sort((a, b) =>
        a.localeCompare(b),
      );
      const emission = starEmissions.get(capability.exactStarName);
      const emissionCount = emission?.emissionCount ?? 0;
      const emittingChartCount = emission?.emittingChartIds.size ?? 0;
      const configuredPalaceMatchCount = referencing.reduce((s, r) => s + r.corpusMatchCount, 0);

      let coverageStatus: RuleCoverageStatus;
      let coverageExplanation: string;

      if (capability.supportStatus === "unsupported") {
        coverageStatus = "unsupported";
        coverageExplanation =
          emissionCount === 0
            ? "Producer unreachable: Calculation Core never emits this exact annual identity (verified by zero corpus emissions)."
            : "Producer marked unsupported in the capability catalog despite unexpected corpus emissions — capability catalog needs re-review.";
      } else if (referencingRuleIds.length === 0) {
        coverageStatus = "unreachable";
        coverageExplanation =
          "No active scoring rule references this exact star name; it cannot contribute to any domain regardless of emission.";
      } else if (emissionCount === 0) {
        coverageStatus = "never-observed";
        coverageExplanation =
          "Producer is available and a scoring rule references it, but the deterministic corpus never generated this exact annual identity.";
      } else if (configuredPalaceMatchCount === 0) {
        coverageStatus = "unreachable";
        coverageExplanation =
          "Star was physically emitted in the corpus, but never inside a configured domain palace for any referencing rule.";
      } else {
        coverageStatus = "observed";
        coverageExplanation = "Star was emitted and matched inside a configured domain palace.";
      }

      return {
        exactStarName: capability.exactStarName,
        temporalLayer: capability.temporalLayer,
        supportStatus: capability.supportStatus,
        producer: capability.producer ?? null,
        rationale: capability.rationale,
        referencingRuleIds,
        emissionCount,
        emittingChartCount,
        configuredPalaceMatchCount,
        coverageStatus,
        coverageExplanation,
      };
    })
    .sort((a, b) => a.exactStarName.localeCompare(b.exactStarName));
}
