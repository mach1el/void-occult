import { describe, expect, it } from "vitest";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../../knowledge/annual-axes/v0.5";
import { aggregateEvidenceDimensions } from "../collect-v051-samples";
import { runV051BiasAudit } from "../run-v051-bias-audit";
import { runV051VariantEvaluation } from "../run-v051-variant-evaluation";
import { runV051ProductFixture, V051_PRODUCT_FIXTURE } from "../run-v051-product-fixture";
import { splitChartIndices } from "../../../../knowledge/annual-axes/v0.5/derive-calibration";
import { FULL_CORPUS_CONTRACT } from "../build-audit-corpus";

describe("V0.5.1 bias audit structure", () => {
  it("reports support and pressure masses separately", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const report = runV051BiasAudit(loaded.knowledge);
    expect(report.global.evidence.directSupportRawMass).toBeGreaterThan(0);
    expect(report.global.evidence.directPressureRawMass).toBeGreaterThan(0);
    expect(report.global.evidence.tp4cSupportRawMass).toBeGreaterThan(0);
    expect(report.global.evidence.tp4cPressureRawMass).toBeGreaterThan(0);
  }, 600_000);

  it("computes positive/negative latent rates from latent not score", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const report = runV051BiasAudit(loaded.knowledge);
    const s = report.global.signed;
    expect(s.positiveLatentRate + s.negativeLatentRate + s.zeroLatentRate).toBeCloseTo(1, 5);
    expect(s.positiveLatentRate).toBeGreaterThan(0.5);
  }, 600_000);

  it("dimension breakdown totals reconstruct global direct masses", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const { training, holdout } = splitChartIndices(FULL_CORPUS_CONTRACT.chartCount);
    const dims = aggregateEvidenceDimensions(loaded.knowledge, [...training, ...holdout]);
    const layerSupport = Object.values(dims.byLayer).reduce((s, v) => s + v.supportRaw, 0);
    const layerPressure = Object.values(dims.byLayer).reduce((s, v) => s + v.pressureRaw, 0);
    expect(layerSupport).toBeCloseTo(dims.directSupportRaw + dims.tp4cSupportRaw, 3);
    expect(layerPressure).toBeCloseTo(dims.directPressureRaw + dims.tp4cPressureRaw, 3);
  }, 600_000);

  it("flags evidence bias when positive latent rate exceeds threshold", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const report = runV051BiasAudit(loaded.knowledge);
    expect(report.evidenceBiasFlags.globalPositiveLatentBias).toBe(true);
    expect(report.evidenceBiasFlags.scaleOnlyTighteningBlocked).toBe(true);
  }, 600_000);
});

describe("V0.5.1 variant selection", () => {
  it("returns no-variant-approved when evidence bias blocks calibration tightening", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const evaluation = runV051VariantEvaluation(loaded.knowledge);
    expect(evaluation.selectionStatus).toBe("no-variant-approved");
    expect(evaluation.selectedVariant).toBeNull();
    expect(evaluation.evidenceBiasDetected).toBe(true);
    for (const c of evaluation.candidates) {
      if (c.candidateId !== "BASELINE-V05") {
        expect(c.blockers.some((b) => b.includes("evidence-bias"))).toBe(true);
      }
    }
  }, 900_000);

  it("does not select baseline as V0.5.1", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const evaluation = runV051VariantEvaluation(loaded.knowledge);
    expect(evaluation.selectedVariant).not.toBe("BASELINE-V05");
  }, 900_000);
});

describe("V0.5.1 product fixture", () => {
  it("excludes fixture birth data from calibration derivation", () => {
    expect(V051_PRODUCT_FIXTURE.solarDate).toBe("1991-09-21");
    const bases = FULL_CORPUS_CONTRACT;
    expect(bases.chartCount).toBe(100);
  });

  it("reports baseline and candidate vectors without selecting one", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const product = runV051ProductFixture(loaded.knowledge, null);
    expect(product.productionV050.scores).toBeDefined();
    expect(product.candidates).toHaveLength(4);
    expect(product.selectedV051).toBeNull();
    if (!product.productionV050.scores) return;
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(product.productionV050.scores[domain]).toBeTypeOf("number");
    }
  }, 30_000);
});
