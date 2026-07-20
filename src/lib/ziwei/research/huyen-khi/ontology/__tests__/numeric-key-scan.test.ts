import { describe, expect, it } from "vitest";

import { loadHuyenKhiOntology } from "../load-ontology";
import { validateOntology } from "../validate-ontology";
import {
  FORBIDDEN_SCORING_KEYS,
  scanForbiddenScoringKeys,
} from "../numeric-key-scan";
import { ONTOLOGY_FILES } from "../paths";

describe("Huyền Khí ontology — no numeric scoring (§3, §14)", () => {
  it("no forbidden scoring key appears in any loaded catalog", () => {
    const result = validateOntology();
    expect(result.summary.numericScoringKeyCount).toBe(0);
    expect(result.issues.filter((i) => i.code === "numeric-scoring-key")).toEqual([]);
  });

  it("scanner catches an injected scoring key (guard is real)", () => {
    const hits = scanForbiddenScoringKeys({ effects: [{ magnitude: "light", weight: 3 }] });
    expect(hits.map((h) => h.key)).toContain("weight");
  });

  it("structural integers (versions, counts, thresholds) are allowed", () => {
    const result = loadHuyenKhiOntology();
    if (!result.ok) throw new Error("expected load");
    // These carry integers but no forbidden KEY — must scan clean.
    expect(scanForbiddenScoringKeys(result.ontology.releaseGates)).toEqual([]);
    expect(scanForbiddenScoringKeys(result.ontology.fixturePlan.minimumApprovedRequiredForNextPhase)).toEqual([]);
    expect(result.ontology.fixturePlan.minimumApprovedRequiredForNextPhase).toBe(30);
  });

  it("magnitude is ordinal vocabulary, not a coefficient", () => {
    const result = loadHuyenKhiOntology();
    if (!result.ok) throw new Error("expected load");
    for (const m of result.ontology.symbolicDimensions.magnitudeVocabulary) {
      expect(typeof m).toBe("string");
    }
    // No numeric mapping is published for any dimension.
    for (const spec of Object.values(result.ontology.symbolicDimensions.dimensions)) {
      expect(spec.numericMappingForbidden).toBe(true);
    }
  });

  it("the non-effective example catalog is NOT a loaded knowledge file", () => {
    const loadedFiles = Object.values(ONTOLOGY_FILES);
    expect(loadedFiles).not.toContain("example-rules.NON-EFFECTIVE.v0.1.json");
    const result = loadHuyenKhiOntology();
    if (!result.ok) throw new Error("expected load");
    expect(result.ontology.rules).toEqual([]);
  });

  it("declares the full forbidden-key set from the spec", () => {
    for (const key of ["score", "weight", "coefficient", "support", "pressure", "stability", "activation", "factor", "delta", "multiplier"]) {
      expect(FORBIDDEN_SCORING_KEYS).toContain(key);
    }
  });
});
