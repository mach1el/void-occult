/**
 * CONTROL-V08 — exact reproduction of production Nam Phái Annual Axes V0.8.
 * Research-only; does not alter production routing.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../../modules/annual-axes/analyze";
import { analyzeAnnualAxesNamPhaiV08 } from "../../modules/annual-axes/nam-phai-v08/analyze";
import { getAnalysisStatus } from "../../contracts/common";

export const CONTROL_CANDIDATE_ID = "CONTROL-V08" as const;
export const CONTROL_FORMULA_VERSION = "v0.8-annual-palace-weighted-score" as const;
export const CONTROL_ENGINE_VERSION = "0.8.0" as const;

export const V08_PRODUCT_FIXTURE_BIRTH: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

export interface ControlVerificationResult {
  ok: boolean;
  candidateId: typeof CONTROL_CANDIDATE_ID;
  engineVersion: string;
  formulaVersion: string | null;
  statusVersion: string | null;
  scores: Record<string, number | null>;
  fixtureScores: Record<string, number>;
  scoreEquality: boolean;
  routingEquality: boolean;
  fixtureEquality: boolean;
  issues: string[];
  fixtureHash: string;
}

function scoresOf(result: ReturnType<typeof analyzeAnnualAxesNamPhaiV08>) {
  return Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => {
      const axis = result.axes[d];
      return [d, axis.status === "available" ? axis.score : null];
    }),
  ) as Record<string, number | null>;
}

export function verifyControlV08(): ControlVerificationResult {
  const issues: string[] = [];
  const fixturePath = join(
    process.cwd(),
    "research/annual-axes/distribution/v0.8/annual-axes-v0.8-product-fixture.json",
  );
  const fixtureRaw = readFileSync(fixturePath, "utf8");
  const fixtureHash = createHash("sha256").update(fixtureRaw).digest("hex");
  const fixture = JSON.parse(fixtureRaw) as {
    formulaVersion: string;
    productFixture: Record<string, number>;
  };

  const chart = calculateNamPhai(V08_PRODUCT_FIXTURE_BIRTH);
  const production = analyzeAnnualAxes(chart, { school: "nam-phai" });
  const control = analyzeAnnualAxesNamPhaiV08(chart);
  const status = getAnalysisStatus("annual-axes", { school: "nam-phai" });

  const routingEquality =
    production.versions.engineVersion === CONTROL_ENGINE_VERSION &&
    control.versions.engineVersion === CONTROL_ENGINE_VERSION &&
    status.status === "available" &&
    status.version === CONTROL_ENGINE_VERSION;

  if (!routingEquality) {
    issues.push(
      `Routing mismatch: production=${production.versions.engineVersion} control=${control.versions.engineVersion} status=${status.status === "available" ? status.version : status.reason}`,
    );
  }

  const productionScores = scoresOf(production as ReturnType<typeof analyzeAnnualAxesNamPhaiV08>);
  const controlScores = scoresOf(control);
  let scoreEquality = true;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (productionScores[domain] !== controlScores[domain]) {
      scoreEquality = false;
      issues.push(
        `Score mismatch on ${domain}: production=${productionScores[domain]} control=${controlScores[domain]}`,
      );
    }
  }

  let fixtureEquality = fixture.formulaVersion === CONTROL_FORMULA_VERSION;
  if (!fixtureEquality) {
    issues.push(
      `Fixture formulaVersion ${fixture.formulaVersion} !== ${CONTROL_FORMULA_VERSION}`,
    );
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const expected = fixture.productFixture[domain];
    const actual = controlScores[domain];
    if (expected !== actual) {
      fixtureEquality = false;
      issues.push(`Fixture mismatch on ${domain}: fixture=${expected} control=${actual}`);
    }
  }

  let formulaVersion: string | null = null;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const axis = control.axes[domain];
    if (axis.status === "available" && axis.engine === "v0.8" && axis.scoreTrace) {
      formulaVersion = axis.scoreTrace.formulaVersion;
      if (formulaVersion !== CONTROL_FORMULA_VERSION) {
        issues.push(`Trace formulaVersion ${formulaVersion} !== ${CONTROL_FORMULA_VERSION}`);
      }
      break;
    }
  }

  return {
    ok: issues.length === 0,
    candidateId: CONTROL_CANDIDATE_ID,
    engineVersion: control.versions.engineVersion,
    formulaVersion,
    statusVersion: status.status === "available" ? status.version : null,
    scores: controlScores,
    fixtureScores: fixture.productFixture,
    scoreEquality,
    routingEquality,
    fixtureEquality,
    issues,
    fixtureHash,
  };
}
