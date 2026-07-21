/**
 * V0.5.1 bias audit writer — ANNUAL_AXES_V051_BIAS_WRITE=1
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import { runV051BiasAudit } from "../run-v051-bias-audit";

const ENABLED = process.env.ANNUAL_AXES_V051_BIAS_WRITE === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.5.1");

function renderBiasMarkdown(report: ReturnType<typeof runV051BiasAudit>): string {
  const g = report.global;
  return `# Annual Axes V0.5.1 Baseline Bias Audit

Engine: V0.5.0 (production baseline)
Corpus: ${report.corpusId}
Baseline reproduced: ${report.baselineReproduced}

## Score distribution (global)

| Metric | Value |
|--------|------:|
| Median score | ${g.score.median.toFixed(2)} |
| Mean score | ${g.score.mean.toFixed(2)} |
| scoreAbove50Rate | ${(g.score.scoreAbove50Rate * 100).toFixed(1)}% |
| scoreBelow50Rate | ${(g.score.scoreBelow50Rate * 100).toFixed(1)}% |
| scoreAtOrBelow45Rate | ${(g.score.scoreAtOrBelow45Rate * 100).toFixed(1)}% |
| scoreAtOrAbove60Rate | ${(g.score.scoreAtOrAbove60Rate * 100).toFixed(1)}% |

## Annual-vector distribution

| Metric | Value |
|--------|------:|
| allSixAbove50Rate | ${(g.vector.allSixAbove50Rate * 100).toFixed(1)}% |
| fiveOrMoreAbove50Rate | ${(g.vector.fiveOrMoreAbove50Rate * 100).toFixed(1)}% |
| allSixInside45To65Rate | ${(g.vector.allSixInside45To65Rate * 100).toFixed(1)}% |
| atLeastOneAtOrBelow45Rate | ${(g.vector.atLeastOneAtOrBelow45Rate * 100).toFixed(1)}% |
| atLeastOneAtOrAbove60Rate | ${(g.vector.atLeastOneAtOrAbove60Rate * 100).toFixed(1)}% |
| oneLowAndOneHighRate | ${(g.vector.oneLowAndOneHighRate * 100).toFixed(1)}% |
| median intra-year range | ${g.vector.medianIntraYearRange.toFixed(2)} |

## Signed-signal distribution

| Metric | Value |
|--------|------:|
| spatialSigned median | ${g.signed.spatialSignedMedian.toFixed(4)} |
| latent median | ${g.signed.latentMedian.toFixed(4)} |
| positive latent rate | ${(g.signed.positiveLatentRate * 100).toFixed(1)}% |
| negative latent rate | ${(g.signed.negativeLatentRate * 100).toFixed(1)}% |
| support/pressure raw mass ratio | ${g.evidence.supportPressureRawMassRatio.toFixed(3)} |

## Diagnosis (required answers)

1. **Softness in spatialSigned?** ${report.diagnosis.softnessInSpatialSigned ? "Yes — median near zero" : "No — spatialSigned has spread"}
2. **Latent positively biased?** ${report.diagnosis.latentPositivelyBiased ? "Yes" : "No"} (global positive rate ${(g.signed.positiveLatentRate * 100).toFixed(1)}%)
3. **Support raw mass > pressure?** ${report.diagnosis.supportLargerThanPressure ? "Yes" : "No"} (ratio ${g.evidence.supportPressureRawMassRatio.toFixed(3)})
4. **Pressure disproportionately TP4C?** ${report.diagnosis.pressureDisproportionatelyTp4c ? "Yes" : "No"}
5. **Pressure dropped by eligibility/dedupe?** ${report.diagnosis.pressureDroppedByEligibilityOrDedupe ? "Possible" : "Not indicated"}
6. **Activation too weak?** ${report.diagnosis.activationTooWeak ? "Yes" : "No"} (median gate ${g.activation.activationGateMedian.toFixed(3)})
7. **Calibration-only would amplify positive bias?** ${report.diagnosis.calibrationWouldAmplifyPositiveBias ? "Yes — blocker for scale-only tightening" : "No"}

## Evidence bias flags

- Global positive latent bias: ${report.evidenceBiasFlags.globalPositiveLatentBias}
- Per-domain bias domains (${report.evidenceBiasFlags.perDomainPositiveLatentBiasDomains.length}): ${report.evidenceBiasFlags.perDomainPositiveLatentBiasDomains.join(", ") || "none"}
- Scale-only tightening blocked: ${report.evidenceBiasFlags.scaleOnlyTighteningBlocked}
`;
}

describe.runIf(ENABLED)("annual-axes v0.5.1 bias audit write", () => {
  it("writes baseline bias audit artifacts", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const report = runV051BiasAudit(loaded.knowledge);
    expect(report.baselineReproduced).toBe(true);

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.5.1-baseline-bias-audit.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    writeFileSync(
      join(OUT_DIR, "ANNUAL-AXES-V0.5.1-BIAS-AUDIT.md"),
      renderBiasMarkdown(report),
    );
  }, 900_000);
});
