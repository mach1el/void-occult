import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV06NamPhai } from "../../../../knowledge/annual-axes/v0.6";
import { runV06CandidateEvaluation } from "../run-v06-candidate-evaluation";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";

const ENABLED = process.env.ANNUAL_AXES_V06_CANDIDATES_WRITE === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.6");

function renderDecision(report: ReturnType<typeof runV06CandidateEvaluation>): string {
  const selected = report.candidates.find((c) => c.candidateId === report.selectedVariant);
  const lines: string[] = [
    "# Annual Axes V0.6 Decision",
    "",
    `selectionStatus: ${report.selectionStatus}`,
    `selectedVariant: ${report.selectedVariant ?? "null"}`,
    `formulaVersion: ${report.formulaVersion}`,
    "",
    "## Selection rationale",
    ...report.selectionRationale.map((r) => `- ${r}`),
    "",
    "## Candidates",
  ];
  for (const c of report.candidates) {
    lines.push(`### ${c.candidateId}`);
    lines.push(`- selectable: ${c.selectable}`);
    lines.push(`- passedAllGates: ${c.passedAllGates}`);
    lines.push(
      `- signedLayerFactors: annual=${c.signedLayerFactors.annual}, natalActivated=${c.signedLayerFactors.natalActivated}, majorFortune=${c.signedLayerFactors.majorFortune}, global=${c.signedLayerFactors.global}`,
    );
    lines.push(`- activationScale: ${c.calibration.activationScale}`);
    lines.push(
      `- domainScales: ${ANNUAL_AXIS_DOMAINS.map((d) => `${d}=${c.calibration.domainScales[d]}`).join(", ")}`,
    );
    lines.push(
      `- holdout median/mean: ${c.holdoutMetrics.globalMedianScore?.toFixed(2)} / ${c.holdoutMetrics.globalMeanScore?.toFixed(2)}`,
    );
    lines.push(
      `- latent +/−: ${((c.holdoutMetrics.positiveLatentRate ?? 0) * 100).toFixed(1)}% / ${((c.holdoutMetrics.negativeLatentRate ?? 0) * 100).toFixed(1)}%`,
    );
    lines.push(
      `- product fixture: ${ANNUAL_AXIS_DOMAINS.map((d) => `${d}=${(c.productFixture as any)[d]}`).join(", ")} (range=${c.productFixture.radarRange}, L1=${c.productFixture.l1FromV05.toFixed(1)})`,
    );
    if (c.blockers.length) {
      lines.push(`- blockers (${c.blockers.length}):`);
      for (const b of c.blockers.slice(0, 30)) lines.push(`  - ${b}`);
      if (c.blockers.length > 30) lines.push(`  - … +${c.blockers.length - 30} more`);
    }
    lines.push("");
  }
  if (selected) {
    lines.push("## Selected calibration");
    lines.push(JSON.stringify(selected.calibration, null, 2));
    lines.push("");
    lines.push("## Notes");
    lines.push("- Background natal-activated evidence is attenuated via signedLayerFactors.");
    lines.push("- Major-fortune and global contribute zero signed mass.");
    lines.push("- No React-side stretching or final-score offset is applied.");
  } else {
    lines.push("## Notes");
    lines.push("- No V0.6 candidate approved. Production remains V0.5.0.");
  }
  return `${lines.join("\n")}\n`;
}

describe.runIf(ENABLED)("annual-axes v0.6 candidate evaluation write", () => {
  it("evaluates candidates and writes research artifacts", () => {
    const loaded = loadAnnualAxesKnowledgeV06NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const report = runV06CandidateEvaluation(loaded.knowledge);
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.6-candidate-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );

    const selected = report.candidates.find((c) => c.candidateId === report.selectedVariant);
    const holdout = {
      selectionStatus: report.selectionStatus,
      selectedVariant: report.selectedVariant,
      holdoutMetrics: selected?.holdoutMetrics ?? null,
      gateResults: selected?.gateResults ?? [],
      candidates: report.candidates.map((c) => ({
        candidateId: c.candidateId,
        passedAllGates: c.passedAllGates,
        blockers: c.blockers,
        holdoutMetrics: {
          globalMedianScore: c.holdoutMetrics.globalMedianScore,
          globalMeanScore: c.holdoutMetrics.globalMeanScore,
          positiveLatentRate: c.holdoutMetrics.positiveLatentRate,
          negativeLatentRate: c.holdoutMetrics.negativeLatentRate,
        },
      })),
    };
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.6-holdout-report.json"),
      `${JSON.stringify(holdout, null, 2)}\n`,
    );

    const fixture = {
      birth: {
        solarDate: "1991-09-21",
        birthHour: "Dậu",
        gender: "female",
        timezone: "7",
        annualYear: "2026",
        flowBase: "luu-nien",
      },
      v05Baseline: {
        health: 41.9,
        family: 59.2,
        wealth: 47.5,
        career: 50,
        social: 53.7,
        romance: 58.9,
      },
      selectedVariant: report.selectedVariant,
      candidates: Object.fromEntries(
        report.candidates.map((c) => [c.candidateId, c.productFixture]),
      ),
    };
    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.6-product-fixture.json"),
      `${JSON.stringify(fixture, null, 2)}\n`,
    );
    writeFileSync(join(OUT_DIR, "ANNUAL-AXES-V0.6-DECISION.md"), renderDecision(report));

    expect(report.candidates).toHaveLength(4);
    expect(report.candidates.find((c) => c.candidateId === "V05-CONTROL")?.selectable).toBe(false);
  }, 900_000);
});
