import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { analyzeAnnualAxesNamPhaiV03 } from "../nam-phai-v03/analyze";
import { loadAnnualAxesKnowledgeV03NamPhai } from "../../../knowledge/annual-axes/v0.3";

const BRANCHES_FROM_DAN = [
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
  "Tý",
  "Sửu",
];

/**
 * Synthetic Nam Phái chart engineered so the annual-head focus lands at
 * Dậu / Tử Tức with opposite Mão / Điền Trạch and trines Sửu / Phụ Mẫu
 * and Tỵ / Nô Bộc — the exact geometry the V0.3 calibration fixture
 * asserts routing values against.
 *
 * The palace list uses natal names positioned so that palace `.name`
 * matches the expected role for every anchor referenced by the routing
 * fixture. Branches are laid out starting at Dần (index 0) to give
 * `Dậu → 7`, `Mão → 1`, `Sửu → 11`, `Tỵ → 3`.
 */
function buildDauTuTucChart(): ChartData {
  const NAMES = [
    "Thiên Di", // 0 Dần
    "Điền Trạch", // 1 Mão (opposite of head)
    "Phúc Đức", // 2 Thìn (outside)
    "Nô Bộc", // 3 Tỵ (trine)
    "Quan Lộc", // 4 Ngọ (outside)
    "Tài Bạch", // 5 Mùi (outside)
    "Huynh Đệ", // 6 Thân (outside)
    "Tử Tức", // 7 Dậu (head focus)
    "Tật Ách", // 8 Tuất (outside)
    "Phu Thê", // 9 Hợi (outside)
    "Mệnh", // 10 Tý (outside)
    "Phụ Mẫu", // 11 Sửu (trine)
  ];
  const palaces: ChartPalace[] = NAMES.map((name, index) => ({
    index,
    branch: BRANCHES_FROM_DAN[index]!,
    name,
  }));
  const headPalace = palaces[7]!;
  headPalace.isLuuNienDaiVan = true;
  return {
    palaces,
    annualHeadPalace: headPalace,
    annualYear: 2026,
    annualStars: [],
    natalMutagens: [],
    annualMutagens: [],
    majorMutagens: [],
  } as unknown as ChartData;
}

describe("Annual Axes V0.3 · Dậu / Tử Tức routing lock", () => {
  const loaded = loadAnnualAxesKnowledgeV03NamPhai();
  if (!loaded.ok) throw new Error("V0.3 Nam Phái knowledge failed to load");
  const fixture = loaded.knowledge.calibrationFixtures.routingFixtures.find(
    (f) => f.fixtureId === "AA03-ROUTE-DAU-TU-TUC",
  );
  if (!fixture) throw new Error("routing fixture AA03-ROUTE-DAU-TU-TUC missing");

  const chart = buildDauTuTucChart();
  const result = analyzeAnnualAxesNamPhaiV03(chart);

  it("uses annual-major-fortune head at Dậu / Tử Tức", () => {
    expect(result.annualFocus?.mode).toBe("annual-major-fortune");
    expect(result.annualFocus?.palaceBranch).toBe("Dậu");
    expect(result.annualFocus?.palaceName).toBe("Tử Tức");
    expect(result.annualFocus?.frameBranches).toEqual(["Dậu", "Mão", "Sửu", "Tỵ"]);
  });

  it.each(fixture.expectedDomains)(
    "$domain routing $routing / headShare $headShare",
    (expected) => {
      const axis = result.axes[expected.domain];
      expect(axis.status).toBe("available");
      if (axis.status !== "available") throw new Error("unavailable");
      expect(axis.routing).toBeDefined();
      expect(axis.routing?.routing).toBeCloseTo(expected.routing, 4);
      expect(axis.routing?.headShare).toBeCloseTo(expected.headShare, 4);
      expect(axis.routing?.localShare).toBeCloseTo(expected.localShare, 4);
    },
  );

  it("changing smallLimitPalace does not change annual-head identity or routing", () => {
    const before = analyzeAnnualAxesNamPhaiV03(chart);
    const cloned: ChartData = {
      ...chart,
      smallLimitPalace: chart.palaces[4]!,
    };
    const after = analyzeAnnualAxesNamPhaiV03(cloned);
    expect(after.annualFocus?.palaceIndex).toBe(before.annualFocus?.palaceIndex);
    for (const d of fixture.expectedDomains) {
      const b = before.axes[d.domain];
      const a = after.axes[d.domain];
      if (b.status !== "available" || a.status !== "available") continue;
      expect(a.routing?.routing).toBe(b.routing?.routing);
      expect(a.routing?.headShare).toBe(b.routing?.headShare);
    }
  });

  it("changing annual head to a different palace changes routing on at least one domain", () => {
    const shifted: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) => ({ ...p, isLuuNienDaiVan: p.index === 1 })),
      annualHeadPalace: chart.palaces[1]!,
    };
    const shiftedResult = analyzeAnnualAxesNamPhaiV03(shifted);
    let changed = false;
    for (const d of fixture.expectedDomains) {
      const original = result.axes[d.domain];
      const now = shiftedResult.axes[d.domain];
      if (original.status !== "available" || now.status !== "available") continue;
      if (Math.abs((original.routing?.routing ?? 0) - (now.routing?.routing ?? 0)) > 1e-6) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("head structural evidence contributes activation only — no support/pressure/stability", () => {
    for (const d of fixture.expectedDomains) {
      const axis = result.axes[d.domain];
      if (axis.status !== "available") continue;
      const structural = axis.evidence.filter(
        (e) => e.stackingGroup === "annual-head-structural",
      );
      expect(structural.length).toBeGreaterThan(0);
      for (const e of structural) {
        expect(e.rawAxes.support).toBe(0);
        expect(e.rawAxes.pressure).toBe(0);
        expect(e.rawAxes.stability).toBe(0);
        expect(e.rawAxes.activation).toBeGreaterThan(0);
      }
    }
  });

  it("emits exactly one evidence row per physical fact per domain (channel blend, not double-count)", () => {
    for (const d of fixture.expectedDomains) {
      const axis = result.axes[d.domain];
      if (axis.status !== "available") continue;
      const seen = new Map<string, number>();
      for (const e of axis.evidence) {
        seen.set(e.physicalFactId, (seen.get(e.physicalFactId) ?? 0) + 1);
      }
      for (const [, count] of seen) {
        expect(count).toBe(1);
      }
    }
  });

  it("does not mutate the loaded knowledge or the input chart", () => {
    const cloned = structuredClone(chart);
    analyzeAnnualAxesNamPhaiV03(chart);
    expect(chart).toEqual(cloned);
  });
});
