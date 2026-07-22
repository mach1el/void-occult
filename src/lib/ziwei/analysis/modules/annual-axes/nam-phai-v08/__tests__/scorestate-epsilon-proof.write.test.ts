/**
 * Gated writer for the Finding 6 maintenance proof.
 * Does not rewrite historical v0.9-foundation / candidate snapshots.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  proofOutDir,
  writeScoreStateEpsilonProof,
} from "../../audit/write-scorestate-epsilon-proof";

const ENABLED = process.env.ANNUAL_AXES_V08_SCORESTATE_PROOF === "1";

describe.runIf(ENABLED)("annual axes v0.8 scoreState epsilon proof", () => {
  it(
    "writes a deterministic before/after proof under maintenance/",
    () => {
      const outDir = proofOutDir();
      const first = writeScoreStateEpsilonProof(outDir);
      const firstJson = readFileSync(join(outDir, "before-after-proof.json"), "utf8");
      writeScoreStateEpsilonProof(outDir);
      const secondJson = readFileSync(join(outDir, "before-after-proof.json"), "utf8");

      expect(secondJson).toBe(firstJson);
      expect(first.proofId).toBe("annual-axes-v08-scorestate-epsilon");
      expect(first.corpus.domainObservations).toBe(7200);
      expect(first.after.scoredNeutralCount).toBe(0);
      expect(first.classificationDelta.scoredToBalancedSignal).toBe(107);
      expect(first.classificationDelta.otherTransitions).toBe(0);
      expect(first.gates.passed).toBe(19);
      expect(first.gates.failed).toBe(9);
      expect(first.versionDecision.engineVersion).toBe("0.8.0");
      expect(first.versionDecision.formulaVersion).toBe(
        "v0.8-annual-palace-weighted-score",
      );
    },
    600_000,
  );
});
