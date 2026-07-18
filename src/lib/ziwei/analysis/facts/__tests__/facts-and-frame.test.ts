import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  buildStaticFrame,
  oppositePalaceIndex,
} from "@/lib/ziwei/analysis/frame";
import {
  canonicalStarName,
  normalizeNatalFacts,
} from "@/lib/ziwei/analysis/facts";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const GEOMETRY = { focus: 1, opposite: 0.5, trine: 0.3 };

describe("canonicalStarName", () => {
  it("keeps Lưu Hà as natal name", () => {
    expect(canonicalStarName("Lưu Hà")).toBe("Lưu Hà");
  });

  it("strips Lưu prefix for annual clones", () => {
    expect(canonicalStarName("Lưu Văn Xương")).toBe("Văn Xương");
  });
});

describe("normalizeNatalFacts", () => {
  it("excludes annual stars and is stable across annualYear", () => {
    const a = calculateNamPhai({ ...REGRESSION, annualYear: "2026" });
    const b = calculateNamPhai({ ...REGRESSION, annualYear: "2027" });
    const fa = normalizeNatalFacts(a, { school: "nam-phai" });
    const fb = normalizeNatalFacts(b, { school: "nam-phai" });

    expect(fa.facts.some((f) => f.source === "annual")).toBe(false);
    expect(fa.facts.some((f) => f.source === "annual-mutagen")).toBe(false);
    expect(fa.facts.map((f) => f.id).sort()).toEqual(
      fb.facts.map((f) => f.id).sort(),
    );
  });

  it("deduplicates Tứ Hóa via natalMutagens only (no marker double-count)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const transforms = facts.filter((f) => f.kind === "transformation");
    expect(transforms.length).toBe(4);
    expect(
      facts.some(
        (f) =>
          f.kind === "star" &&
          (f.starName?.startsWith("Hóa ") || f.source === "natal-mutagen"),
      ),
    ).toBe(false);
  });
});

describe("buildStaticFrame", () => {
  it("builds focus + opposite + 2 trines without duplicating focus", () => {
    const chart = calculateNamPhai(REGRESSION);
    const menh = chart.palaces.find((p) => p.isMenh)!;
    const frame = buildStaticFrame(chart, menh.index, { geometry: GEOMETRY });
    expect(frame.nodes).toHaveLength(4);
    expect(frame.nodes.filter((n) => n.role === "focus")).toHaveLength(1);
    expect(frame.nodes.filter((n) => n.role === "opposite")).toHaveLength(1);
    expect(frame.nodes.filter((n) => n.role === "trine")).toHaveLength(2);
    const opposite = frame.nodes.find((n) => n.role === "opposite")!;
    expect(opposite.palaceIndex).toBe(oppositePalaceIndex(menh.index));
  });
});
