import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../analyze";
import lockFixture from "./fixtures/trung-chau-regression-lock.v0.json";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

interface DomainLock {
  score: number;
  band: string;
  intensity: number;
  conflict: number;
  rawAxes: { support: number; pressure: number; stability: number; activation: number };
  normalizedAxes: { support: number; pressure: number; stability: number; activation: number };
  topSupportDriverIds: string[];
  topPressureDriverIds: string[];
}

const FLOAT_TOLERANCE = 1e-9;

function assertCloseTo(actual: number, expected: number, path: string) {
  expect(Math.abs(actual - expected), `${path}: expected ${expected}, got ${actual}`)
    .toBeLessThanOrEqual(FLOAT_TOLERANCE);
}

/**
 * Trung Châu numeric lock — protects the V0.1 scoring output from V0.2's
 * school-specific resolver refactor. Any change to the Trung Châu path
 * (resolver, frame geometry, evidence collection, aggregation, or
 * normalization) that shifts scores/bands/axes/top-driver IDs will fail
 * this test. The fixture was captured before V0.2 was written and lives
 * under `__tests__/fixtures/` (already committed with the branch).
 */
describe("annual-axes Trung Châu numeric regression lock", () => {
  const chart = calculateTrungChau(REGRESSION);
  const result = analyzeAnnualAxes(chart, { school: "trung-chau" });

  it("preserves module-level status and school", () => {
    expect(result.status).toBe(lockFixture.status);
    expect(result.school).toBe(lockFixture.school);
  });

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const expected = (lockFixture.domains as Record<AnnualAxisDomain, DomainLock>)[domain];

    it(`preserves ${domain} score/band/axes/intensity/conflict`, () => {
      const axis = result.axes[domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") throw new Error("unreachable");

      expect(axis.score).toBe(expected.score);
      expect(axis.band).toBe(expected.band);
      expect(axis.intensity).toBe(expected.intensity);
      expect(axis.conflict).toBe(expected.conflict);

      assertCloseTo(axis.rawAxes.support, expected.rawAxes.support, `${domain}.rawAxes.support`);
      assertCloseTo(axis.rawAxes.pressure, expected.rawAxes.pressure, `${domain}.rawAxes.pressure`);
      assertCloseTo(axis.rawAxes.stability, expected.rawAxes.stability, `${domain}.rawAxes.stability`);
      assertCloseTo(
        axis.rawAxes.activation,
        expected.rawAxes.activation,
        `${domain}.rawAxes.activation`,
      );

      assertCloseTo(
        axis.normalizedAxes.support,
        expected.normalizedAxes.support,
        `${domain}.normalizedAxes.support`,
      );
      assertCloseTo(
        axis.normalizedAxes.pressure,
        expected.normalizedAxes.pressure,
        `${domain}.normalizedAxes.pressure`,
      );
      assertCloseTo(
        axis.normalizedAxes.stability,
        expected.normalizedAxes.stability,
        `${domain}.normalizedAxes.stability`,
      );
      assertCloseTo(
        axis.normalizedAxes.activation,
        expected.normalizedAxes.activation,
        `${domain}.normalizedAxes.activation`,
      );
    });

    it(`preserves ${domain} top-3 support/pressure driver IDs`, () => {
      const axis = result.axes[domain];
      if (axis.status !== "available") throw new Error("unavailable");
      expect(axis.topSupportDrivers.map((e) => e.id)).toEqual(expected.topSupportDriverIds);
      expect(axis.topPressureDrivers.map((e) => e.id)).toEqual(expected.topPressureDriverIds);
    });
  }
});
