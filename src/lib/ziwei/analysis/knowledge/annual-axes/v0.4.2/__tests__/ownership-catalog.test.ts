import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../loader";
import { validateAnnualAxesKnowledgeV042NamPhai } from "../validate";
import type { AnnualAxesKnowledgeV042NamPhai } from "../schema";

const REQUIRED_PALACES = [
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

describe("Annual Axes V0.4.2 · physical domain ownership catalog", () => {
  it("loads and validates", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    expect(loaded.ok).toBe(true);
  });

  it("resolves exactly the twelve required palace names uniquely", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    const names = loaded.knowledge.ownership.records.map((r) => r.palaceName);
    expect(new Set(names).size).toBe(12);
    for (const p of REQUIRED_PALACES) {
      expect(names).toContain(p);
    }
  });

  it("every palace has at most 2 numeric domains and at most 1 primary", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    for (const record of loaded.knowledge.ownership.records) {
      expect(record.numericDomains.length).toBeLessThanOrEqual(2);
      expect(record.numericDomains.filter((d) => d.role === "primary").length).toBeLessThanOrEqual(1);
    }
  });

  it("every numeric domain entry has a non-empty rationale and resolved sourceIds", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    for (const record of loaded.knowledge.ownership.records) {
      for (const entry of record.numericDomains) {
        expect(entry.rationale.length).toBeGreaterThan(0);
        expect(entry.sourceIds.length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects a palace with 3 numeric domains (fan-out violation)", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    const mutated: AnnualAxesKnowledgeV042NamPhai = {
      ...loaded.knowledge,
      ownership: {
        ...loaded.knowledge.ownership,
        records: loaded.knowledge.ownership.records.map((r, i) =>
          i === 0
            ? {
                ...r,
                numericDomains: [
                  { domain: "health", ownershipWeight: 1, role: "primary", rationale: "x", sourceIds: ["SRC-AA-ENG-004"], knowledgeStatus: "experimental" },
                  { domain: "family", ownershipWeight: 0.4, role: "secondary", rationale: "x", sourceIds: ["SRC-AA-ENG-004"], knowledgeStatus: "experimental" },
                  { domain: "wealth", ownershipWeight: 0.4, role: "secondary", rationale: "x", sourceIds: ["SRC-AA-ENG-004"], knowledgeStatus: "experimental" },
                ],
              }
            : r,
        ),
      },
    };
    const sourceIds = new Set(["SRC-AA-ENG-004"]);
    const result = validateAnnualAxesKnowledgeV042NamPhai(mutated, sourceIds);
    expect(result.ok).toBe(false);
  });

  it("rejects a palace with two primary domains", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    const mutated: AnnualAxesKnowledgeV042NamPhai = {
      ...loaded.knowledge,
      ownership: {
        ...loaded.knowledge.ownership,
        records: loaded.knowledge.ownership.records.map((r, i) =>
          i === 0
            ? {
                ...r,
                numericDomains: [
                  { domain: "health", ownershipWeight: 1, role: "primary", rationale: "x", sourceIds: ["SRC-AA-ENG-004"], knowledgeStatus: "experimental" },
                  { domain: "family", ownershipWeight: 1, role: "primary", rationale: "x", sourceIds: ["SRC-AA-ENG-004"], knowledgeStatus: "experimental" },
                ],
              }
            : r,
        ),
      },
    };
    const sourceIds = new Set(["SRC-AA-ENG-004"]);
    const result = validateAnnualAxesKnowledgeV042NamPhai(mutated, sourceIds);
    expect(result.ok).toBe(false);
  });

  it("rejects a missing palace record", () => {
    const loaded = loadAnnualAxesKnowledgeV042NamPhai();
    if (!loaded.ok) throw new Error("v0.4.2 knowledge invalid");
    const mutated: AnnualAxesKnowledgeV042NamPhai = {
      ...loaded.knowledge,
      ownership: {
        ...loaded.knowledge.ownership,
        records: loaded.knowledge.ownership.records.slice(1),
      },
    };
    const sourceIds = new Set(["SRC-AA-ENG-004"]);
    const result = validateAnnualAxesKnowledgeV042NamPhai(mutated, sourceIds);
    expect(result.ok).toBe(false);
  });
});
