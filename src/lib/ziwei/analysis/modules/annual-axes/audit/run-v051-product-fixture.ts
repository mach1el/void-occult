import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";
import { scoreV05ChartDomains } from "../nam-phai-v05/score-chart";
import { deriveV051Calibration } from "./v051-calibration";
import { V051_CANDIDATES, type V051CandidateId } from "./v051-types";

export const V051_PRODUCT_FIXTURE: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function fixtureVector(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  activationScale: number,
  domainScales: Record<string, number>,
) {
  const chart = calculateNamPhai(V051_PRODUCT_FIXTURE);
  const domains = scoreV05ChartDomains(chart, knowledge, {
    activationScaleOverride: activationScale,
    domainScaleOverride: domainScales as Record<(typeof ANNUAL_AXIS_DOMAINS)[number], number>,
  });
  if (!domains) return null;
  const scores = ANNUAL_AXIS_DOMAINS.map((d) => {
    const row = domains.find((x) => x.domain === d);
    return row?.score ?? null;
  });
  const vals = scores.filter((v): v is number => v != null);
  return {
    scores: Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d, i) => [d, scores[i]]),
    ),
    minimum: Math.min(...vals),
    maximum: Math.max(...vals),
    range: Math.max(...vals) - Math.min(...vals),
    countAbove50: vals.filter((v) => v > 50).length,
    countAtOrBelow45: vals.filter((v) => v <= 45).length,
    countAtOrAbove60: vals.filter((v) => v >= 60).length,
  };
}

export function runV051ProductFixture(
  knowledge: AnnualAxesKnowledgeV05NamPhai,
  selectedVariant: V051CandidateId | null,
) {
  const baseline = deriveV051Calibration(
    V051_CANDIDATES.find((c) => c.id === "BASELINE-V05")!,
    knowledge,
  );
  const baselineVector = fixtureVector(
    knowledge,
    baseline.activationScale,
    baseline.domainScales,
  );

  const candidates = V051_CANDIDATES.map((spec) => {
    const cal = deriveV051Calibration(spec, knowledge);
    return {
      candidateId: spec.id,
      ...fixtureVector(knowledge, cal.activationScale, cal.domainScales),
    };
  });

  const selected =
    selectedVariant != null
      ? candidates.find((c) => c.candidateId === selectedVariant) ?? null
      : null;

  return {
    profileId: "annual-axes-v0.5.1-product-fixture",
    fixture: V051_PRODUCT_FIXTURE,
    productionV050: {
      engineVersion: "0.5.0",
      candidateId: "BASELINE-V05",
      ...baselineVector,
    },
    candidates,
    selectedV051: selected,
  };
}
