import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { ChartData } from "@/types/chart";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { analyzeAnnualAxes } from "../analyze";
import { domainFrameCoverage } from "../nam-phai-v04/routing";

/**
 * V0.4.2 corrective prompt §14 structural fixtures (subset — B, E, I; F/G
 * are already covered at the knowledge-validation level by
 * `knowledge/annual-axes/v0.4.2/__tests__/ownership-catalog.test.ts`, so
 * are not duplicated here as slower end-to-end tests).
 */
const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const base = calculateNamPhai(REGRESSION);
const loaded042 = loadAnnualAxesKnowledgeV042NamPhai();
if (!loaded042.ok) throw new Error("v0.4.2 knowledge invalid");
const knowledge042 = loaded042.knowledge;
const loaded04 = loadAnnualAxesKnowledgeV04NamPhai();
if (!loaded04.ok) throw new Error("v0.4 knowledge invalid");
const knowledge04 = loaded04.knowledge;

function stripped(overrides: Partial<ChartData>): ChartData {
  return {
    ...base,
    annualStars: [],
    annualMutagens: [],
    natalMutagens: [],
    majorMutagens: [],
    ...overrides,
  };
}

const DOMAINS = ["health", "family", "wealth", "career", "social", "romance"] as const;

function ownedDomains(palaceName: string): Set<string> {
  const record = knowledge042.ownership.records.find((r) => r.palaceName === palaceName);
  return new Set((record?.numericDomains ?? []).map((d) => d.domain));
}

describe("Annual Axes V0.4.2 · strict physical domain routing fixtures (corrective prompt §14)", () => {
  it("Fixture B — a triggered fact physically in Tài Bạch may affect only Tài Bạch's owned domains", () => {
    const taiBach = base.palaces.find((p) => p.name === "Tài Bạch");
    expect(taiBach).toBeDefined();
    if (!taiBach) return;

    const owned = ownedDomains("Tài Bạch");
    expect(owned).toEqual(new Set(["wealth"]));

    const chart = stripped({ annualStars: [{ name: "Vũ Khúc", palace: taiBach }] });
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });

    for (const domain of DOMAINS) {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") continue;
      const starEvidence = axis.evidence.find(
        (e) => e.physicalFactId === `annual-star:${taiBach.index}:Vũ Khúc`,
      );
      if (owned.has(domain)) {
        expect(starEvidence).toBeDefined();
      } else {
        // Even though Vũ Khúc used to have broad positive affinity
        // (health/family/career/social all >0 under the retired V0.4.1
        // model), physical ownership of Tài Bạch is wealth-only — no
        // unrelated domain may receive this fact's evidence.
        expect(starEvidence).toBeUndefined();
      }
    }
  });

  it("Fixture E — a domain whose old anchor TP4C union spans many palaces still gets zero numeric evidence from a fact in an unowned palace", () => {
    // "family" had 5 anchors under the retired v0.4 axis-definitions
    // (Điền Trạch, Phúc Đức, Phụ Mẫu, Tử Tức, Huynh Đệ) whose TP4C union
    // can span most of the chart — but that union is no longer a numeric
    // eligibility gate (§3).
    const familyCoverage = domainFrameCoverage(base, knowledge04, "family");
    expect(familyCoverage.uniquePhysicalPalaceCount).toBeGreaterThan(4);

    // Tài Bạch owns only "wealth" in the new catalog — use it regardless
    // of whether the old family TP4C union happened to cover it.
    const taiBach = base.palaces.find((p) => p.name === "Tài Bạch");
    expect(taiBach).toBeDefined();
    if (!taiBach) return;
    expect(ownedDomains("Tài Bạch").has("family")).toBe(false);

    const chart = stripped({ annualStars: [{ name: "Vũ Khúc", palace: taiBach }] });
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const family = result.axes.family;
    expect(family.status).toBe("available");
    if (family.status !== "available") return;

    const starEvidence = family.evidence.find(
      (e) => e.physicalFactId === `annual-star:${taiBach.index}:Vũ Khúc`,
    );
    expect(starEvidence).toBeUndefined();
  });

  it("Fixture I — ownership weight is applied exactly once (linearity: doubling ownershipWeight exactly doubles the routed-head/direct-domain contribution)", () => {
    // Use the real chart's own ownership catalog: compare the contribution
    // of a fact at a "primary" palace (ownershipWeight 1.0) against the
    // same physical relationship at a "secondary" palace (ownershipWeight
    // 0.4) elsewhere — if ownership were applied twice (e.g. squared),
    // the ratio between the two would be far from the raw 1.0/0.4 ratio.
    const quanLoc = base.palaces.find((p) => p.name === "Quan Lộc");
    expect(quanLoc).toBeDefined();
    if (!quanLoc) return;

    // Quan Lộc: career=primary(1.0), wealth=secondary(0.4).
    const chart = stripped({ annualStars: [{ name: "Thái Dương", palace: quanLoc }] });
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });

    const career = result.axes.career;
    const wealth = result.axes.wealth;
    expect(career.status).toBe("available");
    expect(wealth.status).toBe("available");
    if (career.status !== "available" || wealth.status !== "available") return;

    const careerEvidence = career.evidence.find(
      (e) => e.physicalFactId === `annual-star:${quanLoc.index}:Thái Dương`,
    );
    const wealthEvidence = wealth.evidence.find(
      (e) => e.physicalFactId === `annual-star:${quanLoc.index}:Thái Dương`,
    );
    expect(careerEvidence).toBeDefined();
    expect(wealthEvidence).toBeDefined();
    if (!careerEvidence || !wealthEvidence) return;

    expect(careerEvidence.ownershipWeight).toBeCloseTo(1.0, 10);
    expect(wealthEvidence.ownershipWeight).toBeCloseTo(0.4, 10);
    // Same physical fact, same rawAxes, same channel (direct-domain via
    // "annual-moving-star-palace") — only ownershipWeight differs, so the
    // weightedAxes ratio must equal the ownershipWeight ratio exactly
    // (not squared: 0.4/1.0 = 0.4, not 0.16).
    expect(wealthEvidence.weightedAxes.support / careerEvidence.weightedAxes.support).toBeCloseTo(
      0.4,
      10,
    );
  });
});
