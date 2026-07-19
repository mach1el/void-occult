/**
 * V0.3 §18 dynamic-resolution / no-hardcode gate tests.
 *
 * These prove the scorer works for all 12 focus indexes with generic
 * modulo geometry, never special-cases Dậu/Tử Tức/age-36, and never
 * imports Calculation Core placement APIs.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { relationRole } from "../nam-phai-v03/routing";
import { loadAnnualAxesKnowledgeV03NamPhai } from "../../../knowledge/annual-axes/v0.3";

const ROOT = join(process.cwd(), "src/lib/ziwei/analysis/modules/annual-axes");

const NATAL_CYCLE = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

function walkProductionFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "audit") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionFiles(full, out);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function chartWithHeadAt(focusIndex: number): ChartData {
  const palaces: ChartPalace[] = NATAL_CYCLE.map((name, index) => ({
    index,
    branch: `B${index}`,
    name,
  }));
  const head = palaces[focusIndex]!;
  head.isLuuNienDaiVan = true;
  return {
    palaces,
    annualHeadPalace: head,
    annualYear: 2026,
    annualStars: [],
    natalMutagens: [],
    annualMutagens: [],
    majorMutagens: [],
  } as unknown as ChartData;
}

describe("Annual Axes V0.3 · dynamic TP4C geometry (all 12 indexes)", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))(
    "focus=%i → opposite/trines via modulo-12 only",
    (focusIndex) => {
      const chart = chartWithHeadAt(focusIndex);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      expect(result.annualFocus?.palaceIndex).toBe(focusIndex);

      const frame = buildAnnualFocusFrame(chart, {
        mode: "annual-major-fortune",
        palaceIndex: focusIndex,
        palaceName: chart.palaces[focusIndex]!.name,
        palaceBranch: chart.palaces[focusIndex]!.branch,
        annualPalaceName: null,
      });
      expect(frame).not.toBeNull();
      const indexes = frame!.nodes.map((n) => n.palaceIndex).sort((a, b) => a - b);
      const expected = [
        focusIndex,
        (focusIndex + 6) % 12,
        (focusIndex + 4) % 12,
        (focusIndex + 8) % 12,
      ].sort((a, b) => a - b);
      expect(indexes).toEqual(expected);

      expect(relationRole(focusIndex, focusIndex)).toBe("focus");
      expect(relationRole(focusIndex, (focusIndex + 6) % 12)).toBe("opposite");
      expect(relationRole(focusIndex, (focusIndex + 4) % 12)).toBe("trine");
      expect(relationRole(focusIndex, (focusIndex + 8) % 12)).toBe("trine");
      expect(relationRole(focusIndex, (focusIndex + 1) % 12)).toBe("outside");
    },
  );

  it("builds TP4C without requiring real branch names", () => {
    const chart = chartWithHeadAt(3);
    // Branches are synthetic B0..B11 — still resolves.
    expect(analyzeAnnualAxes(chart, { school: "nam-phai" }).annualFocus?.palaceIndex).toBe(3);
  });

  it("reordered palace array with same indexes yields identical routing", () => {
    const base = chartWithHeadAt(7);
    const reordered: ChartData = {
      ...base,
      palaces: [...base.palaces].reverse().map((p) => ({ ...p })),
      annualHeadPalace: { ...base.palaces[7]! },
    };
    // Keep the unique LNDV flag on the same physical index.
    reordered.palaces = reordered.palaces.map((p) => ({
      ...p,
      isLuuNienDaiVan: p.index === 7,
    }));

    const a = analyzeAnnualAxes(base, { school: "nam-phai" });
    const b = analyzeAnnualAxes(reordered, { school: "nam-phai" });
    expect(a.annualFocus?.palaceIndex).toBe(b.annualFocus?.palaceIndex);
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"] as const) {
      const aa = a.axes[domain];
      const bb = b.axes[domain];
      if (aa.status !== "available" || bb.status !== "available") continue;
      expect(aa.routing?.routing).toBeCloseTo(bb.routing?.routing ?? NaN, 8);
      expect(aa.routing?.headShare).toBeCloseTo(bb.routing?.headShare ?? NaN, 8);
    }
  });
});

describe("Annual Axes V0.3 · dynamic-resolution source scan", () => {
  const files = walkProductionFiles(ROOT);

  const FORBIDDEN = [
    "getAnnualMajorFortuneIndex",
    "assignSmallLimits",
    "engine-nam-phai",
    "engine-trung-chau",
    "PalaceOverviewResult.score",
    "MajorFortuneAxisResult.score",
    "MonthlyFlowAxisResult.score",
    "analyzeAllPalaces",
    "analyzeMajorFortune",
    "analyzeMonthlyFlow",
  ];

  it("production sources do not import Calculation Core placement or sibling scores", () => {
    const hits: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      for (const token of FORBIDDEN) {
        // Allow mentioning in comments that document the boundary.
        const withoutBlockComments = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
        if (withoutBlockComments.includes(token)) {
          hits.push(`${path}: ${token}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("loads the mandatory dynamic-resolution guard with the V0.3 pack", () => {
    const loaded = loadAnnualAxesKnowledgeV03NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.knowledge.dynamicResolutionGuard.status).toBe("mandatory");
    expect(loaded.knowledge.dynamicResolutionGuard.guardId).toContain("dynamic-resolution");
  });

  it("does not contain Dậu/Tử Tức/age-36 production special cases", () => {
    const hits: string[] = [];
    const patterns = [
      /branch\s*===\s*["']Dậu["']/,
      /name\s*===\s*["']Tử Tức["']/,
      /age\s*===\s*36/,
      /nominalAge\s*===\s*36/,
    ];
    for (const path of files) {
      const text = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const pattern of patterns) {
        if (pattern.test(text)) hits.push(`${path}: ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
