import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { namPhaiDomainResolver } from "../resolvers/nam-phai-domain-resolver";
import { trungChauDomainResolver } from "../resolvers/trung-chau-domain-resolver";
import { selectResolver, resolveAnnualFocus } from "../resolvers";
import type { AnnualAxisDefinitionsCatalog } from "../../../knowledge/annual-axes";

const NAM_PHAI_NATAL_NAMES = [
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

const TC_ANNUAL_LABELS = [
  "Huynh Đệ",
  "Phu Thê",
  "Tử Tức",
  "Tài Bạch",
  "Tật Ách",
  "Thiên Di",
  "Nô Bộc",
  "Quan Lộc",
  "Điền Trạch",
  "Phúc Đức",
  "Phụ Mẫu",
  "Mệnh",
];

const AXIS_DEFS: AnnualAxisDefinitionsCatalog = {
  schemaVersion: "0.1.0",
  catalogId: "annual-axis-definitions-v0",
  status: "experimental",
  domains: [
    {
      domain: "wealth",
      labelVi: "Tài lộc",
      anchors: [
        { annualPalaceName: "Tài Bạch", weight: 0.75 },
        { annualPalaceName: "Điền Trạch", weight: 0.15 },
        { annualPalaceName: "Phúc Đức", weight: 0.1 },
      ],
    },
    {
      domain: "health",
      labelVi: "Sức khỏe",
      anchors: [
        { annualPalaceName: "Tật Ách", weight: 0.7 },
        { annualPalaceName: "Mệnh", weight: 0.3 },
      ],
    },
  ],
  validationRules: {
    anchorWeightsMustSumTo: 1,
    allowedPalaceNames: [],
    missingAnnualPalaceBehavior: "diagnostic_and_no_score",
  },
};

function buildNamPhaiChart(): ChartData {
  const palaces: ChartPalace[] = NAM_PHAI_NATAL_NAMES.map((name, index) => ({
    index,
    branch: `b${index}`,
    name,
  }));
  return { palaces, annualYear: 2026, smallLimitPalace: palaces[3] } as unknown as ChartData;
}

function buildTrungChauChart(): ChartData {
  const palaces: ChartPalace[] = TC_ANNUAL_LABELS.map((annualPalaceName, index) => ({
    index,
    branch: `b${index}`,
    name: `NATAL-${index}`,
    annualPalaceName,
  }));
  return { palaces, annualYear: 2026 } as unknown as ChartData;
}

describe("namPhaiDomainResolver", () => {
  it("resolves anchors by natal palace.name and preserves multi-anchor weights", () => {
    const chart = buildNamPhaiChart();
    const resolved = namPhaiDomainResolver.resolve(chart, AXIS_DEFS);

    expect(resolved.coordinate).toBe("natal-palace-name");
    expect(resolved.provenance).toBe("nam-phai-natal-domain-anchor");

    const wealth = resolved.anchorsByDomain.get("wealth");
    expect(wealth).toBeDefined();
    expect(wealth?.map((a) => [a.annualPalaceName, a.palaceIndex, a.weight])).toEqual([
      ["Tài Bạch", NAM_PHAI_NATAL_NAMES.indexOf("Tài Bạch"), 0.75],
      ["Điền Trạch", NAM_PHAI_NATAL_NAMES.indexOf("Điền Trạch"), 0.15],
      ["Phúc Đức", NAM_PHAI_NATAL_NAMES.indexOf("Phúc Đức"), 0.1],
    ]);
    for (const anchor of wealth ?? []) {
      expect(anchor.provenance).toBe("nam-phai-natal-domain-anchor");
    }

    const health = resolved.anchorsByDomain.get("health");
    expect(health?.map((a) => a.weight)).toEqual([0.7, 0.3]);

    expect(resolved.diagnostics.missingDomainAnchor).toHaveLength(0);
    expect(resolved.diagnostics.ambiguousDomainAnchor).toHaveLength(0);
    expect(resolved.diagnostics.duplicateNatalPalaceNames).toHaveLength(0);
  });

  it("never falls back to annualPalaceName even when one is present", () => {
    const chart = buildNamPhaiChart();
    // Populate annualPalaceName on every palace with a value that would
    // resolve differently — the Nam Phái resolver must ignore it.
    chart.palaces.forEach((p, i) => {
      p.annualPalaceName = TC_ANNUAL_LABELS[i];
    });
    const resolved = namPhaiDomainResolver.resolve(chart, AXIS_DEFS);
    const wealth = resolved.anchorsByDomain.get("wealth");
    expect(wealth?.[0]?.palaceIndex).toBe(NAM_PHAI_NATAL_NAMES.indexOf("Tài Bạch"));
  });

  it("logs missingDomainAnchor when a natal name is absent", () => {
    const chart = buildNamPhaiChart();
    chart.palaces.forEach((p) => {
      if (p.name === "Tài Bạch") p.name = "OTHER";
    });
    const resolved = namPhaiDomainResolver.resolve(chart, AXIS_DEFS);
    expect(resolved.anchorsByDomain.get("wealth")?.some((a) => a.annualPalaceName === "Tài Bạch"))
      .toBe(false);
    expect(resolved.diagnostics.missingDomainAnchor).toContain("wealth:Tài Bạch");
  });

  it("logs duplicateNatalPalaceNames and ambiguousDomainAnchor on a malformed chart", () => {
    const chart = buildNamPhaiChart();
    // Force two palaces to share the same natal name.
    const dupIndex = NAM_PHAI_NATAL_NAMES.indexOf("Phúc Đức");
    chart.palaces[0]!.name = "Phúc Đức";
    const resolved = namPhaiDomainResolver.resolve(chart, AXIS_DEFS);
    expect(resolved.diagnostics.duplicateNatalPalaceNames).toContain("Phúc Đức:2");
    // Every wealth anchor that references "Phúc Đức" must be marked ambiguous.
    expect(
      resolved.diagnostics.ambiguousDomainAnchor.some((d) => d.startsWith("wealth:Phúc Đức")),
    ).toBe(true);
    expect(resolved.anchorsByDomain.get("wealth")?.some((a) => a.annualPalaceName === "Phúc Đức"))
      .toBe(false);
    // Non-ambiguous anchors still resolve.
    expect(resolved.anchorsByDomain.get("wealth")?.some((a) => a.annualPalaceName === "Tài Bạch"))
      .toBe(true);
    // Sanity check: dupIndex was a legitimate index in NAM_PHAI_NATAL_NAMES.
    expect(dupIndex).toBeGreaterThanOrEqual(0);
  });
});

describe("trungChauDomainResolver", () => {
  it("resolves anchors by annualPalaceName and never uses natal palace.name", () => {
    const chart = buildTrungChauChart();
    const resolved = trungChauDomainResolver.resolve(chart, AXIS_DEFS);

    expect(resolved.coordinate).toBe("annual-palace-name");
    expect(resolved.provenance).toBe("trung-chau-annual-palace-name");

    const wealth = resolved.anchorsByDomain.get("wealth");
    expect(wealth?.map((a) => [a.annualPalaceName, a.palaceIndex, a.weight])).toEqual([
      ["Tài Bạch", TC_ANNUAL_LABELS.indexOf("Tài Bạch"), 0.75],
      ["Điền Trạch", TC_ANNUAL_LABELS.indexOf("Điền Trạch"), 0.15],
      ["Phúc Đức", TC_ANNUAL_LABELS.indexOf("Phúc Đức"), 0.1],
    ]);
    for (const anchor of wealth ?? []) {
      expect(anchor.provenance).toBe("trung-chau-annual-palace-name");
    }
    expect(resolved.diagnostics.incompleteChartPalaces).toHaveLength(0);
  });

  it("logs incompleteChartPalaces when annualPalaceName is missing on any palace", () => {
    const chart = buildTrungChauChart();
    chart.palaces.forEach((p) => {
      p.annualPalaceName = undefined;
    });
    const resolved = trungChauDomainResolver.resolve(chart, AXIS_DEFS);
    expect(resolved.diagnostics.incompleteChartPalaces.length).toBeGreaterThan(0);
    expect(resolved.anchorsByDomain.size).toBe(0);
  });

  it("never reads natal palace.name even when annualPalaceName is missing", () => {
    const chart = buildTrungChauChart();
    // Give palaces natal names that match axis-def labels — the Trung Châu
    // resolver must not match these.
    chart.palaces.forEach((p, i) => {
      p.name = NAM_PHAI_NATAL_NAMES[i]!;
      p.annualPalaceName = undefined;
    });
    const resolved = trungChauDomainResolver.resolve(chart, AXIS_DEFS);
    expect(resolved.anchorsByDomain.size).toBe(0);
    expect(resolved.diagnostics.missingDomainAnchor).toContain("wealth:Tài Bạch");
  });
});

describe("selectResolver", () => {
  it("returns the Nam Phái resolver for nam-phai", () => {
    expect(selectResolver("nam-phai")).toBe(namPhaiDomainResolver);
  });
  it("returns the Trung Châu resolver for trung-chau", () => {
    expect(selectResolver("trung-chau")).toBe(trungChauDomainResolver);
  });
});

describe("resolveAnnualFocus", () => {
  it("uses annualHeadPalace for Nam Phái", () => {
    const chart = buildNamPhaiChart();
    // Attach the explicit annual-head pointer produced by the engine.
    (chart as unknown as { annualHeadPalace: ChartPalace | null }).annualHeadPalace = chart.palaces[5]!;
    const { focus, issues } = resolveAnnualFocus(chart, "nam-phai");
    expect(issues.invalidAnnualFocusPalace).toBe(false);
    expect(issues.missingAnnualHeadPalace).toBe(false);
    expect(focus?.mode).toBe("annual-major-fortune");
    expect(focus?.palaceIndex).toBe(5);
    expect(focus?.palaceName).toBe("Nô Bộc");
  });

  it("falls back to a unique isLuuNienDaiVan when annualHeadPalace is missing", () => {
    const chart = buildNamPhaiChart();
    chart.palaces[7]!.isLuuNienDaiVan = true;
    const { focus, issues } = resolveAnnualFocus(chart, "nam-phai");
    expect(focus?.mode).toBe("annual-major-fortune");
    expect(focus?.palaceIndex).toBe(7);
    expect(issues.missingAnnualHeadPalace).toBe(true);
  });

  it("flags invalidAnnualFocusPalace when Nam Phái chart lacks both annualHeadPalace and LNDV flag", () => {
    const chart = buildNamPhaiChart();
    const { focus, issues } = resolveAnnualFocus(chart, "nam-phai");
    expect(focus).toBeNull();
    expect(issues.missingAnnualHeadPalace).toBe(true);
    expect(issues.invalidAnnualFocusPalace).toBe(true);
  });

  it("flags duplicateAnnualHeadPalaces when multiple palaces carry the LNDV flag", () => {
    const chart = buildNamPhaiChart();
    chart.palaces[3]!.isLuuNienDaiVan = true;
    chart.palaces[7]!.isLuuNienDaiVan = true;
    const { focus, issues } = resolveAnnualFocus(chart, "nam-phai");
    expect(focus).toBeNull();
    expect(issues.duplicateAnnualHeadPalaces).toBe(true);
  });

  it("uses annual Mệnh palace for Trung Châu", () => {
    const chart = buildTrungChauChart();
    const { focus, issues } = resolveAnnualFocus(chart, "trung-chau");
    expect(issues.invalidAnnualFocusPalace).toBe(false);
    expect(focus?.mode).toBe("annual-menh");
    expect(focus?.annualPalaceName).toBe("Mệnh");
    expect(focus?.palaceIndex).toBe(TC_ANNUAL_LABELS.indexOf("Mệnh"));
  });

  it("flags invalidAnnualFocusPalace when Trung Châu chart lacks annual Mệnh", () => {
    const chart = buildTrungChauChart();
    chart.palaces.forEach((p) => {
      p.annualPalaceName = undefined;
    });
    const { focus, issues } = resolveAnnualFocus(chart, "trung-chau");
    expect(focus).toBeNull();
    expect(issues.invalidAnnualFocusPalace).toBe(true);
  });
});
