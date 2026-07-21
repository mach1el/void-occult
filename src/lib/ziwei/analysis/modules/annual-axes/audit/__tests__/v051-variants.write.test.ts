/**
 * V0.5.1 variant evaluation writer — ANNUAL_AXES_V051_VARIANTS_WRITE=1
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import { runV051VariantEvaluation } from "../run-v051-variant-evaluation";
import { runV051ProductFixture } from "../run-v051-product-fixture";

const ENABLED = process.env.ANNUAL_AXES_V051_VARIANTS_WRITE === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.5.1");

function renderDecisionMarkdown(
  evaluation: ReturnType<typeof runV051VariantEvaluation>,
  product: ReturnType<typeof runV051ProductFixture>,
): string {
  const status =
    evaluation.selectionStatus === "approved"
      ? "APPROVED FOR RESEARCH PREVIEW"
      : "NO VARIANT APPROVED";

  return `# Annual Axes V0.5.1 Decision

## Status: ${status}

**Selected variant:** ${evaluation.selectedVariant ?? "null"}
**Baseline reproduced:** ${evaluation.baselineReproduced}
**Evidence bias detected:** ${evaluation.evidenceBiasDetected}

## Root cause of softness

Production V0.5 expanded score range versus V0.4.2 but annual vectors remain
positively skewed: high \`fiveOrMoreAbove50Rate\` with low pressure-band reach.
Primary driver is ${evaluation.evidenceBiasDetected ? "positive latent evidence bias — scale-only tightening would amplify bias" : "calibration amplitude / activation gate — not evidence mechanical defect"}.

## Candidate summary

${evaluation.candidates
  .map(
    (c) =>
      `- **${c.candidateId}**: passedAllGates=${c.passedAllGates}, blockers=${c.blockers.length}, globalMedian=${c.holdoutMetrics.globalMedianScore?.toFixed(2)}, allSixAbove50=${((c.holdoutMetrics.allSixAbove50Rate ?? 0) * 100).toFixed(1)}%`,
  )
  .join("\n")}

## Product fixture (1991-09-21 / 2026)

Production V0.5.0: ${JSON.stringify(product.productionV050.scores)}
Range: ${product.productionV050.range?.toFixed(1)}, above50: ${product.productionV050.countAbove50}

## V0.5.1 routing

${evaluation.selectionStatus === "approved" ? "V0.5.1 research routing implemented behind default-OFF flag." : "No V0.5.1 analyzer — audit artifacts only."}

## Prohibited post-processing

No UI stretching, per-chart centering, global pressure multipliers, or score
post-processing were applied. All scores derive from the V0.5 evidence pipeline.
`;
}

describe.runIf(ENABLED)("annual-axes v0.5.1 variant evaluation write", () => {
  it("writes variant evaluation and product fixture artifacts", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const evaluation = runV051VariantEvaluation(loaded.knowledge);
    expect(evaluation.baselineReproduced).toBe(true);

    const product = runV051ProductFixture(
      loaded.knowledge,
      evaluation.selectedVariant,
    );

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.5.1-variant-evaluation.json"),
      `${JSON.stringify(evaluation, null, 2)}\n`,
    );
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.5.1-product-fixture.json"),
      `${JSON.stringify(product, null, 2)}\n`,
    );
    writeFileSync(
      join(OUT_DIR, "ANNUAL-AXES-V0.5.1-DECISION.md"),
      renderDecisionMarkdown(evaluation, product),
    );
  }, 900_000);
});
